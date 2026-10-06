import { createApp } from 'vue'
import { Quasar } from 'quasar'
import App from './App.vue'
import { router } from './routes/routes.js'
import { createPinia } from 'pinia'
import '@quasar/extras/material-icons/material-icons.css'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import 'quasar/src/css/index.sass'

const pinia = createPinia()

const app = createApp(App)

app.use(Quasar, {
  plugins: {}
})

app.use(pinia)

pinia.use(piniaPluginPersistedstate)

app.use(router)

app.mount('#app')