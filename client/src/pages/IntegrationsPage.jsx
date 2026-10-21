import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Puzzle, MessageSquare, Globe, Mail, Database, Phone, Bot, ExternalLink, CheckCircle, XCircle, Loader2, ChevronRight, RefreshCw } from 'lucide-react';

const INTEGRATIONS = [
    {
        id: 'messenger',
        name: 'Facebook Messenger',
        description: 'Connect your Facebook Page to receive and respond to customer messages automatically.',
        icon: MessageSquare,
        color: '#1877F2',
        bgGradient: 'linear-gradient(135deg, #1877F2, #0D65D9)',
        connected: false,
        category: 'messaging',
        docsUrl: '#',
    },
    {
        id: 'whatsapp',
        name: 'WhatsApp Business',
        description: 'Enable WhatsApp messaging for customer support and marketing campaigns.',
        icon: Phone,
        color: '#25D366',
        bgGradient: 'linear-gradient(135deg, #25D366, #128C7E)',
        connected: false,
        category: 'messaging',
        docsUrl: '#',
    },
    {
        id: 'instagram',
        name: 'Instagram Direct',
        description: 'Manage Instagram Direct messages and comments from within LeadFlow.',
        icon: Globe,
        color: '#E4405F',
        bgGradient: 'linear-gradient(135deg, #E4405F, #C13584)',
        connected: false,
        category: 'messaging',
        docsUrl: '#',
    },
    {
        id: 'email',
        name: 'Email Integration',
        description: 'Sync email conversations and track customer interactions via email.',
        icon: Mail,
        color: '#EA4335',
        bgGradient: 'linear-gradient(135deg, #EA4335, #C5221F)',
        connected: false,
        category: 'messaging',
        docsUrl: '#',
    },
    {
        id: 'microMind',
        name: 'MicroMind Core AI',
        description: 'Advanced AI orchestration engine powering analytics, lead scoring, and automation.',
        icon: Bot,
        color: '#6366F1',
        bgGradient: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
        connected: true,
        category: 'ai',
        status: 'Active',
        docsUrl: '#',
    },
    {
        id: 'erp',
        name: 'ERP Integration',
        description: 'Connect your ERP system to sync orders, inventory, and customer data.',
        icon: Database,
        color: '#F59E0B',
        bgGradient: 'linear-gradient(135deg, #F59E0B, #D97706)',
        connected: false,
        category: 'business',
        docsUrl: '#',
    },
];

const CATEGORIES = [
    { id: 'all', label: 'All Integrations' },
    { id: 'messaging', label: 'Messaging' },
    { id: 'ai', label: 'AI & Analytics' },
    { id: 'business', label: 'Business Tools' },
];

