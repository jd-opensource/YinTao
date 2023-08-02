import { createApp } from 'vue'
import element from 'element-plus'
import router from './router'
// @ts-ignore
import App from './App.vue'

const app = createApp(App).use(router)
app.use(element)

app.config.compilerOptions.isCustomElement = (tag) => {
    return tag === 'webview'
}
app.mount('#app')