const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'MicroMind Base Template API',
        version: '1.0.0'
    });
});

// API Routes
const authRoutes = require('./routes/auth');
const managerRoutes = require('./routes/manager');
app.use('/api/auth', authRoutes);
app.use('/api/manager', managerRoutes);
const dashboardRoutes = require('./routes/dashboards');
app.use('/api/dashboards', dashboardRoutes);
const aiRoutes = require('./routes/ai');
app.use('/api/v1/ai', aiRoutes);

// LeadFlow AI Routes
const leadflowRoutes = require('./routes/leadflow');
app.use('/api/leadflow', leadflowRoutes);

// Webhook Routes
const webhookRoutes = require('./routes/webhook');
app.use('/webhook', webhookRoutes);

// Placeholder routes
app.get('/api', (req, res) => {
    res.json({
        message: 'MicroMind Base Template API',
        version: '1.0.0',
        endpoints: {
            health: '/api/health',
            auth: '/api/auth/*',
            dashboards: '/api/dashboards/*',
            reports: '/api/reports/*',
            documents: '/api/documents/*'
        }
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.path} not found`
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// Start server
app.listen(PORT, () => {
    console.log('');
    console.log('🚀 MicroMind Base Template Server');
    console.log(`📡 Server running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`✅ Health check: http://localhost:${PORT}/api/health`);
    console.log('');
});

module.exports = app;
