import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import leadflowService from '../services/leadflowService';
import { Bot, Search, Loader2, Sparkles, Copy, Lightbulb, Target, TrendingUp, AlertTriangle, MessageSquare, ChevronLeft, ChevronRight, History } from 'lucide-react';

const SUGGESTED_PROMPTS = [
    "How do I close the deal with Yasmine who has a 91 lead score?",
    "What's my next best action for the Hossam discount opportunity?",
    "Give me a talk track for handling price objections",
    "Which leads should I prioritize this week?",
    "How can I increase my close rate on qualified leads?",
    "What questions should I ask on my next discovery call?"
];

const QUICK_ACTIONS = [
    { id: 'prioritize', label: 'Prioritize Leads', icon: Target, desc: 'Rank my leads by urgency' },
    { id: 'next-action', label: 'Next Best Action', icon: Lightbulb, desc: 'What to do for each deal' },
    { id: 'talk-track', label: 'Objection Handling', icon: MessageSquare, desc: 'Scripts for common objections' },
    { id: 'forecast', label: 'Pipeline Forecast', icon: TrendingUp, desc: 'Revenue prediction this quarter' },
    { id: 'coaching', label: 'Deal Coaching', icon: Sparkles, desc: 'Specific deal strategy' },
    { id: 'risk', label: 'Risk Assessment', icon: AlertTriangle, desc: 'Identify deals at risk' }
];

