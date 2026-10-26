import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import leadflowService from '../services/leadflowService';
import {
    MessageSquare, DollarSign, Target, CheckSquare,
    Activity, Zap, ArrowRight, Loader2, Calendar, ChevronDown,
    AlertTriangle, AlertCircle, RefreshCw, ShoppingBag, TrendingUp, BarChart3
} from 'lucide-react';

// Design-system tokens (fallbacks match the dark palette in index.css)
const SURFACE = 'var(--bg-surface, #1E2025)';
const BORDER = 'var(--border, #34363E)';
const TEXT_PRIMARY = 'var(--text-primary, #F5F6FA)';
const TEXT_SECONDARY = 'var(--text-secondary, #A9ADB8)';
const PRIMARY = 'var(--primary, #805BE7)';
const ACCENT_YELLOW = 'var(--accent-yellow, #E6B84D)';

const TIME_RANGES = ['24H', '7D', '30D', 'All Time'];

// Currency formatter for Egyptian Pounds (EGP)
const formatEGP = (amount) => {
    const num = Number(amount) || 0;
    return `EGP ${num.toLocaleString('en-US', {
        minimumFractionDigits: num % 1 !== 0 ? 2 : 0,
        maximumFractionDigits: 2
    })}`;
};

// Mock / Baseline timestamped dataset (hoursAgo relative to current time)
// Ensures "24H", "7D", "30D", and "All Time" always have realistic time-bucketed data
const MOCK_ORDERS_DATA = [
    { id: 'ord-1', customer: 'Yasmine Adel', item: 'Classic Denim Jacket + Sweater', amount: 4098, hoursAgo: 3, status: 'CONFIRMED' },
    { id: 'ord-2', customer: 'Hossam Badr', item: 'Linen Blazer', amount: 3299, hoursAgo: 9, status: 'PROCESSING' },
    { id: 'ord-3', customer: 'Mariam Wadie', item: 'Cashmere Blend Scarf', amount: 1798, hoursAgo: 18, status: 'DELIVERED' },
    { id: 'ord-4', customer: 'Karim Naguib', item: 'Leather Chelsea Boots', amount: 4299, hoursAgo: 42, status: 'DELIVERED' },
    { id: 'ord-5', customer: 'Dina El-Shafei', item: 'Silk Evening Dress', amount: 5499, hoursAgo: 84, status: 'DELIVERED' },
    { id: 'ord-6', customer: 'Amr Khaled', item: 'Tailored Trousers + Oxford Shirt', amount: 2898, hoursAgo: 130, status: 'SHIPPED' },
    { id: 'ord-7', customer: 'Nourhan Tarek', item: 'Leather Crossbody Bag', amount: 3499, hoursAgo: 240, status: 'DELIVERED' },
    { id: 'ord-8', customer: 'Omar Farouk', item: 'Merino Wool Sweater (x2)', amount: 4398, hoursAgo: 380, status: 'DELIVERED' },
    { id: 'ord-9', customer: 'Salma Hassan', item: 'Silk Tie Collection + Blazer', amount: 4698, hoursAgo: 540, status: 'DELIVERED' },
    { id: 'ord-10', customer: 'Tarek Mansour', item: 'Executive Capsule Wardrobe', amount: 8950, hoursAgo: 1100, status: 'DELIVERED' },
    { id: 'ord-11', customer: 'Layla Fouad', item: 'Evening Gown + Accessories', amount: 7390, hoursAgo: 1650, status: 'DELIVERED' },
];

const MOCK_CONVERSATIONS_DATA = [
    { id: 'conv-1', customerName: 'Yasmine Adel', channel: 'INSTAGRAM', status: 'ACTIVE', message: 'Confirmed size M in light wash denim jacket', hoursAgo: 2 },
    { id: 'conv-2', customerName: 'Hossam Badr', channel: 'MESSENGER', status: 'ACTIVE', message: 'Requested 15% bundle discount on wedding outfit', hoursAgo: 6 },
    { id: 'conv-3', customerName: 'Karim Naguib', channel: 'WHATSAPP', status: 'ACTIVE', message: 'Inquired about Brown Chelsea Boots availability', hoursAgo: 30 },
    { id: 'conv-4', customerName: 'Dina El-Shafei', channel: 'MESSENGER', status: 'RESOLVED', message: 'Order #1004 delivered and confirmed', hoursAgo: 72 },
    { id: 'conv-5', customerName: 'Amr Khaled', channel: 'INSTAGRAM', status: 'RESOLVED', message: 'Asked about return policy for tailored trousers', hoursAgo: 140 },
    { id: 'conv-6', customerName: 'Nourhan Tarek', channel: 'MESSENGER', status: 'RESOLVED', message: 'Completed checkout via AI payment link', hoursAgo: 260 },
    { id: 'conv-7', customerName: 'Omar Farouk', channel: 'WHATSAPP', status: 'RESOLVED', message: 'Product care inquiry for Merino Wool', hoursAgo: 490 },
    { id: 'conv-8', customerName: 'Salma Hassan', channel: 'INSTAGRAM', status: 'RESOLVED', message: 'VIP styling session scheduled', hoursAgo: 980 },
];

