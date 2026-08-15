interface ProgressBarProps {
  progress: number; // 0-100
  label?: string;
  showPercent?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function ProgressBar({
  progress,
  label,
  showPercent = true,
  size = 'md',
}: ProgressBarProps) {
  const heights = { sm: 'h-1', md: 'h-2', lg: 'h-3' };

  return (
    <div className="w-full">
      {(label || showPercent) && (
        <div className="flex justify-between items-center mb-2">
          {label && <span className="text-sm text-[var(--color-dark-200)]">{label}</span>}
          {showPercent && (
            <span className="text-sm font-medium text-[var(--color-accent-cyan)]">
              {Math.round(progress)}%
            </span>
          )}
        </div>
      )}
      <div className={`w-full bg-[var(--color-dark-600)] rounded-full overflow-hidden ${heights[size]}`}>
        <div
          className={`${heights[size]} rounded-full transition-all duration-500 ease-out`}
          style={{
            width: `${Math.min(100, Math.max(0, progress))}%`,
            background: 'linear-gradient(90deg, var(--color-accent-cyan), var(--color-accent-violet))',
          }}
        />
      </div>
    </div>
  );
}
