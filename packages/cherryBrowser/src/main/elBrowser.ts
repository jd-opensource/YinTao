import {
BrowserWindow,
ipcMain,
session,
app,
nativeImage,
} from 'electron';
import path from 'path'
import _ from 'lodash'
import { ElPage, ElPageOption } from './elPage';
import { EventEmitter } from 'events'
import { CherryBrowserOptions } from '../types';
import {devices} from 'playwright'

export interface ViewportSize {
    /**
     * page width in pixels.
     */
    width: number;
  
    /**
     * page height in pixels.
     */
    height: number;
  }

type DeviceDescriptor = {
    viewport: ViewportSize;
    userAgent: string;
    deviceScaleFactor: number;
    isMobile: boolean;
    hasTouch: boolean;
    defaultBrowserType: 'chromium' | 'firefox' | 'webkit';
  };

interface ElBrowserOption extends CherryBrowserOptions{
    width?: number
    height?: number
    device?: string
    backgroundColor?:string
    icon?:string
    webPreferences?: Electron.WebPreferences
    preload?:string
}

export async function createElBrowser(option:ElBrowserOption) :Promise<ElBrowser>{
    const browser = new ElBrowser(option)
    await browser.create()
    return browser
}

export class ElBrowser extends EventEmitter{
    private _options: ElBrowserOption
    private _pages: ElPage[]
    private browser?: BrowserWindow
    private webContent?: Electron.WebContents
    public deviceOptions?: DeviceDescriptor
    constructor(options: ElBrowserOption){
        super()
        this._options = options
        this._pages = []
        this.listener()

        const {device} = options
        if(device){
           const deviceOptions = devices[device]
           if(deviceOptions){
            this.deviceOptions = deviceOptions
            console.log('devices',deviceOptions)
           }
        }
    }

    setCookies(cookies:any[] | {url:string,data:string}) {
        const _session = session.defaultSession
        // 在设置cookie时清空历史cookie信息
        _session.clearStorageData({storages:['cookies']})
        if ( cookies instanceof Array) {
            cookies.map(cookie => {
                if(!cookie.domain) { // electron cookie must domain
                    cookie.domain = new URL(cookie.url).host
                }
                // console.log('setcookie:', cookie)
                _session.cookies.set(cookie).catch((e:Error) => {
                    console.error(`setCookies error: name is ${cookie.name}`, e);
                });
            })
        } else {
            const getDomain = (url: string) :string => {
              const urlReg = /[a-zA-Z0-9][-a-zA-Z0-9]{0,62}(\.[a-zA-Z0-9][-a-zA-Z0-9]{0,62})+\.?/
              const cc = url.match(urlReg)
              if (cc !== null && cc.length > 1) {
                const coms = cc[0].split('.')
                if (coms.length > 2) {
                  coms.shift()
                  return `.${coms.join('.')}`
                }
              }
              return ''
            }
            
            var cookieText  = cookies.data
            cookieText = cookieText.slice(0, 7) === 'Cookie:' ? cookieText.slice(7) : cookieText
            const kvs: string[] = cookieText.match(/([^;=]+)=([^;]+)/g) || []
            const domain = getDomain(cookies.url)
            for (const kv of kvs) {
              const [, name, value] = kv.match(/^\s*([^=]+)=(.+)/) as Array<string>
              const cookie = {
                domain,
                name,
                path: '/',
                value,
                url:cookies.url
              }
              _session.cookies.set(cookie).catch((e:Error) => {
                console.error(`setCookies error:' ${e.message}`);
             })
            }
        }
    }

    bindElListener() {
        this.browser?.once('close',()=>{
            this.emit('close')
        })

        this.browser?.once('closed',()=>{
            this.emit('closed')
        })
    }

    send(chanel:string,...args:any[]){
        return this.browser?.webContents.send(chanel,...args)
    }
    
    isDestroyed(){
        return  this.browser?.isDestroyed()
    }

    close(){
        this.browser?.close()
    }

    openDevTools(){
        this.webContent?.openDevTools()
    }

