import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 4300,
    proxy: {
      "/api": {
        target: "https://localhost:7003",
        changeOrigin: true,
        secure: false
      }
    }
  }
});