const MOCK_OPPORTUNITIES_DATA = [
    { id: 'opp-1', title: 'Yasmine Adel — Denim + Sweater Bundle', potentialRevenue: 4098, status: 'WON', hoursAgo: 4 },
    { id: 'opp-2', title: 'Hossam Badr — Wedding Outfit Package', potentialRevenue: 4297, status: 'OPEN', hoursAgo: 12 },
    { id: 'opp-3', title: 'Karim Naguib — Chelsea Boots Add-on', potentialRevenue: 4299, status: 'IN_PROGRESS', hoursAgo: 48 },
    { id: 'opp-4', title: 'Dina El-Shafei — Silk Evening Collection', potentialRevenue: 5499, status: 'WON', hoursAgo: 110 },
    { id: 'opp-5', title: 'Nourhan Tarek — Luxury Bag & Scarf', potentialRevenue: 4398, status: 'WON', hoursAgo: 310 },
    { id: 'opp-6', title: 'Omar Farouk — Winter Knitwear Bundle', potentialRevenue: 6597, status: 'OPEN', hoursAgo: 520 },
    { id: 'opp-7', title: 'Tarek Mansour — Corporate Bulk Order', potentialRevenue: 12400, status: 'WON', hoursAgo: 1200 },
];

const CHART_SERIES_BY_RANGE = {
    '24H': [
        { label: '00:00', sales: 850, orders: 1 },
        { label: '04:00', sales: 1200, orders: 1 },
        { label: '08:00', sales: 1798, orders: 1 },
        { label: '12:00', sales: 3299, orders: 2 },
        { label: '16:00', sales: 2450, orders: 1 },
        { label: '20:00', sales: 4098, orders: 2 },
    ],
    '7D': [
        { label: 'Mon', sales: 2898, orders: 2 },
        { label: 'Tue', sales: 3499, orders: 2 },
        { label: 'Wed', sales: 5499, orders: 3 },
        { label: 'Thu', sales: 4299, orders: 2 },
        { label: 'Fri', sales: 6150, orders: 4 },
        { label: 'Sat', sales: 7397, orders: 4 },
        { label: 'Sun', sales: 9195, orders: 5 },
    ],
    '30D': [
        { label: 'Week 1', sales: 8096, orders: 4 },
        { label: 'Week 2', sales: 11397, orders: 6 },
        { label: 'Week 3', sales: 14895, orders: 8 },
        { label: 'Week 4', sales: 21891, orders: 11 },
    ],
    'All Time': [
        { label: 'May', sales: 16340, orders: 7 },
        { label: 'Jun', sales: 22450, orders: 10 },
        { label: 'Jul', sales: 28900, orders: 13 },
        { label: 'Aug', sales: 34388, orders: 16 },
        { label: 'Sep', sales: 41200, orders: 19 },
        { label: 'Oct', sales: 50728, orders: 24 },
    ],
};

/**
 * Filtering function that dynamically recalculates dashboard metrics and chart data
 * based on the selected `timeRange` ("24H", "7D", "30D", "All Time").
 */
