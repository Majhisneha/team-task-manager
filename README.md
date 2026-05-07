# TaskFlow – Team Task Manager

A full-stack collaborative task management web application built with React, Node.js/Express, and MongoDB. Think Trello/Asana — simplified.

---

## Features

### User Authentication
- Signup with Name, Email, Password
- Secure JWT-based login
- Protected routes

### Project Management
- Create projects (creator becomes Admin)
- Admin can add/remove members by email
- Members can view assigned projects

### Task Management
- Create tasks with Title, Description, Due Date, Priority
- Assign tasks to project members
- Update status: **To Do → In Progress → Done**
- Admin: full CRUD on tasks
- Member: view and update status of assigned tasks only

### Dashboard (Admin only)
- Total tasks count
- Tasks by status (To Do / In Progress / Done)
- Tasks per user breakdown
- Overdue tasks count
- Recent activity feed

### Role-Based Access
| Feature | Admin | Member |
|---|---|---|
| Create/delete tasks | ✅ | ❌ |
| Assign tasks | ✅ | ❌ |
| Update task status | ✅ | ✅ (own tasks only) |
| Add/remove members | ✅ | ❌ |
| View Dashboard | ✅ | ❌ |
| View project tasks | ✅ | ✅ (own tasks) |

---

## Tech Stack

**Frontend:** React 18, React Router v6, Axios, CSS Variables  
**Backend:** Node.js, Express.js, JWT Authentication, express-validator  
**Database:** MongoDB with Mongoose ODM  
**Deployment:** Railway

---

## Project Structure

```
team-task-manager/
├── backend/
│   ├── src/
│   │   ├── config/          # DB connection
│   │   ├── controllers/     # authController, projectController, taskController, dashboardController
│   │   ├── middleware/       # JWT auth, role-based access
│   │   ├── models/          # User, Project, Task schemas
│   │   ├── routes/          # auth, projects, tasks, dashboard
│   │   └── server.js        # Express app entry point
│   ├── .env.example
│   ├── package.json
│   └── railway.toml
│
└── frontend/
    ├── public/
    ├── src/
    │   ├── components/      # Navbar, PrivateRoute
    │   ├── context/         # AuthContext (JWT state management)
    │   ├── pages/           # Login, Signup, Projects, ProjectDetail, Dashboard
    │   ├── services/        # API service (Axios)
    │   └── App.js
    ├── .env.example
    ├── package.json
    └── railway.toml
```

---

## Local Setup

### Prerequisites
- Node.js >= 16
- MongoDB (local or MongoDB Atlas)
- npm

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/team-task-manager.git
cd team-task-manager
```

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env`:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/teamtaskmanager
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRE=7d
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

Start the backend:
```bash
npm run dev   # development with nodemon
# or
npm start     # production
```

### 3. Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
```

Edit `.env`:
```
REACT_APP_API_URL=http://localhost:5000/api
```

Start the frontend:
```bash
npm start
```

The app will be available at `http://localhost:3000`.

---

## API Reference

### Auth
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/auth/signup` | Public | Register new user |
| POST | `/api/auth/login` | Public | Login, returns JWT |
| GET | `/api/auth/me` | Private | Get current user |

### Projects
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/projects` | Private | Get all user's projects |
| POST | `/api/projects` | Private | Create project |
| GET | `/api/projects/:id` | Member | Get single project |
| DELETE | `/api/projects/:id` | Admin | Delete project |
| POST | `/api/projects/:id/members` | Admin | Add member by email |
| DELETE | `/api/projects/:id/members/:userId` | Admin | Remove member |

### Tasks
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/projects/:id/tasks` | Member | Get tasks (Admin: all; Member: own) |
| POST | `/api/projects/:id/tasks` | Admin | Create task |
| GET | `/api/projects/:id/tasks/:taskId` | Member | Get single task |
| PUT | `/api/projects/:id/tasks/:taskId` | Member | Update task |
| DELETE | `/api/projects/:id/tasks/:taskId` | Admin | Delete task |

### Dashboard
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/projects/:id/dashboard` | Admin | Get project dashboard stats |

---

## Deployment on Railway

### Step 1: Create a MongoDB Atlas database
1. Go to [mongodb.com/atlas](https://mongodb.com/atlas) → Create free cluster
2. Get your connection string: `mongodb+srv://user:pass@cluster.mongodb.net/teamtaskmanager`

### Step 2: Deploy Backend on Railway
1. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
2. Select your repository, choose the `backend` folder as root
3. Add environment variables in Railway dashboard:
   ```
   PORT=5000
   MONGODB_URI=<your Atlas URI>
   JWT_SECRET=<strong random string>
   JWT_EXPIRE=7d
   NODE_ENV=production
   CLIENT_URL=<your frontend Railway URL>
   ```
4. Railway auto-detects `npm start` from `railway.toml`
5. Copy the generated backend URL (e.g., `https://your-backend.railway.app`)

### Step 3: Deploy Frontend on Railway
1. New Project → Deploy from GitHub → select `frontend` folder
2. Add environment variable:
   ```
   REACT_APP_API_URL=https://your-backend.railway.app/api
   ```
3. Railway runs `npm run build` then `npx serve -s build`
4. Your frontend is now live at `https://your-frontend.railway.app`

### Step 4: Update Backend CORS
Set `CLIENT_URL` in backend Railway env to your frontend URL.

---

## Environment Variables Summary

### Backend
| Variable | Required | Description |
|---|---|---|
| `PORT` | No | Server port (default: 5000) |
| `MONGODB_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Secret for signing JWT tokens |
| `JWT_EXPIRE` | No | Token expiry (default: 7d) |
| `NODE_ENV` | No | Environment (development/production) |
| `CLIENT_URL` | Yes | Frontend URL for CORS |

### Frontend
| Variable | Required | Description |
|---|---|---|
| `REACT_APP_API_URL` | Yes | Backend API base URL |

---

## Database Schema

### User
```
name, email (unique), password (hashed), timestamps
```

### Project
```
name, description, admin (ref: User), members: [{ user, role }], timestamps
```

### Task
```
title, description, dueDate, priority (Low/Medium/High),
status (To Do/In Progress/Done), project (ref), 
assignedTo (ref: User), createdBy (ref: User), timestamps
```
