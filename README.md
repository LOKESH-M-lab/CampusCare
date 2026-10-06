# CampusCare – Student Complaint & Request Management System

> **College Value Added Course (VAC) Project**  
> **Department:** Computer Science & Engineering (B.E. 2nd Year)  
> **Architecture:** Full-Stack MVC Web Application (Node.js, Express.js, MongoDB, Vanilla HTML5/CSS3/JavaScript)

---

## 📌 1. Project Overview

**CampusCare** is a modern, responsive web application engineered to bridge the communication gap between college students and campus administration. It allows students to submit grievances regarding college infrastructure and facilities (classrooms, laboratories, internet connectivity, hostel maintenance, cleanliness, and canteen services) and track their resolution status in real-time.

Administrators have access to a dedicated dashboard to inspect complaints across all departments, filter records, update resolution progress with official maintenance remarks, and analyze campus grievance statistics.

---

## 🚀 2. Technology Stack

| Layer | Technologies Used | Description |
| :--- | :--- | :--- |
| **Frontend** | **HTML5, CSS3, Vanilla JavaScript** | Responsive sidebar layout, dashboard stat cards, accessible `<dialog>` modals, live search & filtering, CSS variables, and toast notifications. Zero heavy external dependencies. |
| **Backend** | **Node.js, Express.js (v4.21)** | RESTful API server handling CRUD operations, route filtering, status updates, request validation, and serving static frontend files. |
| **Database** | **MongoDB & Mongoose (v8.9)** | Document database with schema enforcement, automatic timestamp tracking (`createdAt`, `updatedAt`), pre-save ticket ID generation (`CC-XXXX`), and aggregation pipelines for statistics. |
| **Environment** | **dotenv, cors** | Decoupled configuration for database credentials, server ports, and CORS origin security. |

---

## 📂 3. Project Structure

```
CampusCare/
├── frontend/
│   ├── index.html           # Landing page with hero section & portal entry points
│   ├── student.html         # Student portal (Dashboard cards, Submit form, My Complaints table)
│   ├── admin.html           # Admin console (Metrics, Multi-filters, Status updater, Delete confirmation)
│   ├── style.css            # Professional blue/white/light-gray design system & responsive rules
│   └── script.js            # Modular frontend logic, REST API calls, modals & toasts
├── backend/
│   ├── models/
│   │   └── Complaint.js     # Mongoose schema, validation rules, and pre-save ticket generator
│   ├── routes/
│   │   └── complaintRoutes.js # REST API route handlers (GET, POST, PUT, PATCH, DELETE, Seed)
│   ├── .env.example         # Template for environment configuration
│   ├── .env                 # Local active environment variables (PORT, MONGODB_URI)
│   ├── package.json         # Project metadata, dependencies, and npm start/dev scripts
│   ├── seed.js              # Standalone database seeder script for lab viva demonstrations
│   └── server.js            # Express server initialization, DB connection, and route registration
└── README.md                # Comprehensive documentation and viva presentation guide
```

---

## 🎯 4. Application Modules & Features

### 1. Landing Page (`index.html`)
- Clean hero section with college VAC branding.
- Quick navigation buttons to open **Student Portal** and **Admin Portal**.
- Feature cards summarizing the grievance reporting lifecycle.

### 2. Student Dashboard (`student.html`)
- **Real-Time Stat Cards**: Live counts of **Total Complaints**, **Pending**, **In Progress**, and **Resolved** complaints submitted under the student's register number.
- **Submit Complaint Form**:
  - Fields: *Student Name, Register Number, Department, Complaint Category, Complaint Title, Detailed Description, Date, and Urgency Level*.
  - 8 College Categories:
    - 🏫 Classroom
    - 🔬 Laboratory
    - 📶 Wi-Fi / Internet
    - 🏢 Hostel
    - 🍽️ Canteen
    - 📚 Library
    - 🧹 Cleanliness
    - ⚙️ Other
  - Form validation with inline visual error feedback and non-blocking toast alerts.
