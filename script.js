/* ===== StudyFlow: Subject-Based Tasks with Local Storage ===== */
 const API_BASE_URL = "";
const startBtn = document.getElementById("startBtn");
const taskForm = document.getElementById("taskForm");
const taskInput = document.getElementById("taskInput");
const subjectInput = document.getElementById("subjectInput");
const dueDateInput = document.getElementById("dueDateInput");
const subjectFilter = document.getElementById("subjectFilter");
const taskList = document.getElementById("taskList");

const totalTasksElement = document.getElementById("totalTasks");
const completedTasksElement = document.getElementById("completedTasks");
const progressTextElement = document.getElementById("progressText");

const STORAGE_KEY = "studyflow_tasks";

// Load saved tasks and support data from the previous version.
function loadTasks() {
    try {
        const savedTasks = localStorage.getItem(STORAGE_KEY);
        const storedTasks = savedTasks ? JSON.parse(savedTasks) : [];

        if (!Array.isArray(storedTasks)) {
            return [];
        }

        return storedTasks
            .filter(task =>
                task &&
                typeof task.id === "string" &&
                typeof task.name === "string" &&
                typeof task.completed === "boolean"
            )
            .map(task => ({
                id: task.id,
                name: task.name,
                subject: typeof task.subject === "string"
                    ? task.subject
                    : "Other",
                dueDate: typeof task.dueDate === "string"
                    ? task.dueDate
                    : "",
                completed: task.completed
            }));
    } catch (error) {
        console.error("Failed to load saved tasks:", error);
        return [];
    }
}

// Save all tasks to browser storage.
function saveTasks() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
        return true;
    } catch (error) {
        console.error("Failed to save tasks:", error);
        alert("Unable to save tasks. Please check your browser storage settings.");
        return false;
    }
}

let tasks = loadTasks();

// Update dashboard statistics using all tasks.
function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter(task => task.completed).length;

    const progress = total === 0
        ? 0
        : Math.round((completed / total) * 100);

    totalTasksElement.textContent = total;
    completedTasksElement.textContent = completed;
    progressTextElement.textContent = progress + "%";
}

// Display tasks according to the selected subject.
 function renderTasks(){
    taskList.replaceChildren();

    const selectedSubject = subjectFilter.value;

    const visibleTasks = selectedSubject === "All"
        ? tasks
        : tasks.filter(task => task.subject === selectedSubject);

    if (visibleTasks.length === 0) {
        const emptyMessage = document.createElement("li");
        emptyMessage.textContent = "No tasks found for this subject.";
        taskList.appendChild(emptyMessage);
    }

    visibleTasks.forEach(function (task) {
        const li = document.createElement("li");
        li.style.display = "flex";
        li.style.alignItems = "center";
        li.style.gap = "12px";
        li.style.flexWrap = "wrap";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = task.completed;
        checkbox.setAttribute("aria-label", "Mark task as complete");

        const taskDetails = document.createElement("div");
        taskDetails.style.flex = "1";
        taskDetails.style.minWidth = "120px";

        const taskText = document.createElement("div");
        taskText.textContent = task.name;
        taskText.style.overflowWrap = "anywhere";

        if (task.completed) {
            taskText.style.textDecoration = "line-through";
            taskText.style.opacity = "0.6";
        }

        const taskMeta = document.createElement("small");

        const formattedDate = task.dueDate
            ? new Date(task.dueDate + "T00:00:00").toLocaleDateString()
            : "No due date";

        taskMeta.textContent = task.subject + " • Due: " + formattedDate;
        taskMeta.style.display = "block";
        taskMeta.style.marginTop = "5px";
        taskMeta.style.color = "#8b5870";

        taskDetails.append(taskText, taskMeta);

        checkbox.addEventListener("change", async function () {
    const previousStatus = task.completed;
    const newStatus = checkbox.checked;

    checkbox.disabled = true;

 try {
    const response = await fetch(
        `${API_BASE_URL}/api/tasks/${task.id}`,
        {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                completed: newStatus
            })
        }
    );

    if (!response.ok) {
        throw new Error("Failed to update task.");
    }
    task.completed = newStatus;
    checkbox.disabled = false;
    saveTasks();
    renderTasks();
} catch (error) {
    task.completed = previousStatus;
    checkbox.checked = previousStatus;
    checkbox.disabled = false;

    console.error("Update Error:", error);
    alert("Unable to update task. Please try again.");
}
});
const editBtn = document.createElement("button");
editBtn.type = "button";
editBtn.textContent = "Edit";
editBtn.setAttribute("aria-label", "Edit task");
editBtn.style.padding = "8px 16px";

editBtn.addEventListener("click", function () {
    li.replaceChildren();

    const editTitle = document.createElement("input");
    editTitle.type = "text";
    editTitle.value = task.name;
    editTitle.placeholder = "Task title";

    const editSubject = document.createElement("input");
    editSubject.type = "text";
    editSubject.value = task.subject;
    editSubject.placeholder = "Subject";

    const editDate = document.createElement("input");
    editDate.type = "date";
    editDate.value = task.dueDate;

    const saveBtn = document.createElement("button");
    saveBtn.textContent = "Save";

    const cancelBtn = document.createElement("button");
    cancelBtn.textContent = "Cancel";

   li.classList.add("edit-form");

editTitle.classList.add("edit-input");
editSubject.classList.add("edit-input");
editDate.classList.add("edit-input");

saveBtn.classList.add("save-btn");
cancelBtn.classList.add("cancel-btn");

li.append(
    editTitle,
    editSubject,
    editDate,
    saveBtn,
    cancelBtn
);
  saveBtn.addEventListener("click", async function () {

    const updatedTitle = editTitle.value.trim();
    const updatedSubject = editSubject.value.trim();
    const updatedDate = editDate.value;

    if (!updatedTitle || !updatedSubject || !updatedDate) {
        alert("Please fill in all fields.");
        return;
    }

    saveBtn.disabled = true;
    saveBtn.textContent = "Saving...";

    try {
        const response = await fetch(
            `${API_BASE_URL}/api/tasks/${task.id}`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    title: updatedTitle,
                    subject: updatedSubject,
                    due_date: updatedDate
                })
            }
        );

        if (!response.ok) {
    const errorDetails = await response.text();
    console.error("Server Error:", response.status, errorDetails);

    throw new Error(
        `Server returned ${response.status}: ${errorDetails}`
    );
}

        const result = await response.json();

        task.name = updatedTitle;
        task.subject = updatedSubject;
        task.dueDate = updatedDate;

        saveTasks();
        renderTasks();

        console.log("Task updated:", result.task);

    } catch (error) {
        console.error("Edit Error:", error);
        alert("Update failed: " + error.message);

        saveBtn.disabled = false;
        saveBtn.textContent = "Save";
    }
});
    cancelBtn.addEventListener("click", renderTasks);
});
 
        const deleteBtn = document.createElement("button");
        deleteBtn.type = "button";
        deleteBtn.textContent = "Delete";
        deleteBtn.setAttribute("aria-label", "Delete task");
        deleteBtn.style.background = "#a84470";
        deleteBtn.style.padding = "8px 16px";

       deleteBtn.addEventListener("click", async function () {
      const confirmDelete = confirm("Are you sure you want to delete this task?");

    if (!confirmDelete) {
        return;
    }

    deleteBtn.disabled = true;

    try {
        const response = await fetch(
            `http://localhost:3000/api/tasks/${task.id}`,
            {
                method: "DELETE"
            }
        );

        if (!response.ok) {
            throw new Error("Failed to delete task from the database.");
        }

        const result = await response.json();

        tasks = tasks.filter(item => item.id !== task.id);

        saveTasks();
        renderTasks();

        console.log("Task deleted from PostgreSQL:", result.task);

    } catch (error) {
        deleteBtn.disabled = false;

        console.error("Delete Error:", error);
        alert("Unable to delete task. Please try again.");
    }
     });

    li.append(checkbox, taskDetails, editBtn, deleteBtn);
    taskList.appendChild(li);
    });
    updateStats();
    }
  // Keep the existing welcome button functionality.
    startBtn.addEventListener("click", function () {
    document.querySelector(".welcome h2").textContent =
        "Your Journey Starts Now! 🌸";

    document.querySelector(".welcome p").textContent =
        "Small steps every day lead to big achievements. Let's do this!";

    startBtn.textContent = "Let's Get Started! ✨";
});

