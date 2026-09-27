# 🚀 Standard Node.js Backend Template

A production-ready **Node.js + Express** backend template with built-in **JWT Authentication** and **PostgreSQL** support.

All database operations are implemented using **native PostgreSQL (SQL) queries** without an ORM, providing better control, performance, and easier query optimization.

---

## ✨ Features

* 🔐 JWT-based Authentication APIs
* 👤 User Login & Authorization
* 🐘 PostgreSQL Database Support
* 📁 Clean Project Structure
* ⚡ Express.js Backend
* 🔒 Environment-based Configuration
* 📝 Native SQL Queries (No ORM)

---

## 📋 Prerequisites

Before getting started, ensure the following are installed:

* **Node.js:** `v22.x.x`
* **npm:** Comes bundled with Node.js
* **PostgreSQL:** Installed and running
* Internet connection (required only during dependency installation)

---

## ⚙️ Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd <project-folder>
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure the Project

Update the project information in:

* `package.json`

Configure your database and application settings in:

* `.env`

Example values:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=your_database
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_secret_key
PORT=3000
```

### 4. Create the Database Schema

Execute the following SQL script in your PostgreSQL database:

```
create_users_schema.sql
```

This script creates the required **Users** table and authentication-related schema.

---

## ▶️ Running the Application

### Development Mode

Starts the server with automatic restart on file changes.

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

---

## 📂 Project Structure

```text
project/
├── controllers/
├── routes/
├── middleware/
├── config/
├── database/
├── utils/
├── .env
├── package.json
└── README.md
```

---

## 🔑 Authentication

The template includes JWT-based authentication APIs.

Typical authentication flow:

1. User Login
2. JWT Token Generation
3. Protected Route Access
4. Token Verification via Middleware

---

## 🗄 Database

* Database: PostgreSQL
* Query Language: Native SQL
* No ORM (Sequelize/TypeORM/Prisma not used)

---

## 📦 Scripts

| Command       | Description                  |
| ------------- | ---------------------------- |
| `npm install` | Install project dependencies |
| `npm run dev` | Run development server       |
| `npm start`   | Run production server        |

---

## 🛠 Requirements

* Node.js **22.x.x**
* PostgreSQL
* npm

---

## 📄 License

This project is intended as a reusable backend starter template and can be customized according to project requirements.

## 📂 Project Structure

```text
.
├── src
│   ├── apiDocs/              # Swagger/OpenAPI documentation
│   ├── config/               # Database, environment, and application configuration
│   ├── controllers/          # Business logic
│   │   ├── authentication/   # Authentication & user management APIs
│   │   └── logger/           # Logging-related controllers
│   ├── logs/                 # Application log files
│   ├── middleware/           # Express middleware (JWT, validation, error handling, etc.)
│   ├── models/               # SQL queries and database interaction layer
│   ├── routes/               # API route definitions
│   ├── static/               # Static assets served by the application
│   └── utils/                # Helper functions and shared utilities
├── .env                      # Environment variables (not committed)
├── package.json              # Project metadata and dependencies
├── package-lock.json         # Dependency lock file
└── README.md                 # Project documentation
```

### 📌 Directory Overview

| Directory                      | Purpose                                                                                                    |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| **apiDocs**                    | Contains Swagger/OpenAPI documentation for all REST APIs.                                                  |
| **config**                     | Stores application configuration such as database connections, environment variables, and global settings. |
| **controllers**                | Implements the business logic for API endpoints.                                                           |
| **controllers/authentication** | Handles user authentication, login, JWT generation, and authorization logic.                               |
| **controllers/logger**         | Manages application logging functionality.                                                                 |
| **logs**                       | Stores generated log files for debugging and auditing.                                                     |
| **middleware**                 | Contains Express middleware such as JWT verification, request validation, CORS, and error handling.        |
| **models**                     | Contains PostgreSQL SQL queries and database interaction functions. No ORM is used.                        |
| **routes**                     | Defines all API endpoints and maps them to their respective controllers.                                   |
| **static**                     | Holds static resources such as uploaded files or public assets.                                            |
| **utils**                      | Common helper functions, utilities, constants, and reusable modules used throughout the application.       |
