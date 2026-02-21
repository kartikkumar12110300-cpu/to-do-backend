const express = require("express");
const auth = require("../middleware/authMiddleware");

const router = express.Router();

// GET TASKS
router.get("/", auth, (req, res) => {
  const db = req.db;

  db.query(
    "SELECT * FROM tasks WHERE user_id = ?",
    [req.user.id],
    (err, results) => {
      res.json(results);
    }
  );
});

// ADD TASK
router.post("/", auth, (req, res) => {
  const db = req.db;
  const { task, category, priority, dueDate } = req.body;

  db.query(
    "INSERT INTO tasks (user_id, task, category, priority, due_date, completed) VALUES (?, ?, ?, ?, ?, ?)",
    [req.user.id, task, category, priority, dueDate, false],
    (err, result) => {
      res.json({ message: "Task added" });
    }
  );
});

// DELETE TASK
router.delete("/:id", auth, (req, res) => {
  const db = req.db;

  db.query(
    "DELETE FROM tasks WHERE id = ? AND user_id = ?",
    [req.params.id, req.user.id],
    (err, result) => {
      res.json({ message: "Task deleted" });
    }
  );
});

module.exports = router;
