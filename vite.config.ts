import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'recharts', 'lucide-react'],
          firebase: ['firebase/app', 'firebase/firestore']
        }
      }
    }
  },
  define: {
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY)
  }
});