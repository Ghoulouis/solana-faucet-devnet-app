import { useState, useEffect } from "react";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Program, AnchorProvider, web3 } from "@coral-xyz/anchor";
import * as anchor from "@coral-xyz/anchor";
import {
    TOKEN_PROGRAM_ID,
    getOrCreateAssociatedTokenAccount,
    getAccount,
    getAssociatedTokenAddress,
    createAssociatedTokenAccount,
    createAssociatedTokenAccountInstruction,
} from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import idl from "../idl/token_devnet.json"; // File IDL từ Anchor
import { TokenDevnet } from "../types/token_devnet";

const PROGRAM_ID = new PublicKey("6Y32aZTKjC7GdDkdpyCwPdMP5vPdnuD2siSAKbh16Vwp"); // Từ .env
const CONTROLLER_SEED = "controller";
const TOKEN_PDA = new PublicKey("Bv773jeAs3nsU9NnUM8pYWAXsggqp2NCtpuMzSS3E1fg"); // Địa chỉ token PDA

export const MintButton = () => {
    const { connection } = useConnection();
    const wallet = useAnchorWallet();
    const [amount, setAmount] = useState<string>("1000"); // Số token muốn mint
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

            try {
                console.log("ATA:");
                const ata = await getAssociatedTokenAddress(
                    TOKEN_PDA, // Mint
                    wallet.publicKey // Owner
                );

                console.log("ATA:", ata);

                const accountInfo = await getAccount(connection, ata);
                setBalance(accountInfo.amount.toString());
            } catch (err) {
                console.error("Error fetching balance:", err);
                setBalance("Error");
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
                wallet.publicKey // Owner
            );
            // Tạo hoặc lấy ATA
            try {
                const ata = await getAssociatedTokenAddress(
                    TOKEN_PDA, // Mint
                    wallet.publicKey // Owner
                );
            } catch (err) {
                const transaction = new web3.Transaction().add(
                    web3.SystemProgram.createAccount({
                        fromPubkey: wallet.publicKey,
                        newAccountPubkey: ata,
                        space: 165,
                        lamports: await connection.getMinimumBalanceForRentExemption(165),
                        programId: TOKEN_PROGRAM_ID,
                    })
                );

                const txSignature = await connection.se(transaction);

                await connection.send(txSignature, "confirmed");

                console.log("ATA created:", txSignature);
                setBalance("0");
            }

            // Gọi hàm mintToken từ contract
            const tx = await program.methods
                .mint(new anchor.BN(amount))
                .accountsPartial({
                    signer: wallet.publicKey,
                    signerAta: ata,
                    controller: controllerPda,
                    token: TOKEN_PDA,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    systemProgram: web3.SystemProgram.programId,
                })
                .rpc();

            setTxHash(tx);

            // Cập nhật số dư sau khi mint
            const updatedAccount = await getAccount(connection, ata);
            setBalance(updatedAccount.amount.toString());

            alert(`Minted ${amount} tokens! Tx: ${tx}`);
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
                <p>Current Balance: {balance !== null ? `${balance} tokens` : "Loading..."}</p>
                <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Amount to mint"
                    disabled={loading}
                />
                <button onClick={mintToken} disabled={!wallet || loading}>
                    {loading ? "Minting..." : "Mint Token"}
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
