import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Trash, ArrowRight } from "@phosphor-icons/react";
import { fetchHistory, fetchHistoryItem, deleteHistoryItem } from "../lib/api";
import { MetricCard } from "../components/MetricCard";
import { ImagePane } from "../components/ImagePane";

export default function History() {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  const reload = async () => {
    setLoading(true);
    try { setItems(await fetchHistory()); } finally { setLoading(false); }
  };
  useEffect(() => { reload(); }, []);

  const open   = async (id) => { try { setSelected(await fetchHistoryItem(id)); } catch { toast.error("Could not load analysis"); } };
  const remove = async (id) => {
    try {
      await deleteHistoryItem(id);
      toast.success("Deleted");
      if (selected?.id === id) setSelected(null);
      reload();
    } catch { toast.error("Delete failed"); }
  };

  return (
    <div data-testid="history-page" className="space-y-10">
      <header className="border-b border-gray-200 pb-6">
        <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-gray-500">Workspace · 02</div>
        <h2 className="mt-2 text-4xl font-semibold tracking-tight text-black">Analysis History</h2>
        <p className="mt-2 text-sm text-gray-600 max-w-2xl leading-relaxed">
          Every analysis you've run. Click a row to revisit results — useful for documentation, testing, and validation of imaging algorithms.
        </p>
      </header>

      {loading ? (
        <div className="text-xs font-mono uppercase tracking-wider text-gray-500">Loading…</div>
      ) : items.length === 0 ? (
        <div className="border border-gray-200 px-6 py-10 text-center">
          <div className="text-xs font-mono uppercase tracking-wider text-gray-500">No analyses yet</div>
          <div className="mt-2 text-sm text-black">Head to the Analyzer and try a sample image.</div>
        </div>
      ) : (
        <div className="border-t border-l border-gray-200">
          <div className="grid grid-cols-12 bg-[#F9F9F9] border-b border-r border-gray-200">
            <Cell className="col-span-1">#</Cell>
            <Cell className="col-span-1">Preview</Cell>
            <Cell className="col-span-3">Title</Cell>
            <Cell className="col-span-2">Source</Cell>
            <Cell className="col-span-1">Lap σ²</Cell>
            <Cell className="col-span-1">SNR</Cell>
            <Cell className="col-span-2">Created</Cell>
            <Cell className="col-span-1">Actions</Cell>
          </div>
          {items.map((it, i) => (
            <div key={it.id} data-testid={`history-row-${it.id}`}
              className="grid grid-cols-12 border-b border-r border-gray-200 hover:bg-[#F9F9F9] transition-colors">
              <Cell className="col-span-1 font-mono">{String(i + 1).padStart(2, "0")}</Cell>
              <Cell className="col-span-1"><img src={it.thumbnail} alt="" className="w-10 h-10 object-cover border border-gray-200" /></Cell>
              <Cell className="col-span-3 truncate">{it.title}</Cell>
              <Cell className="col-span-2 font-mono text-xs uppercase">{it.source}</Cell>
              <Cell className="col-span-1 font-mono">{it.quality_metrics.laplacian_variance}</Cell>
              <Cell className="col-span-1 font-mono">{it.quality_metrics.snr_db}</Cell>
              <Cell className="col-span-2 font-mono text-[11px] text-gray-500">{new Date(it.created_at).toLocaleString()}</Cell>
              <Cell className="col-span-1 flex items-center gap-2">
                <button data-testid={`open-${it.id}`}   onClick={() => open(it.id)}   className="text-black hover:text-[#0055FF]" title="View"><ArrowRight size={16} /></button>
                <button data-testid={`delete-${it.id}`} onClick={() => remove(it.id)} className="text-gray-500 hover:text-[#E53935]" title="Delete"><Trash size={16} /></button>
              </Cell>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <section data-testid="history-detail" className="hv-fade-up space-y-6">
          <div className="border-b border-gray-200 pb-4">
            <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-gray-500">
              Detail · {selected.dimensions?.width}×{selected.dimensions?.height}px
            </div>
            <h3 className="mt-1 text-2xl font-medium text-black">{selected.title}</h3>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-0 border-t border-l border-gray-200">
            <ImagePane src={selected.color_spaces?.rgb}          label="RGB" caption="Original" />
            <ImagePane src={selected.color_spaces?.grayscale}    label="Grayscale" />
            <ImagePane src={selected.segmentation?.otsu_mask}    label="Otsu" />
            <ImagePane src={selected.enhancements?.full_pipeline} label="Pipeline" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-0 border-t border-l border-gray-200">
            <MetricCard label="Lap σ²"     value={selected.quality_metrics?.laplacian_variance} />
            <MetricCard label="Sharpness"  value={selected.quality_metrics?.sharpness} />
            <MetricCard label="SNR"        value={selected.quality_metrics?.snr_db} unit="dB" />
            <MetricCard label="Brightness" value={selected.quality_metrics?.brightness} />
            <MetricCard label="Contrast"   value={selected.quality_metrics?.contrast} />
            <MetricCard label="Range"      value={selected.quality_metrics?.dynamic_range} />
          </div>
        </section>
      )}
    </div>
  );
}

const Cell = ({ children, className = "" }) => (
  <div className={`px-4 py-3 text-sm text-black border-r border-gray-200 last:border-r-0 flex items-center ${className}`}>{children}</div>
);
