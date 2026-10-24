import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

/**
 * AppLayout - Main application shell
 * 
 * Renders the fixed sidebar (240px) on the left and the page content
 * area on the right using React Router's <Outlet />.
 * 
 * Used by ManagerLayout as the default desktop layout.
 */
const AppLayout = () => {
    return (
        <div style={{
            display: 'flex',
            minHeight: '100vh',
            background: 'var(--bg-page, #111214)',
        }}>
            <Sidebar />
            <main style={{
                flex: 1,
                marginInlineStart: '240px',
                padding: '24px',
                overflowY: 'auto',
            }}>
                <Outlet />
            </main>
        </div>
    );
};

export default AppLayout;
