import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import leadflowService from '../services/leadflowService';
import { TrendingUp, Search, Filter, DollarSign, Target, Users, Zap, Loader2, ChevronDown, BarChart3 } from 'lucide-react';

const STAGE_COLORS = {
    OPEN: { bg: 'rgba(99,102,241,0.12)', text: '#818CF8', label: 'Open' },
    IN_PROGRESS: { bg: 'rgba(251,191,36,0.12)', text: '#FBBF24', label: 'In Progress' },
    WON: { bg: 'rgba(52,211,153,0.12)', text: '#34D399', label: 'Won' },
    LOST: { bg: 'rgba(239,68,68,0.12)', text: '#EF4444', label: 'Lost' },
};

function OpportunitiesPage() {
    const { t } = useTranslation();
    const [opportunities, setOpportunities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [stageFilter, setStageFilter] = useState('ALL');
    const [summary, setSummary] = useState({ totalPotentialRevenue: 0, openCount: 0 });

    const fetchOpportunities = async () => {
        try {
            setLoading(true);
            const params = { limit: 50 };
            if (stageFilter !== 'ALL') params.status = stageFilter;
            const data = await leadflowService.getOpportunities(params);
            setOpportunities(data.items || []);
            setSummary(data.summary || { totalPotentialRevenue: 0, openCount: 0 });
        } catch (error) {
            console.error('Error fetching opportunities:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOpportunities();
    }, [stageFilter]);

    const formatCurrency = (val) => {
        return `EGP ${(val || 0).toLocaleString()}`;
    };

    const filtered = opportunities.filter(o =>
        (o.lead?.customer?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (o.name || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const stages = ['ALL', 'OPEN', 'IN_PROGRESS', 'WON', 'LOST'];

    return (
        <div style={{ padding: '24px 32px', maxWidth: '1200px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                        <div style={{
                            width: '32px', height: '32px', borderRadius: '8px',
                            background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <TrendingUp size={16} color="#fff" />
                        </div>
                        <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: 'var(--text-primary, #F2F3EC)' }}>
                            Revenue Opportunities
                        </h1>
                    </div>
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted, #888)' }}>
                        Track and manage your sales pipeline
                    </p>
                </div>
            </div>

            {/* Summary Cards */}
            <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px', marginBottom: '24px'
            }}>
                <div style={{
                    padding: '20px', borderRadius: '12px',
                    background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.05))',
                    border: '1px solid rgba(99,102,241,0.2)'
                }}>
                    <div style={{ fontSize: '12px', color: '#818CF8', fontWeight: 600, marginBottom: '6px' }}>
                        Pipeline Value
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary, #F2F3EC)' }}>
                        {formatCurrency(summary.totalPotentialRevenue)}
                    </div>
                </div>
                <div style={{
                    padding: '20px', borderRadius: '12px',
                    background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.15)'
                }}>
                    <div style={{ fontSize: '12px', color: '#34D399', fontWeight: 600, marginBottom: '6px' }}>
                        Open Opportunities
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary, #F2F3EC)' }}>
                        {summary.openCount}
                    </div>
                </div>
                <div style={{
                    padding: '20px', borderRadius: '12px',
                    background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.15)'
                }}>
                    <div style={{ fontSize: '12px', color: '#FBBF24', fontWeight: 600, marginBottom: '6px' }}>
                        Total Opportunities
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary, #F2F3EC)' }}>
                        {opportunities.length}
                    </div>
                </div>
            </div>

            {/* Stage Filters */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', flexWrap: 'wrap' }}>
                {stages.map(stage => (
                    <button
                        key={stage}
                        onClick={() => setStageFilter(stage)}
                        style={{
                            padding: '6px 16px', borderRadius: '16px', border: 'none',
                            fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                            background: stageFilter === stage
                                ? 'linear-gradient(135deg, #6366F1, #8B5CF6)'
                                : 'rgba(255,255,255,0.06)',
                            color: stageFilter === stage ? '#fff' : 'var(--text-muted, #888)',
                            transition: 'all 0.2s'
                        }}
                    >
                        {stage === 'ALL' ? 'All Stages' : STAGE_COLORS[stage]?.label || stage}
                    </button>
                ))}
            </div>

            {/* Search */}
            <div style={{ position: 'relative', marginBottom: '20px', maxWidth: '400px' }}>
                <Search size={16} style={{
                    position: 'absolute', left: '14px', top: '50%',
                    transform: 'translateY(-50%)', color: 'var(--text-muted, #666)'
                }} />
                <input
                    type="text"
                    placeholder="Search by customer or opportunity name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                        width: '100%', padding: '10px 14px 10px 40px',
                        borderRadius: '10px', border: '1px solid var(--border-subtle, #333)',
                        background: 'var(--bg-input, #262626)',
                        color: 'var(--text-primary, #F2F3EC)', fontSize: '13px',
                        outline: 'none', boxSizing: 'border-box'
                    }}
                />
            </div>

            {/* Table */}
            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
                    <Loader2 className="spin" size={28} style={{ color: '#6366F1' }} />
                </div>
            ) : filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted, #555)' }}>
                    <Target size={48} style={{ marginBottom: '16px', opacity: 0.2 }} />
                    <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary, #F2F3EC)', marginBottom: '4px' }}>
                        No opportunities found
                    </div>
                    <div style={{ fontSize: '13px' }}>
                        {searchQuery ? 'Try a different search' : 'Generate leads to create opportunities'}
                    </div>
                </div>
            ) : (
                <div style={{
                    borderRadius: '12px', overflow: 'hidden',
                    border: '1px solid var(--border-subtle, #2a2a2a)',
                    background: 'var(--bg-surface, #1C1C1C)'
                }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--border-subtle, #2a2a2a)' }}>
                                <th style={{ textAlign: 'left', padding: '14px 20px', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted, #888)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Opportunity</th>
                                <th style={{ textAlign: 'left', padding: '14px 20px', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted, #888)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Customer</th>
                                <th style={{ textAlign: 'left', padding: '14px 20px', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted, #888)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Stage</th>
                                <th style={{ textAlign: 'right', padding: '14px 20px', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted, #888)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Value</th>
                                <th style={{ textAlign: 'right', padding: '14px 20px', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted, #888)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Win Prob.</th>
                                <th style={{ textAlign: 'right', padding: '14px 20px', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted, #888)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Updated</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(opp => (
                                <tr key={opp.id} style={{ borderBottom: '1px solid var(--border-subtle, #222)', transition: 'background 0.15s' }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                    <td style={{ padding: '16px 20px' }}>
                                        <div style={{ fontWeight: 600, color: 'var(--text-primary, #F2F3EC)' }}>
                                            {opp.name || 'Unnamed Opportunity'}
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px 20px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{
                                                width: '32px', height: '32px', borderRadius: '8px',
                                                background: opp.lead?.customer?.avatarUrl
                                                    ? `url(${opp.lead.customer.avatarUrl}) center/cover`
                                                    : 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                color: '#fff', fontWeight: 700, fontSize: '12px'
                                            }}>
                                                {!opp.lead?.customer?.avatarUrl && (opp.lead?.customer?.name?.charAt(0) || '?')}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 600, color: 'var(--text-primary, #F2F3EC)', fontSize: '13px' }}>
                                                    {opp.lead?.customer?.name || 'Unknown'}
                                                </div>
                                                <div style={{ fontSize: '11px', color: 'var(--text-muted, #888)' }}>
                                                    {opp.lead?.customer?.email || ''}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px 20px' }}>
                                        <span style={{
                                            padding: '3px 10px', borderRadius: '10px', fontSize: '11px',
                                            fontWeight: 600, display: 'inline-block',
                                            background: STAGE_COLORS[opp.status]?.bg || 'rgba(107,114,128,0.12)',
                                            color: STAGE_COLORS[opp.status]?.text || '#9CA3AF'
                                        }}>
                                            {STAGE_COLORS[opp.status]?.label || opp.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: '16px 20px', textAlign: 'right', fontWeight: 700, color: 'var(--text-primary, #F2F3EC)' }}>
                                        {formatCurrency(opp.potentialRevenue)}
                                    </td>
                                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                                        <span style={{
                                            padding: '3px 10px', borderRadius: '10px', fontSize: '11px',
                                            fontWeight: 600,
                                            background: (opp.winProbability || 0) >= 70
                                                ? 'rgba(52,211,153,0.12)' : (opp.winProbability || 0) >= 40
                                                ? 'rgba(251,191,36,0.12)' : 'rgba(239,68,68,0.12)',
                                            color: (opp.winProbability || 0) >= 70
                                                ? '#34D399' : (opp.winProbability || 0) >= 40
                                                ? '#FBBF24' : '#EF4444'
                                        }}>
                                            {opp.winProbability || 0}%
                                        </span>
                                    </td>
                                    <td style={{ padding: '16px 20px', textAlign: 'right', color: 'var(--text-muted, #888)', fontSize: '12px' }}>
                                        {opp.updatedAt ? new Date(opp.updatedAt).toLocaleDateString() : '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <style>{`
                @keyframes lf-spin { to { transform: rotate(360deg); } }
                .spin { animation: lf-spin 1s linear infinite; }
            `}</style>
        </div>
    );
}

export default OpportunitiesPage;