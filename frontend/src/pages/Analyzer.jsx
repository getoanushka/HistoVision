import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { UploadSimple, ImageSquare, ArrowsClockwise, X } from "@phosphor-icons/react";
import { fetchSamples, analyzeUrl, analyzeUpload } from "../lib/api";
import { MetricCard } from "../components/MetricCard";
import { ImagePane } from "../components/ImagePane";

const TABS = [
  { key: "color", label: "Color Spaces" },
  { key: "seg",   label: "Segmentation" },
  { key: "iqa",   label: "Quality Metrics" },
  { key: "enh",   label: "Enhancement" },
];

export default function Analyzer() {
  const [samples, setSamples] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [activeTitle, setActiveTitle] = useState("");
  const [tab, setTab] = useState("color");
  const fileRef = useRef(null);

  useEffect(() => { fetchSamples().then(setSamples).catch(() => setSamples([])); }, []);

  const handleSample = async (s) => {
    setLoading(true); setActiveTitle(s.title); setResult(null);
    try {
      const data = await analyzeUrl(s.url, s.title);
      setResult(data); setTab("color");
      toast.success("Analysis complete", { description: s.title });
    } catch (e) {
      toast.error("Analysis failed", { description: String(e?.response?.data?.detail || e.message) });
    } finally { setLoading(false); }
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true); setActiveTitle(file.name); setResult(null);
    try {
      const data = await analyzeUpload(file, file.name);
      setResult(data); setTab("color");
      toast.success("Analysis complete", { description: file.name });
    } catch (err) {
      toast.error("Analysis failed", { description: String(err?.response?.data?.detail || err.message) });
    } finally {
      setLoading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const reset = () => { setResult(null); setActiveTitle(""); };

  return (
    <div data-testid="analyzer-page" className="space-y-10">
      <header className="border-b border-gray-200 pb-6">
        <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-gray-500">Workspace · 01</div>
        <h2 className="mt-2 text-4xl font-semibold tracking-tight text-black">Image Analyzer</h2>
        <p className="mt-2 text-sm text-gray-600 max-w-2xl leading-relaxed">
          Upload a microscopy / tissue image, or pick a sample. The pipeline computes
          color-space transforms, segmentation, image quality metrics, and an enhancement
          chain — saved to history.
        </p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 border border-gray-200 p-6 flex flex-col">
          <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-gray-500">Input · A</div>
          <h3 className="mt-2 text-lg font-medium text-black">Upload your image</h3>
          <p className="mt-2 text-xs text-gray-500 leading-relaxed flex-1">
            JPEG / PNG up to ~10MB. Image is resized to a max of 700px on the longer side for fast processing.
          </p>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" data-testid="file-input" />
          <button data-testid="upload-btn" disabled={loading} onClick={() => fileRef.current?.click()}
            className="mt-5 inline-flex items-center justify-center gap-2 bg-black text-white hover:bg-[#0055FF] transition-colors px-6 py-3 font-mono text-xs uppercase tracking-wider disabled:opacity-50">
            <UploadSimple size={16} /> Upload Image
          </button>
        </div>

        <div className="md:col-span-2 border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-gray-500">Input · B</div>
              <h3 className="mt-2 text-lg font-medium text-black">Or pick a sample tissue</h3>
            </div>
            <ImageSquare size={20} className="text-gray-400" />
          </div>
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-0 border-t border-l border-gray-200">
            {samples.map((s) => (
              <button key={s.id} data-testid={`sample-${s.id}`} disabled={loading} onClick={() => handleSample(s)}
                className="group border-r border-b border-gray-200 bg-white hover:bg-[#F9F9F9] disabled:opacity-50 text-left transition-colors">
                <div className="aspect-square overflow-hidden bg-gray-100">
                  <img src={s.url} alt={s.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    draggable={false} />
                </div>
                <div className="px-3 py-2">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-gray-500">{s.id}</div>
                  <div className="text-xs text-black mt-0.5 leading-tight line-clamp-2">{s.title}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {loading && (
        <div data-testid="loading-banner" className="border border-gray-200 px-6 py-5 flex items-center gap-3">
          <ArrowsClockwise size={18} className="animate-spin text-[#0055FF]" />
          <span className="font-mono text-xs uppercase tracking-wider text-black">Running pipeline · {activeTitle}</span>
        </div>
      )}

      {result && !loading && (
        <section data-testid="results-section" className="hv-fade-up space-y-6">
          <div className="flex items-center justify-between border-b border-gray-200 pb-4">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-gray-500">
                Result · {result.dimensions.width}×{result.dimensions.height}px
              </div>
              <h3 className="mt-1 text-xl font-medium text-black">{activeTitle}</h3>
            </div>
            <button onClick={reset} data-testid="clear-btn"
              className="inline-flex items-center gap-1.5 border border-gray-200 hover:border-black px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-black">
              <X size={14} /> Clear
            </button>
          </div>

          <div className="flex border-b border-gray-200">
            {TABS.map((t) => (
              <button key={t.key} data-testid={`tab-${t.key}`} onClick={() => setTab(t.key)}
                className={`px-5 py-3 font-mono text-[11px] uppercase tracking-wider border-b-2 transition-colors ${
                  tab === t.key ? "border-b-[#0055FF] text-black" : "border-b-transparent text-gray-500 hover:text-black"
                }`}>{t.label}</button>
            ))}
          </div>

          {tab === "color" && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-0 border-t border-l border-gray-200">
              <ImagePane src={result.color_spaces.rgb}       label="RGB"       caption="Original"       testid="img-rgb" />
              <ImagePane src={result.color_spaces.grayscale} label="Grayscale" caption="Single channel" testid="img-gray" />
              <ImagePane src={result.color_spaces.hsv}       label="HSV"       caption="Hue · Sat · Val" testid="img-hsv" />
              <ImagePane src={result.color_spaces.lab}       label="LAB"       caption="Perceptual"     testid="img-lab" />
            </div>
          )}

          {tab === "seg" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 border-t border-l border-gray-200">
                <ImagePane src={result.segmentation.otsu_mask}      label="Otsu Mask" caption={`T = ${result.segmentation.otsu_threshold_value.toFixed(0)}`} testid="img-otsu" />
                <ImagePane src={result.segmentation.adaptive_mask}  label="Adaptive Threshold" caption="Gaussian · 31×31" testid="img-adaptive" />
                <ImagePane src={result.segmentation.contour_overlay} label="Contours" caption={`${result.segmentation.contour_count} regions`} testid="img-contours" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-0 border-t border-l border-gray-200">
                <MetricCard label="Otsu T"     value={result.segmentation.otsu_threshold_value.toFixed(0)} hint="Threshold minimizing intra-class variance" testid="metric-otsu" />
                <MetricCard label="Foreground" value={result.segmentation.total_area_pct.toFixed(1)} unit="%" hint="Pixels above Otsu threshold" testid="metric-fg" />
                <MetricCard label="Regions"    value={result.segmentation.contour_count} hint="External contours w/ area > 50px²" testid="metric-regions" />
              </div>
            </div>
          )}

          {tab === "iqa" && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-0 border-t border-l border-gray-200">
              <MetricCard label="Laplacian σ²" value={result.quality_metrics.laplacian_variance.toFixed(1)} hint={`Blur: ${result.quality_metrics.blur_label}`} testid="metric-lap" />
              <MetricCard label="Sharpness"    value={result.quality_metrics.sharpness.toFixed(1)} hint="Mean Sobel gradient magnitude" testid="metric-sharp" />
              <MetricCard label="SNR"          value={result.quality_metrics.snr_db.toFixed(1)} unit="dB" hint="20·log₁₀(μ / σ)" testid="metric-snr" />
              <MetricCard label="Brightness μ" value={result.quality_metrics.brightness.toFixed(1)} hint="0 (black) → 255 (white)" testid="metric-brightness" />
              <MetricCard label="Contrast σ"   value={result.quality_metrics.contrast.toFixed(1)} hint="Std-dev of grayscale intensities" testid="metric-contrast" />
              <MetricCard label="Dynamic Range" value={result.quality_metrics.dynamic_range.toFixed(0)} hint="max(I) − min(I)" testid="metric-dr" />
            </div>
          )}

          {tab === "enh" && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-0 border-t border-l border-gray-200">
              <ImagePane src={result.color_spaces.rgb}            label="Original"      caption="Reference"          testid="img-orig" />
              <ImagePane src={result.enhancements.denoised}       label="Denoised"      caption="Non-Local Means"    testid="img-denoised" />
              <ImagePane src={result.enhancements.clahe_equalized} label="CLAHE"        caption="Local hist. eq."    testid="img-clahe" />
              <ImagePane src={result.enhancements.full_pipeline}  label="Full Pipeline" caption="Denoise → CLAHE → Sharpen" testid="img-pipeline" />
            </div>
          )}
        </section>
      )}
    </div>
  );
}
