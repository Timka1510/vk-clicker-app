import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/vk-clicker-app/' // Убедитесь, что путь соответствует имени вашего репозитория
});
