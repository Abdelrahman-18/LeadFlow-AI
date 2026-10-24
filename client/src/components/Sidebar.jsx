import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import LanguageSwitcher from './LanguageSwitcher';
import {
    LayoutDashboard, MessageSquare, TrendingUp, Brain,
    BookOpen, CheckSquare, Puzzle, Settings,
    LogOut, Sun, Moon, Search,
    ChevronDown, Bot, BarChart3, Zap
} from 'lucide-react';
import './Sidebar.css';

const Sidebar = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    const [theme, setTheme] = useState(() => {
        return localStorage.getItem('theme') || 'dark';
    });

    const userData = {
        name: user?.displayName || user?.name || 'Demo Admin',
        role: user?.role || 'Admin'
    };

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsSearchOpen(true);
                document.getElementById('sidebar-search')?.focus();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const isActive = (path) => {
        return location.pathname === path || location.pathname.startsWith(path + '/');
    };

    const navItems = [
        { id: 'dashboard', label: 'Dashboard', path: '/leadflow', icon: LayoutDashboard, keywords: ['home', 'dashboard', 'overview'] },
        { id: 'conversations', label: 'Conversations', path: '/conversations', icon: MessageSquare, keywords: ['inbox', 'messages', 'chat', 'conversations'] },
        { id: 'opportunities', label: 'Revenue Opportunities', path: '/opportunities', icon: TrendingUp, keywords: ['revenue', 'opportunities', 'leads', 'pipeline'] },
        { id: 'analytics', label: 'AI Analytics', path: '/analytics', icon: Brain, keywords: ['analytics', 'ai', 'insights', 'questions'] },
        { id: 'copilots', label: 'Sales Co-Pilots', path: '/copilots', icon: Bot, keywords: ['copilots', 'coaching', 'sales', 'ai', 'strategy'] },
        { id: 'knowledge', label: 'Knowledge Base', path: '/knowledge', icon: BookOpen, keywords: ['knowledge', 'faq', 'docs', 'information'] },
        { id: 'approvals', label: 'Approvals', path: '/approvals', icon: CheckSquare, keywords: ['approvals', 'review', 'pending'] },
        { id: 'integrations', label: 'Integrations', path: '/integrations', icon: Puzzle, keywords: ['integrations', 'messenger', 'channels'] },
        { id: 'settings', label: 'Settings', path: '/settings', icon: Settings, keywords: ['settings', 'preferences', 'config'] },
    ];

    const filteredItems = searchQuery.length > 0
        ? navItems.filter(item => {
            const searchLower = searchQuery.toLowerCase();
            const labelMatch = item.label.toLowerCase().includes(searchLower);
            const keywordMatch = item.keywords.some(kw => kw.includes(searchLower));
            return labelMatch || keywordMatch;
        })
        : [];

    const handleNavigation = (path) => {
        navigate(path);
        setSearchQuery('');
        setIsSearchOpen(false);
    };

    return (
        <aside className="sidebar">
            {/* Header — LeadFlow AI Brand */}
            <div className="sidebar-header">
                <div className="sidebar-logo">
                    <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        background: 'var(--brand-gradient)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px',
                        fontWeight: '800',
                        color: '#fff',
                        letterSpacing: '0.5px'
                    }}>
                        LF
                    </div>
                </div>
                <div className="sidebar-branding">
                    <div className="brand-name" style={{ fontSize: '15px', fontWeight: '700' }}>LeadFlow</div>
                    <div className="product-name" style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>Revenue Operations</div>
                </div>
            </div>

            {/* Search */}
            <div className="sidebar-search-container">
                <div className="sidebar-search-wrapper">
                    <Search className="search-icon" size={16} />
                    <input
                        id="sidebar-search"
                        type="text"
                        className="sidebar-search-input"
                        placeholder="Search... (Ctrl+K)"
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setIsSearchOpen(e.target.value.length > 0);
                        }}
                        onFocus={() => searchQuery.length > 0 && setIsSearchOpen(true)}
                    />
                </div>
                {isSearchOpen && filteredItems.length > 0 && (
                    <div className="search-dropdown">
                        {filteredItems.map(item => (
                            <button
                                key={item.id}
                                className="search-result-item"
                                onClick={() => handleNavigation(item.path)}
                            >
                                <item.icon size={16} />
                                <span>{item.label}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Navigation */}
            <nav className="sidebar-nav">
                <div className="nav-section">
                    <div className="section-label">Main</div>
                    {navItems.slice(0, 2).map(item => (
                        <button
                            key={item.id}
                            className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
                            onClick={() => handleNavigation(item.path)}
                        >
                            <item.icon size={18} className="nav-icon" />
                            <span className="nav-label">{item.label}</span>
                        </button>
                    ))}
                </div>

                <div className="nav-section">
                    <div className="section-label">Revenue</div>
                    {navItems.slice(2, 5).map(item => (
                        <button
                            key={item.id}
                            className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
                            onClick={() => handleNavigation(item.path)}
                        >
                            <item.icon size={18} className="nav-icon" />
                            <span className="nav-label">{item.label}</span>
                        </button>
                    ))}
                </div>

                <div className="nav-section">
                    <div className="section-label">Operations</div>
                    {navItems.slice(5, 9).map(item => (
                        <button
                            key={item.id}
                            className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
                            onClick={() => handleNavigation(item.path)}
                        >
                            <item.icon size={18} className="nav-icon" />
                            <span className="nav-label">{item.label}</span>
                        </button>
                    ))}
                </div>
            </nav>

            {/* Footer */}
            <div className="sidebar-footer">
                <div className="footer-links" style={{ padding: '8px 12px', borderBottom: 'none' }}>
                    <LanguageSwitcher />
                </div>
                <div className="user-plate">
                    <div className="user-info">
                        <div className="user-avatar" style={{
                            background: 'var(--brand-gradient)',
                            border: 'none',
                            color: '#fff',
                            fontWeight: '700'
                        }}>
                            {userData.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="user-details">
                            <div className="user-name">{userData.name}</div>
                            <div className="user-role" style={{ color: 'var(--text-muted)', fontSize: '11px' }}>{userData.role}</div>
                        </div>
                    </div>
                    <div className="control-cluster">
                        <button className="control-btn" onClick={toggleTheme} title="Toggle theme">
                            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                        </button>
                        <button className="control-btn" onClick={handleLogout} title="Logout">
                            <LogOut size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
