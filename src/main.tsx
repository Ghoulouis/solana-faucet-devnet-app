import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import { WalletContext } from "./WalletContext.tsx";
import { Buffer } from "buffer";

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <WalletContext>
            <App />
        </WalletContext>
    </React.StrictMode>
);
