import React from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart3, Trash2 } from 'lucide-react';

/**
 * DashboardCard - Displays a dashboard summary card with delete action
 */
const DashboardCard = ({ dashboard, onDelete }) => {
    const { t } = useTranslation();

    return (
        <div style={{
            background: 'var(--bg-component, #1E2025)',
            border: '1px solid var(--border-subtle, #333)',
            borderRadius: '12px',
            padding: '20px',
            transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
            position: 'relative',
        }}
            onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#E6B84D';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(230, 184, 77, 0.1)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-subtle, #333)';
                e.currentTarget.style.boxShadow = 'none';
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                    <BarChart3 size={20} style={{ color: '#E6B84D', flexShrink: 0 }} />
                    <h3 style={{ color: 'var(--text-primary, #F5F6FA)', fontSize: '1rem', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {dashboard?.title || t('dashboardsPage.empty.title')}
                    </h3>
                </div>
                {onDelete && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete();
                        }}
                        title={t('common.delete')}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--text-muted, #666)',
                            padding: '4px',
                            borderRadius: '4px',
                            transition: 'color 0.2s ease',
                            flexShrink: 0,
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.color = '#EF4444'}
                        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted, #666)'}
                    >
                        <Trash2 size={16} />
                    </button>
                )}
            </div>
            <p style={{ color: 'var(--text-secondary, #888)', fontSize: '0.85rem', margin: 0, lineHeight: '1.5' }}>
                {dashboard?.description || t('dashboardsPage.noDescription', 'No description')}
            </p>
        </div>
    );
};

export default DashboardCard;
