
const addTaskBtn = document.getElementById("addTaskBtn");
const taskDialog = document.getElementById("taskDialog");
const taskForm = document.getElementById("taskForm");
const taskTitle = document.getElementById("taskTitle");
const taskDescription = document.getElementById("taskDescription");
const cancelBtn = document.getElementById("cancelBtn");

const STORAGE_KEY = "kanbanBoardTasks";

let tasks = loadTasks();
let draggedTaskId = null;

function loadTasks() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        const parsed = saved ? JSON.parse(saved) : [];

        if (!Array.isArray(parsed)) return [];

        return parsed.filter(task =>
            task &&
            typeof task.id === "string" &&
            typeof task.title === "string" &&
            ["todo", "doing", "done"].includes(task.status)
        );
    } catch {
        return [];
    }
}

function saveTasks() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (error) {
        alert("Could not save tasks. Check your browser storage.");
    }
}

function renderTasks() {
    const statuses = ["todo", "doing", "done"];

    statuses.forEach(status => {
        const list = document.getElementById(status);
        const column = list.closest(".column");
        const columnTasks = tasks.filter(task => task.status === status);

        list.replaceChildren();
        column.querySelector(".count").textContent = columnTasks.length;

        if (columnTasks.length === 0) {
            const empty = document.createElement("div");
            empty.className = "empty-message";
            empty.textContent = "Drop tasks here";
            list.appendChild(empty);
        }

        columnTasks.forEach(task => {
            const card = document.createElement("article");
            card.className = "task-card";
            card.draggable = true;
            card.dataset.id = task.id;

            const title = document.createElement("h3");
            title.textContent = task.title;
            card.appendChild(title);

            if (task.description) {
                const description = document.createElement("p");
                description.textContent = task.description;
                card.appendChild(description);
            }

            const actions = document.createElement("div");
            actions.className = "task-actions";

            const deleteBtn = document.createElement("button");
            deleteBtn.className = "delete-btn";
            deleteBtn.textContent = "🗑 Delete";
            deleteBtn.type = "button";
            deleteBtn.setAttribute("aria-label", `Delete ${task.title}`);

            deleteBtn.addEventListener("click", () => {
                tasks = tasks.filter(item => item.id !== task.id);
                saveTasks();
                renderTasks();
            });

            actions.appendChild(deleteBtn);
            card.appendChild(actions);

            card.addEventListener("dragstart", event => {
                draggedTaskId = task.id;
                card.classList.add("dragging");

                event.dataTransfer.setData("text/plain", task.id);
                event.dataTransfer.effectAllowed = "move";
            });

            card.addEventListener("dragend", () => {
                draggedTaskId = null;
                card.classList.remove("dragging");

                document.querySelectorAll(".column").forEach(col => {
                    col.classList.remove("drag-over");
                });
            });

            list.appendChild(card);
        });
    });
}

// Set up drag-and-drop for all three columns.
document.querySelectorAll(".column").forEach(column => {
    column.addEventListener("dragover", event => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
        column.classList.add("drag-over");
    });

    column.addEventListener("dragleave", event => {
        if (!column.contains(event.relatedTarget)) {
            column.classList.remove("drag-over");
        }
    });

    column.addEventListener("drop", event => {
        event.preventDefault();
        column.classList.remove("drag-over");

        const taskId =
            event.dataTransfer.getData("text/plain") || draggedTaskId;

        const task = tasks.find(item => item.id === taskId);
        if (!task) return;

        task.status = column.dataset.status;

        saveTasks();
        renderTasks();
    });
});

// Open the add-task dialog.
addTaskBtn.addEventListener("click", () => {
    taskForm.reset();
    taskDialog.showModal();
    taskTitle.focus();
});

cancelBtn.addEventListener("click", () => {
    taskDialog.close();
});

taskForm.addEventListener("submit", event => {
    event.preventDefault();

    const title = taskTitle.value.trim();
    const description = taskDescription.value.trim();

    if (!title) return;

    tasks.push({
        id: crypto.randomUUID
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random()}`,
        title,
        description,
        status: "todo"
    });

    saveTasks();
    renderTasks();

    taskDialog.close();
    taskForm.reset();
});

// Initial display, including previously saved tasks.
renderTasks();
