import { ipcMain } from "electron";
import { EventEmitter,on } from "events"

export class ElPageWebview extends EventEmitter {
    pageId:string
    constructor(pageId:string) {
        super();
        this.pageId = pageId
        this._listeners()
    }
    _listeners() {
        const _this = this
        ipcMain.on(`${_this.pageId}-webview-ipc-message`,(e,args)=>{
            this.emit('ipc-message', args)
        })

        ipcMain.on(`${_this.pageId}-did-frame-navigate`,(e,args)=>{
            this.emit('did-frame-navigate', args)
        })

        ipcMain.on(`${_this.pageId}-jump-url`,(e,url)=>{
            this.emit('jump-url', url)
        })
    }

}

