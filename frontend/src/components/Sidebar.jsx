import { NavLink } from "react-router-dom";
import { Microscope, ClockCounterClockwise } from "@phosphor-icons/react";

const NAV = [
  { to: "/", label: "Analyzer", icon: Microscope, testid: "nav-analyzer" },
  { to: "/history", label: "History", icon: ClockCounterClockwise, testid: "nav-history" },
];

export const Sidebar = () => (
  <aside data-testid="sidebar"
    className="fixed left-0 top-0 h-full w-[280px] border-r border-gray-200 bg-white z-40 flex flex-col">
    <div className="px-6 py-7 border-b border-gray-200">
      <div className="flex items-center gap-2">
        <span className="hv-live-dot inline-block w-2 h-2 bg-[#0055FF]" />
        <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-gray-500">v1.0 · Live</span>
      </div>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight text-black">HistoVision</h1>
      <p className="mt-1 text-xs text-gray-500 leading-relaxed">Tissue Image Analysis &amp; Quality Assessment</p>
    </div>

    <nav className="flex-1 py-4">
      {NAV.map(({ to, label, icon: Icon, testid }) => (
        <NavLink key={to} to={to} end={to === "/"} data-testid={testid}
          className={({ isActive }) =>
            `flex items-center gap-3 px-6 py-3 text-sm border-l-2 transition-colors ${
              isActive
                ? "border-l-[#0055FF] bg-[#F9F9F9] text-black font-medium"
                : "border-l-transparent text-gray-600 hover:bg-[#F9F9F9] hover:text-black"
            }`
          }>
          <Icon size={18} weight="regular" />
          <span className="font-mono uppercase tracking-wider text-xs">{label}</span>
        </NavLink>
      ))}
    </nav>

    <div className="px-6 py-5 border-t border-gray-200">
      <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-gray-500 mb-2">Pipeline</div>
      <ul className="text-xs text-gray-600 space-y-1.5 leading-relaxed">
        <li>· Color Spaces (RGB / HSV / LAB)</li>
        <li>· Otsu &amp; Adaptive Threshold</li>
        <li>· Contour Extraction</li>
        <li>· Quality Metrics (IQA)</li>
        <li>· Denoise → CLAHE → Sharpen</li>
      </ul>
    </div>
  </aside>
);