// Add a task with its subject and due date.
taskForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const taskName = taskInput.value.trim();
    const subject = subjectInput.value;
    const dueDate = dueDateInput.value;

    if (!taskName || !subject || !dueDate) {
        return;
    }

    const newTask = {
        id: Date.now().toString() +
            Math.random().toString(16).slice(2),
        name: taskName,
        subject: subject,
        dueDate: dueDate,
        completed: false
    };

tasks.push(newTask);

if (!saveTasks()) {
    tasks.pop();
    return;
}

// Update the dashboard and reset the form.
renderTasks();
taskForm.reset();
taskInput.focus();

// Send the task title to the backend.
 sendTaskToServer(newTask);

});

// Refresh the displayed list when the subject filter changes.
subjectFilter.addEventListener("change", renderTasks);

// Display saved tasks when the page loads.
renderTasks();
// Fetch task from the server

  
async function sendTaskToServer(task) {
    try {
        const response = await fetch("http://localhost:3000/api/tasks", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                title: task.name,
                subject: task.subject,
                due_date: task.dueDate || null,
                completed: task.completed
            })
        });

        if (!response.ok) {
            throw new Error("Failed to save task to the database.");
        }

        const result = await response.json();

        // Replace the temporary ID with the PostgreSQL ID.
        const localTask = tasks.find(item => item.id === task.id);

        if (localTask && result.task) {
            localTask.id = String(result.task.id);
            saveTasks();
        }

        console.log("Task saved to PostgreSQL:", result.task);

        return result;

    } catch (error) {
    console.error("Database API Error:", error);

    // Remove the task if the database save fails.
    tasks = tasks.filter(item => item.id !== task.id);

    saveTasks();
    renderTasks();

    alert("Task could not be saved to the database. Please try again.");

    return null;
}
}
// Load tasks from the PostgreSQL database.
async function loadTasksFromServer() {
    try {
        const response = await fetch("http://localhost:3000/api/tasks");

        if (!response.ok) {
            throw new Error("Failed to load tasks from the database.");
        }

        const data = await response.json();

        tasks = data.map((task) => ({
            id: String(task.id),
            name: task.title,
            subject: task.subject || "Other",
            dueDate: task.due_date
                ? String(task.due_date).slice(0, 10)
                : "",
            completed: task.completed
        }));

        saveTasks();
        renderTasks();

        console.log("Tasks loaded from PostgreSQL:", tasks);
    } catch (error) {
        console.error("Failed to load database tasks:", error);
    }
}

// Load database tasks when the page opens.
loadTasksFromServer();