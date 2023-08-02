import { StorageIpc } from "./storageIpc"
import { getElementBySign } from "./utils"
import {ipcRenderer} from 'electron'

(()=>{
    console.log('assist inject v1')

    setInterval(()=>{
        if(!document.title.includes('assist-')){
            document.title = 'assist-' + document.title 
        }
    }, 1000)

    //  Listener main page
    StorageIpc.listener((event)=>{
        let cmd = JSON.parse(event.newValue || '')
        console.log('command:', cmd)
        switch(cmd.name) {
            case 'fill': {
                const signs = cmd.signs
                const el = getElementBySign(signs[0])
                
            }
            break
            case 'click':{
                const signs = cmd.signs
                const el = getElementBySign(signs[0])
                if(el === undefined){
                    console.log('需要进行修正', signs)
                }
            }
            break
            default:{
                console.error('not matching cmd of name equal ',cmd.name)
            }
        }
    })
})()

