import vue from '@vitejs/plugin-vue'
import { join } from 'node:path'
import { defineConfig, loadEnv } from 'vite'
import { quasar, transformAssetUrls } from '@quasar/vite-plugin'

// https://vite.dev/config/

export default defineConfig(({ mode }) => {
  // Lee frontend/.env.local (y .env). Allí se guardan los puertos cuando los
  // por defecto ya los ocupa otro proyecto en la máquina. Al ser .local está
  // en .gitignore: cada desarrollador usa los puertos que le convenjan sin
  // tocar el repositorio. Se leen aquí (y no desde process.env) porque los
  // scripts de npm no siempre heredan las variables del shell.
  //   BACKEND_PORT=3001
  //   FRONTEND_PORT=5174
  const env = loadEnv(mode, import.meta.dirname, '')

  const PUERTO_API = env.BACKEND_PORT || '3000'
  const PUERTO_UI = Number(env.FRONTEND_PORT || 5173)

  // En desarrollo (y con `npm run preview`) las peticiones a /api — URL
  // relativa, mismo origen — se reenvían al backend en local. El proxy corre
  // EN EL SERVIDOR, así que 'localhost:PUERTO_API' siempre es la máquina donde
  // vive el backend: la app funciona igual abierta desde otro dispositivo de
  // la red.
  const proxyApi = {
    '/api': {
      target: `http://localhost:${PUERTO_API}`,
      changeOrigin: true
    }
  }

  return {
    plugins: [
      vue({
        template: { transformAssetUrls }
      }),

      // @quasar/plugin-vite options list:
      // https://github.com/quasarframework/quasar/blob/dev/quasar-vite-plugin/index.d.ts
      quasar({
        sassVariables: join(import.meta.dirname, 'src/quasar-variables.sass')
      })
    ],

    server: {
      host: true,
      port: PUERTO_UI,
      allowedHosts: true,
      proxy: proxyApi
    },

    preview: {
      port: 4173,
      proxy: proxyApi
    }
  }
})