    minimize(){
        this.browser?.minimize()
    }   

    maximize(){
        if(!this.browser?.isMaximized()){
            this.browser?.maximize()
        }else{
            this.browser?.unmaximize()
        }
    }

    // 提供插件调度
    plugs(name:string,func:string,...args:any[]) {
        this.webContent?.postMessage('plugs',{
            name,func,args
        })
    }

    listener(){
        const _this = this
        
        ipcMain.on('page-webcontent', (event,pageId,webContentId)=>{
            const page = this._pages.find(i=>{return i.id === pageId})
            page?.bindWebcontent(webContentId)
        })
        // block repeat register
        ipcMain.removeHandler('browser-openDevTools')
        ipcMain.removeHandler('browser-minimize')
        ipcMain.removeHandler('browser-maximize')
        ipcMain.removeHandler('get-coookie-by-domain')
        ipcMain.removeAllListeners('change-tap')
        
        ipcMain.handle('browser-openDevTools', (event,pageId,webContentId)=>{
            _this.openDevTools()
        })

        ipcMain.on('change-tap', (event,url)=>{
            this.emit('change-tap', url)
        })

        ipcMain.handle('get-coookie-by-domain',(e,domain)=>{
            return this.webContent?.session.cookies.get({domain: domain})
        })

        ipcMain.handle('browser-minimize', (event,pageId,webContentId)=>{
           _this.minimize()
        })

        ipcMain.handle('browser-maximize', (event,pageId,webContentId)=>{
            _this.maximize()
        })
    }

    addPage(page:ElPage) {
        this._pages.push(page)
        // 这里添加了page，需要通知页面内刷新
        this.renderPage(page)
    }

    renderPage(page:ElPage){
        this.send('page-create', page.structuredClone())
    }

    _listeners() {
        this.browser?.once('ready-to-show',()=>{
            if(this._options.headless) return
            this.browser?.show()
        })
    }

    pages() {
        //返回当前的页面数量
    }

    async newPage(url:string, options?:ElPageOption) :Promise<ElPage> {
        // 优先使用传递过来的，如果不包含preload 则可以使用，browser中的默认 preload
        options = options || {}
        options.preload = options.preload || this._options.preload // 没传递则引用brwoser preload
        console.log('page options',options)
        const page = new ElPage(url, this, options)
        this.emit('page', page)
        await page.create()
        return page
    }

    async create(){
        const _this = this
        return new Promise((res,rej)=>{
            this.browser = new BrowserWindow({
                //游览器窗口
                width:  _this.deviceOptions ? _this.deviceOptions.viewport.width : 1920,
                height: _this.deviceOptions ? _this.deviceOptions.viewport.height : 1920,
                backgroundColor: '#fff',
                icon: nativeImage.createFromPath('./strawberry.ico'),
                show: false,
                alwaysOnTop: false, // no't true
                webPreferences: {
                  // 使用preload 而不是开放node环境, contextBridge 更好的提供主进程能力。
                  preload: path.resolve(__dirname,'browserPreload.js'),
                  nodeIntegrationInSubFrames: true,
                  javascript: true,
                  webviewTag: true,
                },
                frame:false // false 无边框
              });

            // console.log("打开了debug")
            // this.browser.webContents.openDevTools() // 打开主窗口调试
    
            const browserOptions : Record<string, string> = {
                "browserOptions": JSON.stringify(this._options)
            }
            this.browser.loadFile('./lib/index.html',{
                query:  browserOptions
            })
            this.webContent = this.browser.webContents
    
            //  成功
            this.browser.webContents.once('did-finish-load',()=>{
                // debug时开启
                // this.browser?.webContents.openDevTools()
                res(this)
                return this
            })
    
            //  失败
            this.browser.webContents.once('did-fail-load',()=>{
                throw new Error('el-browser create eroor!')
            })

            this.browser.webContents.on('destroyed',()=>{
                console.log('browser destroyed')
            })

            this._listeners()
            this.bindElListener()
        })
    }
}