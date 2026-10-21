/**
 * LeadFlow AI — Facebook Messenger Webhook
 *
 * Handles incoming Messenger messages and processes them through MicroMind Core.
 *
 * Verify Token: configured via MESSENGER_VERIFY_TOKEN env var
 * Page Access Token: configured via MESSENGER_PAGE_ACCESS_TOKEN env var
 */

const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const VERIFY_TOKEN = process.env.MESSENGER_VERIFY_TOKEN || 'leadflow_verify_2026';
const PAGE_ACCESS_TOKEN = process.env.MESSENGER_PAGE_ACCESS_TOKEN;
const AI_API_URL = process.env.AI_API_URL || 'https://dev.aimicromind.com';
const AI_API_KEY = process.env.AI_API_KEY;
const AI_CHATFLOW_ID = process.env.AI_CHATFLOW_ID;

// ============================================================================
// GET / — Facebook Webhook Verification
// ============================================================================
router.get('/messenger', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    console.log('[Messenger Webhook] Verification request:', { mode, tokenProvided: !!token });

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('[Messenger Webhook] ✅ Verified successfully');
        return res.status(200).send(challenge);
    }

    console.warn('[Messenger Webhook] ❌ Verification failed');
    return res.status(403).send('Verification failed');
});

// ============================================================================
// POST / — Incoming Messages
// ============================================================================
router.post('/messenger', async (req, res) => {
    // Always respond with 200 to acknowledge receipt
    res.status(200).send('EVENT_RECEIVED');

    try {
        const body = req.body;

        if (body.object === 'page') {
            for (const entry of body.entry || []) {
                for (const event of entry.messaging || []) {
                    await handleMessengerEvent(event);
                }
            }
        }
    } catch (error) {
        console.error('[Messenger Webhook] Error processing event:', error.message);
    }
});

// ============================================================================
// Event Handler
// ============================================================================
async function handleMessengerEvent(event) {
    const senderPsid = event.sender?.id;
    const message = event.message?.text;
    const postback = event.postback?.payload;

    if (!senderPsid) return;

    if (message) {
        await handleIncomingMessage(senderPsid, message);
    } else if (postback) {
        await handlePostback(senderPsid, postback);
    }
}

