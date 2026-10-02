import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

const webhookTarget = `http://127.0.0.1:${process.env.WEBHOOK_PORT || 3000}`;

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      "/api": webhookTarget,
      "/webhook": webhookTarget,
    },
  },
});
