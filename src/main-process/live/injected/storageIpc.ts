//  利用storage 实现通讯

/**
 * @method 消息类型
 */
enum MsgTpe {
  shadow_browser_run= 'shadow_browser_run'
}

export class  StorageIpc{
  static auxiliarySync(cmd:any){
    localStorage.setItem(MsgTpe.shadow_browser_run,JSON.stringify(cmd))
  }

  static listener(func: (event:any) => void){
    window.addEventListener('storage',(event)=>{
      if(event.key as string  in MsgTpe ){
        func(event)
      }
    })
  }
}

// module.exports = {
//   StorageIpc
// }

// window.addEventListener('storage',(event)=>{
//     console.log('收到了storage的变更',event)
// })