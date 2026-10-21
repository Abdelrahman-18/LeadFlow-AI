/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Brand Colors - LeadFlow AI Palette
                brand: {
                    primary: '#6366F1',  // LeadFlow Indigo
                    hover: '#4F46E5',    // Hover state
                    accent: '#8B5CF6',   // Purple accent
                    bone: '#F2F3EC',     // Brand bone/cream
                },
                // Backgrounds - Dark theme
                bg: {
                    page: '#0F0F0F',     // Darkest background
                    surface: '#1C1C1C',  // Card/drawer background
                    input: '#262626',    // Input fields
                    hover: '#333333',    // Hover states
                },
                // Typography
                text: {
                    main: '#F2F3EC',     // Primary text
                    muted: '#888888',    // Secondary text
                    onBrand: '#FFFFFF',  // Text on brand backgrounds
                },
                // Borders
                border: {
                    subtle: '#333333',   // Default borders
                    active: '#6366F1',   // Active/focused borders
                },
                // Status colors
                status: {
                    success: '#22C55E',
                    warning: '#F0AD4E',
                    danger: '#D9534F',
                },
            },
            // Border Radius - V4 Softer/Friendlier
            borderRadius: {
                'sm': '4px',
                'DEFAULT': '6px',
                'md': '8px',
                'lg': '12px',
                'xl': '16px',
            },
            // Box Shadows
            boxShadow: {
                'button': '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                'button-hover': '0 6px 8px -1px rgba(0, 0, 0, 0.4), 0 3px 5px -1px rgba(0, 0, 0, 0.08)',
                'card': '0 4px 20px rgba(0, 0, 0, 0.3)',
            },
            // Font Family
            fontFamily: {
                sans: ['Inter', 'system-ui', 'Avenir', 'Helvetica', 'Arial', 'sans-serif'],
                heading: ['Outfit', 'sans-serif'],
            },
        },
    },
    plugins: [],
};