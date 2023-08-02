// Preload (Isolated World) 无法使用主进程方法
const { contextBridge, ipcRenderer } = require('electron')
const {EventEmitter} = require('events')

contextBridge.exposeInMainWorld(
    'electron',
    {
        doThing: () => ipcRenderer.send('do-a-thing'),
        EventEmitter:{
            on:(event,callback) =>{
               return ((event,callback)=>{
                    EventEmitter.on(event,callback)
                })(event,callback)
            },
            emit: (event)=>{
                new EventEmitter().emit(event)
            }
        },
        browserWindow:{
            openDevTools: ()=>{
                ipcRenderer.invoke('browser-openDevTools')           
            },
            minimize:()=>{
                ipcRenderer.invoke('browser-minimize')
            },
            maximize:()=>{
                ipcRenderer.invoke('browser-maximize')
            }
        },
        ipcRenderer: {
            ...ipcRenderer,
            on: (channel, func) => {
                ipcRenderer.on(channel, (event, ...args) => {
                    func(...args)
                });
            },
            once: (channel, func) => {
                // Deliberately strip event as it includes `sender` 
                ipcRenderer.once(channel, (event, ...args) => func(...args));
            },
            send: (channel, ...args) => {
                ipcRenderer.send(channel,...args)
            }
        }
    },
)