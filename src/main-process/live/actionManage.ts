// 管理录制生成的命令，以进行优化
import * as actions from './injected/actions'
import { camelCase,cloneDeep } from 'lodash'
import { nanoid } from 'nanoid';

/**
 * @method 先沿用之前的转化逻辑 
 */
 function commandToString(command: actions.Action) {
    let args: any[] = [];
    const argsToString = (args: any[]) => {
      let _str = '';
      for (let arg of args) {
        _str += JSON.stringify(arg) + ',';
      }
      return _str.slice(0, _str.length - 1);
    };
  
    // todo: 写法感觉奇怪的主要原因在于命令记录与指令对应的冲突，导致需要二次解析 
    switch (command.name) {
      case "fill":
        args.push(command.signs[0], command.text);
        break;
      case 'press':
          if(command.modifiers){
            return `await keyboard.press('${command.key}',{delay:${command.modifiers}})`
          }else{
            return `await keyboard.press('${command.key}')`
          }
      case "click":
        let muntScript = ''
        args.push(command.signs[0]);
        if(command.delay) {
          args.push({delay:command.delay})
        }
        muntScript += `await dom.${camelCase(command.name)}(${argsToString(args)})`;
        if (command.signals) {
          for (let signal of command.signals) {
            if (signal.name == 'popup') {
              muntScript = muntScript.replaceAll('await ','')
              muntScript += ',\n page.waitPopup()\n'
  
              muntScript = 'await Promise.all([\n' + muntScript + ']);'
            }else if(signal.name == 'frame-navigate') {
              muntScript = muntScript.replaceAll('await ','')
              muntScript += ',\n page.waitForEvent(\'framenavigated\')\n'
              muntScript = 'await Promise.all([\n' + muntScript + ']);'
            }
          }
        }
        return muntScript
      case "setInputFiles":
        args.push(command.signs[0], command.files);
        return `await dom.upload(${argsToString(args)})`
      case 'sleep':
        args.push(command.value);
        return `await sleep(${argsToString(args)})`
      case 'cookies.setAll':
         args.push(command.url, command.value);
         return `await cookies.setAll(${argsToString(args)})`
      case 'assert.custom':
        args.push(...command.value)
        return `await assert.custom(${argsToString(args)})`
      case "select":
        args.push(command.signs[0], command.options);
        break;
      case "changeIframe":
        args.push(command.value);
        return `await page.changeIframe(${argsToString(args)})`;
      case 'change-page':
        args.push(command.value);
        return `await page.change(${argsToString(args)})`
      case "setDevice":
        args.push(command.value);
        return `await page.setDevice(${argsToString(args)})`
      case "openPage":
        args.push(command.url);
        return `await page.to(${argsToString(args)})`;
    }
  
    let commanmName = camelCase(command.name);
    return `await dom.${commanmName}(${argsToString(args)})`;
}


export class ActionManage {
    _actions:any[] = []
    _currentIframe:string | undefined = undefined
    browser:any
    constructor(browser:any){
        this.browser = browser
    } 
    
    add(action: actions.Action) {
        switch(action.name){
            case 'click': {
                console.log('**click**',action,this._currentIframe)
                if (action.anchor && this._currentIframe !== action.anchor.iframe) {
                    this._currentIframe = action.anchor.iframe
                    const iframeAction : actions.ChangeIframeAction = {
                        id:nanoid(7),
                        name: "changeIframe",
                        value: this._currentIframe === undefined ? -1 : this._currentIframe,
                    }
                    this._actions.push(iframeAction)
                    this.write(commandToString(iframeAction))
                  }
                }
                break
            case 'fill':
                const lastCommand: actions.Action = this._actions.at(-1)
                if (lastCommand && lastCommand.name == 'fill'  && action.signs[0] == lastCommand.signs[0]) {
                    this.fix(commandToString(lastCommand),commandToString(action))
                    this._actions.push(action)
                    return
                }
                break

            case 'openPage': {
                this._currentIframe = undefined
                }
                break
        }
        this._actions.push(action)
        this.write(commandToString(action))
    }

    bindSignal(signal:any){
        const lastCommand: actions.Action = this._actions.at(-1)
        if(!lastCommand) return
        switch(signal.name){
            case 'popup':
              {
                // 几乎90%的弹出都是以click 触发,因此先简单化处理
                if(lastCommand.name && lastCommand.name == 'click'){
                    let oldCommand = cloneDeep(lastCommand)
                    lastCommand.signals = lastCommand.signals || []
                    lastCommand.signals.push(signal)
                    this.fix(commandToString(oldCommand),commandToString(lastCommand))
                }
              }
              break;
            case 'frame-navigate':
              {
                if(lastCommand.name && lastCommand.name == 'click') {
                  lastCommand.signals = lastCommand.signals || []
                  if(!lastCommand.signals.find(i=>{return i.name === 'popup'})) {
                      let oldCommand = cloneDeep(lastCommand)
                      // on popup not push frame-navigate
                      lastCommand.signals.push(signal)
                      this.fix(commandToString(oldCommand),commandToString(lastCommand))
                  }
                }
              }
              break
            default:
              console.error('Unknown signal ',signal.name)
        }
    }

    write(text:string){
        this.browser.plugs('codeIde','writeCode',text)
    }

    fix(old:string, now:string) {
        this.browser.plugs('codeIde','fixCode',old,now)
    }
}

