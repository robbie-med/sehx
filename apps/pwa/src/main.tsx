import React from "react";
import ReactDOM from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App";
import "./styles/theme.css";
import "./styles/globals.css";

registerSW({
  immediate: true,
  onRegisteredSW(_swUrl, registration) {
    if (!registration) return;
    const scheduleReload = (sw: ServiceWorker) => {
      sw.addEventListener("statechange", () => {
        if (sw.state === "activated" && !window.crossOriginIsolated) {
          window.location.reload();
        }
      });
    };
    if (registration.installing) {
      scheduleReload(registration.installing);
    }
    registration.addEventListener("updatefound", () => {
      if (registration.installing) scheduleReload(registration.installing);
    });
  }
});

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
