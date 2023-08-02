import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  base:'./',
  optimizeDeps:{
    exclude:['webview']
  },
  build:{
    outDir: 'lib',
    assetsDir:'./',
    rollupOptions:{
      external:[
        'electron',
        'electron-devtools-installer',
      ]
    }
  }
})
