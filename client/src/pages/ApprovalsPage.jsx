import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../supabaseClient';
import leadflowService from '../services/leadflowService';
import { CheckSquare, Search, Loader2, CheckCircle, XCircle, Clock, AlertTriangle, User, MessageSquare, ChevronDown, RefreshCw } from 'lucide-react';

const STATUS_STYLES = {
    PENDING: { bg: 'rgba(251,191,36,0.12)', text: '#FBBF24', icon: Clock, label: 'Pending' },
    APPROVED: { bg: 'rgba(52,211,153,0.12)', text: '#34D399', icon: CheckCircle, label: 'Approved' },
    REJECTED: { bg: 'rgba(239,68,68,0.12)', text: '#EF4444', icon: XCircle, label: 'Rejected' },
    CANCELLED: { bg: 'rgba(107,114,128,0.12)', text: '#9CA3AF', icon: XCircle, label: 'Cancelled' },
};

const RISK_STYLES = {
    LOW: { bg: 'rgba(52,211,153,0.12)', text: '#34D399' },
    MEDIUM: { bg: 'rgba(251,191,36,0.12)', text: '#FBBF24' },
    HIGH: { bg: 'rgba(239,68,68,0.12)', text: '#EF4444' },
};

function ApprovalsPage() {
    const { t } = useTranslation();
    const [approvals, setApprovals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [processing, setProcessing] = useState(null);
    const [reasonModal, setReasonModal] = useState(null);
    const [rejectReason, setRejectReason] = useState('');

    const fetchApprovals = async () => {
        try {
            setLoading(true);

            // 1. Fetch approvals from Supabase
            let query = supabase
                .from('approvals')
                .select('*')
                .order('createdAt', { ascending: false });

            if (statusFilter !== 'ALL') {
                query = query.eq('status', statusFilter);
            }

            const { data: appData, error: appError } = await query;
            if (appError) throw appError;

            // 2. Fetch associated ai_actions, conversations, and customers
            const actionIds = (appData || []).map(a => a.aiActionId).filter(Boolean);
            let actionMap = {};
            let convMap = {};
            let customerMap = {};
            let userMap = {};

            if (actionIds.length > 0) {
                const { data: actionsData } = await supabase.from('ai_actions').select('*').in('id', actionIds);
                if (actionsData) {
                    actionMap = actionsData.reduce((acc, a) => ({ ...acc, [a.id]: a }), {});
                    const convIds = [...new Set(actionsData.map(a => a.conversationId).filter(Boolean))];
                    if (convIds.length > 0) {
                        const { data: convData } = await supabase.from('conversations').select('*').in('id', convIds);
                        if (convData) {
                            convMap = convData.reduce((acc, c) => ({ ...acc, [c.id]: c }), {});
                            const customerIds = [...new Set(convData.map(c => c.customerId).filter(Boolean))];
                            if (customerIds.length > 0) {
                                const { data: custData } = await supabase.from('customers').select('*').in('id', customerIds);
                                if (custData) {
                                    customerMap = custData.reduce((acc, c) => ({ ...acc, [c.id]: c }), {});
                                }
                            }
                        }
                    }
                }
            }

            // 3. Fetch approver users
            const approverIds = [...new Set((appData || []).map(a => a.approvedBy).filter(Boolean))];
            if (approverIds.length > 0) {
                const { data: userData } = await supabase.from('users').select('id, displayName').in('id', approverIds);
                if (userData) {
                    userMap = userData.reduce((acc, u) => ({ ...acc, [u.id]: u }), {});
                }
            }

            const combined = (appData || []).map(app => {
                const aiAction = actionMap[app.aiActionId] || null;
                const conv = aiAction ? convMap[aiAction.conversationId] : null;
                const customer = conv ? customerMap[conv.customerId] : null;
                const approver = app.approvedBy ? userMap[app.approvedBy] : null;

                return {
                    ...app,
                    approver,
                    aiAction: aiAction ? {
                        ...aiAction,
                        description: app.reason || (typeof aiAction.output === 'string' ? aiAction.output : (aiAction.output?.reason || aiAction.actionType)),
                        conversation: conv ? {
                            ...conv,
                            customer: customer || { name: 'Customer' }
                        } : null
                    } : {
                        actionType: 'Manager Approval',
                        description: app.reason || 'AI action awaiting review',
                        riskLevel: 'MEDIUM',
                        conversation: null
                    }
                };
            });

            setApprovals(combined);
        } catch (error) {
            console.error('Error fetching approvals from Supabase:', error);
            try {
                const params = { limit: 50 };
                if (statusFilter !== 'ALL') params.status = statusFilter;
                const data = await leadflowService.getApprovals(params);
                setApprovals(data.items || []);
            } catch (err) {
                console.error('Service fallback error:', err);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchApprovals();
    }, [statusFilter]);

    const handleApprove = async (id) => {
        setProcessing(id);
        try {
            const now = new Date().toISOString();
            const { error } = await supabase
                .from('approvals')
                .update({
                    status: 'APPROVED',
                    resolvedAt: now
                })
                .eq('id', id);

            if (error) throw error;

            const item = approvals.find(a => a.id === id);
            if (item?.aiActionId) {
                await supabase
                    .from('ai_actions')
                    .update({ status: 'APPROVED', executedAt: now })
                    .eq('id', item.aiActionId);
            }

            fetchApprovals();
        } catch (error) {
            console.error('Error approving:', error);
            await leadflowService.processApproval(id, 'APPROVED');
            fetchApprovals();
        } finally {
            setProcessing(null);
        }
    };

    const handleReject = async (id) => {
        setRejectReason('');
        setReasonModal(id);
    };

    const confirmReject = async () => {
        const id = reasonModal;
        setProcessing(id);
        setReasonModal(null);
        try {
            const now = new Date().toISOString();
            const { error } = await supabase
                .from('approvals')
                .update({
                    status: 'REJECTED',
                    reason: rejectReason || 'Rejected by manager',
                    resolvedAt: now
                })
                .eq('id', id);

            if (error) throw error;

            const item = approvals.find(a => a.id === id);
            if (item?.aiActionId) {
                await supabase
                    .from('ai_actions')
                    .update({ status: 'REJECTED' })
                    .eq('id', item.aiActionId);
            }

            fetchApprovals();
        } catch (error) {
            console.error('Error rejecting:', error);
            await leadflowService.processApproval(id, 'REJECTED', rejectReason || 'No reason provided');
            fetchApprovals();
        } finally {
            setProcessing(null);
        }
    };

    const getTimeAgo = (dateStr) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        const days = Math.floor(hrs / 24);
        return `${days}d ago`;
    };

    const pendingCount = approvals.filter(a => a.status === 'PENDING').length;
    const filters = ['ALL', 'PENDING', 'APPROVED', 'REJECTED'];

    return (
        <div style={{ padding: '24px 32px', maxWidth: '1100px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                        <div style={{
                            width: '32px', height: '32px', borderRadius: '8px',
                            background: 'var(--brand-gradient)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <CheckSquare size={16} color="#fff" />
                        </div>
                        <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: 'var(--text-primary, #F5F6FA)' }}>
                            Approvals
                        </h1>
                        {pendingCount > 0 && (
                            <span style={{
                                fontSize: '11px', padding: '2px 10px', borderRadius: '12px',
                                background: 'rgba(251,191,36,0.15)', color: '#FBBF24', fontWeight: 700
                            }}>
                                {pendingCount} pending
                            </span>
                        )}
                    </div>
                    <p style={{ margin: '6px 0 0 0', fontSize: '13px', color: 'var(--text-muted, #888)' }}>
                        Review and manage AI-generated actions requiring approval
                    </p>
                </div>
                <button
                    onClick={() => fetchApprovals()}
                    style={{
                        padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border-subtle, #333)',
                        background: 'transparent', color: 'var(--text-muted, #888)', fontSize: '12px',
                        fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                    }}
                >
                    <RefreshCw size={14} /> Refresh
                </button>
            </div>

            {/* Status Filters */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '20px' }}>
                {filters.map(status => (
                    <button
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        style={{
                            padding: '6px 16px', borderRadius: '16px', border: 'none',
                            fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                            background: statusFilter === status
                                ? 'var(--brand-gradient)'
                                : 'rgba(255,255,255,0.06)',
                            color: statusFilter === status ? '#fff' : 'var(--text-muted, #888)',
                            transition: 'all 0.2s'
                        }}
                    >
                        {status === 'ALL' ? 'All' : STATUS_STYLES[status]?.label || status}
                    </button>
                ))}
            </div>

            {/* Approval List */}
            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
                    <Loader2 className="spin" size={28} style={{ color: '#805BE7' }} />
                </div>
            ) : approvals.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-muted, #555)' }}>
                    <CheckSquare size={56} style={{ marginBottom: '16px', opacity: 0.2 }} />
                    <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary, #F5F6FA)', marginBottom: '6px' }}>
                        {statusFilter === 'PENDING' ? 'No pending approvals' : 'No approvals found'}
                    </div>
                    <div style={{ fontSize: '13px' }}>
                        {statusFilter === 'PENDING' ? 'All caught up! AI actions that need review will appear here.' : 'Try a different filter.'}
                    </div>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {approvals.map(approval => {
                        const StatusIcon = STATUS_STYLES[approval.status]?.icon || Clock;
                        return (
                            <div key={approval.id} style={{
                                padding: '20px', borderRadius: '12px',
                                background: 'var(--bg-surface, #1E2025)',
                                border: approval.status === 'PENDING'
                                    ? '1px solid rgba(251,191,36,0.2)'
                                    : '1px solid var(--border-subtle, #2a2a2a)',
                                transition: 'all 0.2s'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{ flex: 1 }}>
                                        {/* Status badge + time */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                                            <span style={{
                                                display: 'flex', alignItems: 'center', gap: '4px',
                                                padding: '3px 10px', borderRadius: '10px', fontSize: '11px',
                                                fontWeight: 600,
                                                background: STATUS_STYLES[approval.status]?.bg || 'rgba(107,114,128,0.12)',
                                                color: STATUS_STYLES[approval.status]?.text || '#9CA3AF'
                                            }}>
                                                <StatusIcon size={12} />
                                                {STATUS_STYLES[approval.status]?.label || approval.status}
                                            </span>
                                            {approval.aiAction?.riskLevel && (
                                                <span style={{
                                                    padding: '3px 8px', borderRadius: '8px', fontSize: '10px',
                                                    fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px',
                                                    background: RISK_STYLES[approval.aiAction.riskLevel]?.bg || 'rgba(107,114,128,0.12)',
                                                    color: RISK_STYLES[approval.aiAction.riskLevel]?.text || '#9CA3AF'
                                                }}>
                                                    <AlertTriangle size={10} />
                                                    {approval.aiAction.riskLevel} Risk
                                                </span>
                                            )}
                                            <span style={{ fontSize: '11px', color: 'var(--text-muted, #666)', marginLeft: 'auto' }}>
                                                {getTimeAgo(approval.createdAt)}
                                            </span>
                                        </div>

                                        {/* Action type + details */}
                                        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary, #F5F6FA)', marginBottom: '4px' }}>
                                            {approval.aiAction?.actionType || 'AI Action'}
                                        </div>

                                        <div style={{ fontSize: '12px', color: 'var(--text-muted, #888)', lineHeight: 1.5, marginBottom: '8px' }}>
                                            {approval.aiAction?.description || approval.aiAction?.actionType || 'AI-generated action requiring approval'}
                                        </div>

                                        {/* Customer & conversation context */}
                                        {approval.aiAction?.conversation && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted, #888)' }}>
                                                <MessageSquare size={12} />
                                                <span>Customer: <strong style={{ color: 'var(--text-primary, #F5F6FA)' }}>{approval.aiAction.conversation.customer?.name || 'Unknown'}</strong></span>
                                            </div>
                                        )}

                                        {/* Resolved info */}
                                        {approval.status !== 'PENDING' && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '8px', fontSize: '12px', color: 'var(--text-muted, #888)' }}>
                                                {approval.approver && (
                                                    <span>By: <strong style={{ color: 'var(--text-primary, #F5F6FA)' }}>{approval.approver.displayName}</strong></span>
                                                )}
                                                {approval.resolvedAt && (
                                                    <span>{new Date(approval.resolvedAt).toLocaleDateString()}</span>
                                                )}
                                                {approval.reason && (
                                                    <span>Reason: {approval.reason}</span>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Action buttons */}
                                    {approval.status === 'PENDING' && (
                                        <div style={{ display: 'flex', gap: '8px', marginLeft: '20px' }}>
                                            <button
                                                onClick={() => handleReject(approval.id)}
                                                disabled={processing === approval.id}
                                                style={{
                                                    padding: '8px 16px', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.3)',
                                                    background: 'transparent', color: '#EF4444', fontSize: '12px',
                                                    fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap'
                                                }}
                                            >
                                                Reject
                                            </button>
                                            <button
                                                onClick={() => handleApprove(approval.id)}
                                                disabled={processing === approval.id}
                                                style={{
                                                    padding: '8px 20px', borderRadius: '8px', border: 'none',
                                                    background: processing === approval.id
                                                        ? 'rgba(52,211,153,0.3)' : 'linear-gradient(135deg, #10B981, #34D399)',
                                                    color: '#fff', fontSize: '12px', fontWeight: 600,
                                                    cursor: processing === approval.id ? 'not-allowed' : 'pointer',
                                                    display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap'
                                                }}
                                            >
                                                {processing === approval.id ? <Loader2 className="spin" size={14} /> : <CheckCircle size={14} />}
                                                Approve
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Reject Reason Modal */}
            {reasonModal && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)'
                }} onClick={() => setReasonModal(null)}>
                    <div style={{
                        width: '400px', padding: '24px', borderRadius: '16px',
                        background: 'var(--bg-surface, #1E2025)',
                        border: '1px solid var(--border-subtle, #333)'
                    }} onClick={(e) => e.stopPropagation()}>
                        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 700, color: 'var(--text-primary, #F5F6FA)' }}>
                            Reason for Rejection
                        </h3>
                        <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Explain why this action is being rejected..."
                            rows={4}
                            style={{
                                width: '100%', padding: '10px 14px', borderRadius: '8px',
                                border: '1px solid var(--border-subtle, #333)',
                                background: 'var(--bg-input, #262626)',
                                color: 'var(--text-primary, #F5F6FA)',
                                fontSize: '13px', outline: 'none', resize: 'vertical',
                                boxSizing: 'border-box', fontFamily: 'inherit'
                            }}
                        />
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '16px' }}>
                            <button onClick={() => setReasonModal(null)}
                                style={{
                                    padding: '8px 16px', borderRadius: '8px',
                                    border: '1px solid var(--border-subtle, #333)',
                                    background: 'transparent', color: 'var(--text-muted, #888)',
                                    fontSize: '12px', fontWeight: 600, cursor: 'pointer'
                                }}>
                                Cancel
                            </button>
                            <button onClick={confirmReject}
                                style={{
                                    padding: '8px 20px', borderRadius: '8px', border: 'none',
                                    background: '#EF4444', color: '#fff',
                                    fontSize: '12px', fontWeight: 600, cursor: 'pointer'
                                }}>
                                Reject
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes lf-spin { to { transform: rotate(360deg); } }
                .spin { animation: lf-spin 1s linear infinite; }
            `}</style>
        </div>
    );
}

export default ApprovalsPage;