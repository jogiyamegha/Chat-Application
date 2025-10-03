// import { useEffect, useState } from "react";
// import { io } from "socket.io-client";
// import { toast } from "react-toastify";
// import styles from "../styles/chatRoomList.module.css";

// export default function ChatRoom() {
//     const [chatRooms, setChatRooms] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [socket, setSocket] = useState(null);

//     // New chatroom modal
//     const [showForm, setShowForm] = useState(false);
//     const [users, setUsers] = useState([]); // list of all users from backend
//     const [selectedUsers, setSelectedUsers] = useState([]);
//     const [groupName, setGroupName] = useState("");

//     useEffect(() => {
//         const token = localStorage.getItem("token");
//         if (!token) {
//             toast.error("No user token found. Please login.");
//             setLoading(false);
//             return;
//         }

//         const newSocket = io("http://localhost:8000", {
//             auth: { token },
//         });
//         setSocket(newSocket);

//         newSocket.on("connect", () => {
//             console.log("Socket connected:", newSocket.id);

//             // Fetch chatrooms
//             newSocket.emit("getAllChatrooms", (response) => {
//                 if (response.success) {
//                     setChatRooms(response.chatRooms);
//                 } else {
//                     toast.error(response.error || "Failed to load chat rooms");
//                 }
//                 setLoading(false);
//             });

//             // Get all users for selection
//             newSocket.emit("getAllUsers", (res) => {
//                 if (res.success) {
//                     setUsers(res.users);
//                 }
//             });
//         });

//         newSocket.on("createChatRoom", (res) => {
//             if (res.success && res.newRoom) {
//                 setChatRooms((prev) => [res.newRoom, ...prev]);
//                 toast.success("New chatroom created!");
//             }
//         });

//         newSocket.on("connect_error", (err) => {
//             toast.error("Socket connection failed: " + err.message);
//             setLoading(false);
//         });

//         return () => {
//             newSocket.disconnect();
//         };
//     }, []);

//     // Handle checkbox select
//     const toggleUserSelect = (userId) => {
//         setSelectedUsers((prev) =>
//             prev.includes(userId)
//                 ? prev.filter((id) => id !== userId)
//                 : [...prev, userId]
//         );
//     };

//     // Handle new chatroom create
//     const handleCreateChatRoom = () => {
//         if (!groupName.trim()) {
//             toast.error("Group name is required");
//             return;
//         }

//         if (selectedUsers.length === 0) {
//             toast.error("Select at least one user");
//             return;
//         }

//         socket.emit(
//             "createChatRoom",
//             { isGroup: true, groupName, participants: selectedUsers },
//             (res) => {
//                 if (res.success) {
//                     toast.success("Chat room created!");
//                     setShowForm(false);
//                     setSelectedUsers([]);
//                     setGroupName("");
//                 } else {
//                     toast.error(res.error);
//                 }
//             }
//         );
//     };

//     return (
//         <div className={styles.chatroomContainer}>
//             <h1 className={styles.chatroomTitle}>Chat Rooms</h1>

//             <button
//                 className={styles.newChatButton}
//                 onClick={() => setShowForm(true)}
//             >
//                 ➕ New Chatroom
//             </button>

//             {showForm && (
//                 <div className={styles.modal}>
//                     <div className={styles.modalContent}>
//                         <h2>Create New Chatroom</h2>
//                         <input
//                             type="text"
//                             placeholder="Group Name"
//                             value={groupName}
//                             onChange={(e) => setGroupName(e.target.value)}
//                             className={styles.input}
//                         />
//                         <div className={styles.userList}>
//                             {users.map((user) => (
//                                 <label key={user._id} className={styles.userItem}>
//                                     <input
//                                         type="checkbox"
//                                         checked={selectedUsers.includes(user._id)}
//                                         onChange={() => toggleUserSelect(user._id)}
//                                     />
//                                     {user.name}
//                                 </label>
//                             ))}
//                         </div>
                        
//                         <button
//                             className={styles.createButton}
//                             onClick={handleCreateChatRoom}
//                         >
//                             Create
//                         </button>
//                         <button
//                             className={styles.cancelButton}
//                             onClick={() => setShowForm(false)}
//                         >
//                             ❌Cancel
//                         </button>
//                     </div>
//                 </div>
//             )}

//             {loading ? (
//                 <p className={styles.loading}>Loading...</p>
//             ) : chatRooms.length > 0 ? (
//                 <ul className={styles.chatroomList}>
//                     {chatRooms.map((room) => (
//                         <li key={room._id} className={styles.chatroomItem}>
//                             <strong className={styles.chatName}>
//                                 {room.isGroup
//                                     ? room.groupDetails?.groupName
//                                     : room.personalChatRoomDetails?.receiverName}
//                             </strong>
//                             {room.lastMessage && (
//                                 <p className={styles.chatMessage}>
//                                     <em>{room.lastMessage.senderName} :</em>{" "}
//                                     {room.lastMessage.message}
//                                 </p>
//                             )}
//                         </li>
//                     ))}
//                 </ul>
//             ) : (
//                 <p className={styles.noChat}>No chat rooms available</p>
//             )}
//         </div>
//     );
// }

