import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "sonner";
import { App } from "./App";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        theme="light"
        position="bottom-center"
        toastOptions={{
          className:
            "!bg-card !text-foreground !border-border !shadow-[var(--shadow-border)]",
        }}
      />
    </BrowserRouter>
  </StrictMode>,
);
