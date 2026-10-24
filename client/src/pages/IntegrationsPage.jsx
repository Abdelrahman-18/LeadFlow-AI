import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../supabaseClient';
import { Puzzle, MessageSquare, Globe, Mail, Database, Phone, Bot, ExternalLink, CheckCircle, XCircle, Loader2, ChevronRight, RefreshCw } from 'lucide-react';

const INTEGRATIONS = [
    {
        id: 'messenger',
        name: 'Facebook Messenger',
        description: 'Connect your Facebook Page to receive and respond to customer messages automatically.',
        icon: MessageSquare,
        color: '#1877F2',
        bgGradient: 'linear-gradient(135deg, #1877F2, #0D65D9)',
        connected: true,
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
        connected: true,
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
        color: '#805BE7',
        bgGradient: 'var(--brand-gradient)',
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
    const [orgSettings, setOrgSettings] = useState(null);

    // Load integration states from Supabase organizations table
    useEffect(() => {
        const loadOrgSettings = async () => {
            try {
                const { data } = await supabase
                    .from('organizations')
                    .select('id, settings')
                    .limit(1)
                    .single();

                if (data && data.settings) {
                    setOrgSettings(data.settings);
                    if (data.settings.integrations) {
                        setIntegrations(prev => prev.map(item => ({
                            ...item,
                            connected: data.settings.integrations[item.id] !== undefined
                                ? data.settings.integrations[item.id]
                                : item.connected
                        })));
                    }
                }
            } catch (err) {
                console.warn('Failed to load organization settings from Supabase:', err);
            }
        };

        loadOrgSettings();
    }, []);

    const handleConnect = async (id) => {
        setConnecting(id);

        try {
            const target = integrations.find(i => i.id === id);
            const newConnectedState = !target?.connected;

            // Update local state immediately
            setIntegrations(prev => prev.map(i =>
                i.id === id ? { ...i, connected: newConnectedState, status: newConnectedState ? 'Active' : undefined } : i
            ));

            // Persist to Supabase organizations table settings JSON
            const updatedIntegrations = {
                ...(orgSettings?.integrations || {}),
                [id]: newConnectedState
            };

            const updatedSettings = {
                ...(orgSettings || {}),
                integrations: updatedIntegrations
            };

            setOrgSettings(updatedSettings);

            await supabase
                .from('organizations')
                .update({
                    settings: updatedSettings,
                    updatedAt: new Date().toISOString()
                })
                .eq('id', '4d01ebeb-a684-4e84-bb66-a4ed5c76f42c');
        } catch (error) {
            console.error('Error updating integration in Supabase:', error);
        } finally {
            setConnecting(null);
        }
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
                    background: 'var(--brand-gradient)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <Puzzle size={16} color="#fff" />
                </div>
                <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: 'var(--text-primary, #F5F6FA)' }}>
                    Integrations
                </h1>
                <span style={{
                    fontSize: '11px', padding: '3px 8px', borderRadius: '6px',
                    background: 'rgba(52,211,153,0.12)', color: '#34D399', fontWeight: 600
                }}>
                    Supabase Synced
                </span>
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
                                ? 'var(--brand-gradient)'
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
                            background: 'var(--bg-surface, #1E2025)',
                            border: integration.connected
                                ? '1px solid rgba(128, 91, 231,0.3)'
                                : '1px solid var(--border-subtle, #2a2a2a)',
                            transition: 'all 0.25s',
                            position: 'relative', overflow: 'hidden'
                        }}
                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = integration.connected ? 'rgba(128, 91, 231,0.5)' : '#444'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = integration.connected ? 'rgba(128, 91, 231,0.3)' : 'var(--border-subtle, #2a2a2a)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                        >
                            {/* Status indicator dot */}
                            {integration.connected && (
                                <div style={{
                                    position: 'absolute', top: '16px', right: '16px',
                                    display: 'flex', alignItems: 'center', gap: '6px'
                                }}>
                                    <span style={{
                                        width: '8px', height: '8px', borderRadius: '50%',
                                        background: '#34D399', boxShadow: '0 0 8px rgba(52,211,153,0.6)'
                                    }} />
                                    <span style={{ fontSize: '11px', color: '#34D399', fontWeight: 600 }}>Active</span>
                                </div>
                            )}

                            {/* Icon + Name */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
                                <div style={{
                                    width: '44px', height: '44px', borderRadius: '12px',
                                    background: integration.bgGradient || 'var(--brand-gradient)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    boxShadow: '0 4px 14px rgba(0,0,0,0.3)'
                                }}>
                                    <Icon size={22} color="#fff" />
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-primary, #F5F6FA)' }}>
                                        {integration.name}
                                    </h3>
                                    <span style={{ fontSize: '11px', color: 'var(--text-muted, #888)', textTransform: 'capitalize' }}>
                                        {integration.category}
                                    </span>
                                </div>
                            </div>

                            {/* Description */}
                            <p style={{
                                margin: '0 0 20px 0', fontSize: '12px', color: 'var(--text-muted, #888)',
                                lineHeight: 1.6, minHeight: '38px'
                            }}>
                                {integration.description}
                            </p>

                            {/* Actions */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '14px', borderTop: '1px solid var(--border-subtle, #222)' }}>
                                <a
                                    href={integration.docsUrl}
                                    style={{
                                        fontSize: '12px', color: '#9B7DF0', textDecoration: 'none',
                                        display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 500
                                    }}
                                >
                                    Documentation <ExternalLink size={12} />
                                </a>

                                <button
                                    onClick={() => handleConnect(integration.id)}
                                    disabled={connecting === integration.id}
                                    style={{
                                        padding: '7px 18px', borderRadius: '8px', border: 'none',
                                        fontSize: '12px', fontWeight: 600, cursor: connecting === integration.id ? 'not-allowed' : 'pointer',
                                        background: integration.connected
                                            ? 'rgba(239,68,68,0.1)'
                                            : 'var(--brand-gradient)',
                                        color: integration.connected ? '#EF4444' : '#fff',
                                        display: 'flex', alignItems: 'center', gap: '6px',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {connecting === integration.id ? (
                                        <>
                                            <Loader2 className="spin" size={14} />
                                            Updating...
                                        </>
                                    ) : integration.connected ? (
                                        'Disconnect'
                                    ) : (
                                        'Connect'
                                    )}
                                </button>
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
