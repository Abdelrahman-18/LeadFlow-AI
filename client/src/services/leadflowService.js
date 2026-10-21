import api from './api';

const leadflowService = {
    // Dashboard
    getDashboard: () => api.get('/leadflow/dashboard').then(r => r.data),

    // Customers
    getCustomers: (params) => api.get('/leadflow/customers', { params }).then(r => r.data),
    getCustomer: (id) => api.get(`/leadflow/customers/${id}`).then(r => r.data),

    // Conversations
    getConversations: (params) => api.get('/leadflow/conversations', { params }).then(r => r.data),
    getConversation: (id) => api.get(`/leadflow/conversations/${id}`).then(r => r.data),
    assignConversation: (id, userId) => api.put(`/leadflow/conversations/${id}/assign`, { userId }).then(r => r.data),
    updateConversationStatus: (id, status) => api.put(`/leadflow/conversations/${id}/status`, { status }).then(r => r.data),
    generateReply: (conversationId, context) => api.post(`/leadflow/conversations/${conversationId}/generate-reply`, context).then(r => r.data),

    // Leads / Opportunities
    getLeads: (params) => api.get('/leadflow/leads', { params }).then(r => r.data),
    getOpportunities: (params) => api.get('/leadflow/opportunities', { params }).then(r => r.data),

    // Products
    getProducts: (params) => api.get('/leadflow/products', { params }).then(r => r.data),

    // Orders
    getOrders: (params) => api.get('/leadflow/orders', { params }).then(r => r.data),

    // Knowledge Base
    getKnowledge: (params) => api.get('/leadflow/knowledge', { params }).then(r => r.data),
    createKnowledge: (data) => api.post('/leadflow/knowledge', data).then(r => r.data),
    updateKnowledge: (id, data) => api.put(`/leadflow/knowledge/${id}`, data).then(r => r.data),
    deleteKnowledge: (id) => api.delete(`/leadflow/knowledge/${id}`).then(r => r.data),

    // AI Actions
    getAIActions: (params) => api.get('/leadflow/ai-actions', { params }).then(r => r.data),

    // Approvals
    getApprovals: (params) => api.get('/leadflow/approvals', { params }).then(r => r.data),
    processApproval: (id, status, reason) => api.put(`/leadflow/approvals/${id}`, { status, reason }).then(r => r.data),

    // Team
    getTeam: () => api.get('/leadflow/team').then(r => r.data),

    // Settings
    getSettings: () => api.get('/leadflow/settings').then(r => r.data),
    updateSettings: (settings) => api.put('/leadflow/settings', { settings }).then(r => r.data),

    // AI Analytics
    askAnalytics: (question) => api.post('/leadflow/analytics/ask', { question }).then(r => r.data),

    // Send Message (via Conversations Chatflow)
    sendMessage: (conversationId, message) => api.post(`/leadflow/conversations/${conversationId}/send-message`, { message }).then(r => r.data),

    // Sales Co-Pilots
    askCopilot: (question, context) => api.post('/leadflow/copilot/ask', { question, context }).then(r => r.data),
};

export default leadflowService;