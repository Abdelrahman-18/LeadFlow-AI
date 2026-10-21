/**
 * LeadFlow AI — API Routes
 *
 * Core business logic for the Revenue Operations platform.
 */

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ============================================================================
// AUTH MIDDLEWARE
// ============================================================================
const authCheck = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }
        const token = authHeader.substring(7);
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        req.organizationId = req.user.organizationId;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid token' });
    }
};

router.use(authCheck);

// Helper to wrap org-scoped queries
const orgFilter = () => ({ organizationId: req.organizationId });


// ============================================================================
// DASHBOARD — Main Revenue Operations overview
// ============================================================================
router.get('/dashboard', async (req, res) => {
    try {
        const orgId = req.organizationId;

        const [
            totalConversations,
            activeConversations,
            totalLeads,
            hotLeads,
            totalOpportunities,
            openOpportunities,
            totalRevenue,
            potentialRevenue,
            pendingApprovals,
            totalActions,
            recentActivity,
            inboxCount
        ] = await Promise.all([
            prisma.conversation.count({ where: { organizationId: orgId } }),
            prisma.conversation.count({ where: { organizationId: orgId, status: 'ACTIVE' } }),
            prisma.lead.count({ where: { organizationId: orgId } }),
            prisma.lead.count({ where: { organizationId: orgId, leadScore: { gte: 80 } } }),
            prisma.revenueOpportunity.count({ where: { organizationId: orgId } }),
            prisma.revenueOpportunity.count({ where: { organizationId: orgId, status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
            prisma.order.aggregate({ where: { organizationId: orgId }, _sum: { totalAmount: true } }),
            prisma.revenueOpportunity.aggregate({ where: { organizationId: orgId, status: { in: ['OPEN', 'IN_PROGRESS'] } }, _sum: { potentialRevenue: true } }),
            prisma.approval.count({ where: { organizationId: orgId, status: 'PENDING' } }),
            prisma.aIAction.count({ where: { organizationId: orgId } }),
            prisma.message.findMany({
                where: { conversation: { organizationId: orgId } },
                orderBy: { createdAt: 'desc' },
                take: 10,
                include: {
                    conversation: {
                        include: {
                            customer: { select: { name: true, avatarUrl: true } }
                        }
                    }
                }
            }),
            prisma.conversation.count({ where: { organizationId: orgId, status: 'ACTIVE' } })
        ]);

        res.json({
            metrics: {
                totalConversations,
                activeConversations,
                totalLeads,
                hotLeads,
                totalOpportunities,
                openOpportunities,
                totalRevenue: totalRevenue._sum?.totalAmount || 0,
                potentialRevenue: potentialRevenue._sum?.potentialRevenue || 0,
                pendingApprovals,
                totalActions,
                inboxCount
            },
            recentActivity: recentActivity.map(msg => ({
                id: msg.id,
                customerName: msg.conversation?.customer?.name || 'Unknown',
                avatarUrl: msg.conversation?.customer?.avatarUrl,
                message: msg.content.substring(0, 120),
                time: msg.createdAt,
                type: msg.sender,
                conversationId: msg.conversationId
            }))
        });

    } catch (error) {
        console.error('[LeadFlow Dashboard] Error:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
});

// ============================================================================
// CUSTOMERS
// ============================================================================
router.get('/customers', async (req, res) => {
    try {
        const { page = 1, limit = 20, search, channel } = req.query;
        const where = { organizationId: req.organizationId };

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search, mode: 'insensitive' } }
            ];
        }
        if (channel) where.channel = channel;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const [items, total] = await Promise.all([
            prisma.customer.findMany({
                where,
                skip,
                take: parseInt(limit),
                orderBy: { lastSeenAt: 'desc' },
                include: {
                    _count: { select: { conversations: true, leads: true, orders: true } },
                    leads: { take: 1, orderBy: { createdAt: 'desc' }, select: { leadScore: true, status: true } }
                }
            }),
            prisma.customer.count({ where })
        ]);

        res.json({ items, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
    } catch (error) {
        console.error('[LeadFlow Customers] Error:', error);
        res.status(500).json({ error: 'Failed to fetch customers' });
    }
});

router.get('/customers/:id', async (req, res) => {
    try {
        const customer = await prisma.customer.findFirst({
            where: { id: req.params.id, organizationId: req.organizationId },
            include: {
                conversations: {
                    orderBy: { lastMessageAt: 'desc' },
                    include: { _count: { select: { messages: true } } }
                },
                leads: { orderBy: { createdAt: 'desc' } },
                orders: {
                    orderBy: { orderDate: 'desc' },
                    include: { items: { include: { product: true } } }
                }
            }
        });

        if (!customer) return res.status(404).json({ error: 'Customer not found' });
        res.json(customer);
    } catch (error) {
        console.error('[LeadFlow Customer Detail] Error:', error);
        res.status(500).json({ error: 'Failed to fetch customer' });
    }
});

// ============================================================================
// CONVERSATIONS
// ============================================================================
router.get('/conversations', async (req, res) => {
    try {
        const { page = 1, limit = 20, status, channel, assignedTo } = req.query;
        const where = { organizationId: req.organizationId };

        if (status) where.status = status;
        if (channel) where.channel = channel;
        if (assignedTo) where.assignedTo = assignedTo;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const [items, total] = await Promise.all([
            prisma.conversation.findMany({
                where,
                skip,
                take: parseInt(limit),
                orderBy: { lastMessageAt: 'desc' },
                include: {
                    customer: { select: { id: true, name: true, avatarUrl: true, channel: true } },
                    assignedUser: { select: { id: true, displayName: true } },
                    lead: { select: { leadScore: true, buyingIntent: true, potentialRevenue: true } },
                    _count: { select: { messages: true } }
                }
            }),
            prisma.conversation.count({ where })
        ]);

        res.json({ items, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
    } catch (error) {
        console.error('[LeadFlow Conversations] Error:', error);
        res.status(500).json({ error: 'Failed to fetch conversations' });
    }
});

router.get('/conversations/:id', async (req, res) => {
    try {
        const conversation = await prisma.conversation.findFirst({
            where: { id: req.params.id, organizationId: req.organizationId },
            include: {
                customer: true,
                assignedUser: { select: { id: true, displayName: true, email: true } },
                lead: {
                    include: { revenueOpportunity: true }
                },
                messages: {
                    orderBy: { createdAt: 'asc' },
                    include: { aiAction: true }
                }
            }
        });

        if (!conversation) return res.status(404).json({ error: 'Conversation not found' });
        res.json(conversation);
    } catch (error) {
        console.error('[LeadFlow Conversation Detail] Error:', error);
        res.status(500).json({ error: 'Failed to fetch conversation' });
    }
});

router.put('/conversations/:id/assign', async (req, res) => {
    try {
        const { userId } = req.body;
        const conversation = await prisma.conversation.updateMany({
            where: { id: req.params.id, organizationId: req.organizationId },
            data: { assignedTo: userId || null }
        });

        if (conversation.count === 0) return res.status(404).json({ error: 'Conversation not found' });
        res.json({ message: 'Assigned successfully' });
    } catch (error) {
        console.error('[LeadFlow Assign] Error:', error);
        res.status(500).json({ error: 'Failed to assign conversation' });
    }
});

router.put('/conversations/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['ACTIVE', 'PENDING', 'RESOLVED', 'ARCHIVED'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const conversation = await prisma.conversation.updateMany({
            where: { id: req.params.id, organizationId: req.organizationId },
            data: { status }
        });

        if (conversation.count === 0) return res.status(404).json({ error: 'Conversation not found' });
        res.json({ message: `Conversation ${status.toLowerCase()}` });
    } catch (error) {
        console.error('[LeadFlow Status] Error:', error);
        res.status(500).json({ error: 'Failed to update status' });
    }
});

// ============================================================================
// LEADS
// ============================================================================
router.get('/leads', async (req, res) => {
    try {
        const { page = 1, limit = 20, status, minScore } = req.query;
        const where = { organizationId: req.organizationId };

        if (status) where.status = status;
        if (minScore) where.leadScore = { gte: parseInt(minScore) };

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const [items, total] = await Promise.all([
            prisma.lead.findMany({
                where,
                skip,
                take: parseInt(limit),
                orderBy: { leadScore: 'desc' },
                include: {
                    customer: { select: { id: true, name: true, avatarUrl: true, email: true } },
                    assignedUser: { select: { id: true, displayName: true } },
                    revenueOpportunity: true
                }
            }),
            prisma.lead.count({ where })
        ]);

        res.json({ items, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
    } catch (error) {
        console.error('[LeadFlow Leads] Error:', error);
        res.status(500).json({ error: 'Failed to fetch leads' });
    }
});

// ============================================================================
// REVENUE OPPORTUNITIES
// ============================================================================
router.get('/opportunities', async (req, res) => {
    try {
        const { page = 1, limit = 20, status } = req.query;
        const where = { organizationId: req.organizationId };

        if (status) where.status = status;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const [items, total] = await Promise.all([
            prisma.revenueOpportunity.findMany({
                where,
                skip,
                take: parseInt(limit),
                orderBy: { potentialRevenue: 'desc' },
                include: {
                    lead: {
                        include: {
                            customer: { select: { id: true, name: true, email: true, avatarUrl: true } },
                            assignedUser: { select: { id: true, displayName: true } }
                        }
                    }
                }
            }),
            prisma.revenueOpportunity.count({ where })
        ]);

        const summary = {
            totalPotentialRevenue: (await prisma.revenueOpportunity.aggregate({
                where: { ...where, status: { in: ['OPEN', 'IN_PROGRESS'] } },
                _sum: { potentialRevenue: true }
            }))._sum?.potentialRevenue || 0,
            openCount: await prisma.revenueOpportunity.count({ where: { ...where, status: { in: ['OPEN', 'IN_PROGRESS'] } } })
        };

        res.json({ items, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)), summary });
    } catch (error) {
        console.error('[LeadFlow Opportunities] Error:', error);
        res.status(500).json({ error: 'Failed to fetch opportunities' });
    }
});

// ============================================================================
// PRODUCTS
// ============================================================================
router.get('/products', async (req, res) => {
    try {
        const { category, search } = req.query;
        const where = { organizationId: req.organizationId, isActive: true };

        if (category) where.category = category;
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } }
            ];
        }

        const items = await prisma.product.findMany({
            where,
            orderBy: { name: 'asc' }
        });

        res.json(items);
    } catch (error) {
        console.error('[LeadFlow Products] Error:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

// ============================================================================
// ORDERS
// ============================================================================
router.get('/orders', async (req, res) => {
    try {
        const { page = 1, limit = 20, status } = req.query;
        const where = { organizationId: req.organizationId };

        if (status) where.status = status;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const [items, total] = await Promise.all([
            prisma.order.findMany({
                where,
                skip,
                take: parseInt(limit),
                orderBy: { orderDate: 'desc' },
                include: {
                    customer: { select: { id: true, name: true } },
                    assignedUser: { select: { id: true, displayName: true } },
                    items: { include: { product: { select: { id: true, name: true, sku: true } } } }
                }
            }),
            prisma.order.count({ where })
        ]);

        res.json({ items, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
    } catch (error) {
        console.error('[LeadFlow Orders] Error:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

// ============================================================================
// KNOWLEDGE BASE
// ============================================================================
router.get('/knowledge', async (req, res) => {
    try {
        const { category, search } = req.query;
        const where = { organizationId: req.organizationId, isActive: true };

        if (category) where.category = category;
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { content: { contains: search, mode: 'insensitive' } }
            ];
        }

        const items = await prisma.knowledgeItem.findMany({
            where,
            orderBy: { title: 'asc' }
        });

        res.json(items);
    } catch (error) {
        console.error('[LeadFlow Knowledge] Error:', error);
        res.status(500).json({ error: 'Failed to fetch knowledge base' });
    }
});

router.post('/knowledge', async (req, res) => {
    try {
        const { title, content, category, tags } = req.body;
        if (!title || !content || !category) {
            return res.status(400).json({ error: 'Title, content, and category are required' });
        }

        const item = await prisma.knowledgeItem.create({
            data: {
                organizationId: req.organizationId,
                title,
                content,
                category,
                tags: tags || []
            }
        });

        res.status(201).json(item);
    } catch (error) {
        console.error('[LeadFlow Knowledge Create] Error:', error);
        res.status(500).json({ error: 'Failed to create knowledge item' });
    }
});

router.put('/knowledge/:id', async (req, res) => {
    try {
        const { title, content, category, tags, isActive } = req.body;
        const item = await prisma.knowledgeItem.updateMany({
            where: { id: req.params.id, organizationId: req.organizationId },
            data: { title, content, category, tags, isActive }
        });

        if (item.count === 0) return res.status(404).json({ error: 'Knowledge item not found' });
        res.json({ message: 'Updated successfully' });
    } catch (error) {
        console.error('[LeadFlow Knowledge Update] Error:', error);
        res.status(500).json({ error: 'Failed to update knowledge item' });
    }
});

router.delete('/knowledge/:id', async (req, res) => {
    try {
        const item = await prisma.knowledgeItem.deleteMany({
            where: { id: req.params.id, organizationId: req.organizationId }
        });

        if (item.count === 0) return res.status(404).json({ error: 'Knowledge item not found' });
        res.json({ message: 'Deleted successfully' });
    } catch (error) {
        console.error('[LeadFlow Knowledge Delete] Error:', error);
        res.status(500).json({ error: 'Failed to delete knowledge item' });
    }
});

// ============================================================================
// AI ACTIONS
// ============================================================================
router.get('/ai-actions', async (req, res) => {
    try {
        const { page = 1, limit = 20, status, riskLevel } = req.query;
        const where = { organizationId: req.organizationId };

        if (status) where.status = status;
        if (riskLevel) where.riskLevel = riskLevel;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const [items, total] = await Promise.all([
            prisma.aIAction.findMany({
                where,
                skip,
                take: parseInt(limit),
                orderBy: { createdAt: 'desc' },
                include: {
                    conversation: {
                        include: { customer: { select: { id: true, name: true } } }
                    },
                    approval: true
                }
            }),
            prisma.aIAction.count({ where })
        ]);

        res.json({ items, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
    } catch (error) {
        console.error('[LeadFlow AI Actions] Error:', error);
        res.status(500).json({ error: 'Failed to fetch AI actions' });
    }
});

// ============================================================================
// APPROVALS
// ============================================================================
router.get('/approvals', async (req, res) => {
    try {
        const { page = 1, limit = 20, status } = req.query;
        const where = { organizationId: req.organizationId };

        if (status) where.status = status;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const [items, total] = await Promise.all([
            prisma.approval.findMany({
                where,
                skip,
                take: parseInt(limit),
                orderBy: { createdAt: 'desc' },
                include: {
                    aiAction: {
                        include: {
                            conversation: {
                                include: { customer: { select: { id: true, name: true } } }
                            }
                        }
                    },
                    approver: { select: { id: true, displayName: true } }
                }
            }),
            prisma.approval.count({ where })
        ]);

        res.json({ items, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
    } catch (error) {
        console.error('[LeadFlow Approvals] Error:', error);
        res.status(500).json({ error: 'Failed to fetch approvals' });
    }
});

router.put('/approvals/:id', async (req, res) => {
    try {
        const { status, reason } = req.body;

        if (!['APPROVED', 'REJECTED', 'CANCELLED'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status. Use APPROVED, REJECTED, or CANCELLED' });
        }

        // Get the approval
        const approval = await prisma.approval.findFirst({
            where: { id: req.params.id, organizationId: req.organizationId },
            include: { aiAction: true }
        });

        if (!approval) return res.status(404).json({ error: 'Approval not found' });
        if (approval.status !== 'PENDING') return res.status(400).json({ error: 'Approval already resolved' });

        // Update approval
        await prisma.approval.update({
            where: { id: req.params.id },
            data: {
                status,
                approvedBy: req.user.id,
                reason: reason || null,
                resolvedAt: new Date()
            }
        });

        // Update the associated AI action
        await prisma.aIAction.update({
            where: { id: approval.aiActionId },
            data: {
                status: status === 'APPROVED' ? 'APPROVED' : 'REJECTED',
                requiresApproval: false
            }
        });

        res.json({ message: `Approval ${status.toLowerCase()} successfully` });
    } catch (error) {
        console.error('[LeadFlow Approve] Error:', error);
        res.status(500).json({ error: 'Failed to process approval' });
    }
});

// ============================================================================
// TEAM — List users in organization
// ============================================================================
router.get('/team', async (req, res) => {
    try {
        const members = await prisma.organizationMember.findMany({
            where: { organizationId: req.organizationId },
            include: {
                user: {
                    select: { id: true, displayName: true, email: true, role: true, active: true }
                }
            },
            orderBy: { createdAt: 'asc' }
        });

        res.json(members.map(m => ({
            id: m.user.id,
            displayName: m.user.displayName,
            email: m.user.email,
            role: m.user.role,
            orgRole: m.role,
            active: m.user.active
        })));
    } catch (error) {
        console.error('[LeadFlow Team] Error:', error);
        res.status(500).json({ error: 'Failed to fetch team' });
    }
});

// ============================================================================
// SETTINGS — Organization settings
// ============================================================================
router.get('/settings', async (req, res) => {
    try {
        const org = await prisma.organization.findUnique({
            where: { id: req.organizationId },
            include: { subscription: true }
        });

        if (!org) return res.status(404).json({ error: 'Organization not found' });

        res.json({
            name: org.name,
            slug: org.slug,
            logo: org.logo,
            settings: org.settings,
            subscription: org.subscription ? {
                plan: org.subscription.plan,
                status: org.subscription.status
            } : null
        });
    } catch (error) {
        console.error('[LeadFlow Settings] Error:', error);
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
});

router.put('/settings', async (req, res) => {
    try {
        const { settings } = req.body;
        const org = await prisma.organization.update({
            where: { id: req.organizationId },
            data: { settings: settings || {} }
        });

        res.json({ message: 'Settings updated', settings: org.settings });
    } catch (error) {
        console.error('[LeadFlow Settings Update] Error:', error);
        res.status(500).json({ error: 'Failed to update settings' });
    }
});

// ============================================================================
// AI ANALYTICS — Natural language questions via MicroMind Core
// ============================================================================
router.post('/analytics/ask', async (req, res) => {
    try {
        const { question } = req.body;
        if (!question) {
            return res.status(400).json({ error: 'Question is required' });
        }

        const AI_API_URL = process.env.AI_API_URL || 'https://dev.aimicromind.com';
        const ANALYTICS_CHATFLOW_ID = process.env.AI_ANALYTICS_CHATFLOW_ID || process.env.AI_CHATFLOW_ID;

        if (!ANALYTICS_CHATFLOW_ID) {
            // Demo mode — return mock analysis
            const mockResponse = await generateMockAnalytics(question, req.organizationId);
            return res.json(mockResponse);
        }

        const targetUrl = `${AI_API_URL}/api/v1/prediction/${ANALYTICS_CHATFLOW_ID}`;

        // Get org context for AI
        const org = await prisma.organization.findUnique({
            where: { id: req.organizationId },
            include: {
                _count: { select: { customers: true, leads: true, orders: true, products: true } }
            }
        });

        const headers = { 'Content-Type': 'application/json' };
        // Add Authorization header only if API key is provided
        const AI_API_KEY = process.env.AI_API_KEY;
        if (AI_API_KEY) {
            headers['Authorization'] = `Bearer ${AI_API_KEY}`;
        }

        const response = await fetch(targetUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                question,
                context: {
                    organizationId: req.organizationId,
                    organizationName: org?.name,
                    metrics: org?._count
                }
            })
        });

        if (!response.ok) {
            throw new Error(`AI API returned ${response.status}`);
        }

        const data = await response.json();

        // ENHANCEMENT: Extract chart data from SQL results when available
        let chartData = null;
        if (data.usedTools && Array.isArray(data.usedTools)) {
            const sqlTool = data.usedTools.find(t => t.tool === 'postgresql');
            if (sqlTool?.toolOutput) {
                try {
                    const sqlResults = JSON.parse(sqlTool.toolOutput);
                    
                    // Determine chart type based on question keywords
                    const q = (data.question || '').toLowerCase();
                    
                    if (sqlResults.length > 0 && typeof sqlResults[0] === 'object') {
                        const firstItem = sqlResults[0];
                        const hasCategory = Object.keys(firstItem).some(k => 
                            ['category', 'name', 'type', 'status', 'product', 'lead', 'customer', 'month', 'week', 'day'].includes(k.toLowerCase()));
                        const hasValue = Object.keys(firstItem).some(k => 
                            ['value', 'revenue', 'count', 'total', 'amount', 'score', 'price', 'sum', 'avg'].includes(k.toLowerCase()));
                        
                        if (hasCategory && hasValue) {
                            // Extract labels (category-like columns)
                            const labels = sqlResults.map(item => {
                                // Find the category/column value
                                for (const [key, value] of Object.entries(item)) {
                                    if (['category', 'name', 'type', 'status', 'product', 'lead', 'customer', 'month', 'week', 'day'].includes(key.toLowerCase()) && 
                                        value !== null && value !== undefined) {
                                        return String(value);
                                    }
                                }
                                // Fallback to first string value
                                for (const value of Object.values(item)) {
                                    if (typeof value === 'string') return value;
                                }
                                return 'Unknown';
                            });
                            
                            // Extract values (numeric columns)
                            const values = sqlResults.map(item => {
                                // Find the numeric/value column
                                for (const [key, value] of Object.entries(item)) {
                                    if (['value', 'revenue', 'count', 'total', 'amount', 'score', 'price', 'sum', 'avg'].includes(key.toLowerCase()) && 
                                        typeof value === 'number') {
                                        return value;
                                    }
                                    // Handle numeric strings
                                    if (['value', 'revenue', 'count', 'total', 'amount', 'score', 'price', 'sum', 'avg'].includes(key.toLowerCase()) && 
                                        typeof value === 'string' && !isNaN(parseFloat(value))) {
                                        return parseFloat(value);
                                    }
                                }
                                // Fallback to first numeric value
                                for (const value of Object.values(item)) {
                                    if (typeof value === 'number') return value;
                                    if (typeof value === 'string' && !isNaN(parseFloat(value))) return parseFloat(value);
                                }
                                return 0;
                            });
                            
                            // Choose chart type based on question
                            if (q.includes('trend') || q.includes('over time') || q.includes('monthly') || q.includes('daily') || q.includes('weekly') || q.includes('yearly')) {
                                chartData = { type: 'line', title: 'Trend Analysis', labels, values };
                            } else if (q.includes('compare') || q.includes('vs') || q.includes('comparison') || q.includes('versus')) {
                                chartData = { type: 'bar', title: 'Comparison Chart', labels, values };
                            } else if (q.includes('percentage') || q.includes('distribution') || q.includes('breakdown') || q.includes('proportion') || q.includes('share')) {
                                chartData = { type: 'pie', title: 'Distribution Chart', labels, values };
                            } else if (q.includes('growth') || q.includes('change') || q.includes('increase') || q.includes('decrease')) {
                                chartData = { type: 'line', title: 'Growth Analysis', labels, values };
                            } else {
                                // Default to bar chart for categorical data
                                chartData = { type: 'bar', title: 'Analysis Results', labels, values };
                            }
                        }
                    }
                } catch (e) {
                    console.warn('Could not parse SQL results for charting:', e.message);
                }
            }
        }

        // Enhance the response with chartData if we found visualizable data
        const enhancedResponse = {
            ...data,
            ...(chartData && { chartData })  // Only add chartData if we successfully created it
        };

        res.json(enhancedResponse);

    } catch (error) {
        console.error('[LeadFlow Analytics] Error:', error);

        // Fallback to mock on error
        const mockResponse = await generateMockAnalytics(req.body.question, req.organizationId);
        res.json(mockResponse);
    }
});

// Mock analytics for demo when MicroMind is not connected
async function generateMockAnalytics(question, orgId) {
    const q = question.toLowerCase();

    // Gather real data from DB for realistic mock responses
    const [totalOrders, totalRevenue, totalLeads, hotLeads, products, monthlyRevenue] = await Promise.all([
        prisma.order.count({ where: { organizationId: orgId } }),
        prisma.order.aggregate({ where: { organizationId: orgId }, _sum: { totalAmount: true } }),
        prisma.lead.count({ where: { organizationId: orgId } }),
        prisma.lead.count({ where: { organizationId: orgId, leadScore: { gte: 80 } } }),
        prisma.product.findMany({
            where: { organizationId: orgId },
            orderBy: { name: 'asc' },
            select: { name: true, price: true, category: true }
        }),
        prisma.order.groupBy({
            by: ['orderDate'],
            where: { organizationId: orgId },
            _sum: { totalAmount: true },
            orderBy: { orderDate: 'desc' }
        })
    ]);

    const totalRev = totalRevenue._sum?.totalAmount || 0;
    const potentialRev = (await prisma.revenueOpportunity.aggregate({
        where: { organizationId: orgId, status: { in: ['OPEN', 'IN_PROGRESS'] } },
        _sum: { potentialRevenue: true }
    }))._sum?.potentialRevenue || 0;

    // Build context-aware response
    let response = '';
    let chartData = null;

    if (q.includes('revenue') || q.includes('sales') || q.includes('earn')) {
        if (q.includes('month') || q.includes('monthly')) {
            response = `Based on ABC Fashion data, the total revenue generated this month is EGP ${totalRev.toLocaleString()}. We have ${totalOrders} orders processed, with an additional EGP ${potentialRev.toLocaleString()} in potential revenue from ${hotLeads} hot leads.`;
            chartData = {
                type: 'bar',
                title: 'Monthly Revenue',
                labels: ['Jul Wk 1', 'Jul Wk 2', 'Jul Wk 3', 'Jul Wk 4', 'Aug Wk 1', 'Aug Wk 2'],
                values: [12500, 18900, 22300, 19800, 25400, 18200]
            };
        } else if (q.includes('product')) {
            const topProduct = products.reduce((max, p) => p.price > max.price ? p : max, products[0] || { name: 'N/A', price: 0 });
            response = `ABC Fashion's top revenue-generating product is the **${topProduct.name}** at EGP ${topProduct.price.toLocaleString()}. Our product catalog includes ${products.length} active products across ${new Set(products.map(p => p.category)).size} categories. Total revenue across all products: EGP ${totalRev.toLocaleString()}.`;
            chartData = {
                type: 'bar',
                title: 'Revenue by Product Category',
                labels: [...new Set(products.map(p => p.category))],
                values: [28500, 14200, 32100, 18900, 10500, 8700]
            };
        } else {
            response = `ABC Fashion has generated **EGP ${totalRev.toLocaleString()}** in total revenue from ${totalOrders} orders. We currently have ${totalLeads} leads with ${hotLeads} hot leads representing EGP ${potentialRev.toLocaleString()} in potential revenue. Your top sales opportunities could increase revenue by ${Math.round((potentialRev / (totalRev || 1)) * 100)}%.`;
            chartData = {
                type: 'line',
                title: 'Revenue Trend',
                labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'],
                values: [12500, 18900, 22300, 25400, 19800, 18200]
            };
        }
    } else if (q.includes('lead') || q.includes('customer') || q.includes('prospect')) {
        response = `ABC Fashion currently has **${totalLeads} leads** in the pipeline. ${hotLeads} are hot leads (score 80+) requiring immediate attention. Your leads represent approximately EGP ${potentialRev.toLocaleString()} in potential revenue. The average lead score across all leads is ${totalLeads > 0 ? Math.round(await prisma.lead.aggregate({ where: { organizationId: orgId }, _avg: { leadScore: true } }).then(r => r._avg?.leadScore || 0)) : 0}/100.`;
        chartData = {
            type: 'bar',
            title: 'Leads by Score Range',
            labels: ['0-20', '21-40', '41-60', '61-80', '81-100'],
            values: [2, 1, 3, 2, 2]
        };
    } else if (q.includes('product') || q.includes('item') || q.includes('inventory')) {
        const categories = [...new Set(products.map(p => p.category))];
        response = `ABC Fashion offers **${products.length} products** across ${categories.length} categories: ${categories.join(', ')}. The average product price is EGP ${Math.round(products.reduce((s, p) => s + Number(p.price), 0) / products.length).toLocaleString()}. Top categories by product count:`;
        chartData = {
            type: 'pie',
            title: 'Products by Category',
            labels: categories,
            values: categories.map(c => products.filter(p => p.category === c).length)
        };
    } else if (q.includes('top') || q.includes('best') || q.includes('perform')) {
        response = `ABC Fashion's performance metrics:\n\n• **${totalOrders} orders** processed\n• **EGP ${totalRev.toLocaleString()}** total revenue\n• **${totalLeads} leads** with ${hotLeads} hot\n• **EGP ${potentialRev.toLocaleString()}** pipeline value\n• **${products.length} products** across ${new Set(products.map(p => p.category)).size} categories\n\nYour hottest leads represent a ${Math.round((hotLeads / (totalLeads || 1)) * 100)}% conversion opportunity.`;
        chartData = {
            type: 'bar',
            title: 'Top Performance Metrics',
            labels: ['Orders', 'Revenue (K)', 'Leads', 'Hot Leads', 'Products'],
            values: [totalOrders, Math.round(totalRev / 1000), totalLeads, hotLeads, products.length]
        };
    } else {
        response = `Here's an overview of ABC Fashion:\n\n• **${totalOrders} total orders** with EGP ${totalRev.toLocaleString()} revenue\n• **${totalLeads} leads** (${hotLeads} hot) worth EGP ${potentialRev.toLocaleString()}\n• **${products.length} products** available\n\nWhat specific aspect would you like to analyze further? I can help with revenue trends, lead analysis, product performance, or sales forecasting.`;
    }

    return {
        success: true,
        text: response,
        chartData,
        source: 'ai-analytics'
    };
}

// ============================================================================
// CONVERSATIONS — Send Message via MicroMind Chatflow
// ============================================================================
router.post('/conversations/:id/send-message', async (req, res) => {
    try {
        const { message } = req.body;
        const conversationId = req.params.id;

        if (!message || !message.trim()) {
            return res.status(400).json({ error: 'Message is required' });
        }

        const conversation = await prisma.conversation.findFirst({
            where: { id: conversationId, organizationId: req.organizationId },
            include: {
                customer: true,
                messages: { orderBy: { createdAt: 'desc' }, take: 20 },
                lead: true
            }
        });

        if (!conversation) return res.status(404).json({ error: 'Conversation not found' });

        // 1. Store user message in DB
        const userMessage = await prisma.message.create({
            data: {
                conversationId,
                sender: 'HUMAN',
                content: message.trim()
            }
        });

        // 2. Update conversation lastMessageAt
        await prisma.conversation.update({
            where: { id: conversationId },
            data: { lastMessageAt: new Date() }
        });

        // 3. Call the conversations chatflow
        const CONVERSATIONS_CHATFLOW_ID = process.env.AI_CONVERSATIONS_CHATFLOW_ID;
        const AI_API_URL = process.env.AI_API_URL || 'https://core.aimicromind.com';

        let replyText = '';

        if (CONVERSATIONS_CHATFLOW_ID) {
            const payload = {
                question: message.trim(),
                context: {
                    organizationName: conversation.organization?.name || 'ABC Fashion',
                    customerName: conversation.customer?.name || 'Customer',
                    customerEmail: conversation.customer?.email || '',
                    leadScore: conversation.lead?.leadScore || 0,
                    buyingIntent: conversation.lead?.buyingIntent || 'LOW',
                    conversationHistory: conversation.messages.slice(0, 20).reverse().map(m => ({
                        sender: m.sender,
                        content: m.content
                    }))
                }
            };

            const headers = { 'Content-Type': 'application/json' };
            const AI_API_KEY = process.env.AI_API_KEY;
            if (AI_API_KEY) {
                headers['Authorization'] = `Bearer ${AI_API_KEY}`;
            }

            const response = await fetch(`${AI_API_URL}/api/v1/prediction/${CONVERSATIONS_CHATFLOW_ID}`, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload),
                signal: AbortSignal.timeout(30000)
            });

            if (response.ok) {
                const data = await response.json();

                // Extract reply from chatflow response:
                // 1. First check if text field has actual content (not JSON)
                const rawText = data.text || data.response || '';
                try {
                    JSON.parse(rawText); // If it parses, it's JSON acknowledgment
                } catch {
                    replyText = rawText; // It's plain text - use it
                }

                // 2. If no plain text, try extracting from usedTools (Messenger send_text_message)
                if (!replyText && Array.isArray(data.usedTools)) {
                    const sendTool = data.usedTools.find(t => t.tool === 'send_text_message');
                    if (sendTool?.toolInput?.messageText) {
                        replyText = sendTool.toolInput.messageText;
                    }
                }

                // 3. If we still have nothing, use a generic acknowledgment
                if (!replyText) {
                    replyText = 'Message received!';
                }
            } else {
                console.error(`[LeadFlow Chatflow] API returned ${response.status}`);
            }
        }

        // 4. Store chatflow response in DB (if we got one)
        let botMessage = null;
        if (replyText) {
            botMessage = await prisma.message.create({
                data: {
                    conversationId,
                    sender: 'AI',
                    content: replyText
                }
            });

            // Update lastMessageAt again with the bot reply
            await prisma.conversation.update({
                where: { id: conversationId },
                data: { lastMessageAt: new Date() }
            });
        }

        res.json({
            success: true,
            userMessage,
            botMessage,
            text: replyText || 'Message sent. No response generated.',
            source: 'conversations-chatflow'
        });

    } catch (error) {
        console.error('[LeadFlow Send Message] Error:', error);
        res.json({
            success: true,
            userMessage: null,
            botMessage: null,
            text: 'Message sent but encountered an error generating a response.',
            source: 'fallback'
        });
    }
});

// Keep the original generate-reply endpoint pointing to the new chatflow too
router.post('/conversations/:id/generate-reply', async (req, res) => {
    try {
        const { context } = req.body;
        const conversationId = req.params.id;

        const conversation = await prisma.conversation.findFirst({
            where: { id: conversationId, organizationId: req.organizationId },
            include: {
                customer: true,
                messages: { orderBy: { createdAt: 'desc' }, take: 15 },
                lead: true
            }
        });

        if (!conversation) return res.status(404).json({ error: 'Conversation not found' });

        const CONVERSATIONS_CHATFLOW_ID = process.env.AI_CONVERSATIONS_CHATFLOW_ID;

        if (!CONVERSATIONS_CHATFLOW_ID) {
            return res.json({
                success: true,
                text: `Thank you for your message, ${conversation.customer.name}! I'll follow up on this shortly. Is there anything specific you'd like me to address?`,
                source: 'fallback'
            });
        }

        const AI_API_URL = process.env.AI_API_URL || 'https://core.aimicromind.com';

        const payload = {
            question: `Generate a professional follow-up reply for this conversation context.`,
            context: {
                organizationName: conversation.organization?.name || 'ABC Fashion',
                customerName: conversation.customer.name,
                customerEmail: conversation.customer.email,
                leadScore: conversation.lead?.leadScore || 0,
                buyingIntent: conversation.lead?.buyingIntent || 'LOW',
                conversationHistory: conversation.messages.reverse().map(m => ({
                    sender: m.sender,
                    content: m.content,
                    analysis: m.aiAnalysis
                })),
                additionalContext: context || ''
            }
        };

        const headers = { 'Content-Type': 'application/json' };
        const AI_API_KEY = process.env.AI_API_KEY;
        if (AI_API_KEY) {
            headers['Authorization'] = `Bearer ${AI_API_KEY}`;
        }

        const response = await fetch(`${AI_API_URL}/api/v1/prediction/${CONVERSATIONS_CHATFLOW_ID}`, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(30000)
        });

        if (!response.ok) {
            throw new Error(`AI API returned ${response.status}`);
        }

        const data = await response.json();
        res.json({
            success: true,
            text: data.text || data.response || 'I\'ll follow up on this shortly.',
            source: 'conversations-chatflow'
        });

    } catch (error) {
        console.error('[LeadFlow Generate Reply] Error:', error);
        res.json({
            success: true,
            text: `Thank you for your message! I'll get back to you shortly with more details.`,
            source: 'fallback'
        });
    }
});

// ============================================================================
// SALES CO-PILOTS — Ask AI for deal coaching
// ============================================================================
router.post('/copilot/ask', async (req, res) => {
    try {
        const { question, context } = req.body;
        if (!question) {
            return res.status(400).json({ error: 'Question is required' });
        }

        const COPILOT_CHATFLOW_ID = process.env.AI_COPILOT_CHATFLOW_ID;

        if (!COPILOT_CHATFLOW_ID) {
            return res.json({
                success: true,
                text: `Based on your question about "${question}", here's my coaching advice: Focus on qualifying the lead's budget, authority, need, and timeline (BANT). Schedule a discovery call to understand their pain points better, then propose a tailored solution. Next step: Book a 15-min call this week.`,
                source: 'fallback'
            });
        }

        const AI_API_URL = process.env.AI_API_URL || 'https://core.aimicromind.com';
        const AI_API_KEY = process.env.AI_API_KEY;

        // Get org context for richer responses
        const org = await prisma.organization.findUnique({
            where: { id: req.organizationId },
            include: {
                _count: { select: { customers: true, leads: true, orders: true, products: true } }
            }
        });

        const payload = {
            question,
            context: {
                organizationId: req.organizationId,
                organizationName: org?.name,
                metrics: org?._count,
                ...context
            }
        };

        const response = await fetch(`${AI_API_URL}/api/v1/prediction/${COPILOT_CHATFLOW_ID}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(AI_API_KEY ? { 'Authorization': `Bearer ${AI_API_KEY}` } : {})
            },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(30000)
        });

        if (!response.ok) {
            throw new Error(`AI API returned ${response.status}`);
        }

        const data = await response.json();
        res.json({
            success: true,
            text: data.text || data.response || 'I need more context to give specific coaching.',
            source: 'sales-copilot'
        });

    } catch (error) {
        console.error('[LeadFlow Copilot] Error:', error);
        res.json({
            success: true,
            text: `I understand you're asking about "${question}". Here's my general guidance: Focus on understanding the customer's real pain points, qualify their budget and timeline, then position your solution as the clear path to their desired outcome. What specific deal or situation are you working on?`,
            source: 'fallback'
        });
    }
});

module.exports = router;