export function createElBrowser(options?: ElBrowserOption): ElBrowser

interface CherryBrowserOptions {
    headless?: boolean
    timeout?: number
}

interface ElBrowserOption extends CherryBrowserOptions{
    width?: number
    height?: number
    device?: string
    backgroundColor?:string
    icon?:string
    webPreferences?: Electron.WebPreferences
    preload?:string
}

interface ElBrowser{
    deviceOptions?: any
    webContent?: Electron.WebContents

    setCookies(cookies:any[] | {url:string,data:string})

    /**
     * @menthod 调度浏览器内插件
     * @param name 插件名称
     * @param func 插件内函数
     * @param args 调用函数所使用的参数
     */
    plugs(name:string,func:string,args:any)

    once(eventName:string,func:Function)

    on(eventName:string,func:Function)

    newPage(url:string, options?:ElPageOption) :Promise<ElPage>

    isDestroyed():boolean
    
    close()
}


export interface ElPageOption{
    headless?:boolean,
    showHeadless?:boolean
    preload?:string
}


interface ElPage{
}