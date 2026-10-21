import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, ArrowRight, Zap } from 'lucide-react';

const LoginScreen = () => {
    const [username, setUsername] = useState('admin@abcfashion.com');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(username, password);
            navigate('/leadflow');
        } catch {
            setError('Invalid credentials. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-page)',
            padding: '2rem',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Subtle background gradient */}
            <div style={{
                position: 'absolute',
                top: '-50%',
                right: '-30%',
                width: '800px',
                height: '800px',
                background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)',
                pointerEvents: 'none'
            }} />

            <div style={{
                width: '100%',
                maxWidth: '420px',
                backgroundColor: 'var(--bg-surface)',
                borderRadius: '16px',
                border: '1px solid var(--border)',
                overflow: 'hidden',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                position: 'relative',
                zIndex: 1
            }}>
                {/* Header */}
                <div style={{
                    padding: '2.5rem 2rem 1.5rem 2rem',
                    textAlign: 'center',
                    borderBottom: '1px solid var(--border)'
                }}>
                    <div style={{
                        width: '56px',
                        height: '56px',
                        margin: '0 auto 1.25rem auto',
                        borderRadius: '14px',
                        background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '22px',
                        fontWeight: '800',
                        color: '#fff',
                        boxShadow: '0 8px 24px rgba(99, 102, 241, 0.3)'
                    }}>
                        LF
                    </div>

                    <h1 style={{
                        margin: '0 0 0.25rem 0',
                        fontSize: '1.5rem',
                        fontWeight: '700',
                        color: 'var(--text-primary)',
                        letterSpacing: '-0.02em'
                    }}>
                        LeadFlow AI
                    </h1>
                    <p style={{
                        margin: 0,
                        fontSize: '0.8rem',
                        fontWeight: '500',
                        color: 'var(--text-muted)',
                        letterSpacing: '0.3px'
                    }}>
                        Revenue Operations Platform
                    </p>
                </div>

                {/* Form */}
                <div style={{ padding: '2rem' }}>
                    <h2 style={{
                        margin: '0 0 1.5rem 0',
                        fontSize: '1rem',
                        fontWeight: '600',
                        color: 'var(--text-secondary)'
                    }}>
                        Sign in to your account
                    </h2>

                    <form onSubmit={handleLogin}>
                        <div style={{ marginBottom: '1.25rem' }}>
                            <label style={{
                                display: 'block',
                                marginBottom: '0.5rem',
                                fontSize: '0.8rem',
                                fontWeight: '600',
                                color: 'var(--text-muted)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px'
                            }}>
                                Email
                            </label>
                            <div style={{ position: 'relative' }}>
                                <Mail size={16} style={{
                                    position: 'absolute',
                                    left: '14px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    pointerEvents: 'none',
                                    color: 'var(--text-muted)'
                                }} />
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="admin@abcfashion.com"
                                    style={{
                                        width: '100%',
                                        padding: '12px 14px 12px 42px',
                                        borderRadius: '10px',
                                        border: '1px solid var(--border)',
                                        backgroundColor: 'var(--bg-input)',
                                        color: 'var(--text-primary)',
                                        fontSize: '0.9rem',
                                        outline: 'none',
                                        boxSizing: 'border-box',
                                        transition: 'border-color 150ms'
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                                    onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                                    required
                                />
                            </div>
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{
                                display: 'block',
                                marginBottom: '0.5rem',
                                fontSize: '0.8rem',
                                fontWeight: '600',
                                color: 'var(--text-muted)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px'
                            }}>
                                Password
                            </label>
                            <div style={{ position: 'relative' }}>
                                <Lock size={16} style={{
                                    position: 'absolute',
                                    left: '14px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    pointerEvents: 'none',
                                    color: 'var(--text-muted)'
                                }} />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    style={{
                                        width: '100%',
                                        padding: '12px 14px 12px 42px',
                                        borderRadius: '10px',
                                        border: '1px solid var(--border)',
                                        backgroundColor: 'var(--bg-input)',
                                        color: 'var(--text-primary)',
                                        fontSize: '0.9rem',
                                        outline: 'none',
                                        boxSizing: 'border-box',
                                        transition: 'border-color 150ms'
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                                    onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                                    required
                                />
                            </div>
                        </div>

                        {error && (
                            <div style={{
                                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.2)',
                                color: '#FCA5A5',
                                padding: '10px 14px',
                                borderRadius: '10px',
                                marginBottom: '1.5rem',
                                fontSize: '0.85rem'
                            }}>
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                width: '100%',
                                padding: '14px 24px',
                                borderRadius: '10px',
                                border: 'none',
                                background: loading
                                    ? 'linear-gradient(135deg, #4F46E5, #7C3AED)'
                                    : 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                                color: '#fff',
                                fontSize: '0.95rem',
                                fontWeight: '600',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                transition: 'opacity 150ms',
                                opacity: loading ? 0.7 : 1,
                                boxShadow: '0 4px 16px rgba(99, 102, 241, 0.3)'
                            }}
                            onMouseEnter={(e) => {
                                if (!loading) e.target.style.background = 'linear-gradient(135deg, #4F46E5, #7C3AED)';
                            }}
                            onMouseLeave={(e) => {
                                if (!loading) e.target.style.background = 'linear-gradient(135deg, #6366F1, #8B5CF6)';
                            }}
                        >
                            {loading ? (
                                <>
                                    <div className="spinner" style={{
                                        width: '16px', height: '16px',
                                        border: '2px solid rgba(255,255,255,0.3)',
                                        borderTopColor: '#fff',
                                        borderRadius: '50%'
                                    }}></div>
                                    Signing in...
                                </>
                            ) : (
                                <>
                                    Sign In
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Footer */}
                <div style={{
                    padding: '1rem 2rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                    borderTop: '1px solid var(--border)'
                }}>
                    <Zap size={12} />
                    <span>Powered by AI Revenue Operations</span>
                </div>
            </div>
        </div>
    );
};

export default LoginScreen;
