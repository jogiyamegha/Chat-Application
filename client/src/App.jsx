// // App.js
// // import React, { useState, useEffect } from 'react';
// // import { io } from 'socket.io-client';
// // import ChatRoom from './components/ChatRoom';
// // import Chat from './components/Chat';
// // // import LoginForm from './components/LoginForm';
// // import './App.css';

// // const App = () => {
// //     const [socket, setSocket] = useState(null);
// //     const [user, setUser] = useState(null);
// //     const [selectedChatRoom, setSelectedChatRoom] = useState(null);
// //     const [chatRooms, setChatRooms] = useState([]);
// //     const [isOnline, setIsOnline] = useState(false);
// //     const [messages, setMessages] = useState({});

// //     useEffect(() => {
// //         if (user && user.token) {
// //         const newSocket = io('http://localhost:8000', {
// //             auth: {
// //                 token: user.token
// //             }
// //         });

// //         newSocket.on('connect', () => {
// //             console.log('Connected to server');
// //             setSocket(newSocket);

// //             // Create connection
// //             newSocket.emit('createConnection', (response) => {
// //             console.log('Connection created:', response);
// //             });
// //         });

// //         newSocket.on('connectionSuccess', (message) => {
// //             console.log(message);
// //             newSocket.emit('onlineStatusChange', {}, (response) => {
// //                 if (response.success) {
// //                     setIsOnline(true);
// //                 }
// //             });
// //         });

// //         newSocket.on('authError', (error) => {
// //             console.error('Auth error:', error);
// //             setUser(null);
// //         });

// //         newSocket.on('onlineErr', (message) => {
// //             console.error('Online error:', message);
// //             setIsOnline(false);
// //         });

// //         newSocket.on('messageReceived', (data) => {
// //             console.log('Message received:', data);
// //             // Update messages for the current chat room
// //             if (selectedChatRoom) {
// //             setMessages(prev => ({
// //                 ...prev,
// //                 [selectedChatRoom.id]: [...(prev[selectedChatRoom.id] || []), data.message]
// //             }));
// //             }
// //         });

// //         newSocket.on('chatHistory', (history) => {
// //             console.log('Chat history:', history);
// //             if (selectedChatRoom) {
// //             setMessages(prev => ({
// //                 ...prev,
// //                 [selectedChatRoom.id]: history
// //             }));
// //             }
// //         });

// //         return () => {
// //             newSocket.close();
// //         };
// //         }
// //     }, [user]);

// //     // const handleLogin = (userData) => {
// //     //     setUser(userData);
// //     // };

// //     const handleLogout = () => {
// //         if (socket) {
// //         socket.close();
// //         }
// //         setUser(null);
// //         setSocket(null);
// //         setSelectedChatRoom(null);
// //         setChatRooms([]);
// //         setMessages({});
// //         setIsOnline(false);
// //     };

// //     const handleSelectChatRoom = (chatRoom) => {
// //         setSelectedChatRoom(chatRoom);
// //         // Load chat history
// //         if (socket) {
// //             socket.emit('showChatRoomMessage', { chatRoomId: chatRoom.id });
// //         }
// //     };

// //     // if (!user) {
// //     //     return <LoginForm onLogin={handleLogin} />;
// //     // }

// //     return (
// //         <div className="app">
// //             <div className="app-container">
// //                 <ChatRoom
// //                     chatRooms={chatRooms}
// //                     selectedChatRoom={selectedChatRoom}
// //                     onSelectChatRoom={handleSelectChatRoom}
// //                     user={user}
// //                     socket={socket}
// //                     isOnline={isOnline}
// //                     onLogout={handleLogout}
// //                 />
// //                 <Chat
// //                     selectedChatRoom={selectedChatRoom}
// //                     messages={messages[selectedChatRoom?.id] || []}
// //                     socket={socket}
// //                     user={user}
// //                     isOnline={isOnline}
// //                 />
// //             </div>
// //         </div>
// //     );
// // };

// // export default App;

// import React, { useEffect, useState } from "react";
// import ChatRoom from "./components/ChatRoom";
// import socket from "./socket";

// function App() {
//     const [isConnected, setIsConnected] = useState(false);

//     useEffect(() => {
//         socket.on("connect", () => setIsConnected(true));
//         socket.on("disconnect", () => setIsConnected(false));

//         return () => {
//             socket.off("connect");
//             socket.off("disconnect");
//         };

//     }, []);

//     return (
//         <>
//         {isConnected ? (
//             // <ChatRoom socket={socket} />
//             <ChatRoom />
//         ) : (
//             <p>Connecting to server...</p>
//         )}
//         </>
//     );
// }

// export default App;

// App.jsx
import React, { useEffect, useState } from "react";
import socket from "./socket";
import { getToken, logoutUser } from "./api";
import Login from "./components/Login"; 
import ChatRoom from "./components/ChatRoom"; // assume you have this

export default function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = getToken();

        if (!token) {
            // No token, so force login
            setLoading(false);
            return;
        }

        // Setup socket listeners only if token exists
        socket.connect();

        socket.on("connect", () => {
            console.log("Connected with socket id:", socket.id);
            socket.emit("createConnection");
        });

        socket.on("authError", (err) => {
            console.error("Auth error:", err);
            handleLogout(); // auto-logout on error
        });

        socket.on("connectionSuccess", (msg) => {
            console.log(msg);
            // You can also set user data from server if needed
        });

        setLoading(false);

        return () => {
            socket.off("connect");
            socket.off("authError");
            socket.off("connectionSuccess");
        };
    }, []);

    function handleLogout() {
        logoutUser();
        socket.disconnect();
        setUser(null);
    }

    if (loading) return <p>Loading...</p>;

    return (
        <div>
            <h1>Chat App</h1>
            {getToken() ? (
                <>
                    <p>Welcome {user?.name || "User"}</p>
                    <button onClick={handleLogout}>Logout</button>
                    <ChatRoom />
                </>
            ) : (
                <Login onLogin={setUser} />
            )}
        </div>
    );
}
