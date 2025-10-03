import { io } from "socket.io-client";
import { getToken } from "./api";

const URL = "http://localhost:8000";

const socket = io(URL, {
    autoConnect: false, 
    auth: {
        token: getToken(),
    },
});

export default socket;
