import path from "path";
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  return {
    // 1. GitHub Pages Ayarı (KRİTİK)
    // Hem canlıda hem lokalde /factshield/ yolunu kullanır, kafa karışıklığını önler.
    base: "/factshield/",

    // 2. React Eklentisi
    plugins: [react()],

    // 3. Port Ayarları (Eski ayarın)
    server: {
      port: 3000,
      host: "0.0.0.0",
    },

    // 4. Alias Ayarı (Eski ayarın - @ kullanımı için şart)
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
