import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';

const DEFAULT_USER = {
    email: 'admin@abcfashion.com',
    name: 'Demo Admin',
};

const AuthContext = createContext({
    isAuthenticated: true,
    user: DEFAULT_USER,
    login: async () => {},
    logout: () => {},
});

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(() => {
        if (sessionStorage.getItem('demo_logged_out') === 'true') {
            return Boolean(localStorage.getItem('user'));
        }
        return true;
    });

    const [user, setUser] = useState(() => {
        if (sessionStorage.getItem('demo_logged_out') === 'true') {
            const saved = localStorage.getItem('user');
            return saved ? JSON.parse(saved) : null;
        }
        const saved = localStorage.getItem('user');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch {
                return DEFAULT_USER;
            }
        }
        return DEFAULT_USER;
    });

    useEffect(() => {
        if (isAuthenticated && user) {
            localStorage.setItem('user', JSON.stringify(user));
            if (!localStorage.getItem('token')) {
                localStorage.setItem('token', 'demo-token');
            }
        }
    }, [isAuthenticated, user]);

    const login = async (username, password, twoFactorToken = null) => {
        sessionStorage.removeItem('demo_logged_out');
        try {
            const data = await authService.login(username, password, twoFactorToken);
            if (data.user) {
                setUser(data.user);
                setIsAuthenticated(true);
            }
            return data;
        } catch (err) {
            // Fallback for demo mode login if backend is not reachable
            if (!username || username === DEFAULT_USER.email || username === 'admin') {
                const demoUser = { ...DEFAULT_USER, email: username || DEFAULT_USER.email };
                localStorage.setItem('user', JSON.stringify(demoUser));
                localStorage.setItem('token', 'demo-token');
                setUser(demoUser);
                setIsAuthenticated(true);
                return { user: demoUser, token: 'demo-token' };
            }
            throw err;
        }
    };

    const logout = () => {
        sessionStorage.setItem('demo_logged_out', 'true');
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        setUser(null);
        setIsAuthenticated(false);
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, user, setIsAuthenticated, setUser, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;
