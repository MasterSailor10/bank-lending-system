const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();
app.use(express.json());

// ✅ Allow frontend on 5173
app.use(cors({ origin: "http://localhost:5173" }));

const dbPath = path.join(__dirname, "banklending.db");
let db = null;

// Secret key for JWT (change this in production!)
const JWT_SECRET = "your_secret_key_change_in_production";

// ---------------- DB INIT ----------------
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    // Create Users table if not exists
    await db.exec(`
      CREATE TABLE IF NOT EXISTS Users (
        user_id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER UNIQUE,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    app.listen(5000, () => {
      console.log("Server Running at http://localhost:5000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

function getISTDateTime() {
  const now = new Date();
  const istOffsetMs = 5.5 * 60 * 60 * 1000;
  const istTime = new Date(now.getTime() + istOffsetMs);
  return istTime.toISOString().replace("T", " ").slice(0, 19);
}

// ---------------- MIDDLEWARE: Verify JWT Token ----------------
const authenticateToken = (request, response, next) => {
  const authHeader = request.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return response.status(401).send({ error: "Access token required" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return response.status(403).send({ error: "Invalid or expired token" });
    }
    request.user = user;
    next();
  });
};

// ---------------- AUTH API 1: REGISTER ----------------
app.post("/auth/register", async (request, response) => {
  const { name, email, password } = request.body;

  try {
    // Check if user already exists
    const existingUser = await db.get(
      `SELECT * FROM Users WHERE email = ?`,
      [email]
    );

    if (existingUser) {
      return response.status(400).send({ error: "Email already registered" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate unique customer_id
    const customer_id = Math.floor(100000 + Math.random() * 900000);

    // Insert user
    await db.run(
      `INSERT INTO Users (customer_id, name, email, password) VALUES (?, ?, ?, ?)`,
      [customer_id, name, email, hashedPassword]
    );

    // Also create entry in Customers table
    await db.run(
      `INSERT INTO Customers (customer_id, name, email, password, created_at) VALUES (?, ?, ?, ?, ?)`,
      [customer_id, name, email, hashedPassword, getISTDateTime()]
    );

    response.status(201).send({
      message: "Registration successful",
      customer_id,
    });
  } catch (error) {
    response.status(500).send({ error: error.message });
  }
});

// ---------------- AUTH API 2: LOGIN ----------------
app.post("/auth/login", async (request, response) => {
  const { email, password } = request.body;

  try {
    const user = await db.get(
      `SELECT * FROM Users WHERE email = ?`,
      [email]
    );

    if (!user) {
      return response.status(401).send({ error: "Invalid email or password" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return response.status(401).send({ error: "Invalid email or password" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { user_id: user.user_id, customer_id: user.customer_id, email: user.email },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    response.send({
      message: "Login successful",
      token,
      user: {
        customer_id: user.customer_id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    response.status(500).send({ error: error.message });
  }
});

// ---------------- AUTH API 3: GET CURRENT USER ----------------
app.get("/auth/me", authenticateToken, async (request, response) => {
  try {
    const user = await db.get(
      `SELECT user_id, customer_id, name, email FROM Users WHERE user_id = ?`,
      [request.user.user_id]
    );

    if (!user) {
      return response.status(404).send({ error: "User not found" });
    }

    response.send(user);
  } catch (error) {
    response.status(500).send({ error: error.message });
  }
});

// ---------------- AUTH API 4: VERIFY CUSTOMER FOR PASSWORD RESET ----------------
app.post("/auth/verify-customer", async (request, response) => {
  const { customer_id, email } = request.body;

  try {
    const user = await db.get(
      `SELECT user_id, customer_id, name, email FROM Users WHERE customer_id = ? AND email = ?`,
      [customer_id, email]
    );

    if (!user) {
      return response.status(404).send({ 
        error: "No account found with this Customer ID and Email combination" 
      });
    }

    response.send({
      message: "Verification successful",
      customer_id: user.customer_id,
      name: user.name,
    });
  } catch (error) {
    response.status(500).send({ error: error.message });
  }
});

// ---------------- AUTH API 5: RESET PASSWORD ----------------
app.post("/auth/reset-password", async (request, response) => {
  const { customer_id, email, new_password } = request.body;

  try {
    // Verify user exists
    const user = await db.get(
      `SELECT * FROM Users WHERE customer_id = ? AND email = ?`,
      [customer_id, email]
    );

    if (!user) {
      return response.status(404).send({ error: "User not found" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(new_password, 10);

    // Update password in Users table
    await db.run(
      `UPDATE Users SET password = ? WHERE customer_id = ?`,
      [hashedPassword, customer_id]
    );

    // Update password in Customers table
    await db.run(
      `UPDATE Customers SET password = ? WHERE customer_id = ?`,
      [hashedPassword, customer_id]
    );

    response.send({
      message: "Password reset successful",
    });
  } catch (error) {
    response.status(500).send({ error: error.message });
  }
});

// ---------------- API 1 : CREATE LOAN (Protected) ----------------
app.post("/loans/", authenticateToken, async (request, response) => {
  const { loan_amount, loan_period_years } = request.body;
  
  // Use customer_id from authenticated user
  const customer_id = request.user.customer_id;

  try {
    // Get user's name
    const user = await db.get(
      `SELECT name FROM Users WHERE customer_id = ?`,
      [customer_id]
    );

    const interest_rate_yearly = 7;
    const total_interest =
      loan_amount * loan_period_years * (interest_rate_yearly / 100);

    const total_amount = loan_amount + total_interest;
    const monthly_emi = Number(
      (total_amount / (loan_period_years * 12)).toFixed(2)
    );

    const loan_id = `LN${Date.now()}`;

    await db.run(
      `
      INSERT INTO Loans (
        loan_id,
        customer_id,
        principal_amount,
        total_amount,
        interest_rate,
        loan_period_years,
        monthly_emi,
        status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE')
      `,
      [
        loan_id,
        customer_id,
        loan_amount,
        total_amount,
        interest_rate_yearly,
        loan_period_years,
        monthly_emi,
      ]
    );

    response.send({
      loan_id,
      customer_id,
      total_amount_payable: total_amount,
      monthly_emi,
    });
  } catch (error) {
    response.status(500).send({ error: error.message });
  }
});

// ---------------- API 2 : PAYMENT (Protected) ----------------
app.post("/loans/:loan_id/payments", authenticateToken, async (request, response) => {
  const { loan_id } = request.params;
  const { amount, transaction_type } = request.body;
  const customer_id = request.user.customer_id;

  try {
    const loan = await db.get(
      `SELECT * FROM Loans WHERE loan_id = ? AND customer_id = ?`,
      [loan_id, customer_id]
    );

    if (!loan) {
      return response.status(404).send({ error: "Loan not found or unauthorized" });
    }

    const transaction_id = `PMT${Date.now()}`;
    const date = getISTDateTime();

    await db.run(
      `
      INSERT INTO Transactions
      (transaction_id, loan_id, amount, type, date)
      VALUES (?, ?, ?, ?, ?)
      `,
      [transaction_id, loan_id, amount, transaction_type, date]
    );

    const paid = await db.get(
      `SELECT SUM(amount) AS total_paid FROM Transactions WHERE loan_id = ?`,
      [loan_id]
    );

    const total_paid = paid.total_paid || 0;
    const remaining_balance = Math.max(loan.total_amount - total_paid, 0);
    const emis_left = Math.ceil(remaining_balance / loan.monthly_emi);

    response.send({
      transaction_id,
      loan_id,
      remaining_balance,
      emis_left,
      message: "Payment recorded successfully",
    });
  } catch (error) {
    response.status(500).send({ error: error.message });
  }
});

// ---------------- API 3 : LOAN LEDGER (Protected) ----------------
app.get("/loans/:loan_id/ledger", authenticateToken, async (request, response) => {
  const { loan_id } = request.params;
  const customer_id = request.user.customer_id;

  try {
    const loan = await db.get(
      `SELECT * FROM Loans WHERE loan_id = ? AND customer_id = ?`,
      [loan_id, customer_id]
    );

    if (!loan) {
      return response.status(404).send({ error: "Loan not found or unauthorized" });
    }

    const transactions = await db.all(
      `SELECT * FROM Transactions WHERE loan_id = ? ORDER BY date`,
      [loan_id]
    );

    const paid = await db.get(
      `SELECT SUM(amount) AS total_paid FROM Transactions WHERE loan_id = ?`,
      [loan_id]
    );

    const total_paid = paid.total_paid || 0;
    const balance_amount = Math.max(loan.total_amount - total_paid, 0);
    const emis_left = Math.ceil(balance_amount / loan.monthly_emi);

    response.send({
      loan_id: loan.loan_id,
      customer_id: loan.customer_id,
      principal: loan.principal_amount,
      total_amount: loan.total_amount,
      monthly_emi: loan.monthly_emi,
      total_paid,
      balance_amount,
      emis_left,
      transactions,
    });
  } catch (error) {
    response.status(500).send({ error: error.message });
  }
});

// ---------------- API 4 : CUSTOMER OVERVIEW (Protected) ----------------
app.get("/customers/overview", authenticateToken, async (request, response) => {
  const customer_id = request.user.customer_id;

  try {
    // Get user info from Users table
    const user = await db.get(
      `SELECT * FROM Users WHERE customer_id = ?`,
      [customer_id]
    );

    if (!user) {
      return response.status(404).send({ error: "User not found" });
    }

    const loans = await db.all(
      `SELECT * FROM Loans WHERE customer_id = ?`,
      [customer_id]
    );

    if (loans.length === 0) {
      return response.send({
        customer_id,
        total_loans: 0,
        loans: [],
      });
    }

    const resultLoans = [];

    for (const loan of loans) {
      const paid = await db.get(
        `SELECT SUM(amount) AS amount_paid FROM Transactions WHERE loan_id = ?`,
        [loan.loan_id]
      );

      const amount_paid = paid.amount_paid || 0;
      const balance_amount = Math.max(loan.total_amount - amount_paid, 0);
      const emis_left = Math.ceil(balance_amount / loan.monthly_emi);
      const total_interest = loan.total_amount - loan.principal_amount;

      resultLoans.push({
        loan_id: loan.loan_id,
        principal: loan.principal_amount,
        total_amount: loan.total_amount,
        total_interest,
        emi_amount: loan.monthly_emi,
        amount_paid,
        emis_left,
      });
    }

    response.send({
      customer_id,
      total_loans: resultLoans.length,
      loans: resultLoans,
    });
  } catch (error) {
    response.status(500).send({ error: error.message });
  }
});

// ---------------- API 5 : EMI/LUMPSUM (Protected) ----------------
app.get("/loans/:loan_id/emi", authenticateToken, async (request, response) => {
  try {
    const { loan_id } = request.params;
    const customer_id = request.user.customer_id;

    const loan = await db.get(
      `SELECT monthly_emi FROM Loans WHERE loan_id = ? AND customer_id = ?`,
      [loan_id, customer_id]
    );

    if (!loan) {
      return response.status(404).send({ error: "Loan not found or unauthorized" });
    }

    response.send({
      emi_amount: loan.monthly_emi,
    });
  } catch (error) {
    response.status(500).send({ error: error.message });
  }
});