import React, { useEffect, useMemo, useRef, useState } from "react";
import "./Earn.style.css";

type Line = { id: number; text: string; kind?: "info" | "warn" | "ok" | "err" };

const BOOT_LINES: Line[] = [
  { id: 1, text: "Initializing Earn module…", kind: "info" },
  { id: 2, text: "Loading pools registry: /dex/earn", kind: "info" },
  { id: 3, text: "Fetching APR oracles…", kind: "info" },
  { id: 4, text: "› Status: COMING SOON — contracts under construction", kind: "warn" },
  { id: 5, text: "Type `help` to see available commands.", kind: "ok" },
];

let nextId = 100;

export default function Earn() {
  const [history, setHistory] = useState<Line[]>(BOOT_LINES);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const prompt = useMemo(() => "airon@dex:~/$", []);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [history, busy]);
  function push(text: string, kind?: Line["kind"]) { setHistory(h => [...h, { id: nextId++, text, kind }]); }

  function handleCommand(raw: string) {
    const cmd = raw.trim(); if (!cmd) return;
    push(`${prompt} ${cmd}`, "info");
    const [name, ...args] = cmd.split(/\s+/);

    switch (name.toLowerCase()) {
      case "help":
        push("Available commands:", "ok");
        push("  help          — show this help");
        push("  status        — show module status");
        push("  pools         — list farming pools (coming soon)");
        push("  apr <POOL>    — preview APR for a pool (soon™)");
        push("  clear         — clear the terminal");
        break;
      case "status":
        push("Earn status: COMING SOON — UI & contracts in progress.", "warn");
        push("ETA: when tests are green and audits done.", "warn");
        break;
      case "pools":
        push("No pools yet. Liquidity gauges + single-stake vaults are being wired.", "warn");
        break;
      case "apr":
        if (!args.length) push("Usage: apr <POOL>", "err");
        else push(`APR for ${args[0]}: not published yet.`, "warn");
        break;
      case "clear":
        setHistory([]); break;
      default:
        push(`Command not found: ${name}`, "err");
        push("Type `help` to see available commands.");
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    const v = input;
    setInput("");
    setBusy(true);
    setTimeout(() => { handleCommand(v); setBusy(false); }, 220);
  }

  return (
    <div className="earn-wrap">
      
      <section className="hero-box">
        <div className="hero-inner">
          <div className="hero-left">
            <div className="crumbs">Earn — Coming Soon</div>
            <h1 className="hero-title">Earn</h1>
            <p className="hero-sub">Add & manage yield positions soon. While we build, enjoy the terminal below.</p>
            <div className="hero-badges">
              <span className="pill pill--net">Airon Testnet</span>
              <span className="pill pill--gas">Status: Coming Soon</span>
            </div>
          </div>
        </div>
      </section>

     
      <section className="terminal glass">
        <div className="term-head">
          <div className="dots">
            <span className="dot red" />
            <span className="dot yellow" />
            <span className="dot green" />
          </div>
          <div className="title">Airon DEX — Earn</div>
        </div>

        <div className="term-body">
<pre className="ascii">
{String.raw`    _    ___ ____   ___  _   _ 
   / \  |_ _|  _ \ / _ \| \ | |
  / _ \  | || |_) | | | |  \| |
 / ___ \ | ||  _ <| |_| | |\  |
/_/   \_\___|_| \_\\___/|_| \_|`}
</pre>

          <div className="lines">
            {history.map(l => <div key={l.id} className={`line ${l.kind || ""}`}>{l.text}</div>)}
            {busy && <div className="line info">{prompt} <span className="blink">▊</span></div>}
            <div ref={endRef} />
          </div>

          <form className="prompt" onSubmit={onSubmit}>
            <span className="ps1">{prompt}</span>
            <input
              autoFocus
              className="input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="type a command, e.g. help"
              disabled={busy}
            />
          </form>
        </div>

        <div className="term-foot">
          <span className="foot-note">
            Tip: Use <code>status</code>, <code>pools</code>, <code>help</code> — real pools will appear here when ready.
          </span>
        </div>
      </section>
    </div>
  );
}
