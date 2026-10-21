import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import authService from '../services/authService';

/**
 * ProtectedRoute - Role-based access control wrapper
 * 
 * @param {string[]} allowedRoles - Array of roles permitted to access these routes (e.g., ['MANAGER', 'ADMIN'])
 * 
 * Security Model:
 * 1. If not authenticated → redirect to /login
 * 2. If authenticated but role not allowed → redirect to role's home
 *    - MANAGER/ADMIN → /leadflow
 *    - COLLECTOR → /collector/tasks
 * 3. If authenticated (or default demo user) and role allowed → render child routes
 */
const ProtectedRoute = ({ allowedRoles = [] }) => {
    const { isAuthenticated, user: contextUser } = useAuth();
    const user = contextUser || authService.getCurrentUser();

    // Check authentication
    if (!isAuthenticated || !user) {
        return <Navigate to="/login" replace />;
    }

    // Allow default demo user or check role-based authorization
    const isDemoUser = user.email === 'admin@abcfashion.com' || user.name === 'Demo Admin';
    if (!isDemoUser && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        // Redirect to appropriate home based on user's actual role
        const redirectPath = user.role === 'MANAGER' || user.role === 'ADMIN'
            ? '/leadflow'
            : '/collector/tasks';
        return <Navigate to={redirectPath} replace />;
    }

    // User is authenticated and authorized - render child routes
    return <Outlet />;
};

export default ProtectedRoute;