function filterDashboardDataByTimeRange(timeRange, liveSupabaseData) {
    const maxHoursMap = {
        '24H': 24,
        '7D': 24 * 7,
        '30D': 24 * 30,
        'All Time': Infinity,
    };
    const maxHours = maxHoursMap[timeRange] ?? Infinity;

    // Filter orders within the time window
    const filteredOrders = MOCK_ORDERS_DATA.filter(o => o.hoursAgo <= maxHours);
    const filteredConversations = MOCK_CONVERSATIONS_DATA.filter(c => c.hoursAgo <= maxHours);
    const filteredOpportunities = MOCK_OPPORTUNITIES_DATA.filter(op => op.hoursAgo <= maxHours);

    // Incorporate live Supabase totals into "All Time" (or proportionally when live data is present)
    const totalSales = filteredOrders.reduce((sum, ord) => sum + ord.amount, 0);
    const ordersCount = filteredOrders.length;
    const averageOrderValue = ordersCount > 0 ? Math.round(totalSales / ordersCount) : 0;

    const pipelineRevenue = timeRange === 'All Time' && liveSupabaseData?.pipelineRevenue > 0
        ? liveSupabaseData.pipelineRevenue
        : filteredOpportunities.reduce((sum, op) => sum + op.potentialRevenue, 0);

    const totalConversations = timeRange === 'All Time' && liveSupabaseData?.totalConversations > 0
        ? liveSupabaseData.totalConversations
        : filteredConversations.length;

    const wonOpportunities = filteredOpportunities.filter(op => op.status === 'WON').length;
    const winRate = filteredOpportunities.length > 0
        ? Math.round((wonOpportunities / filteredOpportunities.length) * 100)
        : (liveSupabaseData?.winRate ?? 0);

    const pendingApprovals = timeRange === '24H'
        ? 1
        : timeRange === '7D'
            ? 2
            : timeRange === '30D'
                ? 3
                : (liveSupabaseData?.pendingApprovals || 4);

    const chartData = CHART_SERIES_BY_RANGE[timeRange] || CHART_SERIES_BY_RANGE['All Time'];

    const recentActivity = filteredConversations.map(c => ({
        id: c.id,
        customerName: c.customerName,
        message: `${c.message} • ${c.channel}`,
        time: new Date(Date.now() - c.hoursAgo * 3600 * 1000).toISOString(),
    }));

    return {
        totalSales,
        ordersCount,
        averageOrderValue,
        totalConversations,
        pipelineRevenue,
        winRate,
        pendingApprovals,
        chartData,
        recentActivity,
    };
}

