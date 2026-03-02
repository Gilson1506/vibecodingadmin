import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { AuthProvider } from "./hooks/useAuth";
import { registerSW } from "virtual:pwa-register";

// Register PWA service worker
try {
  if (typeof window !== "undefined" && window.location.protocol !== "file:") {
    registerSW({ immediate: true });
  }
} catch (e) {
  console.error("PWA registration failed:", e);
}

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <App />
  </AuthProvider>
);
