import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// /api so'rovlari backendga ketadi. Telefon uchun bitta https tunnel yetadi.
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    // Cloudflare tunnel boshqa Host yuboradi. Aks holda Telegram sahifani ochmaydi.
    allowedHosts: true,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
