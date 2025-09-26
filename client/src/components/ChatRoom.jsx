// import { useState, useEffect } from "react";
// import { USER_END_POINT } from "../utils/constants";
// import { toast } from "react-toastify";

// export default function ChatRoom() {
//     const [chatRooms, setChatRooms] = useState([]);
//     const [loading, setLoading] = useState(true);

//     useEffect(() => {
//         fetchAllChatRooms();
//     }, []);

//     const fetchAllChatRooms = async () => {
//         console.log("Fetching chat rooms...");
//         try {
//             const token = localStorage.getItem("userToken"); 

//             const res = await fetch(`${USER_END_POINT}/all-chat-rooms`, {
//                 method: "GET",
//                 headers: {
//                     "Content-Type": "application/json",
//                     Authorization: `Bearer ${token}`, 
//                 },
//             });

//             const data = await res.json();
//             // console.log("res", res);
//             console.log("data", data);

//             if (!res.ok) {
//                 toast.error(data.error || "Failed to fetch chatrooms");
//                 return;
//             }

//             setChatRooms(data); // ✅ update state
//         } catch (error) {
//             toast.error("Something went wrong while fetching chatrooms");
//             console.error(error);
//         } finally {
//             setLoading(false);
//         }
//     };

//     return (
//         <div>
//             <h1>Chat Rooms</h1>

//             {loading ? (
//                 <p>Loading...</p>
//             ) : chatRooms.length > 0 ? (
//                 <ul>
//                     {chatRooms.map((room) => (
//                         <li key={room._id || room.id}>
//                             <strong>{room.name || room.groupName}</strong>
//                             <p>{room.description || "No description"}</p>
//                         </li>
//                     ))}
//                 </ul>
//             ) : (
//                 <p>No chat rooms available</p>
//             )}
//         </div>
//     );
// }


import { useState, useEffect } from "react";
import { USER_END_POINT } from "../utils/constants";
import { toast } from "react-toastify";

export default function ChatRoom() {
    const [chatRooms, setChatRooms] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAllChatRooms();
    }, []);

    const fetchAllChatRooms = async () => {
        console.log("Fetching chat rooms...");
        try {
            const token = localStorage.getItem("userToken"); // ✅ Get token from localStorage

            const res = await fetch(`${USER_END_POINT}/all-chat-rooms`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`, // ✅ Add JWT header
                },
            });

            const data = await res.json();
            console.log("res", res);
            console.log("data", data);

            if (!res.ok) {
                toast.error(data.error || "Failed to fetch chatrooms");
                return;
            }

            setChatRooms(data); // ✅ update state
        } catch (error) {
            toast.error("Something went wrong while fetching chatrooms");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h1>Chat Rooms</h1>

            {loading ? (
                <p>Loading...</p>
            ) : chatRooms.length > 0 ? (
                <ul>
                    {chatRooms.map((room) => (
                        <li key={room._id || room.id}>
                            <strong>{room.name || room.groupName}</strong>
                            <p>{room.description || "No description"}</p>
                        </li>
                    ))}
                </ul>
            ) : (
                <p>No chat rooms available</p>
            )}
        </div>
    );
}