import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { toast } from "react-toastify";
import styles from "../styles/chatRoomList.module.css";

export default function ChatRoom() {
    const [chatRooms, setChatRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [socket, setSocket] = useState(null);

    // Modal state
    const [showForm, setShowForm] = useState(false);
    const [mode, setMode] = useState(null); // "contact" or "group"

    // Data
    const [users, setUsers] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [groupName, setGroupName] = useState("");

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            toast.error("No user token found. Please login.");
            setLoading(false);
            return;
        }

        const newSocket = io("http://localhost:8000", {
            auth: { token },
        });
        setSocket(newSocket);

        newSocket.on("connect", () => {
            console.log("Socket connected:", newSocket.id);

            // Fetch chatrooms
            newSocket.emit("getAllChatrooms", (response) => {
                if (response.success) {
                    setChatRooms(response.chatRooms);
                } else {
                    toast.error(response.error || "Failed to load chat rooms");
                }
                setLoading(false);
            });

            // Fetch users for selection
            newSocket.emit("getAllUsers", (res) => {
                if (res.success) {
                    setUsers(res.users);
                }
            });
        });

        newSocket.on("createChatRoom", (res) => {
            if (res.success && res.newRoom) {
                setChatRooms((prev) => [res.newRoom, ...prev]);
                toast.success("New chatroom created!");
            }
        });

        newSocket.on("connect_error", (err) => {
            toast.error("Socket connection failed: " + err.message);
            setLoading(false);
        });

        return () => newSocket.disconnect();
    }, []);

    // Toggle checkbox user
    const toggleUserSelect = (userId) => {
        setSelectedUsers((prev) =>
            prev.includes(userId)
                ? prev.filter((id) => id !== userId)
                : [...prev, userId]
        );
    };

    // Create new chatroom
    const handleCreateChatRoom = () => {
        if (mode === "group") {
            if (!groupName.trim()) {
                toast.error("Group name is required");
                return;
            }
            if (selectedUsers.length === 0) {
                toast.error("Select at least one user");
                return;
            }
            socket.emit(
                "createChatRoom",
                { isGroup: true, groupName, participants: selectedUsers },
                (res) => {
                    if (res.success) {
                        toast.success("Group created!");
                        resetForm();
                    } else toast.error(res.error);
                }
            );
        }
    };

    // New contact chat
    const handleNewContact = (userId) => {
        socket.emit(
            "createChatRoom",
            { isGroup: false, participants: [userId] },
            (res) => {
                if (res.success) {
                    toast.success("New contact chat created!");
                    resetForm();
                } else toast.error(res.error);
            }
        );
    };

    const resetForm = () => {
        setShowForm(false);
        setMode(null);
        setSelectedUsers([]);
        setGroupName("");
    };

    // return (
    //     <div className={styles.chatroomContainer}>
    //         <h1 className={styles.chatroomTitle}>Chat Rooms</h1>

    //         <button
    //             className={styles.newChatButton}
    //             onClick={() => setShowForm(true)}
    //         >
    //             ➕ New Chatroom
    //         </button>

    //         {showForm && (
    //             <div className={styles.modal}>
    //                 <div className={styles.modalContent}>
    //                     {!mode && (
    //                         <>
    //                             <h2>Select Chat Type</h2>
    //                             <button
    //                                 className={styles.createButton}
    //                                 onClick={() => setMode("contact")}
    //                             >
    //                                 New Contact
    //                             </button>
    //                             <button
    //                                 className={styles.createButton}
    //                                 onClick={() => setMode("group")}
    //                             >
    //                                 New Group
    //                             </button>
    //                             <button
    //                                 className={styles.cancelButton}
    //                                 onClick={resetForm}
    //                             >
    //                                 Cancel
    //                             </button>
    //                         </>
    //                     )}

    //                     {mode === "contact" && (
    //                         <>
    //                             <h2>Select User</h2>
    //                             <div className={styles.userList}>
    //                                 {users.map((user) => (
    //                                     <button
    //                                         key={user._id}
    //                                         className={styles.userItem}
    //                                         onClick={() => handleNewContact(user._id)}
    //                                     >
    //                                         {user.name}
    //                                     </button>
    //                                 ))}
    //                             </div>
    //                             <button
    //                                 className={styles.cancelButton}
    //                                 onClick={resetForm}
    //                             >
    //                                 Cancel
    //                             </button>
    //                         </>
    //                     )}

    //                     {mode === "group" && (
    //                         <>
    //                             <h2>Create Group</h2>
    //                             <input
    //                                 type="text"
    //                                 placeholder="Group Name"
    //                                 value={groupName}
    //                                 onChange={(e) => setGroupName(e.target.value)}
    //                                 className={styles.input}
    //                             />
    //                             <div className={styles.userList}>
    //                                 {users.map((user) => (
    //                                     <label key={user._id} className={styles.userItem}>
    //                                         <input
    //                                             type="checkbox"
    //                                             checked={selectedUsers.includes(user._id)}
    //                                             onChange={() => toggleUserSelect(user._id)}
    //                                         />
    //                                         {user.name}
    //                                     </label>
    //                                 ))}
    //                             </div>
    //                             <button
    //                                 className={styles.createButton}
    //                                 onClick={handleCreateChatRoom}
    //                             >
    //                                 ✅ Create Group
    //                             </button>
    //                             <button
    //                                 className={styles.cancelButton}
    //                                 onClick={resetForm}
    //                             >
    //                                 Cancel
    //                             </button>
    //                         </>
    //                     )}
    //                 </div>
    //             </div>
    //         )}

    //         {loading ? (
    //             <p className={styles.loading}>Loading...</p>
    //         ) : chatRooms.length > 0 ? (
    //             <ul className={styles.chatroomList}>
    //                 {chatRooms.map((room) => (
    //                     <li key={room._id} className={styles.chatroomItem}>
    //                         <strong className={styles.chatName}>
    //                             {room.isGroup
    //                                 ? room.groupDetails?.groupName
    //                                 : room.personalChatRoomDetails?.receiverName}
    //                         </strong>
    //                         {room.lastMessage && (
    //                             <p className={styles.chatMessage}>
    //                                 <em>{room.lastMessage.senderName} :</em>{" "}
    //                                 {room.lastMessage.message}
    //                             </p>
    //                         )}
    //                     </li>
    //                 ))}
    //             </ul>
    //         ) : (
    //             <p className={styles.noChat}>No chat rooms available</p>
    //         )}
    //     </div>
    // );

     return (
        <div className={styles.chatroomContainer}>
            <h1 className={styles.chatroomTitle}>Chat Rooms</h1>

            <button
                className={styles.newChatButton}
                onClick={() => setShowForm(true)}
            >
                ➕ New Chatroom
            </button>

            {showForm && (
                <div className={styles.modal}>
                    <div className={styles.modalContent}>
                        {!mode && (
                            <>
                                <h2>Select Chat Type</h2>
                                <button
                                    className={styles.createButton}
                                    onClick={() => setMode("contact")}
                                >
                                    New Contact
                                </button>
                                <button
                                    className={styles.createButton}
                                    onClick={() => setMode("group")}
                                >
                                    New Group
                                </button>
                                <button
                                    className={styles.cancelButton}
                                    onClick={resetForm}
                                >
                                    Cancel
                                </button>
                            </>
                        )}

                        {mode === "contact" && (
                            <>
                                <h2>Select User</h2>
                                <div className={styles.userList}>
                                    {users.map((user) => (
                                        <button
                                            key={user._id}
                                            className={styles.userItem}
                                            onClick={() => handleNewContact(user._id)}
                                        >
                                            {user.name}
                                        </button>
                                    ))}
                                </div>
                                <button
                                    className={styles.cancelButton}
                                    onClick={resetForm}
                                >
                                    Cancel
                                </button>
                            </>
                        )}

                        {mode === "group" && (
                            <>
                                <h2>Create Group</h2>
                                <input
                                    type="text"
                                    placeholder="Group Name"
                                    value={groupName}
                                    onChange={(e) => setGroupName(e.target.value)}
                                    className={styles.input}
                                />
                                <div className={styles.userList}>
                                    {users.map((user) => (
                                        <label key={user._id} className={styles.userItem}>
                                            <input
                                                type="checkbox"
                                                checked={selectedUsers.includes(user._id)}
                                                onChange={() => toggleUserSelect(user._id)}
                                            />
                                            {user.name}
                                        </label>
                                    ))}
                                </div>
                                <button
                                    className={styles.createButton}
                                    onClick={handleCreateChatRoom}
                                >
                                    Create Group
                                </button>
                                <button
                                    className={styles.cancelButton}
                                    onClick={resetForm}
                                >
                                    Cancel
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}

            {loading ? (
                <p className={styles.loading}>Loading...</p>
            ) : chatRooms.length > 0 ? (
                <ul className={styles.chatroomList}>
                    {chatRooms.map((room) => (
                        <li key={room._id} className={styles.chatroomItem}>
                            <div className={styles.chatroomContent}>
                                <div className={styles.avatar}>
                                    {room.isGroup ? "👥" : "👤"}
                                </div>
                                <div>
                                    <strong className={styles.chatName}>
                                        {room.isGroup
                                            ? room.groupDetails?.groupName
                                            : room.personalChatRoomDetails?.receiverName}
                                    </strong>
                                    {room.lastMessage && (
                                        <p className={styles.chatMessage}>
                                            <em>{room.lastMessage.senderName} :</em>{" "}
                                            {room.lastMessage.message}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className={styles.noChat}>No chat rooms available</p>
            )}
        </div>
    );
 
}
