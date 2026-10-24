import React, { useState, useRef, useEffect } from 'react';

const CustomSelect = ({ value, onChange, options, placeholder = 'Select...', icon: Icon, style }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    const selectedOption = options.find(opt => opt.value === value);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (optionValue) => {
        onChange(optionValue);
        setIsOpen(false);
    };

    return (
        <div ref={containerRef} style={{ position: 'relative', width: '100%', ...style }}>
            <div
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    backgroundColor: 'var(--bg-surface)',
                    border: isOpen ? '1px solid #E6B84D' : '1px solid var(--border)',
                    borderRadius: '4px',
                    padding: '0.625rem 1rem', // Matching standard input padding
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                    transition: 'border-color 0.2s'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                    {Icon && <Icon size={16} color="#E6B84D" />}
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                </div>
                <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s',
                        color: 'var(--text-secondary)',
                        flexShrink: 0
                    }}
                >
                    <polyline points="6 9 12 15 18 9" />
                </svg>
            </div>

            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 4px)',
                    left: 0,
                    width: '100%',
                    maxHeight: '250px',
                    overflowY: 'auto',
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '4px',
                    zIndex: 1000,
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2)'
                }}>
                    {options.map((option) => (
                        <div
                            key={option.value}
                            onClick={() => handleSelect(option.value)}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#E6B84D';
                                e.currentTarget.style.color = '#000000';
                            }}
                            onMouseLeave={(e) => {
                                const currentTheme = document.documentElement.getAttribute('data-theme');
                                const selectedBg = currentTheme === 'light' ? '#F3F4F6' : '#34363E';
                                e.currentTarget.style.backgroundColor = option.value === value ? selectedBg : 'transparent';
                                e.currentTarget.style.color = getComputedStyle(document.documentElement).getPropertyValue('--text-primary');
                            }}
                            style={{
                                padding: '0.75rem 1rem',
                                cursor: 'pointer',
                                fontSize: '0.9rem',
                                color: 'var(--text-primary)',
                                backgroundColor: option.value === value ? (document.documentElement.getAttribute('data-theme') === 'light' ? '#F3F4F6' : '#34363E') : 'transparent',
                                transition: 'background-color 0.1s'
                            }}
                        >
                            {option.label}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CustomSelect;