function CopilotsPage() {
    const { t } = useTranslation();
    const [messages, setMessages] = useState([
        {
            id: 'welcome',
            sender: 'ai',
            content: `Welcome to **Sales Co-Pilots**! 🤖 I'm your AI sales coach powered by MicroMind Core.

I can help you with:
• **Deal coaching** — "How do I close the Hossam opportunity?"
• **Lead prioritization** — "Which leads need attention this week?"
• **Talk tracks** — "Give me a script for price objections"
• **Pipeline forecasting** — "What's my forecast for Q4?"
• **Risk assessment** — "Which deals are at risk?"

**Quick actions below** or ask me anything about your deals, leads, or sales strategy.`,
            timestamp: new Date().toISOString()
        }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [history, setHistory] = useState([]);
    const [activeQuickAction, setActiveQuickAction] = useState(null);

    useEffect(() => {
        // Load chat history from localStorage
        const saved = localStorage.getItem('copilot_history');
        if (saved) {
            try {
                setHistory(JSON.parse(saved));
            } catch (e) {}
        }
    }, []);

    const handleSend = async (customInput) => {
        const question = customInput || input;
        if (!question.trim()) return;

        const userMessage = {
            id: Date.now().toString(),
            sender: 'user',
            content: question,
            timestamp: new Date().toISOString()
        };

        setMessages(prev => [...prev, userMessage]);
        if (!customInput) setInput('');
        setLoading(true);

        try {
            const result = await leadflowService.askCopilot(question, {
                activeQuickAction,
                recentMessages: messages.slice(-5)
            });

            const aiMessage = {
                id: (Date.now() + 1).toString(),
                sender: 'ai',
                content: result.text,
                timestamp: new Date().toISOString(),
                source: result.source
            };

            setMessages(prev => [...prev, aiMessage]);
            saveToHistory(question, result.text);
            setActiveQuickAction(null);
        } catch (error) {
            console.error('Copilot error:', error);
            const errorMessage = {
                id: (Date.now() + 1).toString(),
                sender: 'ai',
                content: `I'm having trouble connecting right now. Please try again in a moment.`,
                timestamp: new Date().toISOString()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setLoading(false);
        }
    };

    const saveToHistory = (question, answer) => {
        const entry = { id: Date.now().toString(), question, answer, timestamp: new Date().toISOString() };
        const newHistory = [entry, ...history.slice(0, 49)];
        setHistory(newHistory);
        localStorage.setItem('copilot_history', JSON.stringify(newHistory));
    };

    const handleQuickAction = (actionId) => {
        const action = QUICK_ACTIONS.find(a => a.id === actionId);
        if (!action) return;

        setActiveQuickAction(actionId);
        const prompts = {
            prioritize: "Rank all my current leads by urgency and potential revenue. Give me a prioritized list with reasons.",
            'next-action': "For each of my open deals, what's the single next best action I should take this week?",
            'talk-track': "Give me proven talk tracks for the top 3 objections I face: price, timing, and 'need to think about it'.",
            forecast: "Based on my current pipeline, what's my revenue forecast for this quarter? Show best case, likely, and worst case.",
            coaching: "I need coaching on my highest-value deal. Ask me 3 diagnostic questions to give me a tailored strategy.",
            risk: "Analyze my pipeline and identify which deals are at risk of stalling or losing. Give me specific warning signs."
        };
        handleSend(prompts[actionId]);
    };

    const loadHistoryItem = (item) => {
        setShowHistory(false);
        handleSend(`Follow-up on: ${item.question}`);
    };

    return (
        <div style={{ display: 'flex', height: 'calc(100vh - 48px)', gap: 0 }}>
            {/* Left Panel - Quick Actions & History */}
            <div style={{
                width: '320px', minWidth: '320px',
                borderRight: '1px solid var(--border-subtle, #2a2a2a)',
                display: 'flex', flexDirection: 'column',
                background: 'var(--bg-surface, #1E2025)'
            }}>
                {/* Header */}
                <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--border-subtle, #2a2a2a)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                        <div style={{
                            width: '32px', height: '32px', borderRadius: '8px',
                            background: 'linear-gradient(135deg, #9B7DF0, #805BE7)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <Bot size={16} color="#fff" />
                        </div>
                        <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: 'var(--text-primary, #F5F6FA)' }}>
                            Sales Co-Pilots
                        </h2>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted, #888)', lineHeight: 1.5 }}>
                        Your AI sales coach for deal strategy, lead prioritization, and revenue forecasting.
                    </div>
                </div>

                {/* Quick Actions */}
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle, #2a2a2a)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary, #F5F6FA)' }}>
                            Quick Actions
                        </span>
                        <button
                            onClick={() => setShowHistory(!showHistory)}
                            style={{
                                padding: '4px 10px', borderRadius: '6px', border: 'none',
                                background: showHistory ? 'rgba(128, 91, 231,0.12)' : 'transparent',
                                color: showHistory ? '#9B7DF0' : 'var(--text-muted, #888)',
                                fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: '4px'
                            }}
                        >
                            <History size={12} /> {showHistory ? 'Hide' : 'History'}
                        </button>
                    </div>
                    {!showHistory ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                            {QUICK_ACTIONS.map(action => {
                                const Icon = action.icon;
                                const isActive = activeQuickAction === action.id;
                                return (
                                    <button
                                        key={action.id}
                                        onClick={() => handleQuickAction(action.id)}
                                        style={{
                                            padding: '12px', borderRadius: '10px', border: '1px solid',
                                            borderColor: isActive ? '#9B7DF0' : 'var(--border-subtle, #333)',
                                            background: isActive ? 'rgba(128, 91, 231,0.1)' : 'rgba(255,255,255,0.03)',
                                            color: isActive ? '#C084FC' : 'var(--text-primary, #F5F6FA)',
                                            cursor: 'pointer', textAlign: 'left',
                                            display: 'flex', flexDirection: 'column', gap: '4px',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Icon size={16} style={{ color: isActive ? '#C084FC' : 'var(--text-muted, #888)' }} />
                                            <span style={{ fontSize: '12px', fontWeight: 600 }}>{action.label}</span>
                                        </div>
                                        <span style={{ fontSize: '10px', color: 'var(--text-muted, #666)' }}>{action.desc}</span>
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                            {history.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted, #666)' }}>
                                    <History size={32} style={{ marginBottom: '10px', opacity: 0.3 }} />
                                    <div style={{ fontSize: '13px' }}>No chat history yet</div>
                                    <div style={{ fontSize: '11px', marginTop: '4px' }}>Your conversations will appear here</div>
                                </div>
                            ) : (
                                history.map(item => (
                                    <button
                                        key={item.id}
                                        onClick={() => loadHistoryItem(item)}
                                        style={{
                                            width: '100%', padding: '12px', border: 'none',
                                            borderBottom: '1px solid var(--border-subtle, #222)',
                                            background: 'transparent', cursor: 'pointer', textAlign: 'left',
                                            display: 'flex', flexDirection: 'column', gap: '4px',
                                            transition: 'background 0.15s'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-primary, #F5F6FA)' }}>
                                            {item.question.substring(0, 60)}{item.question.length > 60 ? '...' : ''}
                                        </span>
                                        <span style={{ fontSize: '10px', color: 'var(--text-muted, #666)' }}>
                                            {new Date(item.timestamp).toLocaleDateString()} · {item.question.length} chars
                                        </span>
                                    </button>
                                ))
                            )}
                        </div>
                    )}
                </div>

                {/* Suggested Prompts */}
                <div style={{ padding: '16px 20px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary, #F5F6FA)' }}>
                        Suggested Questions
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                        {SUGGESTED_PROMPTS.map((prompt, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleSend(prompt)}
                                style={{
                                    padding: '10px 12px', borderRadius: '8px',
                                    border: '1px solid var(--border-subtle, #333)',
                                    background: 'rgba(255,255,255,0.03)', color: 'var(--text-secondary, #BBB)',
                                    cursor: 'pointer', textAlign: 'left', fontSize: '11px',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'rgba(128, 91, 231,0.08)';
                                    e.currentTarget.style.borderColor = '#805BE7';
                                    e.currentTarget.style.color = '#fff';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                                    e.currentTarget.style.borderColor = 'var(--border-subtle, #333)';
                                    e.currentTarget.style.color = 'var(--text-secondary, #BBB)';
                                }}
                            >
                                {prompt}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Panel - Chat Interface */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-page, #111214)' }}>
                {/* Chat Header */}
                <div style={{
                    padding: '16px 24px', borderBottom: '1px solid var(--border-subtle, #2a2a2a)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: 'var(--bg-surface, #1E2025)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            width: '36px', height: '36px', borderRadius: '10px',
                            background: 'linear-gradient(135deg, #9B7DF0, #805BE7)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <Bot size={18} color="#fff" />
                        </div>
                        <div>
                            <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary, #F5F6FA)' }}>
                                Sales Co-Pilot
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted, #888)' }}>
                                Powered by MicroMind Core · Context-aware coaching
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <span style={{
                            fontSize: '10px', padding: '4px 8px', borderRadius: '6px',
                            background: 'rgba(52,211,153,0.12)', color: '#34D399', fontWeight: 600
                        }}>
                            AI Connected
                        </span>
                    </div>
                </div>

                {/* Messages */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '24px', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
                    {messages.map((msg, idx) => (
                        <div key={msg.id} style={{
                            display: 'flex', justifyContent: msg.sender === 'ai' ? 'flex-start' : 'flex-end',
                            marginBottom: '20px', animation: 'fadeIn 0.3s ease'
                        }}>
                            <div style={{
                                maxWidth: '85%', padding: '16px 20px', borderRadius: '16px',
                                background: msg.sender === 'ai'
                                    ? 'var(--bg-surface, #1E2025)'
                                    : 'var(--brand-gradient)',
                                border: msg.sender === 'ai' ? '1px solid var(--border-subtle, #2a2a2a)' : 'none',
                                color: msg.sender === 'ai' ? 'var(--text-primary, #F5F6FA)' : '#fff',
                                fontSize: '14px', lineHeight: 1.6,
                                boxShadow: msg.sender === 'user' ? '0 4px 20px rgba(128, 91, 231,0.3)' : 'none'
                            }}>
                                {msg.sender === 'ai' && (
                                    <div style={{
                                        display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px',
                                        paddingBottom: '8px', borderBottom: '1px solid var(--border-subtle, #2a2a2a)'
                                    }}>
                                        <Bot size={14} color="#9B7DF0" />
                                        <span style={{ fontSize: '11px', fontWeight: 600, color: '#9B7DF0' }}>
                                            Sales Co-Pilot
                                        </span>
                                        {msg.source && msg.source !== 'fallback' && (
                                            <span style={{
                                                fontSize: '9px', padding: '1px 6px', borderRadius: '4px',
                                                background: 'rgba(128, 91, 231,0.15)', color: '#C084FC', fontWeight: 600
                                            }}>
                                                {msg.source === 'sales-copilot' ? 'MicroMind' : msg.source}
                                            </span>
                                        )}
                                    </div>
                                )}
                                <div dangerouslySetInnerHTML={{ __html: msg.content.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                            </div>
                        </div>
                    ))}
                    {loading && (
                        <div style={{
                            display: 'flex', justifyContent: 'flex-start', marginBottom: '20px', opacity: 0.6
                        }}>
                            <div style={{
                                maxWidth: '85%', padding: '16px 20px', borderRadius: '16px',
                                background: 'var(--bg-surface, #1E2025)',
                                border: '1px solid var(--border-subtle, #2a2a2a)',
                                color: 'var(--text-primary, #F5F6FA)', fontSize: '14px'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                                    <Bot size={14} color="#9B7DF0" />
                                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#9B7DF0' }}>Sales Co-Pilot</span>
                                </div>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                    <Loader2 className="spin" size={16} color="#805BE7" />
                                    <span style={{ color: 'var(--text-muted, #888)' }}>Thinking...</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div style={{
                    padding: '16px 24px', borderTop: '1px solid var(--border-subtle, #2a2a2a)',
                    background: 'var(--bg-surface, #1E2025)'
                }}>
                    <div style={{ display: 'flex', gap: '10px', maxWidth: '800px', margin: '0 auto' }}>
                        <div style={{ flex: 1, position: 'relative' }}>
                            <form onSubmit={(e) => { e.preventDefault(); handleSend(); }}>
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Ask about deals, leads, strategy, objections..."
                                    disabled={loading}
                                    style={{
                                        width: '100%', padding: '12px 16px', borderRadius: '12px',
                                        border: '1px solid var(--border-subtle, #333)',
                                        background: 'var(--bg-input, #262626)', color: 'var(--text-primary, #F5F6FA)',
                                        fontSize: '14px', outline: 'none', boxSizing: 'border-box'
                                    }}
                                />
                            </form>
                        </div>
                        <button
                            type="submit"
                            onClick={() => handleSend()}
                            disabled={loading || !input.trim()}
                            style={{
                                padding: '12px 24px', borderRadius: '12px', border: 'none',
                                background: loading || !input.trim()
                                    ? 'rgba(128, 91, 231,0.4)'
                                    : 'var(--brand-gradient)',
                                color: '#fff', fontSize: '14px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                minWidth: '100px', transition: 'opacity 0.2s'
                            }}
                        >
                            {loading ? <Loader2 className="spin" size={18} /> : <Sparkles size={18} />}
                            <span style={{ display: 'none' }}>Send</span>
                        </button>
                    </div>
                </div>

                <style>{`
                    @keyframes fadeIn {
                        from { opacity: 0; transform: translateY(10px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    @keyframes lf-spin { to { transform: rotate(360deg); } }
                    .spin { animation: lf-spin 1s linear infinite; }
                `}</style>
            </div>
        </div>
    );
}

export default CopilotsPage;