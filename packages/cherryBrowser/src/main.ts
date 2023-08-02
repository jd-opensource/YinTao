import 'element-plus/dist/index.css'
import { createApp } from 'vue'
import element from 'element-plus'
// @ts-ignore
import App from './App.vue'

const app = createApp(App)
app.use(element)

app.config.compilerOptions.isCustomElement = (tag) => {
    return tag === 'webview'
}
app.mount('#app')