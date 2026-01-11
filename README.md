# 🏦 Bank Lending Management System

A full-stack banking application with secure JWT authentication, comprehensive loan management, and real-time payment processing capabilities.

## ✨ Features

- 🔐 **Secure Authentication** - JWT-based authentication with bcrypt password encryption
- 💰 **Loan Management** - Complete loan lifecycle from creation to closure
- 💳 **Flexible Payments** - Support for both EMI and lump-sum payment methods
- 📊 **Analytics Dashboard** - Comprehensive loan overview with real-time data
- 📋 **Transaction History** - Complete audit trail with IST timestamps
- 🔄 **Password Recovery** - Multi-step verification with customer ID and email
- 📱 **Responsive Design** - Seamless experience across all devices
- 📋 **One-Click Copy** - Easy copying of Loan IDs, Customer IDs, and Transaction IDs

## 🛠️ Tech Stack

### Frontend
- React.js (Class & Functional Components)
- React Router v6 (Protected Routes)
- CSS3 (Responsive Design)
- LocalStorage for session management

### Backend
- Node.js & Express.js
- SQLite3 Database
- JWT Authentication
- Bcrypt Password Hashing
- RESTful API Architecture

## 🚀 Quick Start

### Prerequisites
- Node.js >= 14.0.0
- npm >= 6.0.0

### Installation

1. **Clone the repository**

git clone https://github.com/MasterSailor10/bank-lending-system.git
cd bank-lending-system


2. **Backend Setup**

cd backend
npm install
npm start or nodemon index.js or npm run dev

Server runs on http://localhost:5000

3. **Frontend Setup**

cd frontend
npm install
npm run dev

Application runs on http://localhost:5173

## 🔌 API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - User login
- `GET /auth/me` - Get current user
- `POST /auth/verify-customer` - Verify for password reset
- `POST /auth/reset-password` - Reset password

### Loan Management
- `POST /loans` - Create new loan
- `GET /loans/:loan_id/ledger` - Get loan details
- `GET /loans/:loan_id/emi` - Get EMI amount
- `GET /customers/overview` - Get all customer loans

### Payments
- `POST /loans/:loan_id/payments` - Process payment (EMI/Lump-sum)

## 💡 Key Features

- **Automated EMI Calculation** with 7% annual interest rate
- **Dual Payment Modes**: Scheduled EMI and flexible lump-sum payments
- **Real-time Balance Tracking** with remaining EMI calculations
- **Secure Session Management** with JWT tokens (24-hour expiry)
- **Customer-Specific Data Isolation** ensuring privacy

## 👨‍💻 Author

**Siddharth Singh**
- LinkedIn: [Siddharth Singh](https://linkedin.com/in/siddhartha1010)
- Email: siddharthgaming109@gmail.com

## 📝 License

This project is open source and available under the MIT License.

---

⭐ Star this repository if you found it helpful!
