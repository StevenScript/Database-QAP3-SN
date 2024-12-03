const express = require("express");
const app = express();
const PORT = 3000;
const { Pool } = require("pg");

app.use(express.json());

// Connection pool
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "tasks_db",
  password: "postgres",
  port: 5432,
});

// DB connection debugging
pool.query("SELECT NOW()", (err, res) => {
  if (err) {
    console.error("Error connecting to the database:", err);
  } else {
    console.log("Database connected:", res.rows[0]);
  }
});

// Function to initialize the database
const initializeDatabase = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      description VARCHAR(255) NOT NULL,
      status VARCHAR(50) NOT NULL
    );
  `;

  try {
    await pool.query(createTableQuery);
    console.log("Tasks table initialized or already exists.");
  } catch (err) {
    console.error("Error initializing database:", err);
  }
};

// Call the initialization function
initializeDatabase();

// GET /tasks - Get all tasks
app.get("/tasks", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM tasks ORDER BY id ASC");
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching tasks:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /tasks - Add a new task
app.post("/tasks", async (req, res) => {
  const { description, status } = req.body;

  if (!description || !status) {
    return res
      .status(400)
      .json({ error: "Description and status are required" });
  }

  try {
    const insertQuery = `
        INSERT INTO tasks (description, status)
        VALUES ($1, $2)
        RETURNING *;
      `;
    const values = [description, status];
    const result = await pool.query(insertQuery, values);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error adding task:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /tasks/:id - Update a task's status
app.put("/tasks/:id", async (req, res) => {
  const taskId = parseInt(req.params.id, 10);
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ error: "Status is required" });
  }

  try {
    const updateQuery = `
        UPDATE tasks
        SET status = $1
        WHERE id = $2
        RETURNING *;
      `;
    const values = [status, taskId];
    const result = await pool.query(updateQuery, values);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error updating task:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /tasks/:id - Delete a task
app.delete("/tasks/:id", async (req, res) => {
  const taskId = parseInt(req.params.id, 10);

  try {
    const deleteQuery = `
        DELETE FROM tasks
        WHERE id = $1
        RETURNING *;
      `;
    const values = [taskId];
    const result = await pool.query(deleteQuery, values);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.json({ message: "Task deleted successfully", task: result.rows[0] });
  } catch (err) {
    console.error("Error deleting task:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
