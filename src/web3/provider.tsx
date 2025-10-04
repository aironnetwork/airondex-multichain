import "@rainbow-me/rainbowkit/styles.css";
import {
  getDefaultConfig,
  RainbowKitProvider,
  darkTheme,
} from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ALL_CHAINS } from "./chains";

const queryClient = new QueryClient();


const WALLETCONNECT_PROJECT_ID = "YOUR_WALLETCONNECT_PROJECT_ID";

export const wagmiConfig = getDefaultConfig({
  appName: "AIRON DEX",
  projectId: WALLETCONNECT_PROJECT_ID,
  chains: ALL_CHAINS as unknown as [typeof ALL_CHAINS[number], ...typeof ALL_CHAINS[number][]],
  ssr: false,
});

export function Web3Provider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            overlayBlur: "small",
            borderRadius: "large",
            accentColor: "#00ff63",
            accentColorForeground: "#04140c",
          })}
          modalSize="compact"
          showRecentTransactions={false}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
