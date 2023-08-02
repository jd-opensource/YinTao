import { nanoid } from "nanoid"
import { ElBrowser } from "./elBrowser"
import { EventEmitter } from 'events'
import { webContents } from "electron"
import { listenerManage } from "./listenerManage"
import { ElPageWebview } from "./elPageWebview"

export interface ElPageOption{
    headless?:boolean,
    showHeadless?:boolean
    preload?:string
}

export class ElPage extends EventEmitter{
    url?:string
    title?:string
    browser:ElBrowser
    _option:ElPageOption
    id:string
    webcontent?:Electron.WebContents
    webview: ElPageWebview
    headless:boolean
    listenersManage: listenerManage
    showHeadless:boolean
    
    constructor(url:string, browser:ElBrowser, option?:ElPageOption){
        super()
        this.id = nanoid(7)
        this.url = url
        this.browser = browser
        this._option = option || {}
        this.headless = !!option?.headless
        this.showHeadless = !!option?.showHeadless
        this.listenersManage = new listenerManage()
        this.webview = new ElPageWebview(this.id)
    }

    bindWebcontent(id) {
        this.webcontent = webContents.fromId(id)
        this.emit('page-webcontent',this.webcontent)
        // 如果浏览器设置为移动端,则页面同步模拟
        if( this.browser.deviceOptions){
            if (!this.webcontent.debugger.isAttached()) {
                this.webcontent.debugger.attach('1.3');
            }
            if (!this.webcontent) return console.log('null contents');
            this.webcontent.debugger.sendCommand('Emulation.setEmitTouchEventsForMouse', { enabled: true });

            this.webcontent.enableDeviceEmulation({
                screenPosition: this.browser.deviceOptions.isMobile ? 'mobile' : 'desktop',
                viewSize:this.browser.deviceOptions.viewport as any,
                scale:1,
                deviceScaleFactor: this.browser.deviceOptions.deviceScaleFactor,
                screenSize:this.browser.deviceOptions.viewport as any,
                viewPosition:{ x: 0, y: 0 }
            })
        }
 
        this.listenerWebcontent()
    }

    /**
     * content的事件可以在node传递
     */
    listenerWebcontent() {
        if(!this.webcontent) throw new Error('listenerWebcontent webcontent is not null')
        const _this = this
        const new_window_call = (event,url,frameName)=>{
            event.preventDefault()
            // style page
            _this.browser.newPage(url)
        }
        this.listenersManage.clear(this.webcontent)
        this.listenersManage.add(this.webcontent,'new-window',new_window_call)
        this.webcontent?.on('did-attach-webview',(event,webcontent)=>{
        })
        
        this.webcontent?.on('destroyed',()=>{
        })

        this.webcontent?.on('will-prevent-unload',()=>{
            console.log('will-prevent-unload',this.webcontent?.id)
            if(this.webcontent?.isDevToolsOpened()){
                this.webcontent?.closeDevTools()
            }
        })

        this.webcontent?.once('crashed',()=>{
        })
    }

    async create() {
        this.browser.addPage(this)
        this.once('load',()=>{
        })
    }

    structuredClone(){
        return {
            url: this.url,
            title: this.title,
            webviewId: this.id,
            preload: this._option.preload,
            headless: this.headless,
            showHeadless: this.showHeadless,
            useragent: this.browser.deviceOptions?.userAgent || undefined
        }
    }

}