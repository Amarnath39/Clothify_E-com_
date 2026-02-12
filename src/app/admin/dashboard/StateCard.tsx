import React from 'react';

interface StatCardProps {
  title: string;
  value: any; // Changed to any to handle both string, number, and object types
  icon: React.ElementType;
  iconSize?: number;
  description?: string;
  percentage?: string;
  lastUpdated?: string;
  variant?: 'default' | 'highlighted';
  subtitleDotColor?: 'red' | 'green';
}

const StatCard = ({
  title,
  value,
  icon: Icon,
  iconSize = 24,
  description,
  percentage,
  lastUpdated,
  variant = 'default',
  subtitleDotColor = 'green'
}: StatCardProps) => {
  const isHighlighted = variant === 'highlighted';

  // Function to handle different value types
  const displayValue = () => {
    if (value === undefined || value === null) return '0';
    if (typeof value === 'object' && value !== null) {
      // If it's an object with an 'overall' property, use that
      return value.overall !== undefined ? value.overall : JSON.stringify(value);
    }
    return value;
  };

  const formattedValue = displayValue();

  return (
    <div className={`relative overflow-hidden p-7 rounded-2xl transition-all duration-300 border ${
      isHighlighted 
        ? 'bg-slate-900 border-slate-800 text-white shadow-xl' 
        : 'bg-white border-slate-100 text-slate-900 shadow-sm hover:shadow-md'
    }`}>
      {percentage && (
        <div className="absolute top-7 right-7 z-10">
          <span className={`text-xs font-bold px-2 py-1 rounded-lg ${
            isHighlighted ? 'bg-blue-500/20 text-blue-300' : 'bg-green-100 text-green-700'
          }`}>
            {percentage}
          </span>
        </div>
      )}

      <div
        className={`absolute right-7 top-1/2 -translate-y-1/2 pointer-events-none ${
          isHighlighted ? 'text-white/25' : 'text-slate-300'
        }`}
      >
        <Icon size={iconSize} className="opacity-80" />
      </div>

      <div className="space-y-1">
        <p className={`text-sm font-medium ${
          isHighlighted ? 'text-slate-400' : 'text-slate-500'
        }`}>
          {title}
        </p>
        <h3 className="text-2xl font-bold tracking-tight">
          {!isNaN(Number(formattedValue)) && title.toLowerCase().includes('revenue')
            ? `$${Number(formattedValue).toLocaleString()}`
            : formattedValue || '0'}
        </h3>
      </div>

      {(description || lastUpdated) && (
        <div className="mt-4 pt-4 border-t border-slate-100/10 flex flex-col gap-2">
          {description && (
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${
                subtitleDotColor === 'red' ? 'bg-red-500' : 'bg-green-500'
              }`} />
              <p className={`text-xs ${
                isHighlighted ? 'text-slate-400' : 'text-slate-500'
              }`}>
                {description}
              </p>
            </div>
          )}
          {lastUpdated && (
            <p className="text-[10px] uppercase tracking-wider opacity-50 font-semibold">
              Updated: {lastUpdated}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default StatCard;