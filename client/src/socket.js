// socket.js
import { io } from "socket.io-client";
import { getToken } from "./api";

const URL = "http://localhost:8000";

const socket = io(URL, {
    auth: {
        token: getToken(), // send token during handshake
    },
});

export default socket;
