import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../supabaseClient';
import leadflowService from '../services/leadflowService';
import {
    MessageSquare, Search, User, Loader2, Send, Inbox,
    Sparkles, ChevronLeft, ChevronRight, PanelLeftClose, PanelLeftOpen,
    Bot, UserCheck
} from 'lucide-react';

const STATUS_COLORS = {
    ACTIVE: { bg: 'rgba(128, 91, 231, 0.12)', text: '#9B7DF0', label: 'Active' },
    PENDING: { bg: 'rgba(251, 191, 36, 0.12)', text: '#FBBF24', label: 'Pending' },
    RESOLVED: { bg: 'rgba(52, 211, 153, 0.12)', text: '#34D399', label: 'Resolved' },
    ARCHIVED: { bg: 'rgba(107, 114, 128, 0.12)', text: '#9CA3AF', label: 'Archived' },
};

const STATUS_OPTIONS = ['ALL', 'ACTIVE', 'PENDING', 'RESOLVED', 'ARCHIVED'];

/**
 * Coherent Mock Conversations & Messages where:
 * - Customer ('customer') is Inbound (Left Side) asking questions
 * - AI Assistant ('ai_assistant') and Sales Rep ('sales_rep') are Outbound (Right Side) providing answers
 */
const MOCK_CONVERSATIONS = [
    {
        id: 'mock-conv-hossam',
        channel: 'MESSENGER',
        status: 'ACTIVE',
        lastMessageAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        customer: { id: 'cust-hossam', name: 'Hossam Badr', email: 'hossam.b@gmail.com', channel: 'MESSENGER' },
        lead: { leadScore: 84, buyingIntent: 'VERY_HIGH', potentialRevenue: 6456 },
        _count: { messages: 9 }
    },
    {
        id: 'mock-conv-karim',
        channel: 'MESSENGER',
        status: 'ACTIVE',
        lastMessageAt: new Date(Date.now() - 48 * 60 * 1000).toISOString(),
        customer: { id: 'cust-karim', name: 'Karim Naguib', email: 'karim.n@yahoo.com', channel: 'MESSENGER' },
        lead: { leadScore: 68, buyingIntent: 'MEDIUM', potentialRevenue: 4299 },
        _count: { messages: 5 }
    },
    {
        id: 'mock-conv-yasmine',
        channel: 'MESSENGER',
        status: 'ACTIVE',
        lastMessageAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
        customer: { id: 'cust-yasmine', name: 'Yasmine Adel', email: 'yasmine.a@gmail.com', channel: 'MESSENGER' },
        lead: { leadScore: 91, buyingIntent: 'HIGH', potentialRevenue: 4098 },
        _count: { messages: 8 }
    },
    {
        id: 'mock-conv-nour',
        channel: 'MESSENGER',
        status: 'ACTIVE',
        lastMessageAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
        customer: { id: 'cust-nour', name: 'Nour El-Din', email: 'nour.din@hotmail.com', channel: 'MESSENGER' },
        lead: { leadScore: 55, buyingIntent: 'MEDIUM', potentialRevenue: 3299 },
        _count: { messages: 4 }
    },
    {
        id: 'mock-conv-dina',
        channel: 'MESSENGER',
        status: 'RESOLVED',
        lastMessageAt: new Date(Date.now() - 26 * 3600 * 1000).toISOString(),
        customer: { id: 'cust-dina', name: 'Dina El-Shafei', email: 'dina.s@gmail.com', channel: 'MESSENGER' },
        lead: { leadScore: 40, buyingIntent: 'LOW', potentialRevenue: 0 },
        _count: { messages: 5 }
    }
];

