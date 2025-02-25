import React, { useState } from 'react';

const AIChat = () => {
    const [input, setInput] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        // Handle input submission
    };

    return (
        <form onSubmit={handleSubmit}>
            <input 
                type="text" 
                value={input} 
                onChange={(e) => setInput(e.target.value)} 
                placeholder="Ask me anything..." 
            />
            <button type="submit">Send</button>
        </form>
    );
};

export default AIChat; 