// === BACKEND: server.js ===
// Node.js + Express backend with SQLite database

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bodyParser = require('body-parser');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

// Set up database
const db = new sqlite3.Database('./checkin.db');
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS shifts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    date TEXT,
    check_in TEXT,
    check_out TEXT
  )`);
});

// POST /check
app.post('/check', (req, res) => {
  const name = req.body.name;
  const action = req.body.action;
  const date = new Date().toISOString().slice(0, 10);
  const time = new Date().toLocaleTimeString();

  db.get(`SELECT * FROM shifts WHERE name = ? AND date = ?`, [name, date], (err, row) => {
    if (action === 'checkin') {
      if (!row) {
        db.run(`INSERT INTO shifts (name, date, check_in) VALUES (?, ?, ?)`, [name, date, time], () => res.json({ status: 'checked in', time }));
      } else {
        res.json({ status: 'already checked in', time: row.check_in });
      }
    } else if (action === 'checkout') {
      if (row && !row.check_out) {
        db.run(`UPDATE shifts SET check_out = ? WHERE id = ?`, [time, row.id], () => res.json({ status: 'checked out', time }));
      } else if (row && row.check_out) {
        res.json({ status: 'already checked out', time: row.check_out });
      } else {
        res.json({ status: 'not checked in yet', time: null });
      }
    }
  });
});

// GET /hours?name=...
app.get('/hours', (req, res) => {
  const name = req.query.name;
  db.all(`SELECT date, check_in, check_out FROM shifts WHERE name = ? ORDER BY date DESC LIMIT 30`, [name], (err, rows) => {
    res.json(rows);
  });
});

console.log("Starting backend...");
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
