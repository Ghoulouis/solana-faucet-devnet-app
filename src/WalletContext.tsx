import { FC, useMemo } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { clusterApiUrl } from "@solana/web3.js";

// Import CSS cho Wallet UI
import "@solana/wallet-adapter-react-ui/styles.css";

export const WalletContext: FC<{ children: React.ReactNode }> = ({ children }) => {
    // Chọn mạng (devnet trong trường hợp này)
    const network = WalletAdapterNetwork.Devnet;
    const endpoint = useMemo(() => clusterApiUrl(network), [network]);
    console.log("Network endpoint in WalletContext:", endpoint);
    // Danh sách ví hỗ trợ
    const wallets = useMemo(() => [new PhantomWalletAdapter(), new SolflareWalletAdapter()], []);

    return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider>{children}</WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
};
