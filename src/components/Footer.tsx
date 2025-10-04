import "./Footer.style.css";
import logo from "../assets/home/icon.png";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="af">
      <div className="af__wrap">
        
        <div className="af__top">
          
          <div className="af__brand">
            <img src={logo} alt="AIRON" className="af__logo" />
            <div className="af__brandtext">
              <div className="af__title">AIRON DEX</div>
              <div className="af__tag">Low fee • Fast trade • Multichain</div>
            </div>
          </div>

          
          <nav className="af__links">
            <a className="af__link" href="https://t.me/airon_network" target="_blank" rel="noopener noreferrer">Telegram</a>
            <a className="af__link" href="https://airon-network.gitbook.io/airon-network-docs/" target="_blank" rel="noopener noreferrer">DOCS</a>
            <a className="af__link" href="https://x.com/Airon_Layer1" target="_blank" rel="noopener noreferrer">X</a>
            <a className="af__link" href="https://airon.network" target="_blank" rel="noopener noreferrer">Website</a>

          </nav>
        </div>

        <hr className="af__divider" />

        
        <div className="af__bottom">
          <div className="af__copy">© {year} Airon Network. All rights reserved.</div>
          <div className="af__legal">
            <a href="https://drop-faucet.airon.network/" onClick={(e)=>e.preventDefault()} className="af__link">Faucet</a>
            <a href="https://testnet.aironscan.com" onClick={(e)=>e.preventDefault()} className="af__link">Airon Explorer</a>
            <a href="https://airon-network.gitbook.io/airon-network-docs/overview/connect-to-airon-testnet" onClick={(e)=>e.preventDefault()} className="af__link">RPC</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
