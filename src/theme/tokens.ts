/**
 * ═══════════════════════════════════════════════════════════════
 *  ZAPAN DESIGN SYSTEM — Theme Tokens (TypeScript)
 *  Import these constants anywhere you need programmatic access
 *  to the design system (charts, dynamic styles, etc.)
 * ═══════════════════════════════════════════════════════════════
 */

// ── Brand Colors ──────────────────────────────────────────────
export const colors = {
    brand: {
        DEFAULT: '#7C1D3E', // Primary — deep maroon/wine
        dark: '#5A152D', // Hover/pressed state
        light: '#9B2D5A', // Lighter variant
        accent: '#E91E7B', // Secondary pink accent
        accentDark: '#C2185B', // Accent hover
        accentLight: '#F8BBD0', // Accent backgrounds
        muted: '#FCE4EC', // Active sidebar bg, soft highlights
        surface: '#FFF0F5', // Very light brand tint
    },

    // ── Surfaces ──
    surface: {
        bg: '#F8F9FA', // Page background
        card: '#FFFFFF', // Card background
        border: '#F3F4F6', // border-gray-100
        hover: '#F9FAFB', // hover:bg-gray-50
    },

    // ── Status ──
    status: {
        success: {
            bg: '#F0FDF4',
            text: '#166534',
            badge: '#DCFCE7',
            border: '#BBF7D0',
        },
        warning: {
            bg: '#FFFBEB',
            text: '#92400E',
            badge: '#FEF3C7',
            border: '#FDE68A',
        },
        danger: {
            bg: '#FEF2F2',
            text: '#991B1B',
            badge: '#FEE2E2',
            border: '#FECACA',
        },
        info: {
            bg: '#EFF6FF',
            text: '#1E40AF',
            badge: '#DBEAFE',
            border: '#BFDBFE',
        },
        purple: {
            bg: '#FAF5FF',
            text: '#6B21A8',
            badge: '#F3E8FF',
            border: '#E9D5FF',
        },
        neutral: {
            bg: '#F9FAFB',
            text: '#374151',
            badge: '#F3F4F6',
            border: '#E5E7EB',
        },
    },

    // ── Priority ──
    priority: {
        urgent: { bg: '#FEE2E2', text: '#991B1B' },
        high: { bg: '#FFEDD5', text: '#9A3412' },
        medium: { bg: '#FEF3C7', text: '#92400E' },
        low: { bg: '#DCFCE7', text: '#166534' },
    },

    // ── Category Tags ──
    category: {
        travel: { bg: '#DBEAFE', text: '#1E40AF' },
        office: { bg: '#F3F4F6', text: '#374151' },
        software: { bg: '#F3E8FF', text: '#6B21A8' },
        marketing: { bg: '#FCE7F3', text: '#9D174D' },
        utilities: { bg: '#DCFCE7', text: '#166534' },
    },

    // ── Chart Palette (for recharts) ──
    chart: ['#7C1D3E', '#E91E7B', '#F8BBD0', '#9B2D5A', '#C2185B'],
} as const

// ── Typography ────────────────────────────────────────────────
export const typography = {
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
    heading: {
        page: 'text-2xl font-bold text-gray-900',
        section: 'text-lg font-bold text-gray-900',
        card: 'text-lg font-semibold text-gray-800',
    },
    body: {
        DEFAULT: 'text-sm text-gray-600',
        muted: 'text-sm text-gray-500',
        small: 'text-xs text-gray-500',
    },
} as const

// ── Spacing ───────────────────────────────────────────────────
export const spacing = {
    page: 'p-6 lg:p-8',
    card: 'p-6',
    sectionGap: 'space-y-6',
    gridGap: 'gap-6',
} as const

// ── Radius ────────────────────────────────────────────────────
export const radius = {
    card: 'rounded-xl',
    button: 'rounded-lg',
    badge: 'rounded-full',
    input: 'rounded-lg',
} as const

// ── Shadows ───────────────────────────────────────────────────
export const shadows = {
    card: 'shadow-sm',
    cardHover: 'shadow-md',
    sidebar: 'shadow-[4px_0_24px_rgba(0,0,0,0.02)]',
    dropdown: 'shadow-xl',
} as const

// ── Common Class Patterns ─────────────────────────────────────
export const patterns = {
    card: 'bg-white rounded-xl shadow-sm border border-gray-100',
    cardHoverable:
        'bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow',
    pageAnimation: 'animate-in fade-in duration-500',

    // Table
    tableWrapper:
        'bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden',
    tableHead: 'bg-gray-50/50 border-b border-gray-100',
    tableHeadCell:
        'px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider',
    tableRow: 'hover:bg-gray-50/50 transition-colors',
    tableCell: 'px-6 py-4',

    // Buttons
    btnPrimary:
        'bg-[#7C1D3E] text-white px-4 py-2 rounded-lg hover:bg-[#5A152D] transition-colors shadow-sm',
    btnSecondary:
        'bg-[#E91E7B] text-white px-4 py-2 rounded-lg hover:bg-[#C2185B] transition-colors',
    btnOutline:
        'border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors',
    btnDanger:
        'bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors',
    btnGhost:
        'text-gray-500 hover:bg-gray-50 hover:text-gray-700 px-4 py-2 rounded-lg transition-colors',

    // Inputs
    input:
        'w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7C1D3E]/20 focus:border-[#7C1D3E]',
    inputError:
        'w-full px-3 py-2 border border-red-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20',
    searchInput:
        'w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7C1D3E]/20',

    // Badge
    badge:
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
} as const
