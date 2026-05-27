# ✨ Lumina — MERN Stack Social App

A full-featured social media app built with MongoDB, Express, React, and Node.js.

## Features
- 🔐 Auth via **email** or **mobile number** + JWT
- 👤 Profile with **profile picture upload** from your device
- 📝 Posts with **6 text effects**: Gradient, Glow, Shadow, Rainbow, Wave + colored backgrounds
- 📸 **Image upload** for posts
- ❤️ Like & comment on posts
- 💬 **Real-time chat** with Socket.IO (typing indicators, online status)
- 🌙 Aesthetic dark UI with glassmorphism

---

## Project Structure
```
mernstack/
├── backend/
│   ├── src/
│   │   ├── config/db.js         # MongoDB connection
│   │   ├── controllers/         # Auth, User, Post, Message
│   │   ├── middleware/          # JWT auth, Multer upload
│   │   ├── models/              # User, Post, Message schemas
│   │   ├── routes/              # API routes
│   │   ├── uploads/             # Uploaded images (auto-created)
│   │   └── server.js            # Express + Socket.IO server
│   ├── .env
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/          # Navbar, PostCard, CreatePost, Avatar, ProtectedRoute
    │   ├── context/             # AuthContext, ToastContext
    │   ├── pages/               # Home, Login, Register, Feed, Profile, Chat
    │   ├── utils/api.js         # Axios instance
    │   ├── App.jsx
    │   └── index.css
    └── package.json
```

---

## Setup

### Prerequisites
- Node.js v18+
- MongoDB running locally (`mongod`) **or** MongoDB Atlas URI

### 1. Backend
```bash
cd backend
npm install
# Edit .env — set MONGO_URI and JWT_SECRET
npm run dev
# Server runs at http://localhost:5000
```

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
# App runs at http://localhost:5173
```

---

## API Endpoints

| Method | Route                        | Description              | Auth |
|--------|------------------------------|--------------------------|------|
| POST   | /api/auth/register           | Register                 | No   |
| POST   | /api/auth/login              | Login                    | No   |
| GET    | /api/auth/me                 | Get current user         | Yes  |
| GET    | /api/users                   | List all users           | Yes  |
| GET    | /api/users/:id               | Get user by ID           | Yes  |
| PUT    | /api/users/profile           | Update profile + avatar  | Yes  |
| GET    | /api/posts                   | Get all posts            | Yes  |
| POST   | /api/posts                   | Create post + image      | Yes  |
| PUT    | /api/posts/:id               | Update post              | Yes  |
| DELETE | /api/posts/:id               | Delete post              | Yes  |
| PUT    | /api/posts/:id/like          | Like/Unlike post         | Yes  |
| POST   | /api/posts/:id/comment       | Add comment              | Yes  |
| GET    | /api/messages/:userId        | Get chat history         | Yes  |
| POST   | /api/messages/:userId        | Send message             | Yes  |

---

## Environment Variables (backend/.env)
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/socialapp
JWT_SECRET=your_super_secret_key
NODE_ENV=development
```

## Socket.IO Events
| Event             | Direction       | Payload                          |
|-------------------|-----------------|----------------------------------|
| user:online       | client → server | userId                           |
| users:online      | server → client | [userId, ...]                    |
| message:send      | client → server | { receiverId, ...messageData }   |
| message:receive   | server → client | message object                   |
| typing:start/stop | both            | { senderId, receiverId }         |
