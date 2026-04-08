# Smart Campus Operations Hub

Smart Campus Operations Hub is a group project for the IT3030 PAF assignment. The system helps manage campus resources, bookings, notifications, user roles, and authentication in one shared platform.

## Project Overview

This repository contains a full-stack application with:

- A Spring Boot backend for APIs, business logic, security, and MongoDB persistence
- A React + Vite frontend for the user interface
- Shared functionality that supports all four team members' modules in a single system

## Member Allocation

- Member 1: facilities catalogue and resource management
- Member 2: booking workflow and conflict checking
- Member 3: incident ticketing and technician updates
- Member 4: notifications, role management, and OAuth 2.0 integration

## Common Features Across All 4 Members

- Centralized campus resource management
- Booking creation, review, approval, rejection, and cancellation flows
- Notification support for important user and system updates
- Role-based access control for different user types
- Secure authentication and Google OAuth login
- MongoDB persistence for users, resources, bookings, and notifications
- Frontend and backend integration through REST APIs

## Main Functional Areas

### Resource Management

- Create and manage campus resources
- Update resource details, status, and availability windows
- View available resources from the frontend

### Booking Management

- Submit bookings for resources
- Prevent conflicting bookings
- Review and update booking statuses
- Track pending, approved, rejected, and cancelled bookings

### Notifications

- View user notifications
- Track unread notification counts
- Mark single or all notifications as read
- Delete notifications
- Create automatic notifications for booking, role, and ticket-related events

### User and Role Management

- Manage users with role-based permissions
- Assign roles such as `ADMIN`, `USER`, and `TECHNICIAN`
- Activate, deactivate, and delete user accounts

### Authentication and Security

- Spring Security based route and API protection
- Google OAuth login support
- Authenticated user profile lookup
- Restricted admin and technician operations

## Backend API Highlights

- `GET /api/health`
- `GET /api/auth/me`
- `GET /api/resources`
- `POST /api/resources`
- `PUT /api/resources/{resourceId}`
- `PATCH /api/resources/{resourceId}/status`
- `DELETE /api/resources/{resourceId}`
- `GET /api/bookings`
- `POST /api/bookings`
- `PATCH /api/bookings/{bookingId}/status`
- `GET /api/notifications`
- `GET /api/notifications/unread-count`
- `PATCH /api/notifications/{notificationId}/read`
- `PATCH /api/notifications/read-all`
- `POST /api/notifications`
- `DELETE /api/notifications/{notificationId}`
- `GET /api/admin/users`
- `POST /api/admin/users`
- `PUT /api/admin/users/{userId}/roles`
- `PATCH /api/admin/users/{userId}/status`
- `DELETE /api/admin/users/{userId}`
- `POST /api/integrations/tickets/notify`

## Tech Stack

- Backend: Spring Boot, Spring Security, Spring Data MongoDB, OAuth2 Client, Maven
- Frontend: React, React Router, Vite
- Database: MongoDB

## Local Setup

1. Create `backend/.env` from `backend/.env.example`.
2. Create `frontend/.env` from `frontend/.env.example` if needed.
3. Add MongoDB and Google OAuth credentials.
4. Start the backend on port `8081`.
5. Start the frontend on port `5174`.

## Run the Backend

```powershell
cd backend
$env:JAVA_HOME="C:\Program Files\Java\latest\jdk-21"
$env:Path="$env:JAVA_HOME\bin;$env:Path"
.\apache-maven-3.9.9\bin\mvn.cmd spring-boot:run
```

## Run the Frontend

```powershell
cd frontend
npm install
npm run dev
```

## Integration Notes

- Resource, booking, notification, and user modules are designed to work together as one platform.
- Booking and ticket workflows can trigger notifications for users.
- OAuth login creates or updates user records while preserving roles.
- Admin features are protected through role-based authorization.
