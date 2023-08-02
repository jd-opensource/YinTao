import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
    // 指定路由模式
    history: createWebHashHistory(),
    // 路由地址
    routes: [
        {
            path:'/browser',
            name:'browser',
            // @ts-ignore
            component: () => import('../../packages/cherryBrowser/src/view/browser/browser.vue'),
        },
        {
            path:'/test',
            name:'testPage',
            // @ts-ignore
            component: () => import('../view/testPage/testPage.vue'),
        },
        {
            path: "/update",
            name: "Update",
            // @ts-ignore
            component: () => import('../view/update/index.vue')
          }, 
          {
            path: '/',
            redirect: '/browser'
        }
    ]
})

export default router