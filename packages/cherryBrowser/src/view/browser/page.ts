const { ipcRenderer, EventEmitter } = window['electron']

export interface PageOptions { // page render data
  headless?: boolean
  showHeadless?: boolean
  preload?: string
  useragent?:string
  id: string
  favicons?: string
  show_url: string // 展示的url,避免真实url频繁刷新页面
  url: string // 访问的url
  visible: boolean
  title?: string
  webview?: Electron.WebviewTag | any
}

export class Page {
  id: string
  webcontent: any
  _options: PageOptions
  iframes: number[]
  public porxy?: any
  constructor(url: string, options: PageOptions) {
    this.id = options.id
    this._options = options
    this.iframes = []
  }
  
  bindWebview() {
    this._options.webview = <Electron.WebviewTag>document.getElementById(this.id)
    this.preWebview()
  }

  preWebview() {
    console.log('preWebview')
    const _this = this
    const webview = this._options.webview as Electron.WebviewTag

    webview.addEventListener('ipc-message', async (event) => {
      ipcRenderer.send(`${_this.id}-webview-ipc-message`, event)
      switch (event.channel) {
        case 'assert-select':
          {
            const _event = new CustomEvent(event.channel, {
              detail: event.args
            });
            console.log('recv assert-select', _event)
            window.dispatchEvent(_event)
          }
          break
        case 'register-iframe':{
          const [iframeId] = event.args;
          _this.iframes.push(iframeId)
          const index = _this.iframes.length
          webview.sendToFrame(iframeId,'iframe-index',index)
        }
        break
        case "set-assest-result":
          {
            const [result] = event.args

            const _event = new CustomEvent(event.channel, {
              detail: result
            });
            window.dispatchEvent(_event)
          }
          break
      }
    })
    webview.addEventListener('new-window', async (event: any) => {
    })

    webview.addEventListener('did-frame-navigate', async (event: any) => {
      ipcRenderer.send(`${_this.id}-did-frame-navigate`, event)
    })

    // 浏览器图标
    webview.addEventListener('page-favicon-updated', function (e) {
      _this._options.favicons = e.favicons[0]
    })

    //  更新页面title
    webview.addEventListener('page-title-updated', function ({ title }) {
      _this._options.title = title
    })

    webview.addEventListener('close', function () {
      if(webview.isDevToolsOpened()){
        webview.closeDevTools()
      }
      console.log('webview','close')
    })

    webview.addEventListener('crashed', function (){
      console.log('webview','crashed')
    })

    webview.addEventListener('destroyed', function (){
      console.log('webview','destroyed')
    })

    webview.addEventListener('will-navigate', function ({ url }) {
      _this._options.show_url = decodeURIComponent(url)
    })

    webview.addEventListener('did-navigate', function ({ url }) {
      _this._options.show_url = decodeURIComponent(url)
    })
   
    // hint: did-start-navigation don't show url
    webview.addEventListener('did-navigate-in-page', function ({ url }) {
      _this._options.show_url = decodeURIComponent(url)
    })

    webview.addEventListener('did-attach', () => {
    })

    webview.addEventListener('dom-ready', function (e) {
      const webContentsId = webview.getWebContentsId()
      ipcRenderer.send('page-webcontent', _this.id, webContentsId)
    })

  }
}