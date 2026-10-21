import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import leadflowService from '../services/leadflowService';
import { MessageSquare, Search, Filter, User, Clock, CheckCircle, AlertCircle, Loader2, Send, ChevronDown, Inbox, Archive, RefreshCw, Sparkles, Copy, ExternalLink } from 'lucide-react';

const STATUS_COLORS = {
    ACTIVE: { bg: 'rgba(99,102,241,0.12)', text: '#818CF8', label: 'Active' },
    PENDING: { bg: 'rgba(251,191,36,0.12)', text: '#FBBF24', label: 'Pending' },
    RESOLVED: { bg: 'rgba(52,211,153,0.12)', text: '#34D399', label: 'Resolved' },
    ARCHIVED: { bg: 'rgba(107,114,128,0.12)', text: '#9CA3AF', label: 'Archived' },
};

const STATUS_OPTIONS = ['ALL', 'ACTIVE', 'PENDING', 'RESOLVED', 'ARCHIVED'];

function ConversationsPage() {
    const { t } = useTranslation();
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ACTIVE');
    const [showStatusDropdown, setShowStatusDropdown] = useState(false);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messages, setMessages] = useState(null);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [sendingMessage, setSendingMessage] = useState(false);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef(null);
    const messageInputRef = useRef(null);

    const fetchConversations = async () => {
        try {
            setLoading(true);
            const params = { limit: 50 };
            if (statusFilter !== 'ALL') params.status = statusFilter;
            if (searchQuery) params.search = searchQuery;
            const data = await leadflowService.getConversations(params);
            setConversations(data.items || []);
        } catch (error) {
            console.error('Error fetching conversations:', error);
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
        try {
            const data = await leadflowService.getConversation(conv.id);
            setMessages(data);
        } catch (error) {
            console.error('Error fetching conversation:', error);
        } finally {
            setLoadingMessages(false);
        }
    };

    const handleStatusChange = async (id, newStatus) => {
        try {
            await leadflowService.updateConversationStatus(id, newStatus);
            fetchConversations();
            if (selectedConversation?.id === id) {
                setSelectedConversation(prev => ({ ...prev, status: newStatus }));
            }
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const handleSendMessage = async () => {
        if (!selectedConversation || !newMessage.trim()) return;
        const messageText = newMessage.trim();
        setNewMessage('');
        setSendingMessage(true);
        try {
            const result = await leadflowService.sendMessage(selectedConversation.id, messageText);
            // Refresh messages to show the new exchange
            const data = await leadflowService.getConversation(selectedConversation.id);
            setMessages(data);
            // Refresh conversation list too (lastMessageAt changed)
            fetchConversations();
        } catch (error) {
            console.error('Error sending message:', error);
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
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        const days = Math.floor(hrs / 24);
        return `${days}d ago`;
    };

    return (
        <div style={{ display: 'flex', height: 'calc(100vh - 48px)', gap: 0 }}>
            {/* Conversation List */}
            <div style={{
                width: '380px', minWidth: '380px',
                borderRight: '1px solid var(--border-subtle, #2a2a2a)',
                display: 'flex', flexDirection: 'column',
                background: 'var(--bg-surface, #1C1C1C)'
            }}>
                {/* Header */}
                <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--border-subtle, #2a2a2a)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                        <div style={{
                            width: '32px', height: '32px', borderRadius: '8px',
                            background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <MessageSquare size={16} color="#fff" />
                        </div>
                        <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: 'var(--text-primary, #F2F3EC)' }}>
                            Conversations
                        </h2>
                        <span style={{
                            marginLeft: 'auto', fontSize: '12px', padding: '2px 8px',
                            borderRadius: '10px', background: 'rgba(99,102,241,0.12)',
                            color: '#818CF8', fontWeight: 600
                        }}>
                            {conversations.length}
                        </span>
                    </div>

                    {/* Search */}
                    <form onSubmit={handleSearch} style={{ position: 'relative', marginBottom: '12px' }}>
                        <Search size={16} style={{
                            position: 'absolute', left: '12px', top: '50%',
                            transform: 'translateY(-50%)', color: 'var(--text-muted, #666)'
                        }} />
                        <input
                            type="text"
                            placeholder="Search conversations..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                width: '100%', padding: '9px 12px 9px 36px',
                                borderRadius: '8px', border: '1px solid var(--border-subtle, #333)',
                                background: 'var(--bg-input, #262626)',
                                color: 'var(--text-primary, #F2F3EC)', fontSize: '13px',
                                outline: 'none', boxSizing: 'border-box'
                            }}
                        />
                    </form>

                    {/* Status Filter */}
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {STATUS_OPTIONS.map(status => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                style={{
                                    padding: '5px 12px', borderRadius: '14px', border: 'none',
                                    fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                                    background: statusFilter === status
                                        ? 'linear-gradient(135deg, #6366F1, #8B5CF6)'
                                        : 'rgba(255,255,255,0.06)',
                                    color: statusFilter === status ? '#fff' : 'var(--text-muted, #888)',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {status === 'ALL' ? 'All' : STATUS_COLORS[status]?.label || status}
                            </button>
                        ))}
                    </div>
                </div>

                {/* List */}
                <div style={{ flex: 1, overflowY: 'auto' }}>
                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                            <Loader2 className="spin" size={24} style={{ color: '#6366F1' }} />
                        </div>
                    ) : conversations.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted, #666)' }}>
                            <Inbox size={40} style={{ marginBottom: '12px', opacity: 0.3 }} />
                            <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary, #F2F3EC)' }}>
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
                                onClick={() => openConversation(conv)}
                                style={{
                                    width: '100%', padding: '14px 20px', border: 'none',
                                    borderBottom: '1px solid var(--border-subtle, #222)',
                                    background: selectedConversation?.id === conv.id
                                        ? 'rgba(99,102,241,0.08)'
                                        : 'transparent',
                                    cursor: 'pointer', textAlign: 'left',
                                    transition: 'background 0.15s',
                                    display: 'flex', gap: '12px', alignItems: 'flex-start'
                                }}
                                onMouseEnter={(e) => { if (selectedConversation?.id !== conv.id) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                                onMouseLeave={(e) => { if (selectedConversation?.id !== conv.id) e.currentTarget.style.background = 'transparent'; }}
                            >
                                {/* Avatar */}
                                <div style={{
                                    width: '40px', height: '40px', borderRadius: '10px', minWidth: '40px',
                                    background: conv.customer?.avatarUrl
                                        ? `url(${conv.customer.avatarUrl}) center/cover`
                                        : 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: '#fff', fontWeight: 700, fontSize: '15px'
                                }}>
                                    {!conv.customer?.avatarUrl && (conv.customer?.name?.charAt(0) || '?')}
                                </div>

                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary, #F2F3EC)' }}>
                                            {conv.customer?.name || 'Unknown'}
                                        </span>
                                        <span style={{ fontSize: '11px', color: 'var(--text-muted, #666)' }}>
                                            {getTimeAgo(conv.lastMessageAt || conv.createdAt)}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted, #888)', marginBottom: '5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {conv._count?.messages || 0} messages
                                    </div>
                                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                        <span style={{
                                            fontSize: '10px', padding: '1px 6px', borderRadius: '8px',
                                            background: STATUS_COLORS[conv.status]?.bg || 'rgba(107,114,128,0.12)',
                                            color: STATUS_COLORS[conv.status]?.text || '#9CA3AF',
                                            fontWeight: 600
                                        }}>
                                            {STATUS_COLORS[conv.status]?.label || conv.status}
                                        </span>
                                        {conv.lead?.leadScore != null && (
                                            <span style={{
                                                fontSize: '10px', padding: '1px 6px', borderRadius: '8px',
                                                background: conv.lead.leadScore >= 80 ? 'rgba(52,211,153,0.12)' : 'rgba(251,191,36,0.12)',
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

            {/* Conversation Detail */}
            <div style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                background: 'var(--bg-page, #0F0F0F)',
                alignItems: 'center', justifyContent: selectedConversation ? 'flex-start' : 'center'
            }}>
                {!selectedConversation ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted, #555)' }}>
                        <MessageSquare size={56} style={{ marginBottom: '16px', opacity: 0.2 }} />
                        <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary, #F2F3EC)', marginBottom: '6px' }}>
                            Select a conversation
                        </div>
                        <div style={{ fontSize: '13px' }}>
                            Choose a conversation from the list to view messages
                        </div>
                    </div>
                ) : loadingMessages ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
                        <Loader2 className="spin" size={28} style={{ color: '#6366F1' }} />
                    </div>
                ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
                        {/* Detail Header */}
                        <div style={{
                            padding: '16px 24px', borderBottom: '1px solid var(--border-subtle, #2a2a2a)',
                            display: 'flex', alignItems: 'center', gap: '14px',
                            background: 'var(--bg-surface, #1C1C1C)'
                        }}>
                            <div style={{
                                width: '44px', height: '44px', borderRadius: '12px',
                                background: selectedConversation.customer?.avatarUrl
                                    ? `url(${selectedConversation.customer.avatarUrl}) center/cover`
                                    : 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: '#fff', fontWeight: 700, fontSize: '16px'
                            }}>
                                {!selectedConversation.customer?.avatarUrl && (selectedConversation.customer?.name?.charAt(0) || '?')}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary, #F2F3EC)' }}>
                                    {selectedConversation.customer?.name || 'Unknown'}
                                </div>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted, #888)' }}>
                                    {selectedConversation.channel || 'messenger'} · {selectedConversation._count?.messages || 0} messages
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '6px' }}>
                                {['ACTIVE', 'RESOLVED', 'ARCHIVED'].filter(s => s !== selectedConversation.status).map(s => (
                                    <button
                                        key={s}
                                        onClick={() => handleStatusChange(selectedConversation.id, s)}
                                        style={{
                                            padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border-subtle, #333)',
                                            background: 'transparent', color: STATUS_COLORS[s]?.text, fontSize: '11px',
                                            fontWeight: 600, cursor: 'pointer'
                                        }}
                                    >
                                        {STATUS_COLORS[s]?.label || s}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Messages */}
                        <div ref={messagesEndRef} style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
                            {messages?.messages?.length > 0 ? (
                                messages.messages.map((msg, idx) => (
                                    <div key={msg.id || idx} style={{
                                        display: 'flex', justifyContent: msg.sender === 'AI' || msg.sender === 'BOT' ? 'flex-start' : 'flex-end',
                                        marginBottom: '16px'
                                    }}>
                                        <div style={{
                                            maxWidth: '70%', padding: '12px 16px', borderRadius: '12px',
                                            background: msg.sender === 'AI' || msg.sender === 'BOT'
                                                ? 'var(--bg-surface, #1C1C1C)'
                                                : 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                                            border: msg.sender === 'AI' || msg.sender === 'BOT'
                                                ? '1px solid var(--border-subtle, #2a2a2a)' : 'none',
                                            color: msg.sender === 'AI' || msg.sender === 'BOT'
                                                ? 'var(--text-primary, #F2F3EC)' : '#fff',
                                            fontSize: '13px', lineHeight: 1.5
                                        }}>
                                            <div style={{ fontSize: '10px', color: msg.sender === 'AI' || msg.sender === 'BOT' ? 'var(--text-muted, #666)' : 'rgba(255,255,255,0.7)', marginBottom: '4px', fontWeight: 600 }}>
                                                {msg.sender === 'AI' ? 'AI Assistant' : msg.sender === 'BOT' ? 'Bot' : msg.sender === 'CUSTOMER' ? selectedConversation.customer?.name || 'Customer' : msg.sender === 'HUMAN' ? 'You' : 'Agent'}
                                            </div>
                                            {msg.content}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted, #555)' }}>
                                    No messages yet. Send a message below to start the conversation.
                                </div>
                            )}
                        </div>

                        {/* Message Input */}
                        <div style={{
                            borderTop: '1px solid var(--border-subtle, #2a2a2a)',
                            padding: '12px 24px',
                            background: 'var(--bg-surface, #1C1C1C)'
                        }}>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                                <textarea
                                    ref={messageInputRef}
                                    placeholder="Type your message..."
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyDown={handleSendKeyDown}
                                    rows={1}
                                    style={{
                                        flex: 1, padding: '10px 14px', borderRadius: '10px',
                                        border: '1px solid var(--border-subtle, #333)',
                                        background: 'var(--bg-input, #262626)',
                                        color: 'var(--text-primary, #F2F3EC)',
                                        fontSize: '13px', fontFamily: 'inherit',
                                        resize: 'none', outline: 'none', boxSizing: 'border-box',
                                        lineHeight: 1.4, maxHeight: '80px'
                                    }}
                                />
                                <button
                                    onClick={handleSendMessage}
                                    disabled={sendingMessage}
                                    style={{
                                        padding: '10px 20px', borderRadius: '10px', border: 'none',
                                        background: sendingMessage ? 'rgba(99,102,241,0.5)' : 'linear-gradient(135deg, #6366F1, #8B5CF6)',
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
                            <div style={{ marginTop: '6px', fontSize: '10px', color: 'var(--text-muted, #555)', textAlign: 'center' }}>
                                Messages are sent through the AI conversation engine
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Inline style for spinner */}
            <style>{`
                @keyframes lf-spin { to { transform: rotate(360deg); } }
                .spin { animation: lf-spin 1s linear infinite; }
            `}</style>
        </div>
    );
}

export default ConversationsPage;