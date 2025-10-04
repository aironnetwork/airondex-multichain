import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function ConnectWallet() {
  return (
    <ConnectButton
      chainStatus="icon"      
      accountStatus="address" 
      showBalance={false}
    />
  );
}
