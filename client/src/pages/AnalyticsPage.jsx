import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import leadflowService from '../services/leadflowService';
import { Brain, Send, Loader2, Lightbulb, MessageSquare, TrendingUp, Users, ShoppingBag, BarChart3 } from 'lucide-react';

const EXAMPLE_QUESTIONS = [
    { icon: TrendingUp, text: 'What was our revenue last month?' },
    { icon: Users, text: 'How many leads do we have?' },
    { icon: ShoppingBag, text: 'What are our top products?' },
    { icon: BarChart3, text: 'Show me our performance overview' },
];

function AnalyticsPage() {
    const { t } = useTranslation();
    const [question, setQuestion] = useState('');
    const [response, setResponse] = useState(null);
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState([]);
    const inputRef = useRef(null);

    const handleAsk = async (q) => {
        const query = q || question;
        if (!query.trim() || loading) return;

        setLoading(true);
        setQuestion('');

        const newEntry = { question: query, answer: null, timestamp: Date.now() };
        setHistory(prev => [...prev, newEntry]);

        try {
            const result = await leadflowService.askAnalytics(query);
            newEntry.answer = result;
            setResponse(result);
        } catch (error) {
            newEntry.answer = { success: false, text: 'Sorry, I encountered an error analyzing your data. Please try again.' };
            setResponse(newEntry.answer);
        } finally {
            setLoading(false);
            setHistory(prev => [...prev]);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleAsk();
        }
    };

    const renderChart = (chartData) => {
        if (!chartData) return null;
        const maxVal = Math.max(...chartData.values, 1);
        const chartHeight = 200;

        return (
            <div style={{ marginTop: '24px', padding: '20px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle, #2a2a2a)' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary, #F2F3EC)', marginBottom: '16px' }}>
                    {chartData.title || 'Chart'}
                </div>

                {chartData.type === 'pie' ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
                        {chartData.labels.map((label, i) => {
                            const colors = ['#6366F1', '#34D399', '#FBBF24', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'];
                            const total = chartData.values.reduce((s, v) => s + v, 0);
                            const pct = total > 0 ? Math.round((chartData.values[i] / total) * 100) : 0;
                            return (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: colors[i % colors.length] }} />
                                    <span style={{ fontSize: '12px', color: 'var(--text-muted, #888)' }}>{label}: <strong style={{ color: 'var(--text-primary, #F2F3EC)' }}>{pct}%</strong></span>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: `${chartHeight}px`, padding: '0 8px' }}>
                        {chartData.labels.map((label, i) => {
                            const h = (chartData.values[i] / maxVal) * (chartHeight - 30);
                            return (
                                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                                    <span style={{ fontSize: '10px', color: 'var(--text-muted, #888)', marginBottom: '4px' }}>
                                        {chartData.values[i].toLocaleString()}
                                    </span>
                                    <div style={{
                                        width: '100%', height: `${h}px`, borderRadius: '4px 4px 0 0',
                                        background: `linear-gradient(180deg, #6366F1, #8B5CF6)`,
                                        opacity: 0.7 + (i / chartData.labels.length) * 0.3,
                                        transition: 'height 0.5s ease',
                                        minHeight: '4px'
                                    }} />
                                    <span style={{ fontSize: '9px', color: 'var(--text-muted, #666)', marginTop: '6px', textAlign: 'center', maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div style={{ padding: '24px 32px', maxWidth: '900px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <div style={{
                    width: '32px', height: '32px', borderRadius: '8px',
                    background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <Brain size={16} color="#fff" />
                </div>
                <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: 'var(--text-primary, #F2F3EC)' }}>
                    AI Analytics
                </h1>
            </div>
            <p style={{ margin: '0 0 28px 0', fontSize: '13px', color: 'var(--text-muted, #888)' }}>
                Ask natural language questions about your business data
            </p>

            {/* Input Area */}
            <div style={{
                borderRadius: '16px', border: '2px solid var(--border-subtle, #333)',
                background: 'var(--bg-surface, #1C1C1C)', padding: '6px',
                transition: 'border-color 0.2s', marginBottom: '24px'
            }}
                onFocusCapture={(e) => e.currentTarget.style.borderColor = '#6366F1'}
                onBlurCapture={(e) => e.currentTarget.style.borderColor = 'var(--border-subtle, #333)'}
            >
                <textarea
                    ref={inputRef}
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask anything about your business... e.g., 'What was our revenue last month?'"
                    rows={2}
                    style={{
                        width: '100%', padding: '12px 16px', border: 'none',
                        background: 'transparent', color: 'var(--text-primary, #F2F3EC)',
                        fontSize: '14px', resize: 'none', outline: 'none',
                        fontFamily: 'inherit', lineHeight: 1.5, boxSizing: 'border-box'
                    }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 12px 4px 16px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted, #666)' }}>
                        Press Enter to ask
                    </div>
                    <button
                        onClick={() => handleAsk()}
                        disabled={!question.trim() || loading}
                        style={{
                            padding: '8px 20px', borderRadius: '10px', border: 'none',
                            background: !question.trim() || loading
                                ? 'rgba(99,102,241,0.3)' : 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                            color: '#fff', fontSize: '13px', fontWeight: 600,
                            cursor: !question.trim() || loading ? 'not-allowed' : 'pointer',
                            display: 'flex', alignItems: 'center', gap: '8px',
                            transition: 'all 0.2s'
                        }}
                    >
                        {loading ? (
                            <><Loader2 className="spin" size={16} /> Analyzing...</>
                        ) : (
                            <><Send size={16} /> Ask AI</>
                        )}
                    </button>
                </div>
            </div>

            {/* Example Questions */}
            <div style={{ marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                    <Lightbulb size={14} style={{ color: '#FBBF24' }} />
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted, #888)' }}>
                        Try asking:
                    </span>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {EXAMPLE_QUESTIONS.map((item, idx) => {
                        const Icon = item.icon;
                        return (
                            <button
                                key={idx}
                                onClick={() => { setQuestion(item.text); inputRef.current?.focus(); }}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                    padding: '8px 14px', borderRadius: '10px',
                                    border: '1px solid var(--border-subtle, #333)',
                                    background: 'var(--bg-surface, #1C1C1C)',
                                    color: 'var(--text-muted, #888)',
                                    fontSize: '12px', cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#6366F1'; e.currentTarget.style.color = 'var(--text-primary, #F2F3EC)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle, #333)'; e.currentTarget.style.color = 'var(--text-muted, #888)'; }}
                            >
                                <Icon size={14} />
                                {item.text}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Response */}
            {response && (
                <div style={{
                    borderRadius: '16px', padding: '24px',
                    background: 'var(--bg-surface, #1C1C1C)',
                    border: '1px solid var(--border-subtle, #2a2a2a)'
                }}>
                    {response.chartData && renderChart(response.chartData)}
                    <div style={{
                        fontSize: '14px', lineHeight: 1.7, color: 'var(--text-primary, #F2F3EC)',
                        whiteSpace: 'pre-wrap', marginTop: response.chartData ? '20px' : 0
                    }}>
                        {response.text || 'No response available.'}
                    </div>
                    {response.source && (
                        <div style={{ marginTop: '16px', fontSize: '11px', color: 'var(--text-muted, #666)' }}>
                            Source: {response.source === 'ai-analytics' ? 'AI Analytics Engine' : response.source}
                        </div>
                    )}
                </div>
            )}

            {/* History */}
            {history.length > 1 && (
                <div style={{ marginTop: '32px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary, #F2F3EC)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <MessageSquare size={16} />
                        Conversation History
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {history.slice(0, -1).reverse().map((entry, idx) => (
                            <div key={idx} style={{
                                padding: '12px 16px', borderRadius: '10px',
                                background: 'var(--bg-surface, #1C1C1C)',
                                border: '1px solid var(--border-subtle, #2a2a2a)',
                                fontSize: '13px'
                            }}>
                                <div style={{ color: '#818CF8', fontWeight: 600, marginBottom: '4px' }}>
                                    Q: {entry.question}
                                </div>
                                <div style={{ color: 'var(--text-muted, #888)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {entry.answer?.text?.substring(0, 120)}...
                                </div>
                            </div>
                        ))}
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

export default AnalyticsPage;