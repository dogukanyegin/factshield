import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/factshield/',  // BU SATIR KRİTİK! GitHub Pages alt klasörü için şart.
})


  return {
    base: mode === "production" ? "/factshield/" : "/",
    plugins: [react()],
    server: { port: 3000, host: "0.0.0.0" },
    resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
  };
});