// ============================================================================
// Handle Incoming Message
// ============================================================================
async function handleIncomingMessage(psid, text) {
    console.log(`[Messenger Webhook] Message from ${psid}: "${text.substring(0, 100)}"`);

    try {
        // Find or create customer
        const org = await prisma.organization.findFirst({
            where: { slug: process.env.DEMO_ORG_SLUG || 'abc-fashion' }
        });

        if (!org) {
            console.error('[Messenger Webhook] No organization found');
            return;
        }

        let customer = await prisma.customer.findFirst({
            where: { organizationId: org.id, externalId: psid }
        });

        if (!customer) {
            // Look up Messenger profile
            let customerName = `Customer ${psid.substring(psid.length - 4)}`;
            if (PAGE_ACCESS_TOKEN) {
                try {
                    const profileUrl = `https://graph.facebook.com/v18.0/${psid}?fields=first_name,last_name,profile_pic&access_token=${PAGE_ACCESS_TOKEN}`;
                    const profileRes = await fetch(profileUrl);
                    if (profileRes.ok) {
                        const profile = await profileRes.json();
                        customerName = [profile.first_name, profile.last_name].filter(Boolean).join(' ') || customerName;
                    }
                } catch (e) {
                    console.warn('[Messenger Webhook] Could not fetch profile:', e.message);
                }
            }

            customer = await prisma.customer.create({
                data: {
                    organizationId: org.id,
                    externalId: psid,
                    channel: 'MESSENGER',
                    name: customerName,
                    firstSeenAt: new Date()
                }
            });
            console.log(`[Messenger Webhook] ✅ New customer created: ${customerName}`);
        }

        // Find or create active conversation
        let conversation = await prisma.conversation.findFirst({
            where: {
                organizationId: org.id,
                customerId: customer.id,
                channel: 'MESSENGER',
                status: { in: ['ACTIVE', 'PENDING'] }
            },
            include: { messages: { orderBy: { createdAt: 'desc' }, take: 10 } }
        });

        if (!conversation) {
            conversation = await prisma.conversation.create({
                data: {
                    organizationId: org.id,
                    customerId: customer.id,
                    channel: 'MESSENGER',
                    status: 'ACTIVE',
                    channelThreadId: psid
                }
            });
        }

        // Save incoming message
        await prisma.message.create({
            data: {
                conversationId: conversation.id,
                sender: 'CUSTOMER',
                content: text
            }
        });

        // Process through MicroMind Core
        const aiResponse = await processWithMicroMind(org, customer, conversation, text);

        // Save AI response message
        if (aiResponse.text) {
            await prisma.message.create({
                data: {
                    conversationId: conversation.id,
                    sender: 'AI',
                    content: aiResponse.text,
                    aiAnalysis: {
                        intent: aiResponse.intent || 'Unknown',
                        leadScore: aiResponse.leadScore || 0,
                        buyingIntent: aiResponse.buyingIntent || 'LOW',
                        potentialRevenue: aiResponse.potentialRevenue || 0,
                        recommendation: aiResponse.recommendation || ''
                    },
                    aiActionId: aiResponse.aiActionId || null
                }
            });
        }

        // Update lead
        await updateLead(org.id, customer.id, conversation.id, aiResponse);

        // Update conversation timestamp
        await prisma.conversation.update({
            where: { id: conversation.id },
            data: { lastMessageAt: new Date() }
        });

        // Update customer last seen
        await prisma.customer.update({
            where: { id: customer.id },
            data: { lastSeenAt: new Date() }
        });

        // Send response to Messenger
        if (aiResponse.text && PAGE_ACCESS_TOKEN) {
            await sendToMessenger(psid, aiResponse.text);
        }

    } catch (error) {
        console.error('[Messenger Webhook] Error handling message:', error);
    }
}

