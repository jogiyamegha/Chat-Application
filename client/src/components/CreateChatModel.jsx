// components/CreateChatModal.js
import React, { useState } from 'react';

const CreateChatModal = ({ onClose, onCreateChatRoom }) => {
    const [isGroup, setIsGroup] = useState(false);
    const [formData, setFormData] = useState({
        receiverId: '',
        groupName: '',
        description: '',
        participants: []
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        
        const chatRoomData = {
        isGroup,
        ...formData,
        participants: isGroup ? formData.participants : []
        };

        onCreateChatRoom(chatRoomData);
    };

    return (
        <div className="modal-overlay">
        <div className="modal">
            <div className="modal-header">
            <h3>{isGroup ? 'Create Group' : 'New Chat'}</h3>
            <button onClick={onClose}>×</button>
            </div>
            
            <div className="modal-body">
            <div className="chat-type-selector">
                <label>
                <input
                    type="radio"
                    checked={!isGroup}
                    onChange={() => setIsGroup(false)}
                />
                Personal Chat
                </label>
                <label>
                <input
                    type="radio"
                    checked={isGroup}
                    onChange={() => setIsGroup(true)}
                />
                Group Chat
                </label>
            </div>

            <form onSubmit={handleSubmit}>
                {!isGroup ? (
                <div className="form-group">
                    <label>Receiver ID:</label>
                    <input
                    type="text"
                    value={formData.receiverId}
                    onChange={(e) => setFormData({...formData, receiverId: e.target.value})}
                    required
                    placeholder="Enter user ID to chat with"
                    />
                </div>
                ) : (
                <>
                    <div className="form-group">
                    <label>Group Name:</label>
                    <input
                        type="text"
                        value={formData.groupName}
                        onChange={(e) => setFormData({...formData, groupName: e.target.value})}
                        required
                        placeholder="Enter group name"
                    />
                    </div>
                    <div className="form-group">
                    <label>Description:</label>
                    <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        placeholder="Group description (optional)"
                    />
                    </div>
                    <div className="form-group">
                    <label>Participants (comma-separated IDs):</label>
                    <input
                        type="text"
                        placeholder="Enter participant IDs separated by commas"
                        onChange={(e) => setFormData({
                        ...formData, 
                        participants: e.target.value.split(',').map(id => id.trim()).filter(id => id)
                        })}
                    />
                    </div>
                </>
                )}
                
                <div className="modal-actions">
                <button type="button" onClick={onClose}>Cancel</button>
                <button type="submit">Create</button>
                </div>
            </form>
            </div>
        </div>
        </div>
    );
};

export default CreateChatModal;
