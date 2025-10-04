// components/SettingsModal.tsx
import { useEffect, useState } from "react";
import "./SettingsModal.css";

type GasPreset = "default" | "standard" | "fast" | "instant";
type SlippageMode = "auto" | "fixed" | "custom";

export default function SettingsModal({
  open,
  initial,
  onApply,
  onClose,
  autoPreviewPct, 
}: {
  open: boolean;
  initial: {
    slippageMode: SlippageMode;
    slippage: number;
    deadlineMin: number;
    expertMode: boolean;
    disableMultihops: boolean;
    gasPreset: GasPreset;
  };
  onApply: (v: {
    slippageMode: SlippageMode;
    slippage: number;
    deadlineMin: number;
    expertMode: boolean;
    disableMultihops: boolean;
    gasPreset: GasPreset;
    resolvedSlippagePct: number;
    resolvedSlippageBps: number;
  }) => void;
  onClose: () => void;
  autoPreviewPct?: number;
}) {
  const [mode, setMode] = useState<SlippageMode>(initial.slippageMode);
  const [slip, setSlip] = useState<number>(initial.slippage);
  const [ddl, setDdl] = useState<number>(initial.deadlineMin);
  const [exp, setExp] = useState<boolean>(initial.expertMode);
  const [noHop, setNoHop] = useState<boolean>(initial.disableMultihops);
  const [preset, setPreset] = useState<GasPreset>(initial.gasPreset);

  useEffect(() => {
    if (!open) return;
    setMode(initial.slippageMode);
    setSlip(initial.slippage);
    setDdl(initial.deadlineMin);
    setExp(initial.expertMode);
    setNoHop(initial.disableMultihops);
    setPreset(initial.gasPreset);
  }, [open, initial]);

  if (!open) return null;

  const clampPct = (v: number) => Math.max(0, Math.min(50, Number(v.toFixed(2))));

  
  const resolvedPct =
    mode === "auto"
      ? clampPct(Math.max(0.1, autoPreviewPct ?? 1)) 
      : mode === "fixed"
      ? clampPct(slip) 
      : clampPct(slip); 

  return (
    <>
      <div className="airon-backdrop" onClick={onClose} />

      <div className="airon-modal" role="dialog" aria-modal="true" aria-label="Settings">
        <div className="airon-panel">
          <div className="airon-s-head">
            <div className="airon-s-title">
              <span>Settings</span>
              <span className="airon-chip">
                {mode === "auto" ? `Auto ≈ ${(autoPreviewPct ?? 0).toFixed(2)}%` : "Auto (off)"}
              </span>
            </div>
            <button className="airon-s-close" onClick={onClose}>✕</button>
          </div>

          <div className="airon-s-cap">SWAPS &amp; LIQUIDITY</div>

          
          <div className="airon-s-row">
            <div className="airon-s-label">Slippage Mode</div>
            <div className="airon-s-ctrl">
              <button
                className={`airon-pill ${mode === "auto" ? "on" : ""}`}
                onClick={() => setMode("auto")}
              >
                AUTO
              </button>
              <button
                className={`airon-pill ${mode === "fixed" ? "on" : ""}`}
                onClick={() => { setMode("fixed"); }}
              >
                FIXED
              </button>
              <button
                className={`airon-pill ${mode === "custom" ? "on" : ""}`}
                onClick={() => setMode("custom")}
              >
                CUSTOM
              </button>
            </div>
          </div>

          
          <div className="airon-s-row">
            <div className="airon-s-label">
              Slippage Tolerance
              <span className="airon-sub">
                {mode === "auto"
                  ? "AUTO: adapts to token taxes/fees + safety buffer."
                  : "Range: 0–50%, 2 decimals max."}
              </span>
            </div>
            <div className="airon-s-ctrl">
              <div className={`airon-input-combo with-suffix ${mode === "auto" ? "disabled" : ""}`}>
                <input
                  className="airon-input"
                  type="number"
                  step="0.01"
                  min={0}
                  max={50}
                  value={slip}
                  disabled={mode === "auto"}
                  onChange={(e) => {
                    const v = Number((e.target.value || "0").toString().replace(",", "."));
                    const clamped = Math.max(0, Math.min(50, v));
                    setSlip(Number(clamped.toFixed(2)));
                  }}
                />
                <span className="airon-suffix">%</span>
              </div>
            </div>
          </div>

         
          <div className="airon-s-row">
            <div className="airon-s-label">Tx deadline</div>
            <div className="airon-s-ctrl">
              <div className="airon-input-combo with-suffix">
                <input
                  className="airon-input"
                  type="number"
                  min={1}
                  value={ddl}
                  onChange={(e) => setDdl(Math.max(1, Math.floor(Number(e.target.value) || 0)))}
                />
                <span className="airon-suffix">mins</span>
              </div>
            </div>
          </div>

          
          <div className="airon-s-row">
            <div className="airon-s-label">Tx Speed (GWEI)</div>
            <div className="airon-s-ctrl">
              <div className="airon-select">
                <select
                  value={preset}
                  onChange={(e) => setPreset(e.target.value as GasPreset)}
                  className="airon-select-el"
                >
                  <option value="default">Default</option>
                  <option value="instant">Instant (+0.15)</option>
                  <option value="standard">Standard (+0.10)</option>
                  <option value="fast">Fast (+0.12)</option>
                </select>
                <span className="airon-select-caret">▾</span>
              </div>
            </div>
          </div>

          
          <div className="airon-s-row">
            <div className="airon-s-label">Expert Mode</div>
            <div className="airon-s-ctrl">
              <label className="airon-toggle">
                <input
                  type="checkbox"
                  checked={exp}
                  onChange={(e) => setExp(e.target.checked)}
                />
                <span className="airon-toggle-dot" />
              </label>
              <span className="airon-sub">Bypass confirmations. Use with extreme care.</span>
            </div>
          </div>

          
          <div className="airon-s-foot">
            <button className="airon-btn ghost" onClick={onClose}>Cancel</button>
            <button
              className="airon-btn primary"
              onClick={() => {
                onApply({
                  slippageMode: mode,
                  slippage: Number(slip.toFixed(2)),
                  deadlineMin: ddl,
                  expertMode: exp,
                  disableMultihops: noHop,
                  gasPreset: preset,
                  resolvedSlippagePct: resolvedPct,
                  resolvedSlippageBps: Math.round(resolvedPct * 100),
                });
                onClose();
              }}
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