// ============================================================================
// AI Processing via MicroMind Core
// ============================================================================
async function processWithMicroMind(org, customer, conversation, message) {
    // Default response when MicroMind is not connected
    const defaultResponse = {
        text: `Thank you for your message! I've noted your inquiry about "${message.substring(0, 100)}". Our team at ${org?.name || 'ABC Fashion'} will get back to you shortly. Is there anything else I can help you with?`,
        intent: 'General Inquiry',
        leadScore: 50,
        buyingIntent: 'MEDIUM',
        potentialRevenue: 0,
        recommendation: 'Acknowledge and follow up'
    };

    if (!AI_API_KEY || !AI_CHATFLOW_ID) {
        console.log('[Messenger Webhook] ⚠️ MicroMind not configured — using smart default response');
        return generateSmartResponse(org, customer, conversation, message) || defaultResponse;
    }

    try {
        // Get conversation history for context
        const recentMessages = await prisma.message.findMany({
            where: { conversationId: conversation.id },
            orderBy: { createdAt: 'desc' },
            take: 20
        });

        // Get knowledge base for the organization
        const knowledge = await prisma.knowledgeItem.findMany({
            where: { organizationId: org.id, isActive: true }
        });

        // Get products for product-related queries
        const products = await prisma.product.findMany({
            where: { organizationId: org.id, isActive: true }
        });

        const targetUrl = `${AI_API_URL}/api/v1/prediction/${AI_CHATFLOW_ID}`;

        const payload = {
            question: message,
            context: {
                organizationName: org.name,
                customerName: customer.name,
                customerEmail: customer.email,
                conversationHistory: recentMessages.reverse().map(m => ({
                    sender: m.sender,
                    content: m.content,
                    analysis: m.aiAnalysis
                })),
                knowledge: knowledge.map(k => ({
                    title: k.title,
                    content: k.content,
                    category: k.category
                })),
                products: products.map(p => ({
                    name: p.name,
                    price: Number(p.price),
                    category: p.category,
                    description: p.description
                })),
                businessInfo: org.settings
            }
        };

        const response = await fetch(targetUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${AI_API_KEY}`
            },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(30000) // 30 second timeout
        });

        if (!response.ok) {
            console.error(`[Messenger Webhook] ❌ MicroMind error: ${response.status}`);
            return generateSmartResponse(org, customer, conversation, message) || defaultResponse;
        }

        const data = await response.json();

        // Parse MicroMind response — expecting text + optional structured data
        let parsed = {
            text: data.text || data.response || '',
            intent: data.intent || data.json?.intent || 'General Inquiry',
            leadScore: data.leadScore || data.json?.leadScore || 50,
            buyingIntent: data.buyingIntent || data.json?.buyingIntent || 'MEDIUM',
            potentialRevenue: data.potentialRevenue || data.json?.potentialRevenue || 0,
            recommendation: data.recommendation || data.json?.recommendation || '',
            requiresApproval: data.requiresApproval || data.json?.requiresApproval || false,
            riskLevel: data.riskLevel || data.json?.riskLevel || 'LOW'
        };

        // Create AI action if approval required
        if (parsed.requiresApproval) {
            const aiAction = await prisma.aIAction.create({
                data: {
                    organizationId: org.id,
                    conversationId: conversation.id,
                    customerId: customer.id,
                    actionType: parsed.intent?.includes('discount') ? 'send_discount' : 'escalate',
                    input: { customerMessage: message, context: conversation.messages },
                    output: parsed,
                    riskLevel: parsed.riskLevel || 'MEDIUM',
                    status: 'PENDING',
                    requiresApproval: true
                }
            });

            // Also create approval record
            await prisma.approval.create({
                data: {
                    organizationId: org.id,
                    aiActionId: aiAction.id,
                    status: 'PENDING',
                    reason: `AI requires approval for: ${parsed.recommendation}`
                }
            });

            parsed.aiActionId = aiAction.id;
            parsed.text += '\n\n⚠️ *This action requires manager approval and will be reviewed shortly.*';
        }

        console.log(`[Messenger Webhook] ✅ MicroMind response: intent=${parsed.intent}, score=${parsed.leadScore}`);
        return parsed;

    } catch (error) {
        console.error('[Messenger Webhook] ❌ MicroMind error:', error.message);
        return generateSmartResponse(org, customer, conversation, message) || defaultResponse;
    }
}

// ============================================================================
// Smart Response Generator (fallback when MicroMind is offline)
// ============================================================================
function generateSmartResponse(org, customer, conversation, message) {
    const msg = message.toLowerCase();

    try {
        // Check against knowledge base or product data loaded at startup
        // This is a simple keyword-based fallback — MicroMind handles the real intelligence
        if (msg.includes('hello') || msg.includes('hi ') || msg.includes('hey')) {
            return {
                text: `Hello ${customer.name}! 👋 Welcome to ${org?.name || 'ABC Fashion'}. How can I help you today? I can assist with product inquiries, orders, returns, or anything else!`,
                intent: 'Greeting',
                leadScore: 10,
                buyingIntent: 'LOW',
                potentialRevenue: 0,
                recommendation: 'Engage customer and qualify needs'
            };
        }

        if (msg.includes('price') || msg.includes('cost') || msg.includes('how much')) {
            return {
                text: `Great question! I'd be happy to help with pricing. ${org?.name || 'ABC Fashion'} offers a range of products from EGP 899 to EGP 5,499. Could you let me know which product you're interested in? I can check availability, sizes, and current promotions!`,
                intent: 'Price Inquiry',
                leadScore: 40,
                buyingIntent: 'MEDIUM',
                potentialRevenue: 2000,
                recommendation: 'Qualify product interest and provide pricing'
            };
        }

        if (msg.includes('return') || msg.includes('exchange') || msg.includes('refund')) {
            return {
                text: `I can help with that! Our return policy:\n\n• 30-day return window from delivery\n• Items must be unworn with tags\n• Free returns for store credit\n• Refunds in 5-7 business days\n\nWould you like to start a return or exchange?`,
                intent: 'Return Inquiry',
                leadScore: 20,
                buyingIntent: 'LOW',
                potentialRevenue: 0,
                recommendation: 'Provide return support'
            };
        }

        if (msg.includes('shipping') || msg.includes('delivery') || msg.includes('deliver')) {
            return {
                text: `Shipping info for ${org?.name || 'ABC Fashion'}:\n\n• Free shipping on orders over EGP 2,000\n• Standard: 3-5 business days\n• Express: 1-2 business days (+EGP 150)\n• Free store pickup available\n\nWould you like to place an order?`,
                intent: 'Shipping Inquiry',
                leadScore: 45,
                buyingIntent: 'MEDIUM',
                potentialRevenue: 2500,
                recommendation: 'Address shipping questions and upsell'
            };
        }

        if (msg.includes('discount') || msg.includes('sale') || msg.includes('offer') || msg.includes('promo')) {
            return {
                text: `I'd love to help you save! ${org?.name || 'ABC Fashion'} currently has some great options:\n\n• Bundle discount: 10% off when you buy 3+ items\n• First-time buyer: 10% welcome discount\n• Free shipping on orders over EGP 2,000\n\nNote: discounts over 10% require manager approval. Would you like me to check what works best for your order?`,
                intent: 'Discount Inquiry',
                leadScore: 70,
                buyingIntent: 'HIGH',
                potentialRevenue: 3500,
                recommendation: 'Offer bundle discount or escalate if >10% requested'
            };
        }

        if (msg.includes('size') || msg.includes('fit') || msg.includes('measure')) {
            return {
                text: `I can help with sizing! Our sizes follow European standards:\n\nXS=44, S=46, M=48, L=50, XL=52, XXL=54\n\nFor best results, check our size guide on each product page. Would you like specific measurements for an item you're interested in?`,
                intent: 'Sizing Inquiry',
                leadScore: 50,
                buyingIntent: 'HIGH',
                potentialRevenue: 2000,
                recommendation: 'Provide sizing guidance and recommend products'
            };
        }

        if (msg.includes('order') && (msg.includes('status') || msg.includes('track') || msg.includes('where'))) {
            return {
                text: `I'll look into your order status right away! Could you provide your order number so I can check the latest updates for you?`,
                intent: 'Order Status',
                leadScore: 30,
                buyingIntent: 'LOW',
                potentialRevenue: 0,
                recommendation: 'Look up order and provide status update'
            };
        }

        if (msg.includes('thank')) {
            return {
                text: `You're very welcome, ${customer.name}! 😊 If you ever need anything else, don't hesitate to reach out. Have a wonderful day!`,
                intent: 'Appreciation',
                leadScore: 0,
                buyingIntent: 'LOW',
                potentialRevenue: 0,
                recommendation: 'Close conversation warmly'
            };
        }

        // Default — product interest if we have products loaded
        return {
            text: `Thank you for reaching out, ${customer.name}! I'm here to help with anything related to ${org?.name || 'ABC Fashion'}.\n\nI can help you with:\n• Product recommendations and pricing\n• Order status and tracking\n• Returns and exchanges\n• Sizing and fit advice\n• General inquiries\n\nWhat can I assist you with today? 😊`,
            intent: 'General Inquiry',
            leadScore: 30,
            buyingIntent: 'LOW',
            potentialRevenue: 0,
            recommendation: 'Qualify customer intent'
        };
    } catch (e) {
        return null;
    }
}

