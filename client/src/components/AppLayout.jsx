import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';

/**
 * AppLayout - Main application shell
 * 
 * Manages `isSidebarCollapsed` state so the sidebar can collapse from 240px (w-64)
 * to 64px (w-16) on desktop (or hide completely on mobile) while the main content
 * area smoothly expands to fill the freed space.
 */
const AppLayout = () => {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
        if (typeof window !== 'undefined' && window.innerWidth <= 768) {
            return true;
        }
        return localStorage.getItem('lf_sidebar_collapsed') === 'true';
    });

    const [isMobile, setIsMobile] = useState(() => {
        return typeof window !== 'undefined' ? window.innerWidth <= 768 : false;
    });

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth <= 768;
            setIsMobile(mobile);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const toggleSidebar = () => {
        setIsSidebarCollapsed(prev => {
            const next = !prev;
            if (!isMobile) {
                localStorage.setItem('lf_sidebar_collapsed', String(next));
            }
            return next;
        });
    };

    const sidebarWidth = isMobile
        ? '0px'
        : isSidebarCollapsed
            ? '64px'
            : '240px';

    return (
        <div style={{
            display: 'flex',
            minHeight: '100vh',
            background: 'var(--bg-page, #111214)',
            position: 'relative',
        }}>
            {/* Mobile Top Toggle Button when sidebar is hidden on small screens */}
            {isMobile && isSidebarCollapsed && (
                <button
                    type="button"
                    onClick={toggleSidebar}
                    aria-label="Open navigation menu"
                    style={{
                        position: 'fixed',
                        top: '14px',
                        left: '14px',
                        zIndex: 1100,
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        background: 'var(--bg-surface, #1E2025)',
                        border: '1px solid var(--border, #34363E)',
                        color: 'var(--text-primary, #F5F6FA)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.35)',
                    }}
                >
                    <Menu size={20} />
                </button>
            )}

            {/* Mobile Backdrop when sidebar is expanded on mobile */}
            {isMobile && !isSidebarCollapsed && (
                <div
                    onClick={() => setIsSidebarCollapsed(true)}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0, 0, 0, 0.6)',
                        backdropFilter: 'blur(2px)',
                        zIndex: 999,
                        transition: 'opacity 250ms ease',
                    }}
                />
            )}

            <Sidebar
                isSidebarCollapsed={isSidebarCollapsed}
                onToggleSidebar={toggleSidebar}
                isMobile={isMobile}
            />

            <main style={{
                flex: 1,
                width: `calc(100% - ${sidebarWidth})`,
                marginInlineStart: sidebarWidth,
                padding: isMobile ? '64px 16px 24px' : '24px',
                overflowY: 'auto',
                transition: 'margin-inline-start 250ms cubic-bezier(0.4, 0, 0.2, 1), width 250ms cubic-bezier(0.4, 0, 0.2, 1), padding 250ms ease',
            }}>
                <Outlet />
            </main>
        </div>
    );
};

export default AppLayout;
