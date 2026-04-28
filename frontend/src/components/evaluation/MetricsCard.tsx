interface MetricsCardProps {
  label: string;
  value?: number;
}

export const MetricsCard = ({ label, value }: MetricsCardProps) => {
  const percentage = value ? Math.round(value * 100) : 0;

  const getColor = (pct: number) => {
    if (pct >= 80) return 'bg-gray-100 border-gray-300';
    if (pct >= 60) return 'bg-gray-100 border-gray-300';
    return 'bg-gray-100 border-gray-300';
  };

  const getTextColor = (pct: number) => {
    if (pct >= 80) return 'text-gray-700';
    if (pct >= 60) return 'text-gray-700';
    return 'text-gray-700';
  };

  const getBarColor = (pct: number) => {
    if (pct >= 80) return 'bg-black';
    if (pct >= 60) return 'bg-gray-700';
    return 'bg-black';
  };

  return (
    <div className={`p-4 border rounded-md ${getColor(percentage)}`}>
      <p className="text-sm text-gray-700 mb-2">{label}</p>
      <div className="flex items-center gap-3">
        <div className={`text-2xl font-bold ${getTextColor(percentage)}`}>
          {percentage}%
        </div>
        <div className="flex-1 h-2 bg-gray-300 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${getBarColor(percentage)}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
};


