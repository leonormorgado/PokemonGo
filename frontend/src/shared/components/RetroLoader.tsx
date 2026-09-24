type RetroLoaderProps = {
  label: string;
  testId?: string;
};

// Shared full-area overlay loader (bouncing squares + pulsing label) used wherever a blocking
// fetch needs to visually interrupt the current view — keeps every such loading state identical.
export function RetroLoader({ label, testId }: RetroLoaderProps) {
  return (
    <div
      data-testid={testId}
      className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-[#241F1A]/90 text-[#FFFACF]"
    >
      <div className="flex gap-2">
        {[0, 1, 2, 3].map((index) => (
          <span
            key={index}
            className="h-4 w-4 animate-bounce bg-[#DE623C]"
            style={{ animationDelay: `${index * 150}ms` }}
          />
        ))}
      </div>
      <span className="animate-pulse text-xs font-black uppercase tracking-widest">{label}</span>
    </div>
  );
}