- **My Complaints Table**:
  - Displays Complaint ID (`CC-XXXX`), Title, Category, Submission Date, Color-Coded Status Badge, and Action buttons.
  - Interactive Search box and filters (by Status and Category).
  - Accessible **Complaint Details Dialog** showing official technician remarks.
  - Profile Switcher to test multiple student accounts during viva demonstrations.

### 3. Admin Dashboard (`admin.html`)
- **Institution Overview**: Total campus complaints, pending reviews, investigations in progress, and resolved cases.
- **Multi-Filter Grievance Registry**: Filter simultaneously by Department (CSE, IT, ECE, EEE, MECH, etc.), Category, Status, or free-text search.
- **Status Updater Modal**: Change status between *Pending* ➔ *In Progress* ➔ *Resolved* and attach official maintenance remarks visible to students.
- **Delete Confirmation Modal**: Safe deletion with explicit confirmation to prevent accidental loss of data.
- **One-Click Demo Seeder**: Button in sidebar to instantly reset and populate 6 realistic sample campus complaints for college lab presentations.

---

## 📡 5. Backend REST API Endpoints

All endpoints use JSON payloads and return structured responses: `{ "success": true/false, "data": ... }`.

| Method | Endpoint | Description | Request Body / Query Params |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/health` | Server and MongoDB health check | None |
| **GET** | `/api/complaints/stats` | Aggregated dashboard counts | `?registerNumber=...` (optional for student-specific stats) |
| **GET** | `/api/complaints` | Fetch complaints with filters | `?search=...&status=...&category=...&department=...&registerNumber=...` |
| **GET** | `/api/complaints/:id` | Fetch single complaint | By MongoDB `_id` or Ticket ID (`CC-1001`) |
| **POST** | `/api/complaints` | Submit a new complaint | `{ studentName, registerNumber, department, category, title, description, date, priority }` |
| **PUT** | `/api/complaints/:id` | Full update of complaint details | `{ studentName, registerNumber, department, category, title, description, status, priority, adminRemarks }` |
| **PATCH** | `/api/complaints/:id/status` | Quick status & remarks update | `{ status: "Resolved", adminRemarks: "Fixed" }` |
| **DELETE**| `/api/complaints/:id` | Permanently remove complaint | None |
| **POST** | `/api/complaints/seed` | Seed realistic demo complaints | `{ force: true }` (replaces database records) |

---

## 💻 6. Step-by-Step Installation & Setup (Windows & VS Code)

### Prerequisites
1. **Node.js** (v18.x or higher) installed. Verify with `node -v` in terminal.
2. **MongoDB Community Server** installed locally OR a free **MongoDB Atlas** account.

---

### Step 1: Open Project in VS Code
1. Launch **Visual Studio Code**.
2. Go to **File ➔ Open Folder...** and select the `CampusCare` folder:
   ```
   C:\Users\<YourUsername>\.gemini\antigravity-ide\scratch\CampusCare
   ```

---

### Step 2: Configure Environment Variables
Inside `CampusCare/backend/`, verify the `.env` file exists (or copy `.env.example` to `.env`):

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/campuscare
CLIENT_ORIGIN=*
```

> **Using Free Cloud MongoDB Atlas instead of Local MongoDB?**  
> Simply update `MONGODB_URI` in `.env`:  
> `MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xyz.mongodb.net/campuscare?retryWrites=true&w=majority`

---

### Step 3: Verify MongoDB Service (Windows)
If using local MongoDB, ensure the Windows service is running:
- Open **PowerShell** or **Command Prompt** as Administrator:
  ```powershell
  Get-Service -Name "*mongo*"
  ```
- If stopped, start it with:
  ```powershell
  net start MongoDB
  ```

---

### Step 4: Install Dependencies & Seed Sample Data
Open the built-in VS Code Terminal (`Ctrl + ~`) and navigate to `backend`:

```powershell
cd backend
npm install
```

Populate initial realistic sample complaints into MongoDB:
```powershell
npm run seed
```
*(You will see: `✅ Success! Seeded 6 complaints into the "complaints" collection.`)*

---

### Step 5: Start the Server
In the `backend` directory, run:
```powershell
npm start
```
Or for auto-reloading during development:
```powershell
npm run dev
```

You will see:
```
====================================================
🚀 CampusCare Server is running on port: 5000
🌐 Local Application URL: http://localhost:5000
📡 API Endpoints:        http://localhost:5000/api/complaints
🩺 Health Check:          http://localhost:5000/api/health
====================================================
✅ Connected to MongoDB database successfully: campuscare
```

---

### Step 6: Access the Application
Open your web browser (Google Chrome, Microsoft Edge, or Mozilla Firefox) and visit:

- 🏠 **Main Landing Page:** [`http://localhost:5000`](http://localhost:5000)
- 👨‍🎓 **Student Portal:** [`http://localhost:5000/student.html`](http://localhost:5000/student.html)
- 👨‍💼 **Admin Management:** [`http://localhost:5000/admin.html`](http://localhost:5000/admin.html)

---

## 🎓 7. College Viva Voce & Demonstration Q&A Guide

Prepare for your 2nd-year B.E. Computer Science Engineering examination or project presentation with these key questions:

### Q1: What is the architectural pattern used in CampusCare?
> **Answer:** CampusCare follows the **Client-Server MVC (Model-View-Controller)** architectural pattern.
> - **Model (`backend/models/Complaint.js`):** Defines the data schema, data types, and validations using Mongoose.
> - **View (`frontend/*.html`, `style.css`):** Handles visual presentation, responsive UI, dashboard cards, and user forms.
> - **Controller / API (`backend/routes/complaintRoutes.js`, `script.js`):** Mediates business logic, processes client requests, interfaces with MongoDB, and returns JSON responses.

### Q2: Why is Mongoose used with MongoDB instead of raw native drivers?
> **Answer:** While MongoDB is a schema-less NoSQL database, enterprise applications require data integrity. Mongoose provides:
> 1. Strict **Schema Validation** (e.g. required student name, valid register numbers, restricted category enumerations).
> 2. **Middleware Hooks** (e.g., automatically generating `ticketId` like `CC-1001` before saving).
> 3. Automatic **Timestamps** (`createdAt`, `updatedAt`).

### Q3: What is the difference between PUT and PATCH in your REST API?
> **Answer:**
> - `PUT /api/complaints/:id` is an **idempotent complete update** that updates all complaint attributes (title, description, category, department, priority).
> - `PATCH /api/complaints/:id/status` is a **partial update** modifying only specific fields—in this case, updating the resolution status and attaching administrative remarks without re-submitting student information.

### Q4: What is CORS and why is it configured?
> **Answer:** **CORS (Cross-Origin Resource Sharing)** is a browser security mechanism that blocks web pages from making HTTP requests to a domain or port different from the one that served the page. By configuring `cors()` middleware in Express with configurable origins, the backend can safely serve frontend clients whether hosted on `http://localhost:5000` or a separate development server (like VS Code Live Server on `5500`).

### Q5: How is asynchronous communication handled on the frontend?
> **Answer:** Modern JavaScript `async/await` syntax with the native `fetch()` API is used for non-blocking HTTP requests. This prevents the user interface from freezing during database queries and allows dynamic DOM updates without full page reloads.

---

## 🔒 8. Security & Best Practices Implemented
- **Input Sanitation & Trim:** Strips whitespace and prevents malformed register numbers.
- **Environment Decoupling:** Database credentials stored securely in `.env` rather than hardcoded in source files.
- **Defensive Error Handling:** Fast failure timeout on MongoDB connections with user-friendly error logs.
- **Zero CDN Dependency:** Native SVG icons and standard font stacks allow the application to function offline inside college computer laboratories.

---

## 📜 9. License & Academic Attribution
Developed for the **B.E. Computer Science & Engineering Value Added Course (VAC)**. Free to use, modify, and extend for educational purposes.
