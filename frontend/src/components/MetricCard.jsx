export const MetricCard = ({ label, value, unit, hint, testid }) => (
  <div data-testid={testid}
    className="border border-gray-200 p-5 bg-white hover:border-black transition-colors">
    <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-gray-500">{label}</div>
    <div className="mt-3 flex items-baseline gap-1.5">
      <span className="font-mono text-3xl text-black leading-none">{value}</span>
      {unit ? <span className="font-mono text-xs text-gray-500">{unit}</span> : null}
    </div>
    {hint ? <div className="mt-2 text-xs text-gray-500 leading-snug">{hint}</div> : null}
  </div>
);
