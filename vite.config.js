import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,           // ✅ Port cố định
    strictPort: true,     // ✅ Báo lỗi nếu port đã bị chiếm
    open: true,           // ✅ Tự động mở browser
  }
})