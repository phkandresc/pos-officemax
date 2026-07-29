import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import basicSsl from '@vitejs/plugin-basic-ssl'

import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
    plugins: [
        react(),
        tailwindcss(),
        basicSsl(),
        VitePWA({
            registerType: 'autoUpdate',
            manifest: {
                name: 'POS OfficeMax',
                short_name: 'POS OfficeMax',
                description: 'Sistema de Punto de Venta e Inventario',
                theme_color: '#F64C29',
                background_color: '#ffffff',
                display: 'standalone',
                icons: [
                    {
                        src: 'https://cdn-icons-png.flaticon.com/512/3081/3081840.png', // Placeholder icon
                        sizes: '512x512',
                        type: 'image/png'
                    }
                ]
            }
        })
    ],
    server: {
        port: 5173,
        host: true,
        proxy: {
            '/api': {
                target: 'http://localhost:3000',
                changeOrigin: true,
                secure: false,
            }
        }
    }
})
