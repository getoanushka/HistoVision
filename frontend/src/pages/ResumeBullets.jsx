import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Copy, Check } from "@phosphor-icons/react";
import { toast } from "sonner";
import { fetchResumeBullets } from "../lib/api";

export default function ResumeBullets() {
  const [md, setMd] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => { fetchResumeBullets().then(setMd).catch(() => setMd("# Could not load")); }, []);

  const copy = async () => {
    await navigator.clipboard.writeText(md);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div data-testid="resume-page" className="space-y-10">
      <header className="border-b border-gray-200 pb-6 flex items-end justify-between">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-gray-500">Workspace · 03</div>
          <h2 className="mt-2 text-4xl font-semibold tracking-tight text-black">Resume Bullets</h2>
          <p className="mt-2 text-sm text-gray-600 max-w-2xl leading-relaxed">
            JD-tailored bullet points + interview talking points. Pick the strongest 3–5 and paste into your resume.
          </p>
        </div>
        <button onClick={copy} data-testid="copy-md-btn"
          className="inline-flex items-center gap-2 bg-black text-white hover:bg-[#0055FF] transition-colors px-5 py-3 font-mono text-xs uppercase tracking-wider">
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? "Copied" : "Copy Markdown"}
        </button>
      </header>

      <article data-testid="resume-content"
        className="border border-gray-200 p-8 max-w-4xl prose prose-sm prose-neutral max-w-none
          prose-headings:font-semibold prose-headings:text-black
          prose-h1:text-3xl prose-h2:text-xl prose-h3:text-base prose-h3:uppercase prose-h3:tracking-wider prose-h3:font-mono
          prose-li:text-sm prose-li:text-black prose-li:leading-relaxed
          prose-strong:text-black prose-strong:font-semibold
          prose-code:font-mono prose-code:text-[#0055FF] prose-code:bg-[#F9F9F9] prose-code:px-1 prose-code:py-0.5 prose-code:rounded-none
          prose-hr:border-gray-200">
        <ReactMarkdown>{md}</ReactMarkdown>
      </article>
    </div>
  );
}
