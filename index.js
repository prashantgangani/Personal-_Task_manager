const express = require("express");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

const app = express();
const PORT = 3000;
const TASKS_FILE = "tasks.json";

app.use(express.json()); // Middleware to parse JSON

// Load tasks from JSON file
const loadTasks = () => {
    if (!fs.existsSync(TASKS_FILE)) return [];
    const data = fs.readFileSync(TASKS_FILE);
    return JSON.parse(data);
};

// Save tasks to JSON file
const saveTasks = (tasks) => {
    fs.writeFileSync(TASKS_FILE, JSON.stringify(tasks, null, 2));
};

// Middleware: Validate task input
const validateTask = (req, res, next) => {
    const { title, status } = req.body;
    if (!title || typeof title !== "string") {
        return res.status(400).json({ error: "Title is required and must be a string" });
    }
    const validStatuses = ["pending", "in-progress", "completed"];
    if (status && !validStatuses.includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
    }
    next();
};

// Create a new task
app.post("/tasks", validateTask, (req, res) => {
    const tasks = loadTasks();
    const newTask = { id: uuidv4(), ...req.body, status: req.body.status || "pending" };
    tasks.push(newTask);
    saveTasks(tasks);
    res.status(201).json(newTask);
});

// Get all tasks
app.get("/tasks", (req, res) => {
    res.json(loadTasks());
});

// Get a single task by ID
app.get("/tasks/:id", (req, res) => {
    const tasks = loadTasks();
    const task = tasks.find((t) => t.id === req.params.id);
    if (!task) return res.status(404).json({ error: "Task not found" });
    res.json(task);
});

// Update a task
app.put("/tasks/:id", validateTask, (req, res) => {
    const tasks = loadTasks();
    const index = tasks.findIndex((t) => t.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: "Task not found" });

    tasks[index] = { ...tasks[index], ...req.body };
    saveTasks(tasks);
    res.json(tasks[index]);
});

// Delete a task
app.delete("/tasks/:id", (req, res) => {
    let tasks = loadTasks();
    const filteredTasks = tasks.filter((t) => t.id !== req.params.id);
    if (tasks.length === filteredTasks.length) return res.status(404).json({ error: "Task not found" });

    saveTasks(filteredTasks);
    res.status(204).send();
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