function IntegrationsPage() {
    const { t } = useTranslation();
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [connecting, setConnecting] = useState(null);
    const [integrations, setIntegrations] = useState(INTEGRATIONS);

    const handleConnect = async (id) => {
        setConnecting(id);
        // Simulate connection delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        setIntegrations(prev => prev.map(i =>
            i.id === id ? { ...i, connected: !i.connected, status: i.connected ? undefined : 'Active' } : i
        ));
        setConnecting(null);
    };

    const filtered = categoryFilter === 'all'
        ? integrations
        : integrations.filter(i => i.category === categoryFilter);

    return (
        <div style={{ padding: '24px 32px', maxWidth: '1100px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <div style={{
                    width: '32px', height: '32px', borderRadius: '8px',
                    background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <Puzzle size={16} color="#fff" />
                </div>
                <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: 'var(--text-primary, #F2F3EC)' }}>
                    Integrations
                </h1>
            </div>
            <p style={{ margin: '6px 0 28px 0', fontSize: '13px', color: 'var(--text-muted, #888)' }}>
                Connect your tools and channels to extend LeadFlow's capabilities
            </p>

            {/* Category Filters */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '24px', flexWrap: 'wrap' }}>
                {CATEGORIES.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => setCategoryFilter(cat.id)}
                        style={{
                            padding: '7px 18px', borderRadius: '16px', border: 'none',
                            fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                            background: categoryFilter === cat.id
                                ? 'linear-gradient(135deg, #6366F1, #8B5CF6)'
                                : 'rgba(255,255,255,0.06)',
                            color: categoryFilter === cat.id ? '#fff' : 'var(--text-muted, #888)',
                            transition: 'all 0.2s'
                        }}
                    >
                        {cat.label}
                    </button>
                ))}
            </div>

            {/* Integration Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
                {filtered.map(integration => {
                    const Icon = integration.icon;
                    return (
                        <div key={integration.id} style={{
                            padding: '24px', borderRadius: '14px',
                            background: 'var(--bg-surface, #1C1C1C)',
                            border: integration.connected
                                ? '1px solid rgba(99,102,241,0.3)'
                                : '1px solid var(--border-subtle, #2a2a2a)',
                            transition: 'all 0.25s',
                            position: 'relative', overflow: 'hidden'
                        }}
                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = integration.connected ? 'rgba(99,102,241,0.5)' : '#444'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = integration.connected ? 'rgba(99,102,241,0.3)' : 'var(--border-subtle, #2a2a2a)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                        >
                            {/* Status indicator dot */}
                            {integration.connected && (
                                <div style={{
                                    position: 'absolute', top: '20px', right: '20px',
                                    display: 'flex', alignItems: 'center', gap: '5px',
                                    fontSize: '11px', color: '#34D399', fontWeight: 600
                                }}>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#34D399' }} />
                                    {integration.status || 'Connected'}
                                </div>
                            )}

                            {/* Icon */}
                            <div style={{
                                width: '48px', height: '48px', borderRadius: '14px',
                                background: integration.bgGradient,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                marginBottom: '16px'
                            }}>
                                <Icon size={22} color="#fff" />
                            </div>

                            {/* Name + Description */}
                            <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: 700, color: 'var(--text-primary, #F2F3EC)', paddingRight: integration.connected ? '80px' : 0 }}>
                                {integration.name}
                            </h3>
                            <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: 'var(--text-muted, #888)', lineHeight: 1.5 }}>
                                {integration.description}
                            </p>

                            {/* Action */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <button
                                    onClick={() => handleConnect(integration.id)}
                                    disabled={connecting === integration.id}
                                    style={{
                                        padding: '9px 20px', borderRadius: '10px', border: 'none',
                                        background: connecting === integration.id
                                            ? 'rgba(99,102,241,0.3)'
                                            : integration.connected
                                                ? 'rgba(239,68,68,0.1)' : 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                                        color: connecting === integration.id
                                            ? '#fff'
                                            : integration.connected ? '#EF4444' : '#fff',
                                        fontSize: '13px', fontWeight: 600,
                                        cursor: connecting === integration.id ? 'not-allowed' : 'pointer',
                                        display: 'flex', alignItems: 'center', gap: '6px',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {connecting === integration.id ? (
                                        <><Loader2 className="spin" size={14} /> Connecting...</>
                                    ) : integration.connected ? (
                                        <><XCircle size={14} /> Disconnect</>
                                    ) : (
                                        <><ExternalLink size={14} /> Connect</>
                                    )}
                                </button>
                                {integration.docsUrl && (
                                    <a href={integration.docsUrl}
                                        style={{
                                            padding: '9px 14px', borderRadius: '8px',
                                            border: '1px solid var(--border-subtle, #333)',
                                            color: 'var(--text-muted, #888)', fontSize: '12px',
                                            textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px',
                                            fontWeight: 500
                                        }}>
                                        Docs <ChevronRight size={14} />
                                    </a>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            <style>{`
                @keyframes lf-spin { to { transform: rotate(360deg); } }
                .spin { animation: lf-spin 1s linear infinite; }
            `}</style>
        </div>
    );
}

export default IntegrationsPage;