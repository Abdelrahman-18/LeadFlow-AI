/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Brand Colors - LeadFlow Design System
                brand: {
                    primary: '#805BE7',  // Primary Action (Purple)
                    hover: '#6C47D6',    // Primary hover (darker purple)
                    accent: '#E6B84D',   // Active State (Yellow)
                    bone: '#F5F6FA',     // Primary text tone
                },
                // Backgrounds - Dark theme
                bg: {
                    page: '#111214',     // Main Background
                    sidebar: '#0D0E10',  // Sidebar Background
                    surface: '#1E2025',  // Cards / Surface
                    input: '#111214',    // Input fields
                    hover: '#2A2C33',    // Hover Surface
                },
                // Typography
                text: {
                    main: '#F5F6FA',     // Primary Text
                    muted: '#A9ADB8',    // Secondary Text
                    onBrand: '#FFFFFF',  // Text on brand backgrounds
                },
                // Borders
                border: {
                    subtle: '#34363E',   // Border
                    active: '#805BE7',   // Active/focused borders
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