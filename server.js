require("dotenv").config();

const express = require("express");
const cors = require("cors");
const pool = require("./config/db");

const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "http://localhost:5501",
    ],
  })
);

app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "ConnectFlow CRM Backend is running!" });
});

// Test PostgreSQL connection
app.get("/api/db-test", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({
      message: "PostgreSQL connected successfully",
      time: result.rows[0].now,
    });
  } catch (error) {
    console.error("Database test failed:", error.message);
    res.status(500).json({
      message: "Database connection failed",
      error: error.message,
    });
  }
});

// Customer CRUD APIs
app.use("/api/institutes", require("./routes/customerRoutes"));
app.use("/api/customers", require("./routes/customerRoutes"));

// Dashboard statistics
app.get("/api/dashboard", async (req, res) => {
  try {
    const [customers, calls, visits, followups] = await Promise.all([
      pool.query("SELECT COUNT(*)::int AS total FROM customers"),
      pool.query(
        "SELECT COUNT(*)::int AS total FROM calls WHERE call_date::date = CURRENT_DATE"
      ),
      pool.query("SELECT COUNT(*)::int AS total FROM visits"),
      pool.query(
        "SELECT COUNT(*)::int AS total FROM follow_ups WHERE LOWER(status) = 'pending'"
      ),
    ]);

    res.json({
      totalInstitutes: customers.rows[0].total,
      callsToday: calls.rows[0].total,
      visits: visits.rows[0].total,
      pendingFollowUps: followups.rows[0].total,
    });
  } catch (error) {
    console.error("Dashboard error:", error.message);
    res.status(500).json({
      message: "Failed to load dashboard",
      error: error.message,
    });
  }
});

// Read records from CRM tables
const tableEndpoints = {
  calls: "calls",
  visits: "visits",
  followups: "follow_ups",
};

for (const [endpoint, table] of Object.entries(tableEndpoints)) {
  app.get(`/api/${endpoint}`, async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT * FROM public.${table} ORDER BY 1 DESC`
      );
      res.json(result.rows);
    } catch (error) {
      console.error(`GET /api/${endpoint}:`, error.message);
      res.status(500).json({
        message: `Failed to fetch ${endpoint}`,
        error: error.message,
      });
    }
  });
}

// Handle unknown routes
app.use((req, res) => {
  res.status(404).json({ message: "API route not found" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`CRM Backend running on port ${PORT}`);
});
