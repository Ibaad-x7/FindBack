import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    // FindBack keeps a single .env at the project root (see ../.env.example)
    // instead of one per package, so point Vite there instead of frontend/.env.
    envDir: path.resolve(__dirname, ".."),
    server: {
        port: 5173,
        proxy: {
            // Forward /api requests to the Express backend during development
            // so the frontend can call fetch("/api/...") without CORS issues.
            "/api": {
                target: "http://localhost:5000",
                changeOrigin: true,
            },
            "/uploads": {
                target: "http://localhost:5000",
                changeOrigin: true,
            },
        },
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    "react-vendor": ["react", "react-dom"],
                    "router-vendor": ["react-router-dom"],
                    "icons-vendor": ["lucide-react"],
                },
            },
        },
    },
});
