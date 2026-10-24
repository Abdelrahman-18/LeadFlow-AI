import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import leadflowService from '../services/leadflowService';
import {
    TrendingUp, MessageSquare, Target, Users,
    AlertCircle, Loader2, Activity, Zap, ArrowRight, Bot
} from 'lucide-react';

// Design-system tokens (fallbacks match the dark palette in index.css)
const SURFACE = 'var(--bg-surface, #1E2025)';
const BORDER = 'var(--border, #34363E)';
const TEXT_PRIMARY = 'var(--text-primary, #F5F6FA)';
const TEXT_SECONDARY = 'var(--text-secondary, #A9ADB8)';
const PRIMARY = 'var(--primary, #805BE7)';
const ACCENT_YELLOW = 'var(--accent-yellow, #E6B84D)';

function HomePage() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) setUser(JSON.parse(userData));

        const fetchDashboard = async () => {
            try {
                const data = await leadflowService.getDashboard();
                setDashboard(data);
            } catch (error) {
                console.error('Error fetching dashboard:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboard();
    }, []);

    const pendingApprovals = dashboard?.metrics?.pendingApprovals || 0;

    // Top responsive metric cards grid
    const summaryCards = [
        {
            label: 'Total Conversations',
            value: (dashboard?.metrics?.totalConversations || 0).toLocaleString(),
            icon: MessageSquare,
            path: '/conversations',
        },
        {
            label: 'Revenue Leads',
            value: (dashboard?.metrics?.totalLeads || 0).toLocaleString(),
            icon: TrendingUp,
            path: '/opportunities',
        },
        {
            label: 'AI Actions',
            value: (dashboard?.metrics?.totalActions || 0).toLocaleString(),
            icon: Bot,
            path: '/approvals',
            note: pendingApprovals > 0
                ? `${pendingApprovals} pending approval${pendingApprovals !== 1 ? 's' : ''}`
                : null,
        },
    ];

    return (
        <div style={{ padding: '24px 32px', maxWidth: '1200px', margin: '0 auto' }}>
            {/* Welcome Header */}
            <div style={{ marginBottom: '28px' }}>
                <h1 style={{
                    fontSize: '26px', fontWeight: 700, margin: '0 0 6px 0',
                    color: TEXT_PRIMARY
                }}>
                    Welcome back{user ? `, ${user.displayName || user.name}` : ''}
                </h1>
                <p style={{ margin: 0, fontSize: '14px', color: TEXT_SECONDARY }}>
                    Here's your revenue operations overview
                </p>
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}>
                    <Loader2 className="spin" size={32} style={{ color: PRIMARY }} />
                </div>
            ) : (
                <>
                    {/* Top Dashboard Metric Cards */}
                    <div className="lf-summary-grid">
                        {summaryCards.map((card) => {
                            const Icon = card.icon;
                            return (
                                <button
                                    key={card.label}
                                    type="button"
                                    className="lf-summary-card"
                                    onClick={() => navigate(card.path)}
                                >
                                    <div className="lf-summary-icon">
                                        <Icon size={20} style={{ color: ACCENT_YELLOW }} />
                                    </div>
                                    <div style={{ minWidth: 0 }}>
                                        <div className="lf-summary-value">{card.value}</div>
                                        <div className="lf-summary-label">{card.label}</div>
                                        {card.note && (
                                            <div className="lf-summary-note">
                                                <AlertCircle size={12} />
                                                {card.note}
                                            </div>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Recent Activity + Quick Actions */}
                    <div className="lf-dashboard-panels">
                        {/* Recent Activity */}
                        <div style={{
                            padding: '22px', borderRadius: '14px',
                            background: SURFACE,
                            border: `1px solid ${BORDER}`
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                                <Activity size={16} style={{ color: PRIMARY }} />
                                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: TEXT_PRIMARY }}>
                                    Recent Activity
                                </h3>
                            </div>
                            {dashboard?.recentActivity?.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {dashboard.recentActivity.slice(0, 5).map((activity, idx) => (
                                        <div key={activity.id || idx} style={{
                                            display: 'flex', gap: '10px', alignItems: 'flex-start',
                                            padding: '10px 12px', borderRadius: '8px',
                                            background: 'transparent',
                                            cursor: 'pointer', transition: 'background 0.15s'
                                        }}
                                            onClick={() => navigate('/conversations')}
                                            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <div style={{
                                                width: '30px', height: '30px', borderRadius: '8px', minWidth: '30px',
                                                background: activity.avatarUrl
                                                    ? `url(${activity.avatarUrl}) center/cover`
                                                    : 'var(--brand-gradient, #805BE7)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                color: '#fff', fontWeight: 700, fontSize: '11px'
                                            }}>
                                                {!activity.avatarUrl && (activity.customerName?.charAt(0) || '?')}
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontSize: '12px', fontWeight: 600, color: TEXT_PRIMARY, marginBottom: '2px' }}>
                                                    {activity.customerName || 'Unknown'}
                                                </div>
                                                <div style={{ fontSize: '11px', color: TEXT_SECONDARY, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {activity.message || ''}
                                                </div>
                                            </div>
                                            <span style={{ fontSize: '10px', color: TEXT_SECONDARY, whiteSpace: 'nowrap' }}>
                                                {activity.time ? new Date(activity.time).toLocaleDateString() : ''}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ padding: '30px 0', textAlign: 'center', color: TEXT_SECONDARY, fontSize: '13px' }}>
                                    No recent activity
                                </div>
                            )}
                        </div>

                        {/* Quick Actions */}
                        <div style={{
                            padding: '22px', borderRadius: '14px',
                            background: SURFACE,
                            border: `1px solid ${BORDER}`
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                                <Zap size={16} style={{ color: ACCENT_YELLOW }} />
                                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: TEXT_PRIMARY }}>
                                    Quick Actions
                                </h3>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <ActionButton icon={MessageSquare} label="View Conversations" path="/conversations" onClick={navigate} />
                                <ActionButton icon={TrendingUp} label="Revenue Opportunities" path="/opportunities" onClick={navigate} />
                                <ActionButton icon={Target} label="AI Analytics" path="/analytics" onClick={navigate} />
                                <ActionButton icon={Users} label="Knowledge Base" path="/knowledge" onClick={navigate} />
                                <ActionButton icon={Activity} label="Pending Approvals" path="/approvals" onClick={navigate} />
                            </div>
                        </div>
                    </div>
                </>
            )}

            <style>{`
                @keyframes lf-spin { to { transform: rotate(360deg); } }
                .spin { animation: lf-spin 1s linear infinite; }

                .lf-summary-grid {
                    display: grid;
                    grid-template-columns: repeat(3, minmax(0, 1fr));
                    gap: 16px;
                    margin-bottom: 24px;
                }
                .lf-summary-card {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    padding: 20px 22px;
                    border-radius: 14px;
                    background: ${SURFACE};
                    border: 1px solid ${BORDER};
                    cursor: pointer;
                    text-align: left;
                    font: inherit;
                    transition: border-color 0.2s, transform 0.2s;
                }
                .lf-summary-card:hover {
                    border-color: ${PRIMARY};
                    transform: translateY(-2px);
                }
                .lf-summary-card:focus-visible {
                    outline: 2px solid ${PRIMARY};
                    outline-offset: 2px;
                }
                .lf-summary-icon {
                    width: 44px;
                    height: 44px;
                    min-width: 44px;
                    border-radius: 12px;
                    background: rgba(230, 184, 77, 0.12);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .lf-summary-value {
                    font-size: 26px;
                    font-weight: 700;
                    line-height: 1.15;
                    color: ${TEXT_PRIMARY};
                }
                .lf-summary-label {
                    margin-top: 2px;
                    font-size: 13px;
                    color: ${TEXT_SECONDARY};
                }
                .lf-summary-note {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    margin-top: 6px;
                    font-size: 11px;
                    font-weight: 600;
                    color: ${ACCENT_YELLOW};
                }

                .lf-dashboard-panels {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 20px;
                }

                .lf-quick-action {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    width: 100%;
                    padding: 10px 12px;
                    border-radius: 10px;
                    font-size: 13px;
                    font-weight: 500;
                    text-align: left;
                    cursor: pointer;
                    transition: background-color 0.15s, border-color 0.15s;
                }
                .lf-quick-action-icon {
                    width: 32px;
                    height: 32px;
                    border-radius: 8px;
                    background: rgba(128, 91, 231, 0.15);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .lf-quick-action-arrow {
                    color: ${TEXT_SECONDARY};
                    transition: color 0.15s, transform 0.15s;
                }
                .lf-quick-action:hover .lf-quick-action-arrow {
                    color: ${TEXT_PRIMARY};
                    transform: translateX(2px);
                }

                @media (max-width: 900px) {
                    .lf-summary-grid { grid-template-columns: 1fr; }
                    .lf-dashboard-panels { grid-template-columns: 1fr; }
                }
                @media (min-width: 901px) and (max-width: 1100px) {
                    .lf-summary-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
                }
            `}</style>
        </div>
    );
}

// Quick Action row - uses the design system's dark "Secondary" button style
function ActionButton({ icon: Icon, label, path, onClick }) {
    return (
        <button
            type="button"
            className="btn-secondary lf-quick-action"
            onClick={() => onClick(path)}
        >
            <div className="lf-quick-action-icon">
                <Icon size={14} style={{ color: PRIMARY }} />
            </div>
            <span style={{ flex: 1 }}>{label}</span>
            <ArrowRight size={14} className="lf-quick-action-arrow" />
        </button>
    );
}

export default HomePage;
