import React from 'react'
import {
    Search,
    X,
    CheckCircle,
    AlertTriangle,
    Info,
    ChevronLeft,
    ChevronRight,
    TrendingUp,
    Users,
    DollarSign,
    RotateCcw,
} from 'lucide-react'

export { ChevronLeft, ChevronRight, TrendingUp, Users, DollarSign, RotateCcw }

/* ─────────────────────────────────────────────────────────────
   BUTTON
   ───────────────────────────────────────────────────────────── */
type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost'
type ButtonSize = 'sm' | 'md' | 'lg'
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant
    size?: ButtonSize
    children: React.ReactNode
}
const buttonStyles: Record<ButtonVariant, string> = {
    primary: 'bg-[#7C1D3E] text-white hover:bg-[#5A152D] shadow-sm',
    secondary: 'bg-[#E91E7B] text-white hover:bg-[#C2185B]',
    outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    ghost: 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
}
const buttonSizes: Record<ButtonSize, string> = {
    sm: 'px-3 py-1 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg font-medium',
}
export function Button({
    variant = 'primary',
    size = 'md',
    className = '',
    children,
    disabled,
    ...props
}: ButtonProps) {
    return (
        <button
            className={`
        rounded-lg font-medium transition-colors inline-flex items-center gap-2
        ${buttonStyles[variant]}
        ${buttonSizes[size]}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
            disabled={disabled}
            {...props}
        >
            {children}
        </button>
    )
}

/* ─────────────────────────────────────────────────────────────
   BADGE
   ───────────────────────────────────────────────────────────── */
type BadgeVariant =
    | 'success'
    | 'warning'
    | 'danger'
    | 'info'
    | 'purple'
    | 'brand'
    | 'neutral'
interface BadgeProps {
    variant?: BadgeVariant
    children: React.ReactNode
    dot?: boolean
    className?: string
}
const badgeStyles: Record<BadgeVariant, string> = {
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
    purple: 'bg-purple-100 text-purple-800',
    brand: 'bg-[#7C1D3E]/10 text-[#7C1D3E]',
    neutral: 'bg-gray-100 text-gray-800',
}
const dotColors: Record<BadgeVariant, string> = {
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    danger: 'bg-red-500',
    info: 'bg-blue-500',
    purple: 'bg-purple-500',
    brand: 'bg-[#7C1D3E]',
    neutral: 'bg-gray-400',
}
export function Badge({
    variant = 'neutral',
    children,
    dot,
    className = '',
}: BadgeProps) {
    return (
        <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeStyles[variant]} ${className}`}
        >
            {dot && (
                <span
                    className={`w-1.5 h-1.5 rounded-full mr-1.5 ${dotColors[variant]}`}
                />
            )}
            {children}
        </span>
    )
}

/* ─────────────────────────────────────────────────────────────
   TOGGLE SWITCH
   ───────────────────────────────────────────────────────────── */
interface ToggleProps {
    checked: boolean
    onChange: (checked: boolean) => void
    disabled?: boolean
}
export function Toggle({ checked, onChange, disabled }: ToggleProps) {
    return (
        <button
            type="button"
            onClick={() => !disabled && onChange(!checked)}
            className={`
        relative inline-flex h-6 w-11 items-center rounded-full transition-colors
        focus:outline-none focus:ring-2 focus:ring-[#7C1D3E] focus:ring-offset-2
        ${checked ? 'bg-[#7C1D3E]' : 'bg-gray-200'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
        >
            <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`}
            />
        </button>
    )
}

/* ─────────────────────────────────────────────────────────────
   ALERT
   ───────────────────────────────────────────────────────────── */
type AlertType = 'success' | 'warning' | 'error' | 'info'
interface AlertProps {
    type: AlertType
    message: string
    onDismiss?: () => void
}
const alertStyles: Record<AlertType, string> = {
    success: 'bg-green-50 text-green-800 border-green-200',
    warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
    error: 'bg-red-50 text-red-800 border-red-200',
    info: 'bg-blue-50 text-blue-800 border-blue-200',
}
const alertIcons: Record<AlertType, React.ReactNode> = {
    success: <CheckCircle size={20} />,
    warning: <AlertTriangle size={20} />,
    error: <AlertTriangle size={20} />,
    info: <Info size={20} />,
}
export function Alert({ type, message, onDismiss }: AlertProps) {
    return (
        <div
            className={`p-4 rounded-lg border flex items-start gap-3 ${alertStyles[type]}`}
        >
            <div className="mt-0.5">{alertIcons[type]}</div>
            <div className="flex-1 text-sm font-medium">{message}</div>
            {onDismiss && (
                <button
                    onClick={onDismiss}
                    className="opacity-50 hover:opacity-100 transition-opacity"
                >
                    <X size={18} />
                </button>
            )}
        </div>
    )
}

/* ─────────────────────────────────────────────────────────────
   PROGRESS BAR
   ───────────────────────────────────────────────────────────── */
