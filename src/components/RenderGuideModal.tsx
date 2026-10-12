import React, { useState } from 'react';
import { X, Server, CheckCircle2, AlertTriangle, Copy, Check, ExternalLink, HelpCircle, Sparkles } from 'lucide-react';
import { ServerStatusResponse } from '../types';

interface RenderGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  serverStatus: ServerStatusResponse | null;
}

export const RenderGuideModal: React.FC<RenderGuideModalProps> = ({
  isOpen,
  onClose,
  serverStatus,
}) => {
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  if (!isOpen) return null;

  const envSnippet = `SERPAPI_KEY=your_serpapi_key_here\nGEMINI_API_KEY=your_gemini_api_key_here`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(envSnippet);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  const hasSerp = Boolean(serverStatus?.configured);
  const hasGemini = Boolean(serverStatus?.geminiConfigured);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="render-modal-title"
    >
      <div className="relative w-full max-w-xl bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-3 bg-zinc-50/50 dark:bg-zinc-800/30">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center shrink-0 font-bold">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <h2 id="render-modal-title" className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Render Deployment & Setup Guide
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Fix random prices & configure India price intelligence on Render
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs sm:text-sm">
          {/* Live Server Connection Status Card */}
          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 space-y-2.5">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <span>Live Server Status</span>
              {serverStatus?.isRender && (
                <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 rounded text-[10px] font-bold">
                  Running on Render
                </span>
              )}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-start gap-2">
                {hasSerp ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                )}
                <div className="min-w-0">
                  <div className="font-semibold text-zinc-900 dark:text-zinc-100 text-xs">
                    SERPAPI_KEY
                  </div>
                  <div className={`text-[11px] ${hasSerp ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                    {hasSerp ? 'Connected (Live Google Shopping)' : 'Missing in Render Environment'}
                  </div>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-start gap-2">
                {hasGemini ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                )}
                <div className="min-w-0">
                  <div className="font-semibold text-zinc-900 dark:text-zinc-100 text-xs">
                    GEMINI_API_KEY
                  </div>
                  <div className={`text-[11px] ${hasGemini ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                    {hasGemini ? 'Connected (Gemini AI Active)' : 'Offline (Using Indian Tech Catalog)'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Why prices were random explanation */}
          <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 text-blue-900 dark:text-blue-200 space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-xs">
              <HelpCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Why Were Prices Showing Up Randomly on Render?</span>
            </div>
            <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
              When pushing to GitHub and Render, your local <code>.env</code> file is <strong>never uploaded</strong> (it is ignored for security). On Render, your server starts without environment variables unless you add them in the Render Dashboard!
            </p>
            <ul className="text-xs text-blue-800 dark:text-blue-300 list-disc list-inside space-y-1">
              <li>Without <code>SERPAPI_KEY</code>, searches fail or cannot query Google Shopping India.</li>
              <li>Without <code>GEMINI_API_KEY</code>, Google Shopping returns phone covers (₹199), cases, and international dropshippers (₹2,50,000) mixed together without an authentic target price.</li>
              <li><strong>What we fixed:</strong> We built in an <em>offline Indian Tech Catalog</em> so even without Gemini keys on Render, authentic Indian prices are locked and phone covers are automatically filtered out!</li>
            </ul>
          </div>

          {/* 3 Step Render Fix */}
          <div className="space-y-3">
            <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-xs uppercase tracking-wider">
              How to Add Environment Variables on Render (2 Minutes)
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800">
                <span className="w-5 h-5 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <div>
                  <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                    Open Render Dashboard
                  </p>
                  <p className="text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Navigate to <a href="https://dashboard.render.com" target="_blank" rel="noreferrer" className="text-emerald-600 dark:text-emerald-400 underline inline-flex items-center gap-0.5">dashboard.render.com <ExternalLink className="w-2.5 h-2.5" /></a> and select your Web Service.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800">
                <span className="w-5 h-5 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <div>
                  <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                    Go to the "Environment" Tab
                  </p>
                  <p className="text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Click <strong>Environment</strong> on the left sidebar, then click <strong>Add Environment Variable</strong>.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800">
                <span className="w-5 h-5 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                  3
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                    Add Both Keys
                  </p>
                  <p className="text-zinc-500 dark:text-zinc-400 mt-0.5 mb-2">
                    Enter your keys and click <strong>Save Changes</strong>. Render will automatically redeploy.
                  </p>

                  <div className="relative p-2.5 bg-zinc-900 dark:bg-black rounded-lg text-zinc-200 font-mono text-[11px]">
                    <pre className="overflow-x-auto whitespace-pre">{envSnippet}</pre>
                    <button
                      onClick={copyToClipboard}
                      className="absolute top-2 right-2 p-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors cursor-pointer"
                      title="Copy template"
                    >
                      {copiedSnippet ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/30 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Built-in Indian Tech Catalog safeguards all searches</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900 text-white rounded-lg font-medium text-xs transition-colors cursor-pointer"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
