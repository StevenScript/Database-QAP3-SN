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
  password: "your_password",
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
app.get("/tasks", (req, res) => {
  res.json(tasks);
});

// POST /tasks - Add a new task
app.post("/tasks", (request, response) => {
  const { id, description, status } = request.body;
  if (!id || !description || !status) {
    return response
      .status(400)
      .json({ error: "All fields (id, description, status) are required" });
  }

  tasks.push({ id, description, status });
  response.status(201).json({ message: "Task added successfully" });
});

// PUT /tasks/:id - Update a task's status
app.put("/tasks/:id", (request, response) => {
  const taskId = parseInt(request.params.id, 10);
  const { status } = request.body;
  const task = tasks.find((t) => t.id === taskId);

  if (!task) {
    return response.status(404).json({ error: "Task not found" });
  }
  task.status = status;
  response.json({ message: "Task updated successfully" });
});

// DELETE /tasks/:id - Delete a task
app.delete("/tasks/:id", (request, response) => {
  const taskId = parseInt(request.params.id, 10);
  const initialLength = tasks.length;
  tasks = tasks.filter((t) => t.id !== taskId);

  if (tasks.length === initialLength) {
    return response.status(404).json({ error: "Task not found" });
  }
  response.json({ message: "Task deleted successfully" });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