const MOCK_MESSAGES_BY_CUSTOMER = {
    'Hossam Badr': [
        {
            id: 'hb-1',
            sender: 'customer',
            content: "Hi! I'm looking for a complete outfit for a wedding next month. Can you help me put something together?",
            createdAt: new Date(Date.now() - 55 * 60 * 1000).toISOString()
        },
        {
            id: 'hb-2',
            sender: 'ai_assistant',
            content: "Absolutely, Hossam! 🎉 I'd love to help you style the perfect wedding outfit. Here are our top formal pieces:\n\n1. Linen Blazer in Beige (EGP 3,299)\n2. Slim Fit Oxford Shirt (EGP 1,299)\n3. Tailored Trousers in Charcoal (EGP 1,599)\n4. Italian Silk Tie Collection (EGP 1,399)\n\nWould you like details on any of these items?",
            createdAt: new Date(Date.now() - 52 * 60 * 1000).toISOString()
        },
        {
            id: 'hb-3',
            sender: 'customer',
            content: 'I want to ask about any red shirts you have — or burgundy options that would match a formal suit?',
            createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString()
        },
        {
            id: 'hb-4',
            sender: 'ai_assistant',
            content: 'For shirts, our Slim Fit Oxford Shirt is crafted in crisp white and sky blue (100% Egyptian cotton, EGP 1,299). To add a rich red or burgundy statement to your look, our Italian Silk Tie Collection (EGP 1,399) includes a deep burgundy silk tie that pairs effortlessly with a white Oxford shirt and beige blazer.',
            createdAt: new Date(Date.now() - 43 * 60 * 1000).toISOString()
        },
        {
            id: 'hb-5',
            sender: 'customer',
            content: 'That works! What fabric is the Linen Blazer made of?',
            createdAt: new Date(Date.now() - 35 * 60 * 1000).toISOString()
        },
        {
            id: 'hb-6',
            sender: 'ai_assistant',
            content: 'The Linen Blazer (EGP 3,299) is tailored from 100% breathable European flax linen with an unlined construction, making it lightweight, structured, and comfortable for warm-weather weddings.',
            createdAt: new Date(Date.now() - 33 * 60 * 1000).toISOString()
        },
        {
            id: 'hb-7',
            sender: 'customer',
            content: "Sounds amazing. I'll take the Linen Blazer, Oxford shirt, tailored trousers, and the silk tie set. Can I get a 15% bundle discount since I'm buying the full outfit?",
            createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString()
        },
        {
            id: 'hb-8',
            sender: 'ai_assistant',
            content: 'I can immediately apply a 10% bundle discount, and I have flagged your 15% discount request for our Sales Rep to review and approve right away!',
            createdAt: new Date(Date.now() - 23 * 60 * 1000).toISOString()
        },
        {
            id: 'hb-9',
            sender: 'sales_rep',
            content: 'Hi Hossam! Layla here from the sales team. I just got manager approval for your 15% wedding bundle discount — bringing your total down to EGP 6,456 with complimentary express shipping. Shall I send your payment link?',
            createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString()
        }
    ],
    'Karim Naguib': [
        {
            id: 'kn-1',
            sender: 'customer',
            content: 'Hello, I ordered the Leather Chelsea Boots last week (ORD-2026-00842) and wanted to check on the shipping status.',
            createdAt: new Date(Date.now() - 90 * 60 * 1000).toISOString()
        },
        {
            id: 'kn-2',
            sender: 'ai_assistant',
            content: 'Hello Karim! Your order (ORD-2026-00842) for the tan Leather Chelsea Boots is in final quality inspection and will dispatch tomorrow morning via express courier.',
            createdAt: new Date(Date.now() - 85 * 60 * 1000).toISOString()
        },
        {
            id: 'kn-3',
            sender: 'customer',
            content: 'Great, thank you! Do you also have these Chelsea Boots in dark brown in size 43? I might add a second pair.',
            createdAt: new Date(Date.now() - 65 * 60 * 1000).toISOString()
        },
        {
            id: 'kn-4',
            sender: 'ai_assistant',
            content: 'Yes! The Leather Chelsea Boots in Dark Espresso Brown (SKU: ABC-CB-008-BRN) are in stock in size 43 at EGP 4,299. We can bundle them into your current shipment with free shipping.',
            createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString()
        },
        {
            id: 'kn-5',
            sender: 'sales_rep',
            content: 'Hi Karim, Omar here! I reserved the size 43 Dark Brown Chelsea Boots at our warehouse so we can pack them in the same box before the courier picks up tomorrow. Let me know if you want me to confirm the add-on!',
            createdAt: new Date(Date.now() - 48 * 60 * 1000).toISOString()
        }
    ],
    'Yasmine Adel': [
        {
            id: 'ya-1',
            sender: 'customer',
            content: 'Hi! I saw your Classic Denim Jacket on Instagram and I love it! Do you have it in stock in size Medium?',
            createdAt: new Date(Date.now() - 180 * 60 * 1000).toISOString()
        },
        {
            id: 'ya-2',
            sender: 'ai_assistant',
            content: 'Hello Yasmine! 👋 Yes, the Classic Denim Jacket (SKU: ABC-DJ-001, EGP 1,899) is in stock in size Medium in both light wash and classic indigo.',
            createdAt: new Date(Date.now() - 175 * 60 * 1000).toISOString()
        },
        {
            id: 'ya-3',
            sender: 'customer',
            content: 'Can I also add the Merino Wool Sweater in navy? Do you offer any discount for first-time buyers?',
            createdAt: new Date(Date.now() - 150 * 60 * 1000).toISOString()
        },
        {
            id: 'ya-4',
            sender: 'ai_assistant',
            content: 'Excellent choice! Together with the Merino Wool Sweater (EGP 2,199), your bundle comes to EGP 4,098 and qualifies for free express shipping.',
            createdAt: new Date(Date.now() - 145 * 60 * 1000).toISOString()
        },
        {
            id: 'ya-5',
            sender: 'sales_rep',
            content: 'Hi Yasmine! I have applied our 10% Welcome Promo (code: WELCOME10) to your Denim Jacket + Navy Merino Wool Sweater bundle, bringing your total to EGP 3,688 with free shipping!',
            createdAt: new Date(Date.now() - 120 * 60 * 1000).toISOString()
        }
    ],
    'Nour El-Din': [
        {
            id: 'nd-1',
            sender: 'customer',
            content: 'Hi! What fabric is the Linen Blazer made of, and does the beige one come in European size 42?',
            createdAt: new Date(Date.now() - 320 * 60 * 1000).toISOString()
        },
        {
            id: 'nd-2',
            sender: 'ai_assistant',
            content: "Hello Nour! 👋 The Linen Blazer (EGP 3,299) is crafted from 100% premium European linen and is available in beige in European size 42. Would you like to proceed with an order?",
            createdAt: new Date(Date.now() - 310 * 60 * 1000).toISOString()
        }
    ],
    'Dina El-Shafei': [
        {
            id: 'ds-1',
            sender: 'customer',
            content: "Hi, I received my Silk Evening Dress but it's slightly too long. Can I arrange a tailoring pickup?",
            createdAt: new Date(Date.now() - 1500 * 60 * 1000).toISOString()
        },
        {
            id: 'ds-2',
            sender: 'ai_assistant',
            content: "Hello Dina! We offer complimentary alterations within 14 days of delivery. I've scheduled a courier pickup for tomorrow between 10 AM and 2 PM.",
            createdAt: new Date(Date.now() - 1480 * 60 * 1000).toISOString()
        },
        {
            id: 'ds-3',
            sender: 'customer',
            content: 'Perfect, thank you so much!',
            createdAt: new Date(Date.now() - 1460 * 60 * 1000).toISOString()
        }
    ]
};

