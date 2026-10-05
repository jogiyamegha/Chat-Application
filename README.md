<h1 align="center">
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=600&size=40&pause=1000&color=2196F3&center=true&vCenter=true&width=600&lines=Group+Chat+Application;Real-Time+Messaging+Backend" alt="Typing SVG" />
</h1>

<div align="center">
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white" />
  <img src="https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white" />
  <img src="https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socketdotio&logoColor=white" />
  <img src="https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=JSON%20web%20tokens&logoColor=white" />
</div>

<br/>

A high-performance, real-time backend API built for seamless communication. It supports one-on-one messaging, dynamic group chats, and real-time online statuses using WebSockets.

---

## ✨ Features

- ⚡ **Real-Time Communication**: Instant messaging powered by `Socket.io`.
- 👥 **Group Chats**: Create groups, join/leave, add/remove members, and manage admin roles.
- 🟢 **Online Status**: Live updates showing user availability.
- ✏️ **Message Management**: Edit messages, delete for yourself, or delete for everyone.
- 📜 **Chat History**: Persistent chat records via MongoDB.
- 🔒 **Secure Authentication**: Protected routes using JWT and bcrypt.
- 🖼️ **Image Processing**: Handles media uploads using Multer and Sharp (with HEIC support).

## 🚀 Tech Stack

- **Framework**: Node.js & Express.js
- **Database**: MongoDB (Mongoose ORM)
- **WebSockets**: Socket.io
- **Security**: JSON Web Token (JWT) & bcryptjs
- **File Handling**: Multer & Sharp

## ⚙️ Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/jogiyamegha/Chat-Application.git
   ```
2. **Navigate into the server directory:**
   ```bash
   cd server
   ```
3. **Install dependencies:**
   ```bash
   npm install
   ```
4. **Set up environment variables:**
   Create a `./config/dev.env` file in the `server` folder and add:
   ```env
   PORT=8000
   MONGODB_URL=your_mongodb_connection_string
   JWT_SECRET=your_secret_key
   ```
5. **Start the server:**
   - **Development Mode:** `npm run dev`
   - **Production Mode:** `npm start`

## 🔌 Core Socket Events

| Event Name                  | Action                                      |
|-----------------------------|---------------------------------------------|
| `createConnection`          | Establishes initial connection & Auth       |
| `createChatRoom`            | Creates a one-on-one or group chat room     |
| `sendMessage`               | Broadcasts a message to room participants   |
| `editMessage`               | Modifies a previously sent message          |
| `deleteMessageForEveryone`  | Removes a message from everyone's view      |
| `onlineStatusChange`        | Updates user's online availability          |
| `addParticipants`           | Admin only: Add new members to a group      |
| `removeParticipants`        | Admin only: Remove members from a group     |
| `clearChat`                 | Erases chat history for a user              |

---
<div align="center">
  <i>Developed with ❤️ for real-time web applications.</i>
</div>
