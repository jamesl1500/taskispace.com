/**
 * Toolbox component
 * A floating toolbox for quick access to tools 
 * such as creating tasks, lists, and more
 * 
 * @module components/layout/Toolbox
 */
"use client";
import React, { useState } from 'react';
import '@/styles/shared/_toolbox.scss';

export default function Toolbox() {
    const [isOpen, setIsOpen] = useState(false);

    const toggleToolbox = () => {
        setIsOpen(!isOpen);
    };

    return (
        <div className={`global-toolbox ${isOpen ? 'toolbox-open' : ''}`}>
            <button className="toolbox-toggle-button" onClick={toggleToolbox}>
                <span className="toolbox-icon">
                    {isOpen ? '×' : '+'}
                </span>
                <span className="toolbox-text">
                    {isOpen ? 'Close' : 'Toolbox'}
                </span>
            </button>
            
            <div className={`toolbox-content ${isOpen ? 'open' : ''}`}>
                <h3>Quick Tools</h3>
                <div className="toolbox-items">
                    <button className="tool-item">
                        <span className="tool-icon">✓</span>
                        <span className="tool-label">Create Task</span>
                    </button>
                    <button className="tool-item">
                        <span className="tool-icon">📋</span>
                        <span className="tool-label">Create List</span>
                    </button>
                    <button className="tool-item">
                        <span className="tool-icon">💬</span>
                        <span className="tool-label">New Conversation</span>
                    </button>
                    <button className="tool-item">
                        <span className="tool-icon">👥</span>
                        <span className="tool-label">Add Friend</span>
                    </button>
                </div>
            </div>
        </div>
    );
}