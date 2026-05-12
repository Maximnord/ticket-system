import './bootstrap';
import React from 'react';
import ReactDOM from 'react-dom/client';
import TicketSystem from './components/TicketSystem';

if (document.getElementById('root')) {
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(
        <React.StrictMode>
            <TicketSystem />
        </React.StrictMode>
    );
}