// ============================================================================
// Lead / Opportunity Management
// ============================================================================
async function updateLead(orgId, customerId, conversationId, aiResponse) {
    try {
        const existingLead = await prisma.lead.findFirst({
            where: { organizationId: orgId, customerId, status: { not: 'CONVERTED' } }
        });

        const leadData = {
            leadScore: aiResponse.leadScore || 50,
            intent: aiResponse.intent || 'General Inquiry',
            buyingIntent: aiResponse.buyingIntent || 'LOW',
            potentialRevenue: aiResponse.potentialRevenue || 0,
            lastContactedAt: new Date()
        };

        if (existingLead) {
            await prisma.lead.update({
                where: { id: existingLead.id },
                data: {
                    ...leadData,
                    // Upgrade status if score is high enough
                    status: aiResponse.leadScore >= 80 ? 'QUALIFIED'
                        : aiResponse.leadScore >= 50 ? 'QUALIFYING'
                        : existingLead.status
                }
            });

            // Create revenue opportunity for high-value qualified leads
            if (aiResponse.leadScore >= 80 && aiResponse.potentialRevenue > 0) {
                const existingOpp = await prisma.revenueOpportunity.findFirst({
                    where: { leadId: existingLead.id }
                });

                if (!existingOpp) {
                    await prisma.revenueOpportunity.create({
                        data: {
                            organizationId: orgId,
                            leadId: existingLead.id,
                            title: `${customerId.substring(0, 8)} — ${aiResponse.intent || 'Lead'}`,
                            potentialRevenue: aiResponse.potentialRevenue,
                            leadScore: aiResponse.leadScore,
                            reason: aiResponse.recommendation || 'AI identified revenue opportunity',
                            recommendedAction: 'Follow up with customer',
                            status: 'OPEN'
                        }
                    });
                }
            }
        } else {
            const newLead = await prisma.lead.create({
                data: {
                    organizationId: orgId,
                    customerId,
                    conversationId,
                    ...leadData,
                    status: aiResponse.leadScore >= 80 ? 'QUALIFIED'
                        : aiResponse.leadScore >= 50 ? 'QUALIFYING'
                        : 'NEW'
                }
            });

            if (aiResponse.leadScore >= 80 && aiResponse.potentialRevenue > 0) {
                await prisma.revenueOpportunity.create({
                    data: {
                        organizationId: orgId,
                        leadId: newLead.id,
                        title: `${customerId.substring(0, 8)} — ${aiResponse.intent || 'New Lead'}`,
                        potentialRevenue: aiResponse.potentialRevenue,
                        leadScore: aiResponse.leadScore,
                        reason: aiResponse.recommendation || 'New high-value lead identified',
                        recommendedAction: 'Assign sales rep and follow up',
                        status: 'OPEN'
                    }
                });
            }
        }
    } catch (error) {
        console.error('[Messenger Webhook] Lead update error:', error);
    }
}

// ============================================================================
// Handle Postback Events
// ============================================================================
async function handlePostback(psid, payload) {
    console.log(`[Messenger Webhook] Postback from ${psid}: ${payload}`);

    // Default postback response
    const response = `Thanks for your interest! I'm here to help you with ABC Fashion products and services. What can I assist you with?`;

    if (PAGE_ACCESS_TOKEN) {
        await sendToMessenger(psid, response);
    }
}

// ============================================================================
// Send Message to Messenger
// ============================================================================
async function sendToMessenger(psid, text) {
    if (!PAGE_ACCESS_TOKEN) {
        console.log('[Messenger Webhook] ⚠️ No page access token — message not sent');
        return;
    }

    try {
        const url = `https://graph.facebook.com/v18.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                recipient: { id: psid },
                message: { text }
            })
        });

        if (response.ok) {
            console.log(`[Messenger Webhook] ✅ Message sent to ${psid}`);
        } else {
            const error = await response.text();
            console.error(`[Messenger Webhook] ❌ Failed to send: ${error}`);
        }
    } catch (error) {
        console.error('[Messenger Webhook] ❌ Send error:', error.message);
    }
}

module.exports = router;