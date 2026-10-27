import type { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  count: number | string;
  icon: LucideIcon;
  iconColor?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  onClick?: () => void;
}

export default function MetricCard({ 
  title, 
  count, 
  icon: Icon,
  iconColor = 'text-benne-gold',
  trend,
  onClick
}: MetricCardProps) {
  const isClickable = !!onClick;

  return (
    <div 
      className={`card ${isClickable ? 'cursor-pointer hover:shadow-md hover:border-benne-gold transition-all' : ''}`}
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={isClickable ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      } : undefined}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-benne-brown-muted mb-1">{title}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-serif text-benne-brown">{count}</p>
            {trend && (
              <span className={`text-xs font-medium ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
            )}
          </div>
        </div>
        <div className={`p-3 rounded-full bg-benne-cream ${iconColor}`}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  );
}
