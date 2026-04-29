export const ImagePane = ({ src, label, caption, testid }) => (
  <div data-testid={testid} className="border border-gray-200 bg-white flex flex-col">
    <div className="px-3 py-2 border-b border-gray-200 flex items-center justify-between">
      <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-black">{label}</span>
      {caption ? <span className="text-[10px] font-mono text-gray-500">{caption}</span> : null}
    </div>
    <div className="aspect-square w-full overflow-hidden bg-[#F9F9F9] flex items-center justify-center">
      {src ? (
        <img src={src} alt={label} className="w-full h-full object-cover" draggable={false} />
      ) : (
        <span className="text-xs font-mono text-gray-400">— no data —</span>
      )}
    </div>
  </div>
);
