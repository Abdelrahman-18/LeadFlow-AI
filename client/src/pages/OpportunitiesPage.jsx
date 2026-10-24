import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../supabaseClient';
import leadflowService from '../services/leadflowService';
import { TrendingUp, Search, Filter, DollarSign, Target, Users, Zap, Loader2, ChevronDown, BarChart3, RefreshCw } from 'lucide-react';

const STAGE_COLORS = {
    OPEN: { bg: 'rgba(128, 91, 231,0.12)', text: '#9B7DF0', label: 'Open' },
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

            // 1. Fetch revenue_opportunities from Supabase
            let query = supabase
                .from('revenue_opportunities')
                .select('*')
                .order('createdAt', { ascending: false });

            if (stageFilter !== 'ALL') {
                query = query.eq('status', stageFilter);
            }

            const { data: oppData, error: oppError } = await query;
            if (oppError) throw oppError;

            // 2. Fetch associated leads and customers
            const leadIds = (oppData || []).map(o => o.leadId).filter(Boolean);
            let leadMap = {};
            let customerMap = {};

            if (leadIds.length > 0) {
                const { data: leadsData } = await supabase.from('leads').select('*').in('id', leadIds);
                if (leadsData) {
                    leadMap = leadsData.reduce((acc, l) => ({ ...acc, [l.id]: l }), {});
                    const customerIds = [...new Set(leadsData.map(l => l.customerId).filter(Boolean))];
                    if (customerIds.length > 0) {
                        const { data: custData } = await supabase.from('customers').select('*').in('id', customerIds);
                        if (custData) {
                            customerMap = custData.reduce((acc, c) => ({ ...acc, [c.id]: c }), {});
                        }
                    }
                }
            }

            const combined = (oppData || []).map(opp => {
                const lead = leadMap[opp.leadId] || null;
                const customer = lead ? customerMap[lead.customerId] : null;
                return {
                    ...opp,
                    name: opp.title || opp.name,
                    winProbability: opp.leadScore || lead?.leadScore || 0,
                    lead: {
                        ...lead,
                        customer: customer || { name: 'Customer' }
                    }
                };
            });

            // 3. Calculate pipeline summary across all opportunities
            const { data: allOpps } = await supabase.from('revenue_opportunities').select('potentialRevenue, status');
            const totalRev = (allOpps || []).reduce((sum, o) => sum + (Number(o.potentialRevenue) || 0), 0);
            const openCount = (allOpps || []).filter(o => ['OPEN', 'IN_PROGRESS'].includes((o.status || '').toUpperCase())).length;

            setOpportunities(combined);
            setSummary({ totalPotentialRevenue: totalRev, openCount });
        } catch (error) {
            console.error('Error fetching opportunities from Supabase:', error);
            // Fallback to service if needed
            try {
                const params = { limit: 50 };
                if (stageFilter !== 'ALL') params.status = stageFilter;
                const data = await leadflowService.getOpportunities(params);
                setOpportunities(data.items || []);
                setSummary(data.summary || { totalPotentialRevenue: 0, openCount: 0 });
            } catch (err) {
                console.error('Service fallback error:', err);
            }
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
        (o.name || o.title || '').toLowerCase().includes(searchQuery.toLowerCase())
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
                            background: 'var(--brand-gradient)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <TrendingUp size={16} color="#fff" />
                        </div>
                        <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: 'var(--text-primary, #F5F6FA)' }}>
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
                    background: 'linear-gradient(135deg, rgba(128, 91, 231,0.1), rgba(128, 91, 231,0.05))',
                    border: '1px solid rgba(128, 91, 231,0.2)'
                }}>
                    <div style={{ fontSize: '12px', color: '#9B7DF0', fontWeight: 600, marginBottom: '6px' }}>
                        Pipeline Value
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary, #F5F6FA)' }}>
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
                    <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary, #F5F6FA)' }}>
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
                    <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary, #F5F6FA)' }}>
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
                                ? 'var(--brand-gradient)'
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
                        color: 'var(--text-primary, #F5F6FA)', fontSize: '13px',
                        outline: 'none', boxSizing: 'border-box'
                    }}
                />
            </div>

            {/* Table */}
            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
                    <Loader2 className="spin" size={28} style={{ color: '#805BE7' }} />
                </div>
            ) : filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted, #555)' }}>
                    <Target size={48} style={{ marginBottom: '16px', opacity: 0.2 }} />
                    <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary, #F5F6FA)', marginBottom: '4px' }}>
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
                    background: 'var(--bg-surface, #1E2025)'
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
                                        <div style={{ fontWeight: 600, color: 'var(--text-primary, #F5F6FA)' }}>
                                            {opp.name || 'Unnamed Opportunity'}
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px 20px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{
                                                width: '32px', height: '32px', borderRadius: '8px',
                                                background: opp.lead?.customer?.avatarUrl
                                                    ? `url(${opp.lead.customer.avatarUrl}) center/cover`
                                                    : 'var(--brand-gradient)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                color: '#fff', fontWeight: 700, fontSize: '12px'
                                            }}>
                                                {!opp.lead?.customer?.avatarUrl && (opp.lead?.customer?.name?.charAt(0) || '?')}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 600, color: 'var(--text-primary, #F5F6FA)', fontSize: '13px' }}>
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
                                    <td style={{ padding: '16px 20px', textAlign: 'right', fontWeight: 700, color: 'var(--text-primary, #F5F6FA)' }}>
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