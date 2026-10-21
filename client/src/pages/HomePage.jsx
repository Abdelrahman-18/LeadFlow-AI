import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import leadflowService from '../services/leadflowService';
import {
    TrendingUp, MessageSquare, DollarSign, Target, Users,
    AlertCircle, Loader2, Activity, Zap, ArrowRight
} from 'lucide-react';

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

    const formatCurrency = (val) => `EGP ${(val || 0).toLocaleString()}`;

    const metricCards = dashboard ? [
        { label: 'Total Revenue', value: formatCurrency(dashboard.metrics?.totalRevenue), icon: DollarSign, color: '#6366F1', trend: 'Tracked', path: '/opportunities' },
        { label: 'Active Conversations', value: dashboard.metrics?.activeConversations || 0, icon: MessageSquare, color: '#34D399', trend: `${dashboard.metrics?.activeConversations || 0} active`, path: '/conversations' },
        { label: 'Hot Leads', value: dashboard.metrics?.hotLeads || 0, icon: Zap, color: '#FBBF24', trend: `${dashboard.metrics?.hotLeads || 0} ready`, path: '/opportunities' },
        { label: 'Pipeline Value', value: formatCurrency(dashboard.metrics?.potentialRevenue), icon: Target, color: '#8B5CF6', trend: `${dashboard.metrics?.openOpportunities || 0} open`, path: '/opportunities' },
    ] : [];

    return (
        <div style={{ padding: '24px 32px', maxWidth: '1200px', margin: '0 auto' }}>
            {/* Welcome Header */}
            <div style={{ marginBottom: '28px' }}>
                <h1 style={{
                    fontSize: '26px', fontWeight: 700, margin: '0 0 6px 0',
                    color: 'var(--text-primary, #F2F3EC)'
                }}>
                    Welcome back{user ? `, ${user.displayName || user.name}` : ''}
                </h1>
                <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted, #888)' }}>
                    Here's your revenue operations overview
                </p>
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}>
                    <Loader2 className="spin" size={32} style={{ color: '#6366F1' }} />
                </div>
            ) : (
                <>
                    {/* Metric Cards */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                        gap: '16px', marginBottom: '28px'
                    }}>
                        {metricCards.map((card, idx) => {
                            const Icon = card.icon;
                            return (
                                <div
                                    key={idx}
                                    onClick={() => navigate(card.path)}
                                    style={{
                                        padding: '22px', borderRadius: '14px',
                                        background: 'var(--bg-surface, #1C1C1C)',
                                        border: '1px solid var(--border-subtle, #2a2a2a)',
                                        cursor: 'pointer', transition: 'all 0.2s',
                                        position: 'relative', overflow: 'hidden'
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle, #2a2a2a)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                        <div style={{
                                            width: '42px', height: '42px', borderRadius: '12px',
                                            background: `${card.color}18`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            <Icon size={20} style={{ color: card.color }} />
                                        </div>
                                        <ArrowRight size={14} style={{ color: 'var(--text-muted, #444)' }} />
                                    </div>
                                    <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary, #F2F3EC)', marginBottom: '4px' }}>
                                        {card.value}
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '13px', color: 'var(--text-muted, #888)' }}>
                                            {card.label}
                                        </span>
                                        <span style={{ fontSize: '11px', color: card.color, fontWeight: 600 }}>
                                            {card.trend}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Recent Activity + Quick Actions */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        {/* Recent Activity */}
                        <div style={{
                            padding: '22px', borderRadius: '14px',
                            background: 'var(--bg-surface, #1C1C1C)',
                            border: '1px solid var(--border-subtle, #2a2a2a)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                                <Activity size={16} style={{ color: '#6366F1' }} />
                                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'var(--text-primary, #F2F3EC)' }}>
                                    Recent Activity
                                </h3>
                            </div>
                            {dashboard?.recentActivity?.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {dashboard.recentActivity.slice(0, 5).map((activity, idx) => (
                                        <div key={activity.id || idx} style={{
                                            display: 'flex', gap: '10px', alignItems: 'flex-start',
                                            padding: '10px 12px', borderRadius: '8px',
                                            background: 'rgba(255,255,255,0.02)',
                                            cursor: 'pointer', transition: 'background 0.15s'
                                        }}
                                            onClick={() => navigate('/conversations')}
                                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                                        >
                                            <div style={{
                                                width: '30px', height: '30px', borderRadius: '8px', minWidth: '30px',
                                                background: activity.avatarUrl
                                                    ? `url(${activity.avatarUrl}) center/cover`
                                                    : 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                color: '#fff', fontWeight: 700, fontSize: '11px'
                                            }}>
                                                {!activity.avatarUrl && (activity.customerName?.charAt(0) || '?')}
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary, #F2F3EC)', marginBottom: '2px' }}>
                                                    {activity.customerName || 'Unknown'}
                                                </div>
                                                <div style={{ fontSize: '11px', color: 'var(--text-muted, #888)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {activity.message || ''}
                                                </div>
                                            </div>
                                            <span style={{ fontSize: '10px', color: 'var(--text-muted, #555)', whiteSpace: 'nowrap' }}>
                                                {activity.time ? new Date(activity.time).toLocaleDateString() : ''}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ padding: '30px 0', textAlign: 'center', color: 'var(--text-muted, #555)', fontSize: '13px' }}>
                                    No recent activity
                                </div>
                            )}
                        </div>

                        {/* Quick Actions */}
                        <div style={{
                            padding: '22px', borderRadius: '14px',
                            background: 'var(--bg-surface, #1C1C1C)',
                            border: '1px solid var(--border-subtle, #2a2a2a)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                                <Zap size={16} style={{ color: '#FBBF24' }} />
                                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'var(--text-primary, #F2F3EC)' }}>
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

                    {/* Bottom Summary */}
                    <div style={{
                        marginTop: '20px', padding: '16px 22px', borderRadius: '12px',
                        background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.04))',
                        border: '1px solid rgba(99,102,241,0.15)',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        fontSize: '13px', color: 'var(--text-muted, #888)'
                    }}>
                        <span>
                            <strong style={{ color: 'var(--text-primary, #F2F3EC)' }}>
                                {dashboard?.metrics?.totalConversations || 0}
                            </strong> total conversations ·
                            <strong style={{ color: 'var(--text-primary, #F2F3EC)' }}> {dashboard?.metrics?.totalLeads || 0}</strong> leads ·
                            <strong style={{ color: 'var(--text-primary, #F2F3EC)' }}> {dashboard?.metrics?.totalActions || 0}</strong> AI actions
                        </span>
                        <span>
                            {dashboard?.metrics?.pendingApprovals > 0 && (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#FBBF24' }}>
                                    <AlertCircle size={12} />
                                    {dashboard.metrics.pendingApprovals} pending approval{dashboard.metrics.pendingApprovals !== 1 ? 's' : ''}
                                </span>
                            )}
                        </span>
                    </div>
                </>
            )}

            <style>{`
                @keyframes lf-spin { to { transform: rotate(360deg); } }
                .spin { animation: lf-spin 1s linear infinite; }
            `}</style>
        </div>
    );
}

function ActionButton({ icon: Icon, label, path, onClick }) {
    return (
        <button
            onClick={() => onClick(path)}
            style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '11px 14px', borderRadius: '10px', border: 'none',
                background: 'rgba(255,255,255,0.03)',
                color: 'var(--text-primary, #F2F3EC)',
                fontSize: '13px', fontWeight: 500, cursor: 'pointer',
                textAlign: 'left', transition: 'all 0.15s',
                width: '100%'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(99,102,241,0.1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
        >
            <div style={{
                width: '32px', height: '32px', borderRadius: '8px',
                background: 'rgba(99,102,241,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
                <Icon size={14} style={{ color: '#818CF8' }} />
            </div>
            <span style={{ flex: 1 }}>{label}</span>
            <ArrowRight size={14} style={{ color: 'var(--text-muted, #555)' }} />
        </button>
    );
}

export default HomePage;