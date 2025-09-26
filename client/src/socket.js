import { io } from "socket.io-client";
import { getToken } from "./api";

const URL = "http://localhost:8000";

const socket = io(URL, {
    autoConnect: false, // don’t connect until App decides
    auth: {
        token: getToken(),
    },
});

export default socket;
