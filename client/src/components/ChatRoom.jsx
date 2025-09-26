import { useState, useEffect } from "react";
import { USER_END_POINT } from "../utils/constants";
import { toast } from "react-toastify"; // make sure you installed react-toastify

export default function ChatRoom() {
    const [chatRooms, setChatRooms] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch chat rooms when component loads
    useEffect(() => {
        fetchAllChatRooms();
    }, []);

    const fetchAllChatRooms = async () => {
        console.log("hello here");
        try {
            const res = await fetch(`${USER_END_POINT}/all-chat-rooms`, {
                method: "GET",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
            });

            console.log("res",res);
            const data = await res.json();

            console.log("data", data);

            if (!res.ok) {
                toast.error(data.error || "Failed to fetch chatrooms");
                return;
            }

            // setChatRooms(data);
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
                        <li key={room.id || room._id}>
                            <strong>{room.name}</strong>
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