/**
 * Normalizes any message record (from Supabase, API, or mock data) so `sender` is strictly:
 * - 'customer' (Inbound — Left Side)
 * - 'ai_assistant' (Outbound AI — Right Side)
 * - 'sales_rep' (Outbound Sales Rep — Right Side)
 */
function normalizeMessage(msg) {
    const rawSender = String(msg.sender || '').toUpperCase().trim();
    const content = String(msg.content || '');

    let normalizedSender = 'customer';
    if (rawSender === 'AI' || rawSender === 'BOT' || rawSender === 'AI_ASSISTANT') {
        normalizedSender = 'ai_assistant';
    } else if (rawSender === 'HUMAN' || rawSender === 'SALES_REP' || rawSender === 'AGENT') {
        // Guard against legacy test prompts that were saved as HUMAN when a customer was asking a question
        const lower = content.toLowerCase();
        const looksLikeCustomerQuestion =
            lower.includes('i want to ask about') ||
            lower.includes('what fabric is') ||
            lower.includes('whats your return policy') ||
            lower.includes('what are your shipping options') ||
            lower.includes('tell me about your latest collection') ||
            lower.includes('do you have any promotions');
        normalizedSender = looksLikeCustomerQuestion ? 'customer' : 'sales_rep';
    } else {
        normalizedSender = 'customer';
    }

    return {
        ...msg,
        sender: normalizedSender,
    };
}

