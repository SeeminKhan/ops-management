import type { LucideIcon } from 'lucide-react';

interface SummaryCardProps {
  title: string;
  count: number;
  icon: LucideIcon;
  iconColor?: string;
}

export default function SummaryCard({ 
  title, 
  count, 
  icon: Icon,
  iconColor = 'text-benne-gold'
}: SummaryCardProps) {
  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-benne-brown-muted mb-1">{title}</p>
          <p className="text-3xl font-serif text-benne-brown">{count}</p>
        </div>
        <div className={`p-3 rounded-full bg-benne-cream ${iconColor}`}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  );
}
