
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
//connecting pstgresql database
const { Pool } = require("pg");

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === "production"
        ? { rejectUnauthorized: false }
        : false
});


const app = express();

pool.query("SELECT NOW()")
    .then((result) => {
        console.log("PostgreSQL connected successfully!");
        console.log("Database time:", result.rows[0].now);
    })
    .catch((error) => {
        console.error("PostgreSQL connection failed:", error.message);
    });

app.use(cors());
app.use(express.json());



app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/api/tasks", async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM tasks ORDER BY id DESC"
        );

        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching tasks:", error.message);
        res.status(500).json({
            error: "Failed to fetch tasks."
        });
    }
});




app.post("/api/tasks", async (req, res) => {
    const { title, subject, due_date, completed } = req.body;

    if (!title || !title.trim()) {
        return res.status(400).json({
            error: "Task title is required."
        });
    }

    try {
        const result = await pool.query(
            `INSERT INTO tasks
                (title, subject, due_date, completed)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [
                title.trim(),
                subject || null,
                due_date || null,
                completed ?? false
            ]
        );

        res.status(201).json({
            message: "Task created successfully.",
            task: result.rows[0]
        });
    } catch (error) {
        console.error("Error creating task:", error.message);
        res.status(500).json({
            error: "Failed to create task."
        });
    }
});

// Update a task's completion status.
app.patch("/api/tasks/:id", async (req, res) => {
    const { completed } = req.body;
    const { id } = req.params;

    if (typeof completed !== "boolean") {
        return res.status(400).json({
            error: "A valid completion status is required."
        });
    }

    try {
        const result = await pool.query(
            `UPDATE tasks
             SET completed = $1
             WHERE id = $2
             RETURNING *`,
            [completed, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "Task not found."
            });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error("Error updating task:", error.message);
        res.status(500).json({
            error: "Failed to update task."
        });
    }
});

// Update task details.
app.put("/api/tasks/:id", async (req, res) => {
    const { id } = req.params;
    const { title, subject, due_date } = req.body;

    if (!title || !title.trim()) {
        return res.status(400).json({
            error: "Task title is required."
        });
    }

    try {
        const result = await pool.query(
            `UPDATE tasks
             SET title = $1,
                 subject = $2,
                 due_date = $3
             WHERE id = $4
             RETURNING *`,
            [title.trim(), subject || null, due_date || null, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "Task not found."
            });
        }

        res.json({
            message: "Task updated successfully.",
            task: result.rows[0]
        });

    } catch (error) {
        console.error("Error updating task details:", error.message);

        res.status(500).json({
            error: "Failed to update task."
        });
    }
});
// Delete a task from the database.
app.delete("/api/tasks/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query(
            "DELETE FROM tasks WHERE id = $1 RETURNING *",
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "Task not found."
            });
        }

        res.json({
            message: "Task deleted successfully.",
            task: result.rows[0]
        });

    } catch (error) {
        console.error("Error deleting task:", error.message);

        res.status(500).json({
            error: "Failed to delete task."
        });
    }
});


module.exports = app;