interface ProgressBarProps {
    value: number
    label?: string
    color?: string
}
export function ProgressBar({
    value,
    label,
    color = 'bg-[#7C1D3E]',
}: ProgressBarProps) {
    return (
        <div>
            {label && (
                <div className="flex justify-between text-xs font-medium mb-1">
                    <span className="text-gray-600">{label}</span>
                    <span className="text-gray-900">{value}%</span>
                </div>
            )}
            <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                    className={`h-2 rounded-full transition-all duration-500 ${color}`}
                    style={{
                        width: `${Math.min(100, Math.max(0, value))}%`,
                    }}
                />
            </div>
        </div>
    )
}

/* ─────────────────────────────────────────────────────────────
   AVATAR
   ───────────────────────────────────────────────────────────── */
type AvatarSize = 'sm' | 'md' | 'lg'
interface AvatarProps {
    name: string
    src?: string
    size?: AvatarSize
    className?: string
}
const avatarSizes: Record<AvatarSize, string> = {
    sm: 'w-6 h-6 text-[10px]',
    md: 'w-10 h-10 text-sm',
    lg: 'w-20 h-20 text-2xl',
}
export function Avatar({
    name,
    src,
    size = 'md',
    className = '',
}: AvatarProps) {
    if (src) {
        return (
            <img
                src={src}
                alt={name}
                className={`${avatarSizes[size]} rounded-full border-2 border-white shadow-sm object-cover ${className}`}
            />
        )
    }
    return (
        <div
            className={`${avatarSizes[size]} rounded-full bg-gradient-to-br from-[#7C1D3E] to-[#E91E7B] flex items-center justify-center text-white font-bold ${className}`}
        >
            {name.charAt(0).toUpperCase()}
        </div>
    )
}

/* ─────────────────────────────────────────────────────────────
   PAGE HEADER
   ───────────────────────────────────────────────────────────── */
interface PageHeaderProps {
    title: string
    description?: string
    action?: React.ReactNode
}
export function PageHeader({ title, description, action }: PageHeaderProps) {
    return (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
                {description && (
                    <p className="text-gray-500 text-sm mt-1">{description}</p>
                )}
            </div>
            {action}
        </div>
    )
}

/* ─────────────────────────────────────────────────────────────
   CARD
   ───────────────────────────────────────────────────────────── */
interface CardProps {
    children: React.ReactNode
    className?: string
    hoverable?: boolean
}
export function Card({ children, className = '', hoverable }: CardProps) {
    return (
        <div
            className={`bg-white rounded-xl shadow-sm border border-gray-100 ${hoverable ? 'hover:shadow-md transition-shadow' : ''} ${className}`}
        >
            {children}
        </div>
    )
}

/* ─────────────────────────────────────────────────────────────
   SEARCH INPUT
   ───────────────────────────────────────────────────────────── */
interface SearchInputProps {
    value: string
    onChange: (value: string) => void
    placeholder?: string
    className?: string
}
export function SearchInput({
    value,
    onChange,
    placeholder = 'Search...',
    className = '',
}: SearchInputProps) {
    return (
        <div className={`relative ${className}`}>
            <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
            />
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7C1D3E]/20 focus:border-[#7C1D3E]/50 transition-all"
            />
        </div>
    )
}

/* ─────────────────────────────────────────────────────────────
   FILTER TABS
   ───────────────────────────────────────────────────────────── */
