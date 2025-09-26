const http = require('http');
const path = require('path');
const env = require('dotenv');
const DBController = require('./db/mongoose');
const express = require('express');
const { createServer } = require('node:http');
const Util = require('./utils/util');
const { Server } = require('socket.io');
const cors = require('cors');

const userRoutes = require('./routes/userRoutes');

env.config({
    path: './config/dev.env',
});

const app = express();

// ✅ Enable CORS for frontend (Vite on port 5173)
app.use(cors({
    origin: "http://localhost:5173",   // frontend URL
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: '5gb', parameterLimit: 50000 }));
app.use(express.json({ limit: '5gb' }));

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use(userRoutes);

app.get("/", (req, res) => {
    res.send("<h1>Hello world</h1>");
});

const server = createServer(app);

const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",   // allow frontend socket connection too
        methods: ["GET", "POST", "DELETE", "PATCH", "PUT"]
    }
});

require('./socketio')(io);

DBController.initConnection(async () => {
    const PORT = process.env.PORT || 8000;
    server.listen(PORT, async () => {
        console.log(`server is connected on`, Util.getBaseURL(), PORT);
    });
});
