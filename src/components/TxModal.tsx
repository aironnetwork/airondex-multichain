import "./TxModal.css";
import confirmedIcon from "../assets/swap/confirmed.png";
import failedIcon from "../assets/swap/failed.png";

export type TxModalKind = "waiting" | "pending" | "success" | "error";

export default function TxModal({
  open,
  kind,
  title,
  subtitle,
  hash,
  onClose,
  onPrimary,     
  primaryText,   
}: {
  open: boolean;
  kind: TxModalKind;
  title: string;
  subtitle?: string;
  hash?: string;
  onClose: () => void;
  onPrimary?: () => void;
  primaryText?: string;
}) {
  if (!open) return null;

  const isSpin = kind === "waiting" || kind === "pending";
  const isOk   = kind === "success";
  const isErr  = kind === "error";

  return (
    <>
      
      <div
        className="tx-overlay"
        onClick={() => { if (!isSpin) onClose(); }}
      />
      <div className="tx-card" role="dialog" aria-modal="true" aria-label="Transaction status">
        <div className="tx-icon">
          {isSpin ? (
            <div className="tx-spinner" />
          ) : isOk ? (
            <img className="tx-img" src={confirmedIcon} alt="Confirmed" />
          ) : (
            <img className="tx-img" src={failedIcon} alt="Failed" />
          )}
        </div>

        <div className="tx-title">{title}</div>
        {subtitle ? <div className="tx-sub">{subtitle}</div> : null}

        {hash ? (
          <div className="tx-hash" title={hash}>
            Tx: {hash.slice(0, 10)}…{hash.slice(-10)}
          </div>
        ) : null}

        
        {(isOk || isErr) && (
          <div className="tx-actions">
            <button className="btn ghost" onClick={onClose}>Close</button>
            <button
              className={"btn " + (isOk ? "primary" : "danger")}
              onClick={onPrimary || onClose}
            >
              {primaryText || (isOk ? "Done" : "Dismiss")}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
