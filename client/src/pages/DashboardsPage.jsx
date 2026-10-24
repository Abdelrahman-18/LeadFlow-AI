import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Search, LayoutDashboard, Loader2, Sparkles } from 'lucide-react';
import { supabase } from '../supabaseClient';
import dashboardService from '../services/dashboardService';
import DashboardCard from '../components/analytics/DashboardCard';
import DashboardForm from '../components/analytics/DashboardForm';
import './DashboardsPage.css';

const DashboardsPage = () => {
    const { t } = useTranslation();
    const [dashboards, setDashboards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [managerName, setManagerName] = useState('Manager');

    useEffect(() => {
        fetchDashboards();

        // Load manager name from local storage
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                if (user.displayName || user.name) {
                    setManagerName(user.displayName || user.name);
                }
            } catch (e) {
                console.error('Failed to parse user data');
            }
        }
    }, []);

    const fetchDashboards = async () => {
        try {
            setLoading(true);
            // 1. Fetch from Supabase dashboards table
            const { data, error } = await supabase
                .from('dashboards')
                .select('*')
                .order('createdAt', { ascending: false });

            if (error) throw error;
            setDashboards(data || []);
        } catch (error) {
            console.error('Error fetching dashboards from Supabase:', error);
            try {
                const data = await dashboardService.getMyDashboards();
                setDashboards(data || []);
            } catch (err) {
                console.error('Service fallback error:', err);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCreateDashboard = async (formData) => {
        try {
            const orgId = '4d01ebeb-a684-4e84-bb66-a4ed5c76f42c';
            const userId = 'c4c51d3f-9758-4728-b95f-9266e0708889';
            const now = new Date().toISOString();
            const { error } = await supabase
                .from('dashboards')
                .insert({
                    organizationId: orgId,
                    userId: userId,
                    title: formData.title,
                    description: formData.description || '',
                    sqlQuery: formData.sqlQuery || '',
                    chartConfig: formData.chartConfig || {},
                    isPublic: true,
                    createdAt: now,
                    updatedAt: now
                });

            if (error) throw error;
            fetchDashboards();
            setShowCreateModal(false);
        } catch (error) {
            console.error('Error creating dashboard in Supabase:', error);
            try {
                await dashboardService.createDashboard(formData);
                fetchDashboards();
                setShowCreateModal(false);
            } catch (err) {
                console.error('Service fallback error:', err);
                throw err;
            }
        }
    };

    const handleDeleteDashboard = async (id) => {
        if (window.confirm(t('dashboardsPage.confirmDelete'))) {
            try {
                const { error } = await supabase.from('dashboards').delete().eq('id', id);
                if (error) throw error;
                fetchDashboards();
            } catch (error) {
                console.error('Error deleting dashboard from Supabase:', error);
                try {
                    await dashboardService.deleteDashboard(id);
                    fetchDashboards();
                } catch (err) {
                    console.error('Service fallback error:', err);
                }
            }
        }
    };

    const filteredDashboards = dashboards.filter(dash =>
        (dash.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (dash.description && dash.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="dashboards-container">
            {/* Executive Header */}
            <div className="dashboards-header">
                <div className="header-title-area">
                    <div className="header-cockpit-label">
                        <Sparkles size={14} />
                        <span>{t('dashboardsPage.cockpit')}</span>
                    </div>
                    <h1>{t('dashboardsPage.title')}</h1>
                    <p>{t('dashboardsPage.welcome', { name: managerName })}</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="create-btn"
                >
                    <Plus size={20} />
                    <span>{t('dashboardsPage.createDashboard')}</span>
                </button>
            </div>

            {/* Search Section */}
            <div className="search-section">
                <div className="search-input-wrapper">
                    <Search className="search-icon-pos" size={18} />
                    <input
                        type="text"
                        placeholder={t('dashboardsPage.searchPlaceholder')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="dash-search-input"
                    />
                </div>
            </div>

            {/* Content Area */}
            {loading ? (
                <div className="dashboards-loading">
                    <Loader2 className="spinner" size={40} />
                    <p>{t('dashboardsPage.syncing')}</p>
                </div>
            ) : filteredDashboards.length > 0 ? (
                <div className="dashboards-grid">
                    {filteredDashboards.map(dashboard => (
                        <DashboardCard
                            key={dashboard.id}
                            dashboard={dashboard}
                            onDelete={() => handleDeleteDashboard(dashboard.id)}
                        />
                    ))}
                </div>
            ) : (
                <div className="empty-dashboards-container">
                    <div className="empty-icon-wrapper">
                        <LayoutDashboard size={48} />
                    </div>
                    <div>
                        <h3>{t('dashboardsPage.empty.title')}</h3>
                        <p>{t('dashboardsPage.empty.subtitle')}</p>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="empty-create-btn"
                    >
                        <Plus size={20} />
                        <span>{t('dashboardsPage.empty.create')}</span>
                    </button>
                </div>
            )}

            {showCreateModal && (
                <DashboardForm
                    onSave={handleCreateDashboard}
                    onClose={() => setShowCreateModal(false)}
                />
            )}
        </div>
    );
};

export default DashboardsPage;
