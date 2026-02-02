import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { copyFileSync, mkdirSync, existsSync } from "fs";

export default defineConfig({
  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        popup: path.resolve(__dirname, "popup.html"),
      },
    },
    emptyOutDir: true,
  },
  plugins: [
    react(),
    {
      name: "copy-extension-files",
      closeBundle() {
        const manifestPath = path.resolve(__dirname, "manifest.json");
        if (existsSync(manifestPath)) {
          copyFileSync(manifestPath, path.resolve(__dirname, "dist/manifest.json"));
        }

        const iconsDir = path.resolve(__dirname, "public/icons");
        const distIconsDir = path.resolve(__dirname, "dist/icons");
        
        if (existsSync(iconsDir)) {
          mkdirSync(distIconsDir, { recursive: true });
          const iconSizes = [16, 32, 48, 128];
          iconSizes.forEach((size) => {
            const iconPath = path.resolve(iconsDir, `icon-${size}.png`);
            if (existsSync(iconPath)) {
              copyFileSync(iconPath, path.resolve(distIconsDir, `icon-${size}.png`));
            }
          });
        } else {
          mkdirSync(distIconsDir, { recursive: true });
          console.warn("icons not found");
        }

        const logoPath = path.resolve(__dirname, "public/logo.png");
        if (existsSync(logoPath)) {
          copyFileSync(logoPath, path.resolve(__dirname, "dist/logo.png"));
        }
      },
    },
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
