import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import leadflowService from '../services/leadflowService';
import {
    MessageSquare, DollarSign, Target, CheckSquare,
    Activity, Zap, ArrowRight, Loader2, Calendar, ChevronDown,
    AlertTriangle, AlertCircle
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
    const [timeRange, setTimeRange] = useState('This Month');

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

    // Interactive 4-card metric grid configuration
    const metricCards = [
        {
            label: 'Total Conversations',
            value: dashboard?.metrics?.totalConversations != null
                ? dashboard.metrics.totalConversations.toLocaleString()
                : '0',
            icon: MessageSquare,
            path: '/conversations',
        },
        {
            label: 'Pipeline Revenue',
            value: dashboard?.metrics?.potentialRevenue != null
                ? `EGP ${Number(dashboard.metrics.potentialRevenue).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : 'EGP 0.00',
            icon: DollarSign,
            path: '/opportunities',
        },
        {
            label: 'Avg. Win Rate',
            value: dashboard?.metrics?.winRate != null
                ? `${dashboard.metrics.winRate}%`
                : '0%',
            icon: Target,
            path: '/analytics',
        },
        {
            label: 'Pending Approvals',
            value: String(dashboard?.metrics?.pendingApprovals ?? 0),
            trend: 'Action needed',
            icon: CheckSquare,
            path: '/approvals',
        },
    ];

    // AI Insights & Alerts Feed
    const alertsFeed = [
        {
            id: 'alert-1',
            text: "High closing intent detected in 'TechFlow' conversation.",
            actionText: 'Review Transcript',
            path: '/conversations',
            icon: Zap,
            iconColor: '#10B981',
            dotColor: '#10B981',
            bgIcon: 'rgba(16, 185, 129, 0.12)',
        },
        {
            id: 'alert-2',
            text: 'Sentiment dropped in 2 recent chats. Leads at risk of slipping away.',
            actionText: 'Intervene',
            path: '/conversations',
            icon: AlertTriangle,
            iconColor: ACCENT_YELLOW,
            dotColor: ACCENT_YELLOW,
            bgIcon: 'rgba(230, 184, 77, 0.12)',
        },
        {
            id: 'alert-3',
            text: '2 high-value proposals require your immediate approval.',
            actionText: 'Review Approvals',
            path: '/approvals',
            icon: AlertCircle,
            iconColor: '#EF4444',
            dotColor: '#EF4444',
            bgIcon: 'rgba(239, 68, 68, 0.12)',
        },
    ];

    return (
        <div style={{ padding: '24px 32px', maxWidth: '1200px', margin: '0 auto' }}>
            {/* Header: Greeting + Global Time Context Filter */}
            <div className="lf-header-row">
                <div>
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

                {/* Styled Date Filter Dropdown */}
                <div className="lf-time-filter-wrapper">
                    <Calendar size={15} style={{ color: TEXT_SECONDARY, pointerEvents: 'none' }} />
                    <select
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value)}
                        className="lf-time-filter-select"
                        aria-label="Time context filter"
                    >
                        <option value="Last 7 Days">Last 7 Days</option>
                        <option value="This Month">This Month</option>
                        <option value="All Time">All Time</option>
                    </select>
                    <ChevronDown size={14} style={{ color: TEXT_SECONDARY, pointerEvents: 'none' }} />
                </div>
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}>
                    <Loader2 className="spin" size={32} style={{ color: PRIMARY }} />
                </div>
            ) : (
                <>
                    {/* Interactive 4-Card Metric Grid */}
                    <div className="lf-metric-grid">
                        {metricCards.map((card) => {
                            const Icon = card.icon;
                            return (
                                <button
                                    key={card.label}
                                    type="button"
                                    className="lf-metric-card"
                                    onClick={() => navigate(card.path)}
                                >
                                    <div className="lf-metric-top">
                                        <div className="lf-metric-icon">
                                            <Icon size={20} style={{ color: ACCENT_YELLOW }} />
                                        </div>
                                        {card.trend ? (
                                            <span className="lf-metric-trend">
                                                <AlertCircle size={12} />
                                                {card.trend}
                                            </span>
                                        ) : (
                                            <ArrowRight size={14} className="lf-metric-arrow" />
                                        )}
                                    </div>
                                    <div className="lf-metric-value">{card.value}</div>
                                    <div className="lf-metric-label">{card.label}</div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Dashboard Panels: Recent Activity + AI Alerts Feed */}
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

                        {/* AI Insights & Alerts Feed */}
                        <div style={{
                            padding: '22px', borderRadius: '14px',
                            background: SURFACE,
                            border: `1px solid ${BORDER}`
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Zap size={16} style={{ color: ACCENT_YELLOW }} />
                                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: TEXT_PRIMARY }}>
                                        Alerts
                                    </h3>
                                </div>
                                <span style={{
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    color: PRIMARY,
                                    background: 'rgba(128, 91, 231, 0.12)',
                                    padding: '3px 8px',
                                    borderRadius: '6px'
                                }}>
                                    AI Insights
                                </span>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {alertsFeed.map((alert) => {
                                    const AlertIcon = alert.icon;
                                    return (
                                        <div key={alert.id} className="lf-alert-card">
                                            <div className="lf-alert-body">
                                                <div className="lf-alert-icon-wrap" style={{ background: alert.bgIcon }}>
                                                    <span className="lf-alert-dot" style={{ backgroundColor: alert.dotColor }} />
                                                    <AlertIcon size={14} style={{ color: alert.iconColor }} />
                                                </div>
                                                <p className="lf-alert-text">
                                                    {alert.text}
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                className="lf-alert-action-btn"
                                                onClick={() => navigate(alert.path)}
                                            >
                                                <span>{alert.actionText}</span>
                                                <ArrowRight size={13} />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </>
            )}

            <style>{`
                @keyframes lf-spin { to { transform: rotate(360deg); } }
                .spin { animation: lf-spin 1s linear infinite; }

                /* Header row with time filter */
                .lf-header-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 16px;
                    margin-bottom: 28px;
                    flex-wrap: wrap;
                }
                .lf-time-filter-wrapper {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 12px;
                    border-radius: 10px;
                    background: ${SURFACE};
                    border: 1px solid ${BORDER};
                    transition: border-color 0.15s ease, box-shadow 0.15s ease;
                }
                .lf-time-filter-wrapper:focus-within {
                    border-color: ${PRIMARY};
                    box-shadow: 0 0 0 2px rgba(128, 91, 231, 0.2);
                }
                .lf-time-filter-select {
                    background: transparent;
                    border: none;
                    outline: none;
                    color: ${TEXT_PRIMARY};
                    font-size: 13px;
                    font-weight: 500;
                    cursor: pointer;
                    appearance: none;
                    -webkit-appearance: none;
                    -moz-appearance: none;
                    padding-right: 4px;
                    font-family: inherit;
                }
                .lf-time-filter-select option {
                    background: #1E2025;
                    color: #F5F6FA;
                }

                /* 4-Card Metric Grid */
                .lf-metric-grid {
                    display: grid;
                    grid-template-columns: repeat(4, minmax(0, 1fr));
                    gap: 16px;
                    margin-bottom: 24px;
                }
                .lf-metric-card {
                    display: flex;
                    flex-direction: column;
                    padding: 20px 22px;
                    border-radius: 14px;
                    background: ${SURFACE};
                    border: 1px solid ${BORDER};
                    cursor: pointer;
                    text-align: left;
                    font: inherit;
                    transition: border-color 0.2s ease, transform 0.2s ease;
                    width: 100%;
                }
                .lf-metric-card:hover {
                    border-color: ${PRIMARY};
                    transform: translateY(-2px);
                }
                .lf-metric-card:focus-visible {
                    outline: 2px solid ${PRIMARY};
                    outline-offset: 2px;
                }
                .lf-metric-top {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 14px;
                    width: 100%;
                }
                .lf-metric-icon {
                    width: 42px;
                    height: 42px;
                    min-width: 42px;
                    border-radius: 12px;
                    background: rgba(230, 184, 77, 0.12);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .lf-metric-arrow {
                    color: ${TEXT_SECONDARY};
                    transition: color 0.15s ease, transform 0.15s ease;
                }
                .lf-metric-card:hover .lf-metric-arrow {
                    color: ${TEXT_PRIMARY};
                    transform: translateX(2px);
                }
                .lf-metric-trend {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    font-size: 11px;
                    font-weight: 600;
                    color: ${ACCENT_YELLOW};
                    background: rgba(230, 184, 77, 0.12);
                    padding: 3px 8px;
                    border-radius: 6px;
                }
                .lf-metric-value {
                    font-size: 24px;
                    font-weight: 700;
                    line-height: 1.2;
                    color: ${TEXT_PRIMARY};
                    margin-bottom: 4px;
                }
                .lf-metric-label {
                    font-size: 13px;
                    color: ${TEXT_SECONDARY};
                }

                /* Panels */
                .lf-dashboard-panels {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 20px;
                }

                /* Alerts Card Feed */
                .lf-alert-card {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 14px;
                    padding: 13px 15px;
                    border-radius: 12px;
                    background: rgba(255, 255, 255, 0.02);
                    border: 1px solid ${BORDER};
                    transition: background-color 0.15s ease, border-color 0.15s ease;
                }
                .lf-alert-card:hover {
                    background: var(--bg-hover);
                    border-color: rgba(128, 91, 231, 0.4);
                }
                .lf-alert-body {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    flex: 1;
                    min-width: 0;
                }
                .lf-alert-icon-wrap {
                    width: 30px;
                    height: 30px;
                    min-width: 30px;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                }
                .lf-alert-dot {
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                    position: absolute;
                    top: -1px;
                    right: -1px;
                }
                .lf-alert-text {
                    margin: 0;
                    font-size: 13px;
                    font-weight: 500;
                    color: ${TEXT_PRIMARY};
                    line-height: 1.4;
                }
                .lf-alert-action-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    padding: 6px 12px;
                    border-radius: 8px;
                    border: 1px solid rgba(128, 91, 231, 0.35);
                    background: rgba(128, 91, 231, 0.12);
                    color: #9B7DF0;
                    font-size: 12px;
                    font-weight: 600;
                    white-space: nowrap;
                    cursor: pointer;
                    transition: all 0.15s ease;
                    flex-shrink: 0;
                    font-family: inherit;
                }
                .lf-alert-action-btn:hover {
                    background: ${PRIMARY};
                    color: #FFFFFF;
                    border-color: ${PRIMARY};
                    transform: translateX(1px);
                }

                @media (max-width: 1100px) {
                    .lf-metric-grid {
                        grid-template-columns: repeat(2, minmax(0, 1fr));
                    }
                    .lf-dashboard-panels {
                        grid-template-columns: 1fr;
                    }
                }
                @media (max-width: 768px) {
                    .lf-alert-card {
                        flex-direction: column;
                        align-items: flex-start;
                    }
                    .lf-alert-action-btn {
                        align-self: flex-end;
                        margin-top: 4px;
                    }
                }
                @media (max-width: 640px) {
                    .lf-header-row {
                        flex-direction: column;
                        align-items: flex-start;
                    }
                    .lf-metric-grid {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>
        </div>
    );
}

export default HomePage;
