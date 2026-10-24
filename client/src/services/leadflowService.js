import api from './api';
import { supabase } from '../supabaseClient';

const leadflowService = {
    // Dashboard
    getDashboard: async () => {
        try {
            return await api.get('/leadflow/dashboard').then(r => r.data);
        } catch (e) {
            // Fallback using direct Supabase queries
            const [convRes, oppRes, appRes] = await Promise.all([
                supabase.from('conversations').select('*', { count: 'exact', head: true }),
                supabase.from('revenue_opportunities').select('potentialRevenue, status'),
                supabase.from('approvals').select('*', { count: 'exact', head: true }).eq('status', 'PENDING')
            ]);
            const opportunities = oppRes.data || [];
            const potentialRevenue = opportunities.reduce((s, o) => s + (Number(o.potentialRevenue) || 0), 0);
            const wonCount = opportunities.filter(o => ['WON', 'CLOSED_WON'].includes((o.status || '').toUpperCase())).length;
            const winRate = opportunities.length ? Math.round((wonCount / opportunities.length) * 100) : 0;

            return {
                metrics: {
                    totalConversations: convRes.count ?? 0,
                    potentialRevenue,
                    winRate,
                    pendingApprovals: appRes.count ?? 0
                }
            };
        }
    },

    // Customers
    getCustomers: async (params) => {
        try {
            return await api.get('/leadflow/customers', { params }).then(r => r.data);
        } catch (e) {
            const { data } = await supabase.from('customers').select('*').order('name');
            return { items: data || [] };
        }
    },

    getCustomer: async (id) => {
        try {
            return await api.get(`/leadflow/customers/${id}`).then(r => r.data);
        } catch (e) {
            const { data } = await supabase.from('customers').select('*').eq('id', id).single();
            return data;
        }
    },

    // Conversations
    getConversations: async (params) => {
        try {
            return await api.get('/leadflow/conversations', { params }).then(r => r.data);
        } catch (e) {
            let query = supabase.from('conversations').select('*').order('lastMessageAt', { ascending: false });
            if (params?.status && params.status !== 'ALL') {
                query = query.eq('status', params.status);
            }
            const { data: convData } = await query;
            return { items: convData || [] };
        }
    },

    getConversation: async (id) => {
        try {
            return await api.get(`/leadflow/conversations/${id}`).then(r => r.data);
        } catch (e) {
            const { data: messages } = await supabase
                .from('messages')
                .select('*')
                .eq('conversationId', id)
                .order('createdAt', { ascending: true });
            return { messages: messages || [] };
        }
    },

    assignConversation: async (id, userId) => {
        try {
            return await api.put(`/leadflow/conversations/${id}/assign`, { userId }).then(r => r.data);
        } catch (e) {
            const { data } = await supabase.from('conversations').update({ assignedTo: userId }).eq('id', id);
            return data;
        }
    },

    updateConversationStatus: async (id, status) => {
        try {
            return await api.put(`/leadflow/conversations/${id}/status`, { status }).then(r => r.data);
        } catch (e) {
            const { data } = await supabase.from('conversations').update({ status }).eq('id', id);
            return data;
        }
    },

    generateReply: (conversationId, context) => api.post(`/leadflow/conversations/${conversationId}/generate-reply`, context).then(r => r.data),

    // Leads / Opportunities
    getLeads: async (params) => {
        try {
            return await api.get('/leadflow/leads', { params }).then(r => r.data);
        } catch (e) {
            const { data } = await supabase.from('leads').select('*').order('createdAt', { ascending: false });
            return { items: data || [] };
        }
    },

    getOpportunities: async (params) => {
        try {
            return await api.get('/leadflow/opportunities', { params }).then(r => r.data);
        } catch (e) {
            let query = supabase.from('revenue_opportunities').select('*').order('createdAt', { ascending: false });
            if (params?.status && params.status !== 'ALL') {
                query = query.eq('status', params.status);
            }
            const { data: opps } = await query;
            const totalRev = (opps || []).reduce((s, o) => s + (Number(o.potentialRevenue) || 0), 0);
            const openCount = (opps || []).filter(o => ['OPEN', 'IN_PROGRESS'].includes((o.status || '').toUpperCase())).length;
            return {
                items: opps || [],
                summary: { totalPotentialRevenue: totalRev, openCount }
            };
        }
    },

    // Products
    getProducts: async (params) => {
        try {
            return await api.get('/leadflow/products', { params }).then(r => r.data);
        } catch (e) {
            const { data } = await supabase.from('products').select('*').order('name');
            return { items: data || [] };
        }
    },

    // Orders
    getOrders: async (params) => {
        try {
            return await api.get('/leadflow/orders', { params }).then(r => r.data);
        } catch (e) {
            const { data } = await supabase.from('orders').select('*').order('orderDate', { ascending: false });
            return { items: data || [] };
        }
    },

    // Knowledge Base
    getKnowledge: async (params) => {
        try {
            return await api.get('/leadflow/knowledge', { params }).then(r => r.data);
        } catch (e) {
            let query = supabase.from('knowledge_items').select('*').order('createdAt', { ascending: false });
            if (params?.category && params.category !== 'ALL') {
                query = query.eq('category', params.category);
            }
            const { data } = await query;
            return data || [];
        }
    },

    createKnowledge: async (data) => {
        try {
            return await api.post('/leadflow/knowledge', data).then(r => r.data);
        } catch (e) {
            const now = new Date().toISOString();
            const { data: item } = await supabase.from('knowledge_items').insert({
                organizationId: '4d01ebeb-a684-4e84-bb66-a4ed5c76f42c',
                title: data.title,
                content: data.content,
                category: data.category,
                tags: data.tags || [],
                isActive: true,
                createdAt: now,
                updatedAt: now
            });
            return item;
        }
    },

    updateKnowledge: async (id, data) => {
        try {
            return await api.put(`/leadflow/knowledge/${id}`, data).then(r => r.data);
        } catch (e) {
            const { data: item } = await supabase.from('knowledge_items').update({
                title: data.title,
                content: data.content,
                category: data.category,
                tags: data.tags || [],
                updatedAt: new Date().toISOString()
            }).eq('id', id);
            return item;
        }
    },

    deleteKnowledge: async (id) => {
        try {
            return await api.delete(`/leadflow/knowledge/${id}`).then(r => r.data);
        } catch (e) {
            const { data } = await supabase.from('knowledge_items').delete().eq('id', id);
            return data;
        }
    },

    // AI Actions
    getAIActions: async (params) => {
        try {
            return await api.get('/leadflow/ai-actions', { params }).then(r => r.data);
        } catch (e) {
            const { data } = await supabase.from('ai_actions').select('*').order('createdAt', { ascending: false });
            return { items: data || [] };
        }
    },

    // Approvals
    getApprovals: async (params) => {
        try {
            return await api.get('/leadflow/approvals', { params }).then(r => r.data);
        } catch (e) {
            let query = supabase.from('approvals').select('*').order('createdAt', { ascending: false });
            if (params?.status && params.status !== 'ALL') {
                query = query.eq('status', params.status);
            }
            const { data } = await query;
            return { items: data || [] };
        }
    },

    processApproval: async (id, status, reason) => {
        try {
            return await api.put(`/leadflow/approvals/${id}`, { status, reason }).then(r => r.data);
        } catch (e) {
            const { data } = await supabase.from('approvals').update({
                status,
                reason,
                resolvedAt: new Date().toISOString()
            }).eq('id', id);
            return data;
        }
    },

    // Team
    getTeam: async () => {
        try {
            return await api.get('/leadflow/team').then(r => r.data);
        } catch (e) {
            const { data } = await supabase.from('users').select('id, displayName, email, role');
            return data || [];
        }
    },

    // Settings
    getSettings: async () => {
        try {
            return await api.get('/leadflow/settings').then(r => r.data);
        } catch (e) {
            const { data } = await supabase.from('organizations').select('settings').limit(1).single();
            return data?.settings || {};
        }
    },

    updateSettings: async (settings) => {
        try {
            return await api.put('/leadflow/settings', { settings }).then(r => r.data);
        } catch (e) {
            const { data } = await supabase.from('organizations').update({
                settings,
                updatedAt: new Date().toISOString()
            }).eq('id', '4d01ebeb-a684-4e84-bb66-a4ed5c76f42c');
            return data;
        }
    },

    // AI Analytics
    askAnalytics: (question) => api.post('/leadflow/analytics/ask', { question }).then(r => r.data),

    // Send Message
    sendMessage: async (conversationId, message) => {
        try {
            return await api.post(`/leadflow/conversations/${conversationId}/send-message`, { message }).then(r => r.data);
        } catch (e) {
            const now = new Date().toISOString();
            const { data } = await supabase.from('messages').insert({
                conversationId,
                sender: 'HUMAN',
                content: message,
                contentType: 'text',
                createdAt: now
            });
            await supabase.from('conversations').update({ lastMessageAt: now }).eq('id', conversationId);
            return data;
        }
    },

    // Sales Co-Pilots
    askCopilot: (question, context) => api.post('/leadflow/copilot/ask', { question, context }).then(r => r.data),
};

export default leadflowService;
