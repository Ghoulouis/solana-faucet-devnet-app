import { useState, useEffect } from "react";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Program, AnchorProvider } from "@coral-xyz/anchor";
import * as anchor from "@coral-xyz/anchor";
import { getAccount, getAssociatedTokenAddress } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import idl from "../idl/token_devnet.json"; // File IDL từ Anchor
import { TokenDevnet } from "../types/token_devnet";

const PROGRAM_ID = new PublicKey("6Y32aZTKjC7GdDkdpyCwPdMP5vPdnuD2siSAKbh16Vwp"); // Từ .env
const CONTROLLER_SEED = "controller";
const TOKEN_PDA = new PublicKey("Bv773jeAs3nsU9NnUM8pYWAXsggqp2NCtpuMzSS3E1fg"); // Địa chỉ token PDA

export const MintButton = () => {
    const { connection } = useConnection();
    const wallet = useAnchorWallet();

    const [txHash, setTxHash] = useState<string | null>(null);
    const [balance, setBalance] = useState<string | null>(null); // Số dư token
    const [loading, setLoading] = useState(false);

    // Lấy số dư khi ví thay đổi
    useEffect(() => {
        const fetchBalance = async () => {
            if (!wallet) {
                setBalance(null);
                return;
            }
            const ata = await getAssociatedTokenAddress(
                TOKEN_PDA, // Mint
                wallet.publicKey, // Owner,
                false
            );

            try {
                console.log("ATA:", ata);
                const accountInfo = await getAccount(connection, ata);
                setBalance(accountInfo.amount.toString());
            } catch (err) {
                // Nếu không có ATA thì tạo mới
                setBalance("0");
            }
        };

        fetchBalance();
    }, [wallet, connection]);

    const mintToken = async () => {
        if (!wallet) {
            alert("Please connect your wallet!");
            return;
        }

        setLoading(true);
        console.log("Connection endpoint:", connection.rpcEndpoint); // Log endpoint
        console.log("Wallet connected:", wallet.publicKey.toBase58());
        try {
            // Thiết lập provider
            const provider = new AnchorProvider(connection, wallet, { commitment: "confirmed" });
            const program = new Program(idl as TokenDevnet, provider);

            // Tính PDA
            const controllerPda = PublicKey.findProgramAddressSync([Buffer.from(CONTROLLER_SEED)], PROGRAM_ID)[0];
            const ata = await getAssociatedTokenAddress(
                TOKEN_PDA, // Mint
                wallet.publicKey
                // Owner,
            );

            console.log("ATA:", ata.toBase58());
            console.log("Controller PDA:", controllerPda.toBase58());
            console.log("Token  :", TOKEN_PDA.toBase58());
            console.log("Program:", PROGRAM_ID.toBase58());
            let amount = 1000 * 1e6;
            const tx = await program.methods
                .mint(new anchor.BN(amount))
                .accountsPartial({
                    signer: wallet.publicKey,
                    controller: controllerPda,
                    token: TOKEN_PDA,
                    signerAta: ata,
                })
                .rpc();

            setTxHash(tx);

            // Cập nhật số dư sau khi mint
            const updatedAccount = await getAccount(connection, ata);
            setBalance(updatedAccount.amount.toString());
        } catch (err) {
            console.error("Error minting token:", err);
            alert("Failed to mint token. Check console for details.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <WalletMultiButton />
            <div style={{ marginTop: "20px" }}>
                <p>
                    Current Balance: {balance !== null ? `${(Number(balance) / 1e6).toFixed(2)} tokens` : "Loading..."}
                </p>

                <button onClick={mintToken} disabled={!wallet || loading}>
                    {loading ? "Minting..." : "Mint 1000 Token"}
                </button>
                {txHash && (
                    <p>
                        Transaction:{" "}
                        <a
                            href={`https://explorer.solana.com/tx/${txHash}?cluster=devnet`}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {txHash}
                        </a>
                    </p>
                )}
            </div>
        </div>
    );
};
