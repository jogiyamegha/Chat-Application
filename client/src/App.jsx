import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import socket from "./socket";
import { getToken, logoutUser } from "./api";
import Login from "./components/Login";
import ChatRoom from "./components/ChatRoom";
import { clearUser } from "./redux/features/userSlice";

export default function App() {
    const user = useSelector((state) => state.user.user); // Redux state
    const dispatch = useDispatch();
    const [loading, setLoading] = useState(true);

    const token = getToken();

    useEffect(() => {
        if (!token) {
            setLoading(false);
            return;
        }

        if (!socket.connected) socket.connect();

        const handleConnect = () => console.log("Connected with socket id:", socket.id);
    
        const handleAuthError = (err) => {
            console.error("Auth error:", err);
            // handleLogout();
        };
        const handleConnectionSuccess = (msg) => console.log(msg);

        socket.on("connect", handleConnect);
        socket.on("authError", handleAuthError);
        socket.on("connectionSuccess", handleConnectionSuccess);

        setLoading(false);
        return () => {
            socket.off("connect", handleConnect);
            socket.off("authError", handleAuthError);
            socket.off("connectionSuccess", handleConnectionSuccess);
        };
    }, [token]);

    const handleLogout = () => {
        logoutUser();
        socket.disconnect();
        dispatch(clearUser());
    };

    if (loading) return <p>Loading...</p>;

    return (
        <div>
        <h1>Chat App</h1>

        {token && user ? (
            <>
            <p>Welcome {user.name || "User"}</p>
            <button onClick={handleLogout}>Logout</button>
            <ChatRoom />
            </>
        ) : (
            <Login />
        )}
        </div>
    );
}
