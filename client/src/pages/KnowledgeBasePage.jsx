import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import leadflowService from '../services/leadflowService';
import { BookOpen, Search, Plus, Loader2, X, Tag, FileText, Edit3, Trash2, ChevronDown } from 'lucide-react';

const CATEGORY_COLORS = {
    PRODUCT: { bg: 'rgba(128, 91, 231,0.12)', text: '#9B7DF0' },
    FAQ: { bg: 'rgba(52,211,153,0.12)', text: '#34D399' },
    POLICY: { bg: 'rgba(251,191,36,0.12)', text: '#FBBF24' },
    PROCESS: { bg: 'rgba(128, 91, 231,0.12)', text: '#A78BFA' },
    TROUBLESHOOTING: { bg: 'rgba(239,68,68,0.12)', text: '#EF4444' },
};

function KnowledgeBasePage() {
    const { t } = useTranslation();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('ALL');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState({ title: '', content: '', category: 'FAQ', tags: [] });
    const [tagInput, setTagInput] = useState('');
    const [saving, setSaving] = useState(false);

    const fetchItems = async () => {
        try {
            setLoading(true);
            const params = {};
            if (searchQuery) params.search = searchQuery;
            if (categoryFilter !== 'ALL') params.category = categoryFilter;
            const data = await leadflowService.getKnowledge(params);
            setItems(data || []);
        } catch (error) {
            console.error('Error fetching knowledge base:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchItems();
    }, [categoryFilter]);

    const handleSearch = (e) => {
        e.preventDefault();
        fetchItems();
    };

    const openCreate = () => {
        setEditingItem(null);
        setFormData({ title: '', content: '', category: 'FAQ', tags: [] });
        setShowCreateModal(true);
    };

    const openEdit = (item) => {
        setEditingItem(item);
        setFormData({ title: item.title, content: item.content, category: item.category, tags: item.tags || [] });
        setShowCreateModal(true);
    };

    const handleSave = async () => {
        if (!formData.title.trim() || !formData.content.trim()) return;
        setSaving(true);
        try {
            if (editingItem) {
                await leadflowService.updateKnowledge(editingItem.id, formData);
            } else {
                await leadflowService.createKnowledge(formData);
            }
            setShowCreateModal(false);
            fetchItems();
        } catch (error) {
            console.error('Error saving knowledge item:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this knowledge item?')) return;
        try {
            await leadflowService.deleteKnowledge(id);
            fetchItems();
        } catch (error) {
            console.error('Error deleting:', error);
        }
    };

    const addTag = () => {
        if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
            setFormData(prev => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }));
            setTagInput('');
        }
    };

    const removeTag = (tag) => {
        setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
    };

    const categories = ['ALL', ...Object.keys(CATEGORY_COLORS)];

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
                            <BookOpen size={16} color="#fff" />
                        </div>
                        <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: 'var(--text-primary, #F5F6FA)' }}>
                            Knowledge Base
                        </h1>
                    </div>
                    <p style={{ margin: '6px 0 0 0', fontSize: '13px', color: 'var(--text-muted, #888)' }}>
                        Manage FAQs, policies, and reference materials
                    </p>
                </div>
                <button
                    onClick={openCreate}
                    style={{
                        padding: '10px 20px', borderRadius: '10px', border: 'none',
                        background: 'var(--brand-gradient)',
                        color: '#fff', fontSize: '13px', fontWeight: 600,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                        transition: 'all 0.2s'
                    }}
                >
                    <Plus size={16} /> Add Article
                </button>
            </div>

            {/* Search + Filters */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', alignItems: 'center' }}>
                <form onSubmit={handleSearch} style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
                    <Search size={16} style={{
                        position: 'absolute', left: '14px', top: '50%',
                        transform: 'translateY(-50%)', color: 'var(--text-muted, #666)'
                    }} />
                    <input
                        type="text"
                        placeholder="Search knowledge base..."
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
                </form>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setCategoryFilter(cat)}
                            style={{
                                padding: '6px 14px', borderRadius: '14px', border: 'none',
                                fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                                background: categoryFilter === cat
                                    ? 'var(--brand-gradient)'
                                    : 'rgba(255,255,255,0.06)',
                                color: categoryFilter === cat ? '#fff' : 'var(--text-muted, #888)',
                                transition: 'all 0.2s'
                            }}
                        >
                            {cat === 'ALL' ? 'All' : cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Items Grid */}
            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
                    <Loader2 className="spin" size={28} style={{ color: '#805BE7' }} />
                </div>
            ) : items.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-muted, #555)' }}>
                    <FileText size={56} style={{ marginBottom: '16px', opacity: 0.2 }} />
                    <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary, #F5F6FA)', marginBottom: '6px' }}>
                        No articles yet
                    </div>
                    <div style={{ fontSize: '13px', marginBottom: '20px' }}>
                        Create your first knowledge base article
                    </div>
                    <button onClick={openCreate} style={{
                        padding: '10px 24px', borderRadius: '10px', border: 'none',
                        background: 'var(--brand-gradient)',
                        color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer'
                    }}>
                        <Plus size={16} style={{ display: 'inline', marginRight: '6px' }} /> Create Article
                    </button>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                    {items.map(item => (
                        <div key={item.id} style={{
                            padding: '20px', borderRadius: '12px',
                            background: 'var(--bg-surface, #1E2025)',
                            border: '1px solid var(--border-subtle, #2a2a2a)',
                            transition: 'all 0.2s'
                        }}
                            onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(128, 91, 231,0.3)'}
                            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-subtle, #2a2a2a)'}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                <span style={{
                                    padding: '3px 10px', borderRadius: '8px', fontSize: '10px',
                                    fontWeight: 600, display: 'inline-block',
                                    background: CATEGORY_COLORS[item.category]?.bg || 'rgba(107,114,128,0.12)',
                                    color: CATEGORY_COLORS[item.category]?.text || '#9CA3AF'
                                }}>
                                    {item.category || 'General'}
                                </span>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                    <button onClick={() => openEdit(item)} style={{
                                        padding: '4px', borderRadius: '6px', border: 'none',
                                        background: 'transparent', color: 'var(--text-muted, #666)',
                                        cursor: 'pointer'
                                    }}>
                                        <Edit3 size={14} />
                                    </button>
                                    <button onClick={() => handleDelete(item.id)} style={{
                                        padding: '4px', borderRadius: '6px', border: 'none',
                                        background: 'transparent', color: 'var(--text-muted, #666)',
                                        cursor: 'pointer'
                                    }}>
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                            <h3 style={{ margin: '0 0 8px 0', fontSize: '15px', fontWeight: 600, color: 'var(--text-primary, #F5F6FA)' }}>
                                {item.title}
                            </h3>
                            <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: 'var(--text-muted, #888)', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                                {item.content}
                            </p>
                            {item.tags && item.tags.length > 0 && (
                                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                    {item.tags.map((tag, i) => (
                                        <span key={i} style={{
                                            padding: '2px 8px', borderRadius: '6px',
                                            background: 'rgba(255,255,255,0.04)',
                                            color: 'var(--text-muted, #888)', fontSize: '10px'
                                        }}>
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Create/Edit Modal */}
            {showCreateModal && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)'
                }} onClick={() => setShowCreateModal(false)}>
                    <div style={{
                        width: '560px', maxHeight: '80vh', overflowY: 'auto',
                        padding: '28px', borderRadius: '16px',
                        background: 'var(--bg-surface, #1E2025)',
                        border: '1px solid var(--border-subtle, #333)'
                    }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: 'var(--text-primary, #F5F6FA)' }}>
                                {editingItem ? 'Edit Article' : 'New Article'}
                            </h3>
                            <button onClick={() => setShowCreateModal(false)} style={{ padding: '4px', borderRadius: '6px', border: 'none', background: 'transparent', color: 'var(--text-muted, #888)', cursor: 'pointer' }}>
                                <X size={18} />
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted, #888)', marginBottom: '6px' }}>Title</label>
                                <input type="text" value={formData.title}
                                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                    placeholder="Article title"
                                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-subtle, #333)', background: 'var(--bg-input, #262626)', color: 'var(--text-primary, #F5F6FA)', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted, #888)', marginBottom: '6px' }}>Category</label>
                                <select value={formData.category}
                                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-subtle, #333)', background: 'var(--bg-input, #262626)', color: 'var(--text-primary, #F5F6FA)', fontSize: '13px', outline: 'none' }}>
                                    {Object.keys(CATEGORY_COLORS).map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted, #888)', marginBottom: '6px' }}>Content</label>
                                <textarea value={formData.content}
                                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                                    placeholder="Write your article content here..."
                                    rows={6}
                                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-subtle, #333)', background: 'var(--bg-input, #262626)', color: 'var(--text-primary, #F5F6FA)', fontSize: '13px', outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit', lineHeight: 1.5 }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted, #888)', marginBottom: '6px' }}>Tags</label>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <input type="text" value={tagInput}
                                        onChange={(e) => setTagInput(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                                        placeholder="Add a tag and press Enter"
                                        style={{ flex: 1, padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-subtle, #333)', background: 'var(--bg-input, #262626)', color: 'var(--text-primary, #F5F6FA)', fontSize: '13px', outline: 'none' }} />
                                    <button onClick={addTag} style={{ padding: '10px 16px', borderRadius: '8px', border: 'none', background: 'rgba(128, 91, 231,0.15)', color: '#9B7DF0', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>Add</button>
                                </div>
                                {formData.tags.length > 0 && (
                                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
                                        {formData.tags.map((tag, i) => (
                                            <span key={i} style={{
                                                display: 'flex', alignItems: 'center', gap: '4px',
                                                padding: '3px 8px', borderRadius: '6px',
                                                background: 'rgba(128, 91, 231,0.1)',
                                                color: '#9B7DF0', fontSize: '11px'
                                            }}>
                                                #{tag}
                                                <button onClick={() => removeTag(tag)} style={{ padding: 0, border: 'none', background: 'transparent', color: '#9B7DF0', cursor: 'pointer', fontSize: '12px', lineHeight: 1 }}>×</button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <button onClick={handleSave} disabled={!formData.title.trim() || !formData.content.trim() || saving}
                                style={{
                                    padding: '12px', borderRadius: '10px', border: 'none',
                                    background: !formData.title.trim() || !formData.content.trim()
                                        ? 'rgba(128, 91, 231,0.3)' : 'var(--brand-gradient)',
                                    color: '#fff', fontSize: '14px', fontWeight: 600,
                                    cursor: !formData.title.trim() || !formData.content.trim() ? 'not-allowed' : 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                    marginTop: '8px'
                                }}>
                                {saving ? <><Loader2 className="spin" size={16} /> Saving...</> : editingItem ? 'Update Article' : 'Create Article'}
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

export default KnowledgeBasePage;