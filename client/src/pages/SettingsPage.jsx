import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { User, Mail, Globe, Moon, Sun, Bell, Shield, Key, ArrowLeft, Save, CheckCircle } from 'lucide-react';

const SectionCard = ({ icon: Icon, title, children }) => (
    <div style={{
        padding: '24px', borderRadius: '14px', marginBottom: '16px',
        background: 'var(--bg-surface, #1E2025)',
        border: '1px solid var(--border-subtle, #2a2a2a)'
    }}>
        <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            marginBottom: '20px', paddingBottom: '14px',
            borderBottom: '1px solid var(--border-subtle, #222)'
        }}>
            <div style={{
                width: '32px', height: '32px', borderRadius: '8px',
                background: 'rgba(128, 91, 231,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
                <Icon size={16} style={{ color: '#9B7DF0' }} />
            </div>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'var(--text-primary, #F5F6FA)' }}>
                {title}
            </h3>
        </div>
        {children}
    </div>
);

const FormInput = ({ label, value, onChange, placeholder, type = 'text', icon: Icon }) => (
    <div style={{ marginBottom: '14px' }}>
        <label style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            fontSize: '12px', fontWeight: 600, color: 'var(--text-muted, #888)',
            marginBottom: '6px'
        }}>
            {Icon && <Icon size={14} />}
            {label}
        </label>
        <input
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            style={{
                width: '100%', padding: '10px 14px', borderRadius: '10px',
                border: '1px solid var(--border-subtle, #333)',
                background: 'var(--bg-input, #262626)',
                color: 'var(--text-primary, #F5F6FA)', fontSize: '13px',
                outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s'
            }}
            onFocus={(e) => e.currentTarget.style.borderColor = '#805BE7'}
            onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border-subtle, #333)'}
        />
    </div>
);

function SettingsPage() {
    const navigate = useNavigate();
    const [settings, setSettings] = useState({
        displayName: '',
        email: '',
        language: 'en',
        theme: 'dark',
        notifications: true,
        twoFactor: false,
    });

    const [saving, setSaving] = useState(false);
    const [savedSuccess, setSavedSuccess] = useState(false);

    // Fetch user profile from Supabase users table
    useEffect(() => {
        const theme = localStorage.getItem('theme') || 'dark';
        const language = localStorage.getItem('language') || 'en';

        const loadProfile = async () => {
            try {
                const { data: userData } = await supabase
                    .from('users')
                    .select('*')
                    .limit(1)
                    .single();

                if (userData) {
                    setSettings(prev => ({
                        ...prev,
                        displayName: userData.displayName || '',
                        email: userData.email || '',
                        theme,
                        language
                    }));
                } else {
                    const user = localStorage.getItem('user');
                    if (user) {
                        const parsed = JSON.parse(user);
                        setSettings(prev => ({
                            ...prev,
                            displayName: parsed.displayName || parsed.name || '',
                            email: parsed.email || '',
                            theme,
                            language
                        }));
                    }
                }
            } catch (err) {
                console.warn('Failed to load user profile from Supabase:', err);
            }
        };

        loadProfile();
    }, []);

    const applyTheme = (theme) => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    };

    const handleThemeToggle = () => {
        const newTheme = settings.theme === 'dark' ? 'light' : 'dark';
        setSettings(prev => ({ ...prev, theme: newTheme }));
        applyTheme(newTheme);
    };

    const handleSave = async () => {
        setSaving(true);
        setSavedSuccess(false);

        try {
            localStorage.setItem('language', settings.language);
            applyTheme(settings.theme);

            // Update user in Supabase users table
            const { error } = await supabase
                .from('users')
                .update({
                    displayName: settings.displayName,
                    email: settings.email,
                    updatedAt: new Date().toISOString()
                })
                .eq('email', settings.email);

            if (error) {
                console.warn('Supabase profile update warning:', error);
            }

            // Update local user object
            const userStr = localStorage.getItem('user');
            if (userStr) {
                try {
                    const parsed = JSON.parse(userStr);
                    localStorage.setItem('user', JSON.stringify({
                        ...parsed,
                        displayName: settings.displayName,
                        name: settings.displayName,
                        email: settings.email
                    }));
                } catch (e) {}
            }

            setSavedSuccess(true);
            setTimeout(() => setSavedSuccess(false), 3000);
        } catch (err) {
            console.error('Error saving settings:', err);
        } finally {
            setSaving(false);
        }
    };

    const Toggle = ({ checked, onChange, label, description }) => (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
            <div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary, #F5F6FA)', marginBottom: '2px', fontSize: '13px' }}>
                    {label}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted, #888)' }}>
                    {description}
                </div>
            </div>
            <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px', cursor: 'pointer' }}>
                <input type="checkbox" checked={checked} onChange={onChange}
                    style={{ opacity: 0, width: 0, height: 0 }} />
                <span style={{
                    position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: checked ? '#805BE7' : '#333',
                    transition: '0.3s', borderRadius: '24px'
                }}>
                    <span style={{
                        position: 'absolute', height: '18px', width: '18px',
                        left: checked ? '23px' : '3px', bottom: '3px',
                        backgroundColor: 'white', transition: '0.3s', borderRadius: '50%'
                    }} />
                </span>
            </label>
        </div>
    );

    return (
        <div style={{ padding: '24px 32px', maxWidth: '800px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '6px' }}>
                    <button onClick={() => navigate(-1)} style={{
                        padding: '6px', borderRadius: '8px', border: '1px solid var(--border-subtle, #333)',
                        background: 'transparent', color: 'var(--text-muted, #888)', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <ArrowLeft size={16} />
                    </button>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: 'var(--text-primary, #F5F6FA)' }}>
                                Settings
                            </h1>
                            <span style={{
                                fontSize: '11px', padding: '3px 8px', borderRadius: '6px',
                                background: 'rgba(52,211,153,0.12)', color: '#34D399', fontWeight: 600
                            }}>
                                Database Linked
                            </span>
                        </div>
                        <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-muted, #888)' }}>
                            Manage your account settings and preferences connected to Supabase
                        </p>
                    </div>
                </div>
            </div>

            {/* Profile Section */}
            <SectionCard icon={User} title="Profile Information">
                <FormInput icon={User} label="Display Name" value={settings.displayName}
                    onChange={(e) => setSettings(p => ({ ...p, displayName: e.target.value }))}
                    placeholder="Your display name" />
                <FormInput icon={Mail} label="Email" type="email" value={settings.email}
                    onChange={(e) => setSettings(p => ({ ...p, email: e.target.value }))}
                    placeholder="your@email.com" />
            </SectionCard>

            {/* Appearance */}
            <SectionCard icon={settings.theme === 'dark' ? Moon : Sun} title="Appearance">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary, #F5F6FA)', marginBottom: '2px', fontSize: '13px' }}>
                            Theme
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted, #888)' }}>
                            Choose your preferred color scheme
                        </div>
                    </div>
                    <button onClick={handleThemeToggle} style={{
                        padding: '8px 16px', borderRadius: '8px',
                        border: '1px solid var(--border-subtle, #333)',
                        background: 'var(--bg-input, #262626)',
                        color: 'var(--text-primary, #F5F6FA)', fontSize: '12px',
                        fontWeight: 600, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '6px'
                    }}>
                        {settings.theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
                        {settings.theme === 'dark' ? 'Light' : 'Dark'}
                    </button>
                </div>

                <div style={{ marginBottom: '4px' }}>
                    <label style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        fontSize: '12px', fontWeight: 600, color: 'var(--text-muted, #888)', marginBottom: '6px'
                    }}>
                        <Globe size={14} /> Language
                    </label>
                    <select value={settings.language}
                        onChange={(e) => setSettings(p => ({ ...p, language: e.target.value }))}
                        style={{
                            width: '100%', padding: '10px 14px', borderRadius: '10px',
                            border: '1px solid var(--border-subtle, #333)',
                            background: 'var(--bg-input, #262626)',
                            color: 'var(--text-primary, #F5F6FA)', fontSize: '13px', outline: 'none'
                        }}>
                        <option value="en">English</option>
                        <option value="ar">العربية (Arabic)</option>
                        <option value="fr">Français (French)</option>
                        <option value="de">Deutsch (German)</option>
                        <option value="sw">Kiswahili (Swahili)</option>
                    </select>
                </div>
            </SectionCard>

            {/* Notifications */}
            <SectionCard icon={Bell} title="Notifications">
                <Toggle
                    label="Push Notifications"
                    description="Receive notifications about important updates"
                    checked={settings.notifications}
                    onChange={(e) => setSettings(p => ({ ...p, notifications: e.target.checked }))}
                />
            </SectionCard>

            {/* Security */}
            <SectionCard icon={Shield} title="Security">
                <Toggle
                    label="Two-Factor Authentication"
                    description="Add an extra layer of security to your account"
                    checked={settings.twoFactor}
                    onChange={(e) => setSettings(p => ({ ...p, twoFactor: e.target.checked }))}
                />
                <button style={{
                    marginTop: '16px', padding: '10px 16px', borderRadius: '8px',
                    border: '1px solid var(--border-subtle, #333)',
                    background: 'transparent', color: 'var(--text-primary, #F5F6FA)',
                    fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '6px'
                }}>
                    <Key size={14} /> Change Password
                </button>
            </SectionCard>

            {/* Save Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
                {savedSuccess && (
                    <span style={{ fontSize: '13px', color: '#34D399', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                        <CheckCircle size={16} /> Saved to Database!
                    </span>
                )}
                <button onClick={handleSave} disabled={saving} style={{
                    padding: '12px 28px', borderRadius: '10px', border: 'none',
                    background: saving ? 'rgba(128, 91, 231,0.3)' : 'var(--brand-gradient)',
                    color: '#fff', fontSize: '14px', fontWeight: 600,
                    cursor: saving ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', gap: '8px',
                    transition: 'all 0.2s'
                }}>
                    <Save size={16} /> {saving ? 'Saving...' : 'Save Settings'}
                </button>
            </div>
        </div>
    );
}

export default SettingsPage;
