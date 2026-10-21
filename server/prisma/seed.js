const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting LeadFlow AI — ABC Fashion seed...');

    // ============================================================================
    // ORGANIZATION
    // ============================================================================
    console.log('\n📦 Creating organization...');

    const org = await prisma.organization.upsert({
        where: { slug: 'abc-fashion' },
        update: {},
        create: {
            name: 'ABC Fashion',
            slug: 'abc-fashion',
            settings: {
                timezone: 'Africa/Cairo',
                dateFormat: 'DD/MM/YYYY',
                currency: 'EGP',
                ai: {
                    autonomyLevel: 2, // 1-4, where 2 means low-risk auto, high-risk needs approval
                    defaultChatflowId: null, // to be configured
                    language: 'en'
                }
            }
        }
    });
    console.log('✅ Created organization:', org.name);

    // ============================================================================
    // USERS
    // ============================================================================
    console.log('\n👥 Creating users...');

    const adminHash = await bcrypt.hash('admin123', 10);
    const userHash = await bcrypt.hash('user123', 10);

    const admin = await prisma.user.upsert({
        where: { email: 'admin@abcfashion.com' },
        update: {},
        create: {
            email: 'admin@abcfashion.com',
            passwordHash: adminHash,
            displayName: 'Ahmed Hassan',
            role: 'ADMIN',
            active: true,
            currentOrganizationId: org.id
        }
    });
    console.log('✅ Admin:', admin.email);

    const manager = await prisma.user.upsert({
        where: { email: 'manager@abcfashion.com' },
        update: {},
        create: {
            email: 'manager@abcfashion.com',
            passwordHash: userHash,
            displayName: 'Sara Mahmoud',
            role: 'MANAGER',
            active: true,
            currentOrganizationId: org.id
        }
    });
    console.log('✅ Manager:', manager.email);

    const salesRep1 = await prisma.user.upsert({
        where: { email: 'layla@abcfashion.com' },
        update: {},
        create: {
            email: 'layla@abcfashion.com',
            passwordHash: userHash,
            displayName: 'Layla Ibrahim',
            role: 'SALES_REP',
            active: true,
            currentOrganizationId: org.id
        }
    });
    console.log('✅ Sales Rep:', salesRep1.email);

    const salesRep2 = await prisma.user.upsert({
        where: { email: 'omar@abcfashion.com' },
        update: {},
        create: {
            email: 'omar@abcfashion.com',
            passwordHash: userHash,
            displayName: 'Omar Khalid',
            role: 'SALES_REP',
            active: true,
            currentOrganizationId: org.id
        }
    });
    console.log('✅ Sales Rep:', salesRep2.email);

    const viewer = await prisma.user.upsert({
        where: { email: 'viewer@abcfashion.com' },
        update: {},
        create: {
            email: 'viewer@abcfashion.com',
            passwordHash: userHash,
            displayName: 'Nadia Farouk',
            role: 'VIEWER',
            active: true,
            currentOrganizationId: org.id
        }
    });
    console.log('✅ Viewer:', viewer.email);

    // ============================================================================
    // ORGANIZATION MEMBERSHIPS
    // ============================================================================
    console.log('\n🔗 Creating memberships...');

    const memberships = [
        { userId: admin.id, role: 'OWNER' },
        { userId: manager.id, role: 'MANAGER' },
        { userId: salesRep1.id, role: 'SALES_REP' },
        { userId: salesRep2.id, role: 'SALES_REP' },
        { userId: viewer.id, role: 'VIEWER' }
    ];

    for (const m of memberships) {
        await prisma.organizationMember.upsert({
            where: {
                organizationId_userId: {
                    organizationId: org.id,
                    userId: m.userId
                }
            },
            update: {},
            create: {
                organizationId: org.id,
                userId: m.userId,
                role: m.role
            }
        });
    }
    console.log(`✅ Created ${memberships.length} memberships`);

    // ============================================================================
    // SUBSCRIPTION
    // ============================================================================
    console.log('\n💳 Creating subscription...');

    const now = new Date();
    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    await prisma.subscription.upsert({
        where: { organizationId: org.id },
        update: {},
        create: {
            organizationId: org.id,
            plan: 'PRO',
            status: 'ACTIVE',
            currentPeriodStart: now,
            currentPeriodEnd: periodEnd
        }
    });
    console.log('✅ PRO subscription created');

    // ============================================================================
    // PRODUCTS — ABC Fashion Collection
    // ============================================================================
    console.log('\n👕 Creating products...');

    const products = await Promise.all([
        prisma.product.create({
            data: {
                organizationId: org.id,
                name: 'Classic Denim Jacket',
                description: 'Timeless blue denim jacket with a modern fit. Made from premium cotton denim.',
                price: 1899,
                category: 'Outerwear',
                sku: 'ABC-DJ-001',
                isActive: true
            }
        }),
        prisma.product.create({
            data: {
                organizationId: org.id,
                name: 'Cashmere Blend Scarf',
                description: 'Luxurious cashmere blend scarf in charcoal grey. Perfect for winter layering.',
                price: 899,
                category: 'Accessories',
                sku: 'ABC-CS-002',
                isActive: true
            }
        }),
        prisma.product.create({
            data: {
                organizationId: org.id,
                name: 'Slim Fit Oxford Shirt',
                description: 'Crisp white Oxford shirt with a slim fit. 100% Egyptian cotton.',
                price: 1299,
                category: 'Shirts',
                sku: 'ABC-OX-003',
                isActive: true
            }
        }),
        prisma.product.create({
            data: {
                organizationId: org.id,
                name: 'Leather Crossbody Bag',
                description: 'Genuine leather crossbody bag with adjustable strap and multiple compartments.',
                price: 3499,
                category: 'Accessories',
                sku: 'ABC-LB-004',
                isActive: true
            }
        }),
        prisma.product.create({
            data: {
                organizationId: org.id,
                name: 'Merino Wool Sweater',
                description: 'Fine merino wool crew neck sweater in navy. Lightweight yet warm.',
                price: 2199,
                category: 'Knitwear',
                sku: 'ABC-MW-005',
                isActive: true
            }
        }),
        prisma.product.create({
            data: {
                organizationId: org.id,
                name: 'Tailored Trousers',
                description: 'Modern tailored trousers in charcoal. Stretch cotton blend for comfort.',
                price: 1599,
                category: 'Bottoms',
                sku: 'ABC-TT-006',
                isActive: true
            }
        }),
        prisma.product.create({
            data: {
                organizationId: org.id,
                name: 'Silk Evening Dress',
                description: 'Elegant silk evening dress in midnight blue. Floor-length with subtle draping.',
                price: 5499,
                category: 'Dresses',
                sku: 'ABC-SD-007',
                isActive: true
            }
        }),
        prisma.product.create({
            data: {
                organizationId: org.id,
                name: 'Leather Chelsea Boots',
                description: 'Handcrafted leather Chelsea boots in tan brown. Durable leather sole.',
                price: 4299,
                category: 'Footwear',
                sku: 'ABC-CB-008',
                isActive: true
            }
        }),
        prisma.product.create({
            data: {
                organizationId: org.id,
                name: 'Linen Blazer',
                description: 'Lightweight linen blazer in beige. Unlined for warm weather.',
                price: 3299,
                category: 'Outerwear',
                sku: 'ABC-LB-009',
                isActive: true
            }
        }),
        prisma.product.create({
            data: {
                organizationId: org.id,
                name: 'Silk Tie Collection',
                description: 'Set of 3 Italian silk ties in navy, burgundy, and silver.',
                price: 1399,
                category: 'Accessories',
                sku: 'ABC-ST-010',
                isActive: true
            }
        })
    ]);
    console.log(`✅ Created ${products.length} products`);

    // ============================================================================
    // CUSTOMERS
    // ============================================================================
    console.log('\n👤 Creating customers...');

    const customers = await Promise.all([
        prisma.customer.create({
            data: {
                organizationId: org.id,
                externalId: 'psid_1001',
                channel: 'MESSENGER',
                name: 'Yasmine Adel',
                email: 'yasmine.a@gmail.com',
                phone: '+201001234567',
                firstSeenAt: new Date('2026-07-28T10:00:00Z'),
                lastSeenAt: new Date('2026-08-12T15:30:00Z')
            }
        }),
        prisma.customer.create({
            data: {
                organizationId: org.id,
                externalId: 'psid_1002',
                channel: 'MESSENGER',
                name: 'Karim Naguib',
                email: 'karim.n@yahoo.com',
                phone: '+201009876543',
                firstSeenAt: new Date('2026-08-01T09:00:00Z'),
                lastSeenAt: new Date('2026-08-13T11:00:00Z')
            }
        }),
        prisma.customer.create({
            data: {
                organizationId: org.id,
                externalId: 'psid_1003',
                channel: 'MESSENGER',
                name: 'Nour El-Din',
                email: 'nour.din@hotmail.com',
                firstSeenAt: new Date('2026-08-05T14:00:00Z'),
                lastSeenAt: new Date('2026-08-13T09:15:00Z')
            }
        }),
        prisma.customer.create({
            data: {
                organizationId: org.id,
                externalId: null,
                channel: 'INSTAGRAM',
                name: 'Mariam Wadie',
                email: 'mariam.w@icloud.com',
                firstSeenAt: new Date('2026-08-10T16:00:00Z'),
                lastSeenAt: new Date('2026-08-12T20:00:00Z')
            }
        }),
        prisma.customer.create({
            data: {
                organizationId: org.id,
                externalId: 'psid_1004',
                channel: 'MESSENGER',
                name: 'Hossam Badr',
                email: 'hossam.b@gmail.com',
                phone: '+201001112233',
                firstSeenAt: new Date('2026-08-08T08:00:00Z'),
                lastSeenAt: new Date('2026-08-13T14:45:00Z')
            }
        }),
        prisma.customer.create({
            data: {
                organizationId: org.id,
                externalId: 'psid_1005',
                channel: 'MESSENGER',
                name: 'Dina El-Shafei',
                email: 'dina.s@gmail.com',
                firstSeenAt: new Date('2026-07-20T11:00:00Z'),
                lastSeenAt: new Date('2026-08-11T17:30:00Z')
            }
        }),
        prisma.customer.create({
            data: {
                organizationId: org.id,
                externalId: null,
                channel: 'MESSENGER',
                name: 'Amr Khaled',
                email: 'amr.k@outlook.com',
                firstSeenAt: new Date('2026-08-12T19:00:00Z'),
                lastSeenAt: new Date('2026-08-13T10:00:00Z')
            }
        })
    ]);
    console.log(`✅ Created ${customers.length} customers`);

    // ============================================================================
    // CONVERSATIONS & MESSAGES
    // ============================================================================
    console.log('\n💬 Creating conversations...');

    const [conv1, conv2, conv3, conv4, conv5] = await Promise.all([
        // Conversation 1 — Yasmine — Active, high lead score
        prisma.conversation.create({
            data: {
                organizationId: org.id,
                customerId: customers[0].id,
                channel: 'MESSENGER',
                channelThreadId: 'thread_1001',
                status: 'ACTIVE',
                assignedTo: salesRep1.id,
                lastMessageAt: new Date('2026-08-12T15:30:00Z')
            }
        }),
        // Conversation 2 — Karim — Active, medium lead
        prisma.conversation.create({
            data: {
                organizationId: org.id,
                customerId: customers[1].id,
                channel: 'MESSENGER',
                channelThreadId: 'thread_1002',
                status: 'ACTIVE',
                assignedTo: salesRep2.id,
                lastMessageAt: new Date('2026-08-13T11:00:00Z')
            }
        }),
        // Conversation 3 — Nour — Active, new lead
        prisma.conversation.create({
            data: {
                organizationId: org.id,
                customerId: customers[2].id,
                channel: 'MESSENGER',
                channelThreadId: 'thread_1003',
                status: 'ACTIVE',
                lastMessageAt: new Date('2026-08-13T09:15:00Z')
            }
        }),
        // Conversation 4 — Hossam — Active, high intent
        prisma.conversation.create({
            data: {
                organizationId: org.id,
                customerId: customers[4].id,
                channel: 'MESSENGER',
                channelThreadId: 'thread_1004',
                status: 'ACTIVE',
                assignedTo: salesRep1.id,
                lastMessageAt: new Date('2026-08-13T14:45:00Z')
            }
        }),
        // Conversation 5 — Dina — Resolved
        prisma.conversation.create({
            data: {
                organizationId: org.id,
                customerId: customers[5].id,
                channel: 'MESSENGER',
                channelThreadId: 'thread_1005',
                status: 'RESOLVED',
                assignedTo: salesRep2.id,
                lastMessageAt: new Date('2026-08-11T17:30:00Z')
            }
        })
    ]);
    console.log(`✅ Created 5 conversations`);

    // Messages for Conversation 1 — Yasmine (Product Inquiry → High intent)
    const yasmineMessages = [
        { sender: 'CUSTOMER', content: 'Hi! I saw your Classic Denim Jacket on Instagram and I love it! Do you have it in stock?' },
        { sender: 'AI', content: 'Hello Yasmine! 👋 Yes, the Classic Denim Jacket (SKU: ABC-DJ-001) is in stock. We have sizes S through XXL available. It\'s priced at EGP 1,899. Would you like more details about the fabric or fit?' },
        { sender: 'CUSTOMER', content: 'Great! What sizes do you have in the light wash? I\'m usually a medium.' },
        { sender: 'AI', content: 'The light wash version is available in sizes S, M, L, and XL in stock. Size M should fit you perfectly! The jacket is made from premium cotton denim with a slight stretch for comfort. We also offer free shipping on orders over EGP 2,000. Would you like to place an order?' },
        { sender: 'CUSTOMER', content: 'That sounds perfect! Can I also see the Merino Wool Sweater in navy? I might get both.' },
        { sender: 'AI', content: 'Excellent choice! The Merino Wool Sweater in navy (EGP 2,199) is one of our best sellers. Together with the Denim Jacket (EGP 1,899), your total would be EGP 4,098 — which qualifies for free shipping! 🎉 Would you like me to help you place the order?' },
        { sender: 'CUSTOMER', content: 'Yes please! But do you offer any discount for first-time buyers?' }
    ];
    for (const msg of yasmineMessages) {
        await prisma.message.create({
            data: {
                conversationId: conv1.id,
                sender: msg.sender,
                content: msg.content,
                aiAnalysis: msg.sender === 'AI' ? {
                    intent: 'Product Inquiry',
                    leadScore: 91,
                    buyingIntent: 'HIGH',
                    potentialRevenue: 4098,
                    recommendation: 'Continue qualification — customer is showing strong buying signals'
                } : undefined
            }
        });
    }
    console.log('✅ Messages for Yasmine created');

    // Messages for Conversation 2 — Karim (Support)
    const karimMessages = [
        { sender: 'CUSTOMER', content: 'Hello, I ordered the Leather Chelsea Boots last week but haven\'t received any shipping update.' },
        { sender: 'AI', content: 'Hello Karim! I\'m sorry to hear that. Let me check your order status. Could you please provide your order number so I can look into it?' },
        { sender: 'CUSTOMER', content: 'Sure, my order number is ORD-2026-00842.' },
        { sender: 'AI', content: 'Thank you! I can see your order (ORD-2026-00842) is currently in "Processing" stage. Our team is preparing your Chelsea Boots for shipment. Typically, orders are dispatched within 2-3 business days. Since you ordered on August 10th, it should ship by tomorrow at the latest. I\'ll notify you as soon as it\'s dispatched! Is there anything else I can help with?' },
        { sender: 'CUSTOMER', content: 'Okay, thanks. Also, do you have these in brown? I might want another pair.' },
        { sender: 'AI', content: 'Yes! The Leather Chelsea Boots also come in dark brown (SKU: ABC-CB-008-BRN) at the same price of EGP 4,299. Would you like me to add a brown pair to your existing order? I can check with our team if that\'s possible before dispatch.' }
    ];
    for (const msg of karimMessages) {
        await prisma.message.create({
            data: {
                conversationId: conv2.id,
                sender: msg.sender,
                content: msg.content,
                aiAnalysis: msg.sender === 'AI' ? {
                    intent: 'Order Support',
                    leadScore: 68,
                    buyingIntent: 'MEDIUM',
                    potentialRevenue: 4299,
                    recommendation: 'Resolve shipping issue first, then upsell brown boots'
                } : undefined
            }
        });
    }
    console.log('✅ Messages for Karim created');

    // Messages for Conversation 3 — Nour (New inquiry)
    const nourMessages = [
        { sender: 'CUSTOMER', content: 'Hi! What fabric is the Linen Blazer made of?' },
        { sender: 'AI', content: 'Hello Nour! 👋 The Linen Blazer (EGP 3,299) is made from 100% premium European linen. It\'s unlined, making it perfect for warm weather. Available in beige, navy, and light grey. Would you like to know more about sizing or see how it pairs with our tailored trousers?' },
        { sender: 'CUSTOMER', content: 'I\'m interested in the beige one. Does it come in size 42 (European)?' },
        { sender: 'AI', content: 'Yes, the beige Linen Blazer is available in European size 42 (which corresponds to a US size 42 Regular / UK 42R). It\'s in stock and ready to ship. If you order today, you could receive it within 3-5 business days. Would you like to proceed with the order?' }
    ];
    for (const msg of nourMessages) {
        await prisma.message.create({
            data: {
                conversationId: conv3.id,
                sender: msg.sender,
                content: msg.content,
                aiAnalysis: msg.sender === 'AI' ? {
                    intent: 'Product Inquiry',
                    leadScore: 55,
                    buyingIntent: 'MEDIUM',
                    potentialRevenue: 3299,
                    recommendation: 'Provide sizing guidance and close the sale'
                } : undefined
            }
        });
    }
    console.log('✅ Messages for Nour created');

    // Messages for Conversation 4 — Hossam (High intent, wants multiple items)
    const hossamMessages = [
        { sender: 'CUSTOMER', content: 'I\'m looking for a complete outfit for a wedding next month. Can you help?' },
        { sender: 'AI', content: 'Absolutely, Hossam! 🎉 I\'d love to help you find the perfect wedding outfit. Let me suggest a few options:\n\n1. Slim Fit Oxford Shirt (EGP 1,299) — Crisp white Egyptian cotton\n2. Tailored Trousers in charcoal (EGP 1,599)\n3. Silk Tie Collection (EGP 1,399) — Navy, burgundy, silver\n4. Leather Chelsea Boots in tan (EGP 4,299)\n\nWould you like me to put together a complete look? We also have a Linen Blazer that could complete the outfit beautifully!' },
        { sender: 'CUSTOMER', content: 'That sounds amazing. I\'ll take the Oxford shirt, the trousers, and the tie set. But I need a 15% discount since I\'m buying multiple items.' },
        { sender: 'AI', content: 'Thank you for your interest, Hossam! I can offer you a 10% bundle discount on those three items, bringing the total from EGP 4,297 to approximately EGP 3,867. Unfortunately, a 15% discount requires manager approval as it exceeds my automated discount limit. Would you like me to proceed with the 10% discount, or should I request approval for the 15%?' },
        { sender: 'CUSTOMER', content: 'Let me think about it. Can you also tell me about the return policy?' },
        { sender: 'AI', content: 'Of course! Our return policy:\n\n• 30-day return window from delivery date\n• Items must be unworn with tags attached\n• Free returns for store credit\n• Refunds processed within 5-7 business days\n• Full refund if item is defective\n\nTake your time! I\'ll save the 10% bundle offer for you. Just let me know when you\'re ready to order 😊' }
    ];
    for (const msg of hossamMessages) {
        await prisma.message.create({
            data: {
                conversationId: conv4.id,
                sender: msg.sender,
                content: msg.content,
                aiAnalysis: msg.sender === 'AI' ? {
                    intent: 'Wedding Outfit Shopping',
                    leadScore: 84,
                    buyingIntent: 'VERY_HIGH',
                    potentialRevenue: 4297,
                    recommendation: 'Bundle discount offered. Customer asked for 15% — high risk, needs approval if >10%. Follow up in 24h.'
                } : undefined
            }
        });
    }
    console.log('✅ Messages for Hossam created');

    // Messages for Conversation 5 — Dina (Resolved)
    const dinaMessages = [
        { sender: 'CUSTOMER', content: 'Hi, I received my Silk Evening Dress but it\'s slightly too long. Can I exchange for a shorter length?' },
        { sender: 'AI', content: 'Hello Dina! I\'m sorry the dress doesn\'t fit perfectly. We do offer free alterations within 14 days of delivery. You can either:\n\n1. Visit our Cairo showroom for complimentary tailoring\n2. We can arrange a pickup and our seamstress will adjust it\n3. Exchange for a different size—the dress also comes in petite sizing\n\nWhich option works best for you?' },
        { sender: 'CUSTOMER', content: 'Option 2 please! Can you arrange the pickup?' },
        { sender: 'AI', content: 'Absolutely! I\'ve scheduled a pickup for tomorrow (August 12th) between 10 AM and 2 PM. Our team will collect the dress, alter it to your preferred length, and return it within 3-5 business days. You\'ll receive a confirmation SMS shortly. Is there anything else I can help with?' },
        { sender: 'CUSTOMER', content: 'Perfect, thank you so much!' }
    ];
    for (const msg of dinaMessages) {
        await prisma.message.create({
            data: {
                conversationId: conv5.id,
                sender: msg.sender,
                content: msg.content,
                aiAnalysis: msg.sender === 'AI' ? {
                    intent: 'Alteration Request',
                    leadScore: 0,
                    buyingIntent: 'LOW',
                    potentialRevenue: 0,
                    recommendation: 'Post-purchase support — resolved successfully'
                } : undefined
            }
        });
    }
    console.log('✅ Messages for Dina created');

    // ============================================================================
    // LEADS
    // ============================================================================
    console.log('\n🎯 Creating leads...');

    const lead1 = await prisma.lead.create({
        data: {
            organizationId: org.id,
            customerId: customers[0].id,
            conversationId: conv1.id,
            leadScore: 91,
            intent: 'Product Inquiry',
            buyingIntent: 'HIGH',
            potentialRevenue: 4098,
            status: 'QUALIFYING',
            assignedTo: salesRep1.id,
            source: 'MESSENGER',
            lastContactedAt: new Date('2026-08-12T15:30:00Z')
        }
    });
    console.log('✅ Lead: Yasmine (Score: 91, Revenue: EGP 4,098)');

    const lead2 = await prisma.lead.create({
        data: {
            organizationId: org.id,
            customerId: customers[1].id,
            conversationId: conv2.id,
            leadScore: 68,
            intent: 'Order Support',
            buyingIntent: 'MEDIUM',
            potentialRevenue: 4299,
            status: 'QUALIFYING',
            assignedTo: salesRep2.id,
            source: 'MESSENGER',
            lastContactedAt: new Date('2026-08-13T11:00:00Z')
        }
    });
    console.log('✅ Lead: Karim (Score: 68, Revenue: EGP 4,299)');

    const lead3 = await prisma.lead.create({
        data: {
            organizationId: org.id,
            customerId: customers[2].id,
            conversationId: conv3.id,
            leadScore: 55,
            intent: 'Product Inquiry',
            buyingIntent: 'MEDIUM',
            potentialRevenue: 3299,
            status: 'NEW',
            source: 'MESSENGER',
            lastContactedAt: new Date('2026-08-13T09:15:00Z')
        }
    });
    console.log('✅ Lead: Nour (Score: 55, Revenue: EGP 3,299)');

    const lead4 = await prisma.lead.create({
        data: {
            organizationId: org.id,
            customerId: customers[4].id,
            conversationId: conv4.id,
            leadScore: 84,
            intent: 'Wedding Outfit Shopping',
            buyingIntent: 'VERY_HIGH',
            potentialRevenue: 4297,
            status: 'QUALIFYING',
            assignedTo: salesRep1.id,
            source: 'MESSENGER',
            lastContactedAt: new Date('2026-08-13T14:45:00Z')
        }
    });
    console.log('✅ Lead: Hossam (Score: 84, Revenue: EGP 4,297)');

    // ============================================================================
    // REVENUE OPPORTUNITIES
    // ============================================================================
    console.log('\n💰 Creating revenue opportunities...');

    await Promise.all([
        prisma.revenueOpportunity.create({
            data: {
                organizationId: org.id,
                leadId: lead1.id,
                title: 'Yasmine Adel — Denim Jacket + Sweater Bundle',
                potentialRevenue: 4098,
                leadScore: 91,
                reason: 'Customer showed strong interest in two products and asked about first-time buyer discount. High probability of conversion.',
                recommendedAction: 'Offer 10% first-time buyer discount to close the bundle sale. Total after discount: EGP 3,688.',
                status: 'IN_PROGRESS'
            }
        }),
        prisma.revenueOpportunity.create({
            data: {
                organizationId: org.id,
                leadId: lead4.id,
                title: 'Hossam Badr — Wedding Outfit Package',
                potentialRevenue: 4297,
                leadScore: 84,
                reason: 'Customer is actively building a wedding outfit and requested 15% discount. Strong buying intent but negotiating on price.',
                recommendedAction: 'Manager approval needed for >10% discount. Consider approving 12-15% to secure multi-item order. Follow up within 24h.',
                status: 'OPEN'
            }
        }),
        prisma.revenueOpportunity.create({
            data: {
                organizationId: org.id,
                leadId: lead2.id,
                title: 'Karim Naguib — Brown Chelsea Boots Add-on',
                potentialRevenue: 4299,
                leadScore: 68,
                reason: 'Customer is interested in purchasing an additional pair of boots in brown. Current order still processing — opportunity to add on.',
                recommendedAction: 'Resolve current order shipping first, then propose adding brown boots to existing order before dispatch.',
                status: 'OPEN'
            }
        })
    ]);
    console.log('✅ Created 3 revenue opportunities');

    // ============================================================================
    // ORDERS
    // ============================================================================
    console.log('\n📋 Creating orders...');

    const order1 = await prisma.order.create({
        data: {
            organizationId: org.id,
            customerId: customers[1].id, // Karim
            orderDate: new Date('2026-08-10T14:00:00Z'),
            status: 'PROCESSING',
            totalAmount: 4299,
            assignedTo: salesRep2.id,
            items: {
                create: [
                    {
                        productId: products[7].id, // Chelsea Boots
                        quantity: 1,
                        unitPrice: 4299,
                        totalPrice: 4299
                    }
                ]
            }
        }
    });
    console.log('✅ Order 1: Karim — Chelsea Boots (EGP 4,299)');

    const order2 = await prisma.order.create({
        data: {
            organizationId: org.id,
            customerId: customers[5].id, // Dina
            orderDate: new Date('2026-08-05T11:00:00Z'),
            status: 'DELIVERED',
            totalAmount: 5499,
            assignedTo: salesRep2.id,
            items: {
                create: [
                    {
                        productId: products[6].id, // Silk Evening Dress
                        quantity: 1,
                        unitPrice: 5499,
                        totalPrice: 5499
                    }
                ]
            }
        }
    });
    console.log('✅ Order 2: Dina — Silk Evening Dress (EGP 5,499)');

    const order3 = await prisma.order.create({
        data: {
            organizationId: org.id,
            customerId: customers[3].id, // Mariam (Instagram)
            orderDate: new Date('2026-08-11T18:00:00Z'),
            status: 'SHIPPED',
            totalAmount: 2199,
            items: {
                create: [
                    {
                        productId: products[4].id, // Merino Wool Sweater
                        quantity: 1,
                        unitPrice: 2199,
                        totalPrice: 2199
                    }
                ]
            }
        }
    });
    console.log('✅ Order 3: Mariam — Merino Wool Sweater (EGP 2,199)');

    const order4 = await prisma.order.create({
        data: {
            organizationId: org.id,
            customerId: customers[0].id, // Yasmine
            orderDate: new Date('2026-07-30T10:00:00Z'),
            status: 'DELIVERED',
            totalAmount: 1899,
            items: {
                create: [
                    {
                        productId: products[0].id, // Classic Denim Jacket
                        quantity: 1,
                        unitPrice: 1899,
                        totalPrice: 1899
                    }
                ]
            }
        }
    });
    console.log('✅ Order 4: Yasmine — Denim Jacket (EGP 1,899)');

    const order5 = await prisma.order.create({
        data: {
            organizationId: org.id,
            customerId: customers[4].id, // Hossam
            orderDate: new Date('2026-08-01T09:00:00Z'),
            status: 'CONFIRMED',
            totalAmount: 1299,
            items: {
                create: [
                    {
                        productId: products[2].id, // Slim Fit Oxford Shirt
                        quantity: 1,
                        unitPrice: 1299,
                        totalPrice: 1299
                    }
                ]
            }
        }
    });
    console.log('✅ Order 5: Hossam — Oxford Shirt (EGP 1,299)');

    // ============================================================================
    // KNOWLEDGE BASE
    // ============================================================================
    console.log('\n📚 Creating knowledge base entries...');

    const knowledgeItems = [
        {
            title: 'Shipping Policy',
            content: 'ABC Fashion offers free shipping on orders over EGP 2,000. Standard shipping takes 3-5 business days within Egypt. Express shipping (1-2 business days) is available for an additional EGP 150. International shipping is available to select GCC countries with 7-14 day delivery.',
            category: 'SHIPPING',
            tags: ['shipping', 'delivery', 'free shipping', 'express']
        },
        {
            title: 'Return & Exchange Policy',
            content: 'Items can be returned within 30 days of delivery. Items must be unworn, unwashed, and with tags attached. Free returns for store credit. Refunds processed within 5-7 business days to original payment method. Exchanges are free of charge. Sale items are final sale unless defective.',
            category: 'RETURN',
            tags: ['return', 'exchange', 'refund', 'policy']
        },
        {
            title: 'Sizing Guide',
            content: 'Our sizes follow standard European sizing. XS=EU 44, S=EU 46, M=EU 48, L=EU 50, XL=EU 52, XXL=EU 54. For shirts, we also offer neck size measurements. For trousers, we provide waist and inseam measurements in centimeters. We recommend checking the size guide on each product page for exact measurements.',
            category: 'FAQ',
            tags: ['sizing', 'measurements', 'fit']
        },
        {
            title: 'Classic Denim Jacket Details',
            content: 'The Classic Denim Jacket is made from 100% premium cotton denim (12oz weight). Features include: button front closure, two chest pockets, adjustable waist tabs, and a modern tailored fit. Available in light wash, medium wash, and dark indigo. Machine wash cold, tumble dry low.',
            category: 'PRODUCT',
            tags: ['denim jacket', 'product details', 'care instructions']
        },
        {
            title: 'Payment Methods',
            content: 'We accept Visa, Mastercard, American Express, Meeza, and cash on delivery (COD) within Egypt. All online payments are processed through our secure payment gateway. BNPL (Buy Now Pay Later) is available through ValU and Sympl for orders over EGP 1,000.',
            category: 'POLICY',
            tags: ['payment', 'credit card', 'COD', 'BNPL']
        },
        {
            title: 'About ABC Fashion',
            content: 'ABC Fashion is a premium fashion retailer based in Cairo, Egypt. Founded in 2020, we specialize in contemporary menswear and womenswear with a focus on quality fabrics and timeless designs. We source materials from Italy, France, and Egypt. Our flagship store is located in New Cairo, and we ship nationwide.',
            category: 'BUSINESS_INFO',
            tags: ['about', 'company', 'history', 'location']
        },
        {
            title: 'Price Matching Policy',
            content: 'We offer price matching on identical items from authorized Egyptian retailers. To request a price match, please provide a link or photo showing the lower price. Price match must be requested before purchase. We do not match prices from international retailers or marketplace sellers.',
            category: 'PRICE',
            tags: ['price match', 'pricing', 'guarantee']
        },
        {
            title: 'Alterations Service',
            content: 'ABC Fashion offers free alterations within 14 days of delivery for full-price items. Alterations include hemming trousers, shortening sleeves, and taking in waistbands. We can arrange pickup and delivery for alterations within Cairo. Alteration turnaround is 3-5 business days.',
            category: 'POLICY',
            tags: ['alterations', 'tailoring', 'adjustments']
        }
    ];

    for (const ki of knowledgeItems) {
        await prisma.knowledgeItem.create({
            data: {
                organizationId: org.id,
                title: ki.title,
                content: ki.content,
                category: ki.category,
                tags: ki.tags,
                isActive: true
            }
        });
    }
    console.log(`✅ Created ${knowledgeItems.length} knowledge base entries`);

    // ============================================================================
    // AI ACTIONS & APPROVALS
    // ============================================================================
    console.log('\n🤖 Creating AI actions and approvals...');

    // Low-risk auto action (FAQ response)
    const autoAction = await prisma.aIAction.create({
        data: {
            organizationId: org.id,
            conversationId: conv5.id,
            customerId: customers[5].id,
            actionType: 'auto_reply',
            input: { customerMessage: 'Perfect, thank you so much!', context: 'Alteration scheduled' },
            output: { response: 'You\'re welcome Dina! Enjoy your perfectly fitted dress. Have a wonderful day! 💃' },
            riskLevel: 'LOW',
            status: 'EXECUTED',
            requiresApproval: false,
            executedAt: new Date('2026-08-11T17:30:00Z')
        }
    });
    console.log('✅ AI Action: Auto reply to Dina (LOW risk — auto-executed)');

    // High-risk action needing approval (Hossam discount)
    const discountAction = await prisma.aIAction.create({
        data: {
            organizationId: org.id,
            conversationId: conv4.id,
            customerId: customers[4].id,
            actionType: 'send_discount',
            input: {
                customerMessage: 'I need a 15% discount since I\'m buying multiple items.',
                context: 'Customer building wedding outfit, 3 items (EGP 4,297). Requested 15% off.',
                maxAutoDiscount: 10
            },
            output: {
                recommendedDiscount: 10,
                requestedDiscount: 15,
                reason: 'Customer requested 15%. AI can auto-approve up to 10%. Manager approval needed for >10%.',
                recommendedAction: 'Consider approving 12% as compromise to secure EGP 4,297 order.'
            },
            riskLevel: 'HIGH',
            status: 'PENDING',
            requiresApproval: true
        }
    });
    console.log('✅ AI Action: Discount request from Hossam (HIGH risk — needs approval)');

    await prisma.approval.create({
        data: {
            organizationId: org.id,
            aiActionId: discountAction.id,
            requestedBy: salesRep1.id,
            status: 'PENDING',
            reason: 'Customer Hossam Badr requested 15% discount on 3-item bundle (EGP 4,297). AI recommends max 10% auto-approval. Manager decision needed on whether to approve up to 15%.'
        }
    });
    console.log('✅ Approval: Pending for Hossam discount');

    // Another pending AI action
    const escalationAction = await prisma.aIAction.create({
        data: {
            organizationId: org.id,
            conversationId: conv1.id,
            customerId: customers[0].id,
            actionType: 'escalate',
            input: {
                customerMessage: 'Yes please! But do you offer any discount for first-time buyers?',
                context: 'Customer interested in EGP 4,098 bundle. Asked about first-time buyer discount.'
            },
            output: {
                recommendation: 'Offer 10% first-time buyer discount to close. Total after discount: EGP 3,688. This is within auto-approval range.',
                suggestedResponse: 'We do! 🎉 As a first-time buyer, I can offer you a 10% discount on your first order. That brings your total from EGP 4,098 down to EGP 3,688! Would you like to proceed?'
            },
            riskLevel: 'MEDIUM',
            status: 'PENDING',
            requiresApproval: false
        }
    });
    console.log('✅ AI Action: First-time buyer discount suggestion (MEDIUM risk — pending response)');

    // ============================================================================
    // DASHBOARDS & REPORTS (sample)
    // ============================================================================
    console.log('\n📊 Creating sample dashboards...');

    await prisma.dashboard.create({
        data: {
            organizationId: org.id,
            userId: admin.id,
            title: 'LeadFlow Overview',
            description: 'Main revenue operations dashboard',
            sqlQuery: 'SELECT COUNT(*) as total_leads, SUM("potentialRevenue") as total_revenue FROM "Lead" WHERE "organizationId" = $1',
            chartConfig: { type: 'metric', metrics: ['total_leads', 'total_revenue'] },
            isPublic: true
        }
    });
    console.log('✅ Dashboard created');

    console.log('\n');
    console.log('🎉 LeadFlow AI — ABC Fashion database seeded successfully!');
    console.log('');
    console.log('📝 Demo Credentials:');
    console.log('');
    console.log('   Organization: ABC Fashion');
    console.log('   ───────────────────────────────────────────');
    console.log('   Owner:        admin@abcfashion.com / admin123');
    console.log('   Manager:      manager@abcfashion.com / user123');
    console.log('   Sales Rep 1:  layla@abcfashion.com   / user123');
    console.log('   Sales Rep 2:  omar@abcfashion.com    / user123');
    console.log('   Viewer:       viewer@abcfashion.com  / user123');
    console.log('');
    console.log('   Active Conversations:  Yasmine (91), Karim (68), Nour (55), Hossam (84)');
    console.log('   Revenue Opportunities: 3 open (EGP 12,694 total potential)');
    console.log('   Pending Approvals:     Hossam 15% discount request');
    console.log('   Knowledge Items:       8 entries across 6 categories');
    console.log('   Products:              10 fashion items');
    console.log('');
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });