# 🚀 Smart Campus Operations Hub

A full-stack **Smart Campus Management System** developed for the **IT3030 – Programming Applications and Frameworks (PAF)** assignment at SLIIT.
This platform integrates multiple campus services into a **single, secure, and scalable system** to improve operational efficiency and user experience.

---

## 📌 Project Overview

The system provides a centralized solution for managing:

* 📚 Campus resources
* 📅 Smart bookings with conflict detection
* 🛠️ Incident reporting and resolution workflows
* 🔔 Notifications and alerts
* 👤 User roles and secure authentication

### 🏗️ Architecture

* **Backend**: Spring Boot (REST APIs, Business Logic, Security)
* **Frontend**: React + Vite (Responsive UI)
* **Database**: MongoDB (NoSQL persistence)

---

## 👥 Team Member Contributions

Each member is responsible for a clearly defined module:

---

### 👤 Member 1 — Resource Management

**Scope: Facilities Catalogue & Resource Control**

#### 🔹 Features

* Create, update, and delete campus resources
* Manage availability and operational status
* Categorize resources (labs, halls, equipment)
* Provide resource listing for frontend consumption

#### 🔹 APIs

```http
GET    /api/resources
POST   /api/resources
PUT    /api/resources/{resourceId}
PATCH  /api/resources/{resourceId}/status
DELETE /api/resources/{resourceId}
```

---

### 👤 Member 2 — Booking Management

**Scope: Booking Workflow & Conflict Handling**

#### 🔹 Features

* Submit booking requests for resources
* Prevent overlapping/conflicting bookings
* Admin approval and rejection workflow
* **QR code check-in system** for approved bookings
* **Check-in verification** by admins/technicians
* Track booking lifecycle:

  ```
  PENDING → APPROVED → REJECTED → CANCELLED
  ```

#### 🔹 APIs

```http
GET    /api/bookings
POST   /api/bookings
DELETE /api/bookings/{bookingId}
GET    /api/bookings/admin
PATCH  /api/bookings/admin/{bookingId}/status
GET    /api/bookings/check-in/verify?token=xxx
POST   /api/bookings/check-in/confirm?token=xxx
```

---

### 👤 Member 3 — Incident Management

**Scope: Tickets, Attachments & Technician Workflow**

#### 🔹 Features

* Report incidents linked to campus resources
* Capture detailed information:

  * Category, priority, location, description
* Upload image evidence (JPG/PNG)
* Ticket workflow:

  ```
  OPEN → IN_PROGRESS → RESOLVED → CLOSED
  ```
* Assign technicians
* Add updates and maintain comment history
* Reject tickets with reason (admin control)
* Store resolution notes

#### 🔹 APIs

```http
POST   /api/tickets
GET    /api/tickets
GET    /api/tickets/{ticketId}
PUT    /api/tickets/{ticketId}
PATCH  /api/tickets/{ticketId}/status
PATCH  /api/tickets/{ticketId}/assign
POST   /api/tickets/{ticketId}/updates
PATCH  /api/tickets/{ticketId}/updates/{updateId}
DELETE /api/tickets/{ticketId}/updates/{updateId}
POST   /api/tickets/{ticketId}/attachments
GET    /api/tickets/{ticketId}/attachments
DELETE /api/tickets/{ticketId}
```

---

### 👤 Member 4 — Notifications & User Management

**Scope: Notifications, Roles & OAuth Integration**

#### 🔹 Features

* Real-time user notifications
* Track unread notifications
* Mark notifications as read
* Role-based user management:

  * ADMIN, USER, TECHNICIAN
* Google OAuth 2.0 login integration
* User activation, deactivation, and role assignment

#### 🔹 APIs

```http
GET    /api/notifications
GET    /api/notifications/unread-count
PATCH  /api/notifications/{notificationId}/read
PATCH  /api/notifications/read-all
POST   /api/notifications
DELETE /api/notifications/{notificationId}

GET    /api/admin/users
POST   /api/admin/users
PUT    /api/admin/users/{userId}/roles
PATCH  /api/admin/users/{userId}/status
DELETE /api/admin/users/{userId}
```

---

## 🌟 Core System Features

* ✅ Centralized campus management platform
* ✅ RESTful API architecture
* ✅ Role-based access control
* ✅ Secure authentication (Spring Security + OAuth)
* ✅ MongoDB data persistence
* ✅ Clean and responsive UI
* ✅ Modular design for team collaboration

---

## 🖥️ UI Modules Overview

| Route             | Description                      |
| ----------------- | -------------------------------- |
| `/resources`      | View and manage campus resources |
| `/bookings`       | Submit and track bookings        |
| `/bookings/check-in` | QR code check-in verification    |
| `/tickets`        | Create and view incident tickets |
| `/tickets/manage` | Admin & technician dashboard     |
| `/notifications`  | View alerts and updates          |
| `/admin/users`    | Manage users and roles           |
| `/admin/bookings` | Admin booking management         |

---

## ⚙️ Tech Stack

| Layer          | Technology                          |
| -------------- | ----------------------------------- |
| Backend        | Spring Boot, Spring Security, Maven |
| Frontend       | React, Vite, React Router           |
| Database       | MongoDB                             |
| Authentication | OAuth 2.0 (Google)                  |

---

## 🛠️ Local Setup

### 1️⃣ Configure Environment

* Create `.env` files for backend and frontend
* Add MongoDB and OAuth credentials

---

### 2️⃣ Run Backend

```powershell
cd backend
$env:JAVA_HOME="C:\Program Files\Java\jdk-21"
$env:Path="$env:JAVA_HOME\bin;$env:Path"
.\apache-maven-3.9.9\bin\mvn.cmd spring-boot:run
```

---

### 3️⃣ Run Frontend

```bash
cd frontend
npm install
npm run dev
```

