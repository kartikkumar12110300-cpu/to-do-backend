const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});
const PORT = process.env.PORT || 5000;
db.connect((err) => {
  if (err) {
    console.log("DB connection failed:", err);
  } else {
    console.log("Connected to MySQL");
  }
});

// JWT Middleware
const jwt = require("jsonwebtoken");

function auth(req, res, next) {
  const token = req.headers.authorization;
  if (!token) return res.status(401).json({ message: "No token" });

  try {
    const decoded = jwt.verify(token, "secretkey");
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
}

// ================= AUTH =================

const bcrypt = require("bcryptjs");

// Signup
app.post("/api/auth/signup", async (req, res) => {
  const { email, password } = req.body;

  const hashedPassword = await bcrypt.hash(password, 10);

  db.query(
    "INSERT INTO users (email, password) VALUES (?, ?)",
    [email, hashedPassword],
    (err, result) => {
      if (err) {
        return res.status(400).json({ message: "User exists" });
      }
      res.json({ message: "User created" });
    }
  );
});

// Login
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;

  db.query(
    "SELECT * FROM users WHERE email = ?",
    [email],
    async (err, results) => {
      if (results.length === 0)
        return res.status(400).json({ message: "User not found" });

      const user = results[0];
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch)
        return res.status(400).json({ message: "Invalid credentials" });

      const token = jwt.sign({ id: user.id }, "secretkey");

      res.json({ token });
    }
  );
});

// ================= TASKS =================

// Get tasks
app.get("/api/tasks", auth, (req, res) => {
  db.query(
    "SELECT * FROM tasks WHERE user_id = ?",
    [req.user.id],
    (err, results) => {
      res.json(results);
    }
  );
});

// Add task
app.post("/api/tasks", auth, (req, res) => {
  const { task, category, priority, dueDate } = req.body;

  db.query(
    "INSERT INTO tasks (user_id, task, category, priority, due_date, completed) VALUES (?, ?, ?, ?, ?, ?)",
    [req.user.id, task, category, priority, dueDate, false],
    (err, result) => {
      res.json({ message: "Task added" });
    }
  );
});

// Delete task
app.delete("/api/tasks/:id", auth, (req, res) => {
  db.query(
    "DELETE FROM tasks WHERE id = ? AND user_id = ?",
    [req.params.id, req.user.id],
    (err, result) => {
      res.json({ message: "Task deleted" });
    }
  );
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});