function ConversationsPage() {
    const { t } = useTranslation();
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messages, setMessages] = useState(null);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [sendingMessage, setSendingMessage] = useState(false);
    const [newMessage, setNewMessage] = useState('');

    // Chat List Collapse Toggle state
    const [isChatListCollapsed, setIsChatListCollapsed] = useState(false);

    const messagesEndRef = useRef(null);
    const messageInputRef = useRef(null);

    const fetchConversations = async () => {
        try {
            setLoading(true);

            let query = supabase
                .from('conversations')
                .select('*')
                .order('lastMessageAt', { ascending: false });

            if (statusFilter !== 'ALL') {
                query = query.eq('status', statusFilter);
            }

            const { data: convData, error: convError } = await query;
            if (convError) throw convError;

            const customerIds = [...new Set((convData || []).map(c => c.customerId).filter(Boolean))];
            const convIds = (convData || []).map(c => c.id);

            const [custRes, leadsRes, msgsRes] = await Promise.all([
                customerIds.length > 0 ? supabase.from('customers').select('*').in('id', customerIds) : { data: [] },
                convIds.length > 0 ? supabase.from('leads').select('*').in('conversationId', convIds) : { data: [] },
                convIds.length > 0 ? supabase.from('messages').select('conversationId') : { data: [] }
            ]);

            const customerMap = (custRes.data || []).reduce((acc, c) => ({ ...acc, [c.id]: c }), {});
            const leadMap = (leadsRes.data || []).reduce((acc, l) => ({ ...acc, [l.conversationId]: l }), {});
            const msgCountMap = {};
            (msgsRes.data || []).forEach(m => {
                msgCountMap[m.conversationId] = (msgCountMap[m.conversationId] || 0) + 1;
            });

            const combined = (convData && convData.length > 0)
                ? convData.map(conv => ({
                    ...conv,
                    customer: customerMap[conv.customerId] || { name: 'Customer' },
                    lead: leadMap[conv.id] || null,
                    _count: { messages: msgCountMap[conv.id] || 0 }
                }))
                : MOCK_CONVERSATIONS;

            const filtered = searchQuery
                ? combined.filter(c =>
                    (c.customer?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (c.channel || '').toLowerCase().includes(searchQuery.toLowerCase())
                )
                : combined;

            setConversations(filtered);

            if (filtered.length > 0 && !selectedConversation) {
                openConversation(filtered[0]);
            }
        } catch (error) {
            console.error('Error fetching conversations from Supabase, using mock conversations:', error);
            const fallbackList = MOCK_CONVERSATIONS.filter(c =>
                (statusFilter === 'ALL' || c.status === statusFilter) &&
                (!searchQuery || (c.customer?.name || '').toLowerCase().includes(searchQuery.toLowerCase()))
            );
            setConversations(fallbackList);
            if (fallbackList.length > 0 && !selectedConversation) {
                openConversation(fallbackList[0]);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchConversations();
    }, [statusFilter]);

    const handleSearch = (e) => {
        e.preventDefault();
        fetchConversations();
    };

    const openConversation = async (conv) => {
        setSelectedConversation(conv);
        setLoadingMessages(true);
        const customerName = conv.customer?.name || 'Customer';

        try {
            if (String(conv.id).startsWith('mock-')) {
                const mockMsgs = MOCK_MESSAGES_BY_CUSTOMER[customerName] || MOCK_MESSAGES_BY_CUSTOMER['Hossam Badr'];
                setMessages({ messages: mockMsgs.map(normalizeMessage) });
                return;
            }

            const { data: msgData, error } = await supabase
                .from('messages')
                .select('*')
                .eq('conversationId', conv.id)
                .order('createdAt', { ascending: true });

            if (error) throw error;

            if (msgData && msgData.length > 0) {
                setMessages({ messages: msgData.map(normalizeMessage) });
            } else {
                const fallbackMsgs = MOCK_MESSAGES_BY_CUSTOMER[customerName] || [];
                setMessages({ messages: fallbackMsgs.map(normalizeMessage) });
            }
        } catch (error) {
            console.error('Error fetching messages from Supabase, using mock messages:', error);
            const fallbackMsgs = MOCK_MESSAGES_BY_CUSTOMER[customerName] || MOCK_MESSAGES_BY_CUSTOMER['Hossam Badr'];
            setMessages({ messages: fallbackMsgs.map(normalizeMessage) });
        } finally {
            setLoadingMessages(false);
        }
    };

    const handleStatusChange = async (id, newStatus) => {
        try {
            await supabase.from('conversations').update({ status: newStatus }).eq('id', id);
            fetchConversations();
            if (selectedConversation?.id === id) {
                setSelectedConversation(prev => ({ ...prev, status: newStatus }));
            }
        } catch (error) {
            console.error('Error updating status:', error);
            await leadflowService.updateConversationStatus(id, newStatus);
        }
    };

    const handleSendMessage = async () => {
        if (!selectedConversation || !newMessage.trim()) return;
        const messageText = newMessage.trim();
        setNewMessage('');
        setSendingMessage(true);

        const now = new Date().toISOString();
        const optimisticRepMsg = {
            id: `local-${Date.now()}`,
            conversationId: selectedConversation.id,
            sender: 'sales_rep',
            content: messageText,
            createdAt: now,
        };

        // Immediately append the Sales Rep reply to the right side of the chat
        setMessages(prev => ({
            messages: [...(prev?.messages || []), optimisticRepMsg]
        }));

        try {
            if (!String(selectedConversation.id).startsWith('mock-')) {
                const { error: insertError } = await supabase
                    .from('messages')
                    .insert({
                        conversationId: selectedConversation.id,
                        sender: 'HUMAN',
                        content: messageText,
                        contentType: 'text',
                        createdAt: now
                    });

                if (insertError) throw insertError;

                await supabase
                    .from('conversations')
                    .update({ lastMessageAt: now })
                    .eq('id', selectedConversation.id);

                const { data: msgData } = await supabase
                    .from('messages')
                    .select('*')
                    .eq('conversationId', selectedConversation.id)
                    .order('createdAt', { ascending: true });

                if (msgData) {
                    setMessages({ messages: msgData.map(normalizeMessage) });
                }
                fetchConversations();
            }
        } catch (error) {
            console.error('Error saving message:', error);
        } finally {
            setSendingMessage(false);
        }
    };

    const handleSendKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollTop = messagesEndRef.current.scrollHeight;
        }
    }, [messages]);

    const getTimeAgo = (dateStr) => {
        if (!dateStr) return '';
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.max(1, Math.floor(diff / 60000));
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        const days = Math.floor(hrs / 24);
        return `${days}d ago`;
    };

    return (
        <div style={{ display: 'flex', height: 'calc(100vh - 48px)', gap: 0, overflow: 'hidden', position: 'relative' }}>
            {/* Middle Column: Collapsible Conversation List */}
            <div
                style={{
                    width: isChatListCollapsed ? '0px' : '360px',
                    minWidth: isChatListCollapsed ? '0px' : '360px',
                    opacity: isChatListCollapsed ? 0 : 1,
                    overflow: 'hidden',
                    borderRight: isChatListCollapsed ? 'none' : '1px solid var(--border, #34363E)',
                    display: 'flex',
                    flexDirection: 'column',
                    background: 'var(--bg-surface, #1E2025)',
                    transition: 'width 250ms cubic-bezier(0.4, 0, 0.2, 1), min-width 250ms cubic-bezier(0.4, 0, 0.2, 1), opacity 200ms ease',
                    pointerEvents: isChatListCollapsed ? 'none' : 'auto',
                }}
                aria-hidden={isChatListCollapsed}
            >
                {/* Conversation List Header with Collapse Toggle */}
                <div style={{ padding: '20px 18px 16px', borderBottom: '1px solid var(--border, #34363E)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                        <div style={{
                            width: '32px', height: '32px', borderRadius: '8px', minWidth: '32px',
                            background: 'var(--brand-gradient, #805BE7)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <MessageSquare size={16} color="#fff" />
                        </div>
                        <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: 'var(--text-primary, #F5F6FA)', whiteSpace: 'nowrap' }}>
                            Conversations
                        </h2>
                        <span style={{
                            fontSize: '12px', padding: '2px 8px',
                            borderRadius: '10px', background: 'rgba(128, 91, 231, 0.14)',
                            color: '#9B7DF0', fontWeight: 600
                        }}>
                            {conversations.length}
                        </span>

                        {/* Collapse Conversation List Button */}
                        <button
                            type="button"
                            onClick={() => setIsChatListCollapsed(true)}
                            title="Collapse conversation list"
                            aria-label="Collapse conversation list"
                            style={{
                                marginLeft: 'auto',
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                border: '1px solid var(--border, #34363E)',
                                background: 'rgba(255, 255, 255, 0.03)',
                                color: 'var(--text-secondary, #A9ADB8)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                                flexShrink: 0,
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'var(--bg-hover, #2A2C33)';
                                e.currentTarget.style.color = 'var(--text-primary, #F5F6FA)';
                                e.currentTarget.style.borderColor = '#805BE7';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                                e.currentTarget.style.color = 'var(--text-secondary, #A9ADB8)';
                                e.currentTarget.style.borderColor = 'var(--border, #34363E)';
                            }}
                        >
                            <ChevronLeft size={17} />
                        </button>
                    </div>

                    {/* Search */}
                    <form onSubmit={handleSearch} style={{ position: 'relative', marginBottom: '12px' }}>
                        <Search size={15} style={{
                            position: 'absolute', left: '12px', top: '50%',
                            transform: 'translateY(-50%)', color: 'var(--text-secondary, #A9ADB8)'
                        }} />
                        <input
                            type="text"
                            placeholder="Search conversations..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                width: '100%', padding: '9px 12px 9px 36px',
                                borderRadius: '8px', border: '1px solid var(--border, #34363E)',
                                background: 'var(--bg-page, #111214)',
                                color: 'var(--text-primary, #F5F6FA)', fontSize: '13px',
                                outline: 'none', boxSizing: 'border-box'
                            }}
                        />
                    </form>

                    {/* Status Filter Pills */}
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {STATUS_OPTIONS.map(status => (
                            <button
                                key={status}
                                type="button"
                                onClick={() => setStatusFilter(status)}
                                style={{
                                    padding: '5px 11px', borderRadius: '14px', border: 'none',
                                    fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                                    background: statusFilter === status
                                        ? 'var(--brand-gradient, #805BE7)'
                                        : 'rgba(255, 255, 255, 0.05)',
                                    color: statusFilter === status ? '#fff' : 'var(--text-secondary, #A9ADB8)',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {status === 'ALL' ? 'All' : STATUS_COLORS[status]?.label || status}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Conversation Items */}
                <div style={{ flex: 1, overflowY: 'auto' }}>
                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                            <Loader2 className="spin" size={24} style={{ color: '#805BE7' }} />
                        </div>
                    ) : conversations.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary, #A9ADB8)' }}>
                            <Inbox size={40} style={{ marginBottom: '12px', opacity: 0.3 }} />
                            <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary, #F5F6FA)' }}>
                                No conversations
                            </div>
                            <div style={{ fontSize: '12px' }}>
                                {statusFilter !== 'ALL' ? 'Try a different status filter' : 'Start by connecting a channel'}
                            </div>
                        </div>
                    ) : (
                        conversations.map(conv => (
                            <button
                                key={conv.id}
                                type="button"
                                onClick={() => openConversation(conv)}
                                style={{
                                    width: '100%', padding: '14px 18px', border: 'none',
                                    borderBottom: '1px solid rgba(52, 54, 62, 0.6)',
                                    borderLeft: selectedConversation?.id === conv.id
                                        ? '3px solid #E6B84D'
                                        : '3px solid transparent',
                                    background: selectedConversation?.id === conv.id
                                        ? 'rgba(128, 91, 231, 0.12)'
                                        : 'transparent',
                                    cursor: 'pointer', textAlign: 'left',
                                    transition: 'background 0.15s',
                                    display: 'flex', gap: '12px', alignItems: 'flex-start'
                                }}
                                onMouseEnter={(e) => {
                                    if (selectedConversation?.id !== conv.id) {
                                        e.currentTarget.style.background = 'var(--bg-hover, #2A2C33)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (selectedConversation?.id !== conv.id) {
                                        e.currentTarget.style.background = 'transparent';
                                    }
                                }}
                            >
                                {/* Customer Avatar */}
                                <div style={{
                                    width: '40px', height: '40px', borderRadius: '10px', minWidth: '40px',
                                    background: conv.customer?.avatarUrl
                                        ? `url(${conv.customer.avatarUrl}) center/cover`
                                        : 'rgba(230, 184, 77, 0.16)',
                                    border: '1px solid rgba(230, 184, 77, 0.35)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: '#E6B84D', fontWeight: 700, fontSize: '15px'
                                }}>
                                    {!conv.customer?.avatarUrl && (conv.customer?.name?.charAt(0) || '?')}
                                </div>

                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary, #F5F6FA)' }}>
                                            {conv.customer?.name || 'Unknown'}
                                        </span>
                                        <span style={{ fontSize: '11px', color: 'var(--text-secondary, #A9ADB8)' }}>
                                            {getTimeAgo(conv.lastMessageAt || conv.createdAt)}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-secondary, #A9ADB8)', marginBottom: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {conv.channel || 'MESSENGER'} · {conv._count?.messages || 0} messages
                                    </div>
                                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                        <span style={{
                                            fontSize: '10px', padding: '2px 7px', borderRadius: '8px',
                                            background: STATUS_COLORS[conv.status]?.bg || 'rgba(107,114,128,0.12)',
                                            color: STATUS_COLORS[conv.status]?.text || '#9CA3AF',
                                            fontWeight: 600
                                        }}>
                                            {STATUS_COLORS[conv.status]?.label || conv.status}
                                        </span>
                                        {conv.lead?.leadScore != null && (
                                            <span style={{
                                                fontSize: '10px', padding: '2px 7px', borderRadius: '8px',
                                                background: conv.lead.leadScore >= 80 ? 'rgba(52, 211, 153, 0.12)' : 'rgba(251, 191, 36, 0.12)',
                                                color: conv.lead.leadScore >= 80 ? '#34D399' : '#FBBF24',
                                                fontWeight: 600
                                            }}>
                                                Score: {conv.lead.leadScore}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Active Chat Window (Expands when Conversation List is Collapsed) */}
            <div style={{
                flex: 1,
                minWidth: 0,
                display: 'flex',
                flexDirection: 'column',
                background: 'var(--bg-page, #111214)',
                alignItems: 'center',
                justifyContent: selectedConversation ? 'flex-start' : 'center',
                transition: 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)',
            }}>
                {!selectedConversation ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-secondary, #A9ADB8)', padding: '24px' }}>
                        {isChatListCollapsed && (
                            <button
                                type="button"
                                onClick={() => setIsChatListCollapsed(false)}
                                style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                                    padding: '8px 14px', borderRadius: '8px', marginBottom: '20px',
                                    border: '1px solid var(--border, #34363E)',
                                    background: 'var(--bg-surface, #1E2025)',
                                    color: 'var(--text-primary, #F5F6FA)',
                                    fontSize: '12px', fontWeight: 600, cursor: 'pointer'
                                }}
                            >
                                <PanelLeftOpen size={15} style={{ color: '#E6B84D' }} />
                                <span>Show Conversations</span>
                            </button>
                        )}
                        <div>
                            <MessageSquare size={56} style={{ marginBottom: '16px', opacity: 0.2 }} />
                            <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary, #F5F6FA)', marginBottom: '6px' }}>
                                Select a conversation
                            </div>
                            <div style={{ fontSize: '13px' }}>
                                Choose a conversation from the list to view messages
                            </div>
                        </div>
                    </div>
                ) : loadingMessages ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
                        <Loader2 className="spin" size={28} style={{ color: '#805BE7' }} />
                    </div>
                ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
                        {/* Active Chat Header */}
                        <div style={{
                            padding: '14px 24px',
                            borderBottom: '1px solid var(--border, #34363E)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '14px',
                            background: 'var(--bg-surface, #1E2025)'
                        }}>
                            {/* Uncollapse Button when Middle Column is Hidden */}
                            {isChatListCollapsed && (
                                <button
                                    type="button"
                                    onClick={() => setIsChatListCollapsed(false)}
                                    title="Show conversations list"
                                    aria-label="Show conversations list"
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        padding: '7px 12px',
                                        borderRadius: '8px',
                                        border: '1px solid var(--border, #34363E)',
                                        background: 'rgba(128, 91, 231, 0.12)',
                                        color: 'var(--text-primary, #F5F6FA)',
                                        fontSize: '12px',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        transition: 'all 0.15s ease',
                                        flexShrink: 0,
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.borderColor = '#805BE7';
                                        e.currentTarget.style.background = 'rgba(128, 91, 231, 0.22)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.borderColor = 'var(--border, #34363E)';
                                        e.currentTarget.style.background = 'rgba(128, 91, 231, 0.12)';
                                    }}
                                >
                                    <ChevronRight size={16} style={{ color: '#E6B84D' }} />
                                    <span>Conversations</span>
                                </button>
                            )}

                            <div style={{
                                width: '42px', height: '42px', borderRadius: '11px', minWidth: '42px',
                                background: selectedConversation.customer?.avatarUrl
                                    ? `url(${selectedConversation.customer.avatarUrl}) center/cover`
                                    : 'rgba(230, 184, 77, 0.16)',
                                border: '1px solid rgba(230, 184, 77, 0.35)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: '#E6B84D', fontWeight: 700, fontSize: '16px'
                            }}>
                                {!selectedConversation.customer?.avatarUrl && (selectedConversation.customer?.name?.charAt(0) || '?')}
                            </div>

                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary, #F5F6FA)' }}>
                                        {selectedConversation.customer?.name || 'Unknown'}
                                    </span>
                                    <span style={{
                                        fontSize: '10px', padding: '2px 7px', borderRadius: '6px',
                                        background: 'rgba(230, 184, 77, 0.12)', color: '#E6B84D', fontWeight: 600
                                    }}>
                                        Customer
                                    </span>
                                </div>
                                <div style={{ fontSize: '12px', color: 'var(--text-secondary, #A9ADB8)' }}>
                                    {selectedConversation.channel || 'MESSENGER'} · {(messages?.messages?.length ?? selectedConversation._count?.messages) || 0} messages
                                </div>
                            </div>

                            {/* Legend + Status Controls */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                {['ACTIVE', 'RESOLVED', 'ARCHIVED'].filter(s => s !== selectedConversation.status).map(s => (
                                    <button
                                        key={s}
                                        type="button"
                                        onClick={() => handleStatusChange(selectedConversation.id, s)}
                                        style={{
                                            padding: '6px 12px', borderRadius: '8px',
                                            border: '1px solid var(--border, #34363E)',
                                            background: 'transparent', color: STATUS_COLORS[s]?.text,
                                            fontSize: '11px', fontWeight: 600, cursor: 'pointer'
                                        }}
                                    >
                                        {STATUS_COLORS[s]?.label || s}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Chat Messages Stream */}
                        <div
                            ref={messagesEndRef}
                            style={{
                                flex: 1,
                                overflowY: 'auto',
                                padding: '24px 28px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '14px',
                            }}
                        >
                            {messages?.messages?.length > 0 ? (
                                messages.messages.map((rawMsg, idx) => {
                                    const message = normalizeMessage(rawMsg);
                                    const isCustomer = message.sender === 'customer';
                                    const isSalesRep = message.sender === 'sales_rep';
                                    const isAIAssistant = message.sender === 'ai_assistant';
                                    const isOutbound = isSalesRep || isAIAssistant;

                                    const customerName = selectedConversation.customer?.name || 'Customer';

                                    // Visual distinction:
                                    // - Left Side (Inbound): Customer ('customer') -> dark surface card (#1E2025)
                                    // - Right Side (Outbound):
                                    //   * Sales Rep ('sales_rep') -> Primary Purple (#805BE7 gradient)
                                    //   * AI Assistant ('ai_assistant') -> Darker/muted purple-slate variant (#242038) with accent border
                                    const bubbleBg = isSalesRep
                                        ? 'linear-gradient(135deg, #805BE7 0%, #6842D2 100%)'
                                        : isAIAssistant
                                            ? '#242038'
                                            : 'var(--bg-surface, #1E2025)';

                                    const bubbleBorder = isSalesRep
                                        ? '1px solid rgba(155, 125, 240, 0.45)'
                                        : isAIAssistant
                                            ? '1px solid rgba(128, 91, 231, 0.45)'
                                            : '1px solid var(--border, #34363E)';

                                    return (
                                        <div
                                            key={message.id || idx}
                                            className={isOutbound ? 'flex-row-reverse' : 'flex-row'}
                                            style={{
                                                display: 'flex',
                                                flexDirection: isOutbound ? 'row-reverse' : 'row',
                                                alignItems: 'flex-end',
                                                gap: '10px',
                                                width: '100%',
                                            }}
                                        >
                                            {/* Sender Avatar Badge */}
                                            <div
                                                style={{
                                                    width: '32px',
                                                    height: '32px',
                                                    minWidth: '32px',
                                                    borderRadius: '9px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '12px',
                                                    fontWeight: 700,
                                                    background: isSalesRep
                                                        ? '#805BE7'
                                                        : isAIAssistant
                                                            ? 'rgba(128, 91, 231, 0.18)'
                                                            : 'rgba(230, 184, 77, 0.15)',
                                                    border: isSalesRep
                                                        ? '1px solid rgba(255, 255, 255, 0.25)'
                                                        : isAIAssistant
                                                            ? '1px solid rgba(128, 91, 231, 0.45)'
                                                            : '1px solid rgba(230, 184, 77, 0.35)',
                                                    color: isSalesRep
                                                        ? '#FFFFFF'
                                                        : isAIAssistant
                                                            ? '#E6B84D'
                                                            : '#E6B84D',
                                                }}
                                                title={
                                                    isSalesRep
                                                        ? 'You (Sales Rep)'
                                                        : isAIAssistant
                                                            ? 'AI Assistant'
                                                            : customerName
                                                }
                                            >
                                                {isSalesRep ? (
                                                    <UserCheck size={15} />
                                                ) : isAIAssistant ? (
                                                    <Bot size={16} />
                                                ) : (
                                                    customerName.charAt(0)
                                                )}
                                            </div>

                                            {/* Message Bubble */}
                                            <div
                                                style={{
                                                    maxWidth: '70%',
                                                    padding: '12px 16px',
                                                    borderRadius: isOutbound
                                                        ? '14px 14px 4px 14px'
                                                        : '14px 14px 14px 4px',
                                                    background: bubbleBg,
                                                    border: bubbleBorder,
                                                    color: isSalesRep ? '#FFFFFF' : 'var(--text-primary, #F5F6FA)',
                                                    fontSize: '13px',
                                                    lineHeight: 1.55,
                                                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.18)',
                                                    whiteSpace: 'pre-wrap',
                                                }}
                                            >
                                                {/* Header Row inside Bubble */}
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'space-between',
                                                        gap: '12px',
                                                        marginBottom: '5px',
                                                        fontSize: '11px',
                                                        fontWeight: 600,
                                                        color: isSalesRep
                                                            ? 'rgba(255, 255, 255, 0.9)'
                                                            : isAIAssistant
                                                                ? '#A78BFA'
                                                                : '#E6B84D',
                                                    }}
                                                >
                                                    <span style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '5px',
                                                        color: isSalesRep
                                                            ? '#FFFFFF'
                                                            : isAIAssistant
                                                                ? '#A78BFA'
                                                                : '#E6B84D'
                                                    }}>
                                                        {isSalesRep && (
                                                            <>
                                                                <User size={11} />
                                                                <span>You (Sales Rep)</span>
                                                            </>
                                                        )}
                                                        {isAIAssistant && (
                                                            <>
                                                                <Sparkles size={11} style={{ color: '#E6B84D' }} />
                                                                <span>AI Assistant</span>
                                                            </>
                                                        )}
                                                        {isCustomer && (
                                                            <span>{customerName}</span>
                                                        )}
                                                    </span>

                                                    {message.createdAt && (
                                                        <span style={{
                                                            fontSize: '10px',
                                                            fontWeight: 500,
                                                            color: isSalesRep
                                                                ? 'rgba(255, 255, 255, 0.7)'
                                                                : 'var(--text-secondary, #A9ADB8)'
                                                        }}>
                                                            {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    )}
                                                </div>

                                                <div>{message.content}</div>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary, #A9ADB8)' }}>
                                    No messages yet. Send a message below to reply as Sales Rep.
                                </div>
                            )}
                        </div>

                        {/* Message Input */}
                        <div style={{
                            borderTop: '1px solid var(--border, #34363E)',
                            padding: '12px 24px',
                            background: 'var(--bg-surface, #1E2025)'
                        }}>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                                <textarea
                                    ref={messageInputRef}
                                    placeholder={`Reply to ${selectedConversation.customer?.name || 'customer'} as Sales Rep...`}
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyDown={handleSendKeyDown}
                                    rows={1}
                                    style={{
                                        flex: 1, padding: '10px 14px', borderRadius: '10px',
                                        border: '1px solid var(--border, #34363E)',
                                        background: 'var(--bg-page, #111214)',
                                        color: 'var(--text-primary, #F5F6FA)',
                                        fontSize: '13px', fontFamily: 'inherit',
                                        resize: 'none', outline: 'none', boxSizing: 'border-box',
                                        lineHeight: 1.4, maxHeight: '80px'
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={handleSendMessage}
                                    disabled={sendingMessage}
                                    style={{
                                        padding: '10px 20px', borderRadius: '10px', border: 'none',
                                        background: sendingMessage ? 'rgba(128, 91, 231, 0.5)' : 'var(--brand-gradient, #805BE7)',
                                        color: '#fff', fontSize: '13px', fontWeight: 600,
                                        cursor: sendingMessage ? 'not-allowed' : 'pointer',
                                        display: 'flex', alignItems: 'center', gap: '6px',
                                        whiteSpace: 'nowrap', height: '42px'
                                    }}
                                >
                                    {sendingMessage ? (
                                        <Loader2 className="spin" size={16} />
                                    ) : (
                                        <>
                                            <Send size={14} /> Send
                                        </>
                                    )}
                                </button>
                            </div>
                            <div style={{ marginTop: '6px', fontSize: '10px', color: 'var(--text-secondary, #A9ADB8)', textAlign: 'center' }}>
                                Outbound replies from AI Assistant and You (Sales Rep) appear on the right · Customer messages appear on the left
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes lf-spin { to { transform: rotate(360deg); } }
                .spin { animation: lf-spin 1s linear infinite; }
                .flex-row-reverse { flex-direction: row-reverse; }
                .flex-row { flex-direction: row; }
            `}</style>
        </div>
    );
}

export default ConversationsPage;