function HomePage() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [timeRange, setTimeRange] = useState('All Time');
    const [isTimeMenuOpen, setIsTimeMenuOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Live Supabase baseline states
    const [supabaseMetrics, setSupabaseMetrics] = useState({
        totalConversations: 0,
        pipelineRevenue: 0,
        winRate: 0,
        pendingApprovals: 0,
    });

    // Close custom dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsTimeMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Fetch live metrics from Supabase database
    const fetchDashboardData = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const [convRes, oppRes, appRes] = await Promise.all([
                supabase
                    .from('conversations')
                    .select('*', { count: 'exact', head: true }),
                supabase
                    .from('revenue_opportunities')
                    .select('potentialRevenue, status'),
                supabase
                    .from('approvals')
                    .select('*', { count: 'exact', head: true })
                    .eq('status', 'PENDING')
            ]);

            if (convRes.error) throw convRes.error;
            if (oppRes.error) throw oppRes.error;
            if (appRes.error) throw appRes.error;

            const convCount = convRes.count ?? 0;
            const opportunities = oppRes.data || [];
            const revenueSum = opportunities.reduce(
                (sum, opp) => sum + (Number(opp.potentialRevenue) || 0),
                0
            );

            const wonCount = opportunities.filter((opp) => {
                const status = (opp.status || '').toUpperCase();
                return status === 'WON' || status === 'CLOSED_WON';
            }).length;
            const calculatedWinRate = opportunities.length > 0
                ? Math.round((wonCount / opportunities.length) * 100)
                : 0;

            const pendingCount = appRes.count ?? 0;

            setSupabaseMetrics({
                totalConversations: convCount,
                pipelineRevenue: revenueSum,
                winRate: calculatedWinRate,
                pendingApprovals: pendingCount,
            });
        } catch (err) {
            console.error('Error fetching Supabase metrics:', err);
            setError(err.message || 'Failed to connect to Supabase database. Using cached dashboard dataset.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            try {
                setUser(JSON.parse(userData));
            } catch (e) {
                console.error('Error parsing user data:', e);
            }
        }

        fetchDashboardData();

        leadflowService.getDashboard()
            .then((data) => {
                if (data?.recentActivity?.length) {
                    setDashboard((prev) => ({ ...prev, recentActivity: data.recentActivity }));
                }
            })
            .catch(() => {
                // Ignore if backend server is offline
            });
    }, [fetchDashboardData]);

    // Dynamically recalculate metrics and chart data whenever `timeRange` or `supabaseMetrics` changes
    const filteredData = useMemo(
        () => filterDashboardDataByTimeRange(timeRange, supabaseMetrics),
        [timeRange, supabaseMetrics]
    );

    // Interactive 4-card metric grid configuration bound to filteredData
    const metricCards = [
        {
            label: 'Total Conversations',
            value: filteredData.totalConversations.toLocaleString(),
            subLabel: `${filteredData.ordersCount} orders in ${timeRange}`,
            icon: MessageSquare,
            path: '/conversations',
        },
        {
            label: 'Pipeline Revenue',
            value: formatEGP(filteredData.pipelineRevenue),
            subLabel: `Sales: ${formatEGP(filteredData.totalSales)}`,
            icon: DollarSign,
            path: '/opportunities',
        },
        {
            label: 'Avg. Win Rate',
            value: `${filteredData.winRate}%`,
            subLabel: `AOV: ${formatEGP(filteredData.averageOrderValue)}`,
            icon: Target,
            path: '/analytics',
        },
        {
            label: 'Pending Approvals',
            value: String(filteredData.pendingApprovals),
            trend: 'Action needed',
            icon: CheckSquare,
            path: '/approvals',
        },
    ];

    // AI Insights & Alerts Feed
    const alertsFeed = [
        {
            id: 'alert-1',
            text: "High closing intent detected in 'TechFlow' conversation.",
            actionText: 'Review Transcript',
            path: '/conversations',
            icon: Zap,
            iconColor: '#10B981',
            dotColor: '#10B981',
            bgIcon: 'rgba(16, 185, 129, 0.12)',
        },
        {
            id: 'alert-2',
            text: 'Sentiment dropped in 2 recent chats. Leads at risk of slipping away.',
            actionText: 'Intervene',
            path: '/conversations',
            icon: AlertTriangle,
            iconColor: ACCENT_YELLOW,
            dotColor: ACCENT_YELLOW,
            bgIcon: 'rgba(230, 184, 77, 0.12)',
        },
        {
            id: 'alert-3',
            text: '2 high-value proposals require your immediate approval.',
            actionText: 'Review Approvals',
            path: '/approvals',
            icon: AlertCircle,
            iconColor: '#EF4444',
            dotColor: '#EF4444',
            bgIcon: 'rgba(239, 68, 68, 0.12)',
        },
    ];

    const maxChartSales = Math.max(...filteredData.chartData.map(d => d.sales), 1);

    return (
        <div style={{ padding: '24px 32px', maxWidth: '1200px', margin: '0 auto' }}>
            {/* Header: Greeting + Functional Global Time Context Filter */}
            <div className="lf-header-row">
                <div>
                    <h1 style={{
                        fontSize: '26px', fontWeight: 700, margin: '0 0 6px 0',
                        color: TEXT_PRIMARY
                    }}>
                        Welcome back{user ? `, ${user.displayName || user.name}` : ''}
                    </h1>
                    <p style={{ margin: 0, fontSize: '14px', color: TEXT_SECONDARY }}>
                        Here's your revenue operations overview ({timeRange})
                    </p>
                </div>

                {/* Functional Time Range Dropdown with Button Label */}
                <div className="lf-time-dropdown-container" ref={dropdownRef}>
                    <button
                        type="button"
                        className="lf-time-filter-btn"
                        onClick={() => setIsTimeMenuOpen(prev => !prev)}
                        aria-haspopup="listbox"
                        aria-expanded={isTimeMenuOpen}
                    >
                        <Calendar size={15} style={{ color: ACCENT_YELLOW }} />
                        <span>{timeRange}</span>
                        <ChevronDown
                            size={14}
                            style={{
                                color: TEXT_SECONDARY,
                                transform: isTimeMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                                transition: 'transform 0.2s ease'
                            }}
                        />
                    </button>

                    {isTimeMenuOpen && (
                        <div className="lf-time-dropdown-menu" role="listbox">
                            {TIME_RANGES.map((range) => (
                                <button
                                    key={range}
                                    type="button"
                                    role="option"
                                    aria-selected={timeRange === range}
                                    className={`lf-time-option ${timeRange === range ? 'active' : ''}`}
                                    onClick={() => {
                                        setTimeRange(range);
                                        setIsTimeMenuOpen(false);
                                    }}
                                >
                                    <span>{range}</span>
                                    {timeRange === range && (
                                        <span className="lf-time-option-dot" />
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px', gap: '14px' }}>
                    <Loader2 className="spin" size={34} style={{ color: PRIMARY }} />
                    <span style={{ fontSize: '13px', color: TEXT_SECONDARY }}>Fetching live Supabase metrics...</span>
                </div>
            ) : (
                <>
                    {error && (
                        <div className="lf-error-banner" role="alert">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <AlertCircle size={18} style={{ color: '#EF4444', flexShrink: 0 }} />
                                <span>
                                    <strong>Database Notice:</strong> {error}
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={fetchDashboardData}
                                className="lf-retry-btn"
                            >
                                <RefreshCw size={13} />
                                <span>Retry</span>
                            </button>
                        </div>
                    )}

                    {/* Interactive 4-Card Metric Grid */}
                    <div className="lf-metric-grid">
                        {metricCards.map((card) => {
                            const Icon = card.icon;
                            return (
                                <button
                                    key={card.label}
                                    type="button"
                                    className="lf-metric-card"
                                    onClick={() => navigate(card.path)}
                                >
                                    <div className="lf-metric-top">
                                        <div className="lf-metric-icon">
                                            <Icon size={20} style={{ color: ACCENT_YELLOW }} />
                                        </div>
                                        {card.trend ? (
                                            <span className="lf-metric-trend">
                                                <AlertCircle size={12} />
                                                {card.trend}
                                            </span>
                                        ) : (
                                            <ArrowRight size={14} className="lf-metric-arrow" />
                                        )}
                                    </div>
                                    <div className="lf-metric-value">{card.value}</div>
                                    <div className="lf-metric-label">{card.label}</div>
                                    {card.subLabel && (
                                        <div style={{ fontSize: '11px', color: PRIMARY, marginTop: '4px', fontWeight: 500 }}>
                                            {card.subLabel}
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Dynamic Sales, Orders, AOV & Performance Chart Section */}
                    <div style={{
                        padding: '22px',
                        borderRadius: '14px',
                        background: SURFACE,
                        border: `1px solid ${BORDER}`,
                        marginBottom: '24px'
                    }}>
                        <div className="lf-chart-header">
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                    <BarChart3 size={17} style={{ color: ACCENT_YELLOW }} />
                                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: TEXT_PRIMARY }}>
                                        Revenue & Orders Analytics
                                    </h3>
                                    <span style={{
                                        fontSize: '11px',
                                        fontWeight: 600,
                                        color: ACCENT_YELLOW,
                                        background: 'rgba(230, 184, 77, 0.12)',
                                        padding: '2px 8px',
                                        borderRadius: '6px'
                                    }}>
                                        {timeRange}
                                    </span>
                                </div>
                                <p style={{ margin: 0, fontSize: '12px', color: TEXT_SECONDARY }}>
                                    Dynamically recalculated sales metrics and trend distribution
                                </p>
                            </div>

                            {/* Recalculated Sales Metrics: Total Sales, Orders, Average Order Value */}
                            <div className="lf-sales-kpis">
                                <div className="lf-sales-kpi-item">
                                    <span className="lf-sales-kpi-label">Total Sales</span>
                                    <span className="lf-sales-kpi-value">{formatEGP(filteredData.totalSales)}</span>
                                </div>
                                <div className="lf-sales-kpi-item">
                                    <span className="lf-sales-kpi-label">Orders</span>
                                    <span className="lf-sales-kpi-value">{filteredData.ordersCount}</span>
                                </div>
                                <div className="lf-sales-kpi-item">
                                    <span className="lf-sales-kpi-label">Average Order Value</span>
                                    <span className="lf-sales-kpi-value">{formatEGP(filteredData.averageOrderValue)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Dynamic Bar & Trend Visualization */}
                        <div className="lf-chart-bars">
                            {filteredData.chartData.map((point) => {
                                const heightPct = Math.max(Math.round((point.sales / maxChartSales) * 100), 10);
                                return (
                                    <div key={point.label} className="lf-chart-col">
                                        <div className="lf-chart-bar-value">
                                            {formatEGP(point.sales)}
                                        </div>
                                        <div className="lf-chart-bar-track">
                                            <div
                                                className="lf-chart-bar-fill"
                                                style={{ height: `${heightPct}%` }}
                                                title={`${point.label}: ${formatEGP(point.sales)} (${point.orders} orders)`}
                                            />
                                        </div>
                                        <div className="lf-chart-bar-label">{point.label}</div>
                                        <div className="lf-chart-bar-sub">{point.orders} ord</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Dashboard Panels: Recent Activity + AI Alerts Feed */}
                    <div className="lf-dashboard-panels">
                        {/* Recent Activity */}
                        <div style={{
                            padding: '22px', borderRadius: '14px',
                            background: SURFACE,
                            border: `1px solid ${BORDER}`
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                                <Activity size={16} style={{ color: PRIMARY }} />
                                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: TEXT_PRIMARY }}>
                                    Recent Activity
                                </h3>
                            </div>
                            {filteredData.recentActivity?.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {filteredData.recentActivity.slice(0, 5).map((activity, idx) => (
                                        <div key={activity.id || idx} style={{
                                            display: 'flex', gap: '10px', alignItems: 'flex-start',
                                            padding: '10px 12px', borderRadius: '8px',
                                            background: 'transparent',
                                            cursor: 'pointer', transition: 'background 0.15s'
                                        }}
                                            onClick={() => navigate('/conversations')}
                                            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <div style={{
                                                width: '30px', height: '30px', borderRadius: '8px', minWidth: '30px',
                                                background: activity.avatarUrl
                                                    ? `url(${activity.avatarUrl}) center/cover`
                                                    : 'var(--brand-gradient, #805BE7)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                color: '#fff', fontWeight: 700, fontSize: '11px'
                                            }}>
                                                {!activity.avatarUrl && (activity.customerName?.charAt(0) || '?')}
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontSize: '12px', fontWeight: 600, color: TEXT_PRIMARY, marginBottom: '2px' }}>
                                                    {activity.customerName || 'Unknown'}
                                                </div>
                                                <div style={{ fontSize: '11px', color: TEXT_SECONDARY, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {activity.message || ''}
                                                </div>
                                            </div>
                                            <span style={{ fontSize: '10px', color: TEXT_SECONDARY, whiteSpace: 'nowrap' }}>
                                                {activity.time ? new Date(activity.time).toLocaleDateString() : ''}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ padding: '30px 0', textAlign: 'center', color: TEXT_SECONDARY, fontSize: '13px' }}>
                                    No recent activity in {timeRange}
                                </div>
                            )}
                        </div>

                        {/* AI Insights & Alerts Feed */}
                        <div style={{
                            padding: '22px', borderRadius: '14px',
                            background: SURFACE,
                            border: `1px solid ${BORDER}`
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Zap size={16} style={{ color: ACCENT_YELLOW }} />
                                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: TEXT_PRIMARY }}>
                                        Alerts
                                    </h3>
                                </div>
                                <span style={{
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    color: PRIMARY,
                                    background: 'rgba(128, 91, 231, 0.12)',
                                    padding: '3px 8px',
                                    borderRadius: '6px'
                                }}>
                                    AI Insights
                                </span>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {alertsFeed.map((alert) => {
                                    const AlertIcon = alert.icon;
                                    return (
                                        <div key={alert.id} className="lf-alert-card">
                                            <div className="lf-alert-body">
                                                <div className="lf-alert-icon-wrap" style={{ background: alert.bgIcon }}>
                                                    <span className="lf-alert-dot" style={{ backgroundColor: alert.dotColor }} />
                                                    <AlertIcon size={14} style={{ color: alert.iconColor }} />
                                                </div>
                                                <p className="lf-alert-text">
                                                    {alert.text}
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                className="lf-alert-action-btn"
                                                onClick={() => navigate(alert.path)}
                                            >
                                                <span>{alert.actionText}</span>
                                                <ArrowRight size={13} />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </>
            )}

            <style>{`
                @keyframes lf-spin { to { transform: rotate(360deg); } }
                .spin { animation: lf-spin 1s linear infinite; }

                /* Header row with time filter */
                .lf-header-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 16px;
                    margin-bottom: 28px;
                    flex-wrap: wrap;
                }
                .lf-time-dropdown-container {
                    position: relative;
                }
                .lf-time-filter-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    padding: 9px 14px;
                    border-radius: 10px;
                    background: ${SURFACE};
                    border: 1px solid ${BORDER};
                    color: ${TEXT_PRIMARY};
                    font-size: 13px;
                    font-weight: 600;
                    font-family: inherit;
                    cursor: pointer;
                    transition: border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
                }
                .lf-time-filter-btn:hover {
                    border-color: ${PRIMARY};
                    background: var(--bg-hover, #2A2C33);
                }
                .lf-time-dropdown-menu {
                    position: absolute;
                    right: 0;
                    top: calc(100% + 6px);
                    min-width: 150px;
                    background: ${SURFACE};
                    border: 1px solid ${BORDER};
                    border-radius: 10px;
                    padding: 6px;
                    box-shadow: 0 10px 28px rgba(0, 0, 0, 0.45);
                    z-index: 50;
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                }
                .lf-time-option {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    width: 100%;
                    padding: 8px 10px;
                    border: none;
                    border-radius: 7px;
                    background: transparent;
                    color: ${TEXT_SECONDARY};
                    font-size: 13px;
                    font-weight: 500;
                    font-family: inherit;
                    cursor: pointer;
                    text-align: left;
                    transition: background 0.15s ease, color 0.15s ease;
                }
                .lf-time-option:hover {
                    background: var(--bg-hover, #2A2C33);
                    color: ${TEXT_PRIMARY};
                }
                .lf-time-option.active {
                    background: rgba(128, 91, 231, 0.14);
                    color: ${TEXT_PRIMARY};
                    font-weight: 600;
                }
                .lf-time-option-dot {
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                    background: ${ACCENT_YELLOW};
                }

                /* Sales & Chart Section */
                .lf-chart-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    gap: 16px;
                    margin-bottom: 22px;
                    flex-wrap: wrap;
                }
                .lf-sales-kpis {
                    display: flex;
                    gap: 16px;
                    flex-wrap: wrap;
                }
                .lf-sales-kpi-item {
                    display: flex;
                    flex-direction: column;
                    padding: 10px 16px;
                    border-radius: 10px;
                    background: rgba(255, 255, 255, 0.02);
                    border: 1px solid ${BORDER};
                    min-width: 130px;
                }
                .lf-sales-kpi-label {
                    font-size: 11px;
                    color: ${TEXT_SECONDARY};
                    margin-bottom: 4px;
                }
                .lf-sales-kpi-value {
                    font-size: 16px;
                    font-weight: 700;
                    color: ${TEXT_PRIMARY};
                }
                .lf-chart-bars {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(70px, 1fr));
                    gap: 14px;
                    align-items: end;
                    height: 190px;
                    padding-top: 20px;
                }
                .lf-chart-col {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    height: 100%;
                }
                .lf-chart-bar-value {
                    font-size: 11px;
                    font-weight: 600;
                    color: ${TEXT_SECONDARY};
                    margin-bottom: 6px;
                    white-space: nowrap;
                }
                .lf-chart-bar-track {
                    flex: 1;
                    width: 100%;
                    max-width: 44px;
                    background: rgba(255, 255, 255, 0.03);
                    border-radius: 8px;
                    display: flex;
                    align-items: flex-end;
                    overflow: hidden;
                    padding: 2px;
                }
                .lf-chart-bar-fill {
                    width: 100%;
                    background: linear-gradient(180deg, ${PRIMARY} 0%, rgba(128, 91, 231, 0.45) 100%);
                    border-top: 2px solid ${ACCENT_YELLOW};
                    border-radius: 6px;
                    transition: height 0.35s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .lf-chart-bar-label {
                    margin-top: 8px;
                    font-size: 12px;
                    font-weight: 600;
                    color: ${TEXT_PRIMARY};
                }
                .lf-chart-bar-sub {
                    font-size: 10px;
                    color: ${TEXT_SECONDARY};
                }

                /* Error Alert Banner */
                .lf-error-banner {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 16px;
                    padding: 12px 18px;
                    border-radius: 12px;
                    background: rgba(239, 68, 68, 0.1);
                    border: 1px solid rgba(239, 68, 68, 0.35);
                    color: #F87171;
                    font-size: 13px;
                    margin-bottom: 22px;
                    flex-wrap: wrap;
                }
                .lf-retry-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    padding: 6px 14px;
                    border-radius: 8px;
                    background: rgba(239, 68, 68, 0.2);
                    border: 1px solid rgba(239, 68, 68, 0.5);
                    color: #FFFFFF;
                    font-size: 12px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.15s ease;
                    font-family: inherit;
                    white-space: nowrap;
                }
                .lf-retry-btn:hover {
                    background: #EF4444;
                    color: #FFFFFF;
                }

                /* 4-Card Metric Grid */
                .lf-metric-grid {
                    display: grid;
                    grid-template-columns: repeat(4, minmax(0, 1fr));
                    gap: 16px;
                    margin-bottom: 24px;
                }
                .lf-metric-card {
                    display: flex;
                    flex-direction: column;
                    padding: 20px 22px;
                    border-radius: 14px;
                    background: ${SURFACE};
                    border: 1px solid ${BORDER};
                    cursor: pointer;
                    text-align: left;
                    font: inherit;
                    transition: border-color 0.2s ease, transform 0.2s ease;
                    width: 100%;
                }
                .lf-metric-card:hover {
                    border-color: ${PRIMARY};
                    transform: translateY(-2px);
                }
                .lf-metric-card:focus-visible {
                    outline: 2px solid ${PRIMARY};
                    outline-offset: 2px;
                }
                .lf-metric-top {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 14px;
                    width: 100%;
                }
                .lf-metric-icon {
                    width: 42px;
                    height: 42px;
                    min-width: 42px;
                    border-radius: 12px;
                    background: rgba(230, 184, 77, 0.12);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .lf-metric-arrow {
                    color: ${TEXT_SECONDARY};
                    transition: color 0.15s ease, transform 0.15s ease;
                }
                .lf-metric-card:hover .lf-metric-arrow {
                    color: ${TEXT_PRIMARY};
                    transform: translateX(2px);
                }
                .lf-metric-trend {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    font-size: 11px;
                    font-weight: 600;
                    color: ${ACCENT_YELLOW};
                    background: rgba(230, 184, 77, 0.12);
                    padding: 3px 8px;
                    border-radius: 6px;
                }
                .lf-metric-value {
                    font-size: 24px;
                    font-weight: 700;
                    line-height: 1.2;
                    color: ${TEXT_PRIMARY};
                    margin-bottom: 4px;
                }
                .lf-metric-label {
                    font-size: 13px;
                    color: ${TEXT_SECONDARY};
                }

                /* Panels */
                .lf-dashboard-panels {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 20px;
                }

                /* Alerts Card Feed */
                .lf-alert-card {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 14px;
                    padding: 13px 15px;
                    border-radius: 12px;
                    background: rgba(255, 255, 255, 0.02);
                    border: 1px solid ${BORDER};
                    transition: background-color 0.15s ease, border-color 0.15s ease;
                }
                .lf-alert-card:hover {
                    background: var(--bg-hover);
                    border-color: rgba(128, 91, 231, 0.4);
                }
                .lf-alert-body {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    flex: 1;
                    min-width: 0;
                }
                .lf-alert-icon-wrap {
                    width: 30px;
                    height: 30px;
                    min-width: 30px;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                }
                .lf-alert-dot {
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                    position: absolute;
                    top: -1px;
                    right: -1px;
                }
                .lf-alert-text {
                    margin: 0;
                    font-size: 13px;
                    font-weight: 500;
                    color: ${TEXT_PRIMARY};
                    line-height: 1.4;
                }
                .lf-alert-action-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    padding: 6px 12px;
                    border-radius: 8px;
                    border: 1px solid rgba(128, 91, 231, 0.35);
                    background: rgba(128, 91, 231, 0.12);
                    color: #9B7DF0;
                    font-size: 12px;
                    font-weight: 600;
                    white-space: nowrap;
                    cursor: pointer;
                    transition: all 0.15s ease;
                    flex-shrink: 0;
                    font-family: inherit;
                }
                .lf-alert-action-btn:hover {
                    background: ${PRIMARY};
                    color: #FFFFFF;
                    border-color: ${PRIMARY};
                    transform: translateX(1px);
                }

                @media (max-width: 1100px) {
                    .lf-metric-grid {
                        grid-template-columns: repeat(2, minmax(0, 1fr));
                    }
                    .lf-dashboard-panels {
                        grid-template-columns: 1fr;
                    }
                }
                @media (max-width: 768px) {
                    .lf-alert-card {
                        flex-direction: column;
                        align-items: flex-start;
                    }
                    .lf-alert-action-btn {
                        align-self: flex-end;
                        margin-top: 4px;
                    }
                }
                @media (max-width: 640px) {
                    .lf-header-row {
                        flex-direction: column;
                        align-items: flex-start;
                    }
                    .lf-metric-grid {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>
        </div>
    );
}

export default HomePage;