interface FilterTabsProps {
    tabs: string[]
    activeTab: string
    onTabChange: (tab: string) => void
    variant?: 'underline' | 'pill'
}
export function FilterTabs({
    tabs,
    activeTab,
    onTabChange,
    variant = 'underline',
}: FilterTabsProps) {
    if (variant === 'pill') {
        return (
            <div className="flex gap-2 text-black">
                {tabs.map((tab) => (
                    <button
                        key={tab}
                        onClick={() => onTabChange(tab)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeTab === tab ? 'bg-[#7C1D3E] text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                    >
                        {tab}
                    </button>
                ))}
            </div>
        )
    }
    return (
        <div className="flex gap-2 border-b border-gray-200 pb-px text-black">
            {tabs.map((tab) => (
                <button
                    key={tab}
                    onClick={() => onTabChange(tab)}
                    className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors relative ${activeTab === tab ? 'text-[#7C1D3E] bg-white border-b-2 border-[#7C1D3E]' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                >
                    {tab}
                </button>
            ))}
        </div>
    )
}

/* ─────────────────────────────────────────────────────────────
   STAT CARD (simplified portable version)
   ───────────────────────────────────────────────────────────── */
interface StatCardSimpleProps {
    label: string
    value: string
    icon?: React.ReactNode
    change?: string
    changePositive?: boolean
    highlighted?: boolean
}
export function StatCardSimple({
    label,
    value,
    icon,
    change,
    changePositive = true,
    highlighted,
}: StatCardSimpleProps) {
    return (
        <div
            className={`rounded-xl p-6 relative overflow-hidden ${highlighted ? 'bg-gradient-to-br from-[#7C1D3E] to-[#5A152D] text-white shadow-lg' : 'bg-white shadow-sm border border-gray-100'}`}
        >
            <div className="flex justify-between items-start">
                <div>
                    <p
                        className={`text-sm font-medium mb-2 ${highlighted ? 'text-white/80' : 'text-gray-500'}`}
                    >
                        {label}
                    </p>
                    <h3
                        className={`text-2xl font-bold ${highlighted ? 'text-white' : 'text-gray-900'}`}
                    >
                        {value}
                    </h3>
                    {change && (
                        <div className="flex items-center gap-1 mt-2">
                            <span
                                className={`text-xs font-bold ${highlighted ? 'text-white' : changePositive ? 'text-green-600' : 'text-red-600'}`}
                            >
                                {changePositive ? '+' : ''}
                                {change}
                            </span>
                            <span
                                className={`text-xs ${highlighted ? 'text-white/60' : 'text-gray-400'}`}
                            >
                                vs last week
                            </span>
                        </div>
                    )}
                </div>
                {icon && (
                    <div
                        className={`p-3 rounded-lg ${highlighted ? 'bg-white/10' : 'bg-gray-50'}`}
                    >
                        {icon}
                    </div>
                )}
            </div>
        </div>
    )
}

/* ─────────────────────────────────────────────────────────────
   EMPTY STATE
   ───────────────────────────────────────────────────────────── */
interface EmptyStateProps {
    message: string
    icon?: React.ReactNode
}
export function EmptyState({ message, icon }: EmptyStateProps) {
    return (
        <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-dashed border-gray-200">
            {icon && (
                <div className="mb-3 flex justify-center text-gray-300">{icon}</div>
            )}
            <p>{message}</p>
        </div>
    )
}

/* ─────────────────────────────────────────────────────────────
   PAGINATION
   ───────────────────────────────────────────────────────────── */
interface PaginationProps {
    currentPage: number
    totalPages: number
    onPageChange: (page: number) => void
    totalItems?: number
    itemsPerPage?: number
}
export function Pagination({
    currentPage,
    totalPages,
    onPageChange,
    totalItems,
    itemsPerPage,
}: PaginationProps) {
    return (
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/30">
            {totalItems && itemsPerPage && (
                <div className="text-sm text-gray-500">
                    Showing{' '}
                    <span className="font-medium">
                        {(currentPage - 1) * itemsPerPage + 1}
                    </span>{' '}
                    to{' '}
                    <span className="font-medium">
                        {Math.min(currentPage * itemsPerPage, totalItems)}
                    </span>{' '}
                    of <span className="font-medium">{totalItems}</span>
                </div>
            )}
            <div className="flex gap-2">
                <button
                    onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-black"
                >
                    <ChevronLeft size={16} />
                </button>
                {Array.from(
                    {
                        length: totalPages,
                    },
                    (_, i) => i + 1,
                ).map((p) => (
                    <button
                        key={p}
                        onClick={() => onPageChange(p)}
                        className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${currentPage === p ? 'bg-[#7C1D3E] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                    >
                        {p}
                    </button>
                ))}
                <button
                    onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-black"
                >
                    <ChevronRight size={16} />
                </button>
            </div>
        </div>
    )
}

/* ─────────────────────────────────────────────────────────────
   ZAPAN INPUT
   ───────────────────────────────────────────────────────────── */
interface ZapanInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    icon?: React.ElementType;
}
export const ZapanInput = React.forwardRef<HTMLInputElement, ZapanInputProps>(
    ({ label, error, icon: Icon, className = '', ...props }, ref) => {
        return (
            <div className="space-y-1.5 w-full text-black">
                {label && (
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] ml-1">
                        {label}
                    </label>
                )}
                <div className="relative">
                    {Icon && (
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                            <Icon size={18} />
                        </div>
                    )}
                    <input
                        ref={ref}
                        className={`
            w-full h-12 bg-gray-50 border border-gray-100 rounded-xl
            text-sm font-bold placeholder:text-gray-300
            focus:outline-none focus:ring-2 focus:ring-[#7C1D3E]/20 focus:border-[#7C1D3E]/50
            transition-all disabled:opacity-50 disabled:cursor-not-allowed
            ${Icon ? 'pl-11 pr-4' : 'px-4'}
            ${error ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' : ''}
            ${className}
            `}
                        {...props}
                    />
                </div>
                {error && <p className="text-[10px] font-bold text-red-500 ml-1 uppercase tracking-wider">{error}</p>}
            </div>
        );
    }
);
ZapanInput.displayName = 'ZapanInput';

/* ─────────────────────────────────────────────────────────────
   ZAPAN TEXTAREA
   ───────────────────────────────────────────────────────────── */
interface ZapanTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
}
export function ZapanTextarea({ label, className = '', ...props }: ZapanTextareaProps) {
    return (
        <div className="space-y-1.5 w-full text-black">
            {label && (
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] ml-1">
                    {label}
                </label>
            )}
            <textarea
                className={`
          w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl
          text-sm font-bold placeholder:text-gray-300
          focus:outline-none focus:ring-2 focus:ring-[#7C1D3E]/20 focus:border-[#7C1D3E]/50
          transition-all disabled:opacity-50 disabled:cursor-not-allowed
          min-h-[100px]
          ${className}
        `}
                {...props}
            />
        </div>
    );
}
