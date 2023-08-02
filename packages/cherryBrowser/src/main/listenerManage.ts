export class listenerManage{
    listeners:Map<string,Function>
    constructor(){
        this.listeners = new Map()
    }

    add(opt:Electron.WebContents,event:any,func: any){
        opt.on(event,func)
        this.listeners.set(event,func)
    }

    clear(opt:Electron.WebContents){
       this.listeners.forEach((func:any,event:any)=>{
           opt.removeListener(event, func)
       })
    }
}
