import { LiveConfig } from '../typeApi'
import { createElBrowser } from '@cherry-jd/cherry-browser'
import path from 'path'
import {nanoid} from 'nanoid'
import { ipcMain } from 'electron'
import { camelCase } from 'lodash'
import * as actions from "./injected/actions"
import { ActionManage } from './actionManage'

/**
 * @method 先沿用之前的转化逻辑 
 */
function commandToString(command: actions.Action) {
    let args: any[] = []
    const argsToString = (args: any[]) => {
      let _str = ''
      for (let arg of args) {
        _str += JSON.stringify(arg) + ','
      }
      return _str.slice(0, _str.length - 1)
    }
  
    // todo: 写法感觉奇怪的主要原因在于命令记录与指令对应的冲突，导致需要二次解析 
    switch (command.name) {
      case "fill":
        args.push(command.signs[0], command.text);
        break;
      case 'press':
          if(command.modifiers) {
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

// 中断则抛出错误
export async function live(config:LiveConfig) :Promise<any> {
    return  new Promise(async (resolve, reject) => {
        const {device, cookies} = config || {}
        const browser = await createElBrowser({device, preload: path.resolve(__dirname, './injected/record.js')})
        const actionManage = new ActionManage(browser)
        if(cookies) {
            browser.setCookies(cookies)
        }
        if(device) {
            const _action :actions.SetDevice = {
                id: nanoid(7),
                name: 'setDevice',
                value: device,
            }
            browser.plugs('codeIde','writeCode',[commandToString(_action)])
        }
        browser.once('page',(page)=>{
            // 录制时一般不会涉及多页面因此只需在初始时记录一次页面访问 
            const _action : actions.OpenPageAction = {
                id: nanoid(7),
                name: 'openPage',
                url: page.url,
            }
            actionManage.add(_action)
        })

        browser.on('change-tap',url=>{
            url =  new URL(url)
            const value = url.origin + url.pathname
            const _action :any = {
                id: nanoid(7),
                name:'change-page',
                value,
            }
            browser.plugs('codeIde','writeCode', [commandToString(_action)])
        })

        browser.on('page',(page)=>{
            // 监听到页面后再打开一个相同的页面为辅助模式
            // if(page.headless !== true){
            //     // 调试时显示辅助页面
            //     let showHeadless = true
            //     browser.newPage(config.url || 'https://baidu.com',{preload: path.resolve(__dirname, "./injected/assist.js"),headless:true,showHeadless})
            // }
            // browser.plugs('codeIde','bindSignal', {name:'popup'})
            actionManage.bindSignal({name:'popup'})

            // 在所有页面中的webview 都监听
            page.webview.on('ipc-message',(msg:{channel:string,args:any[]}) => {
                switch(msg.channel){
                    case 'record-action':{
                        const [action] = msg.args
                        // 不能执行写字符串，还是得先写一道命令，当然这个命令不需要，browser进行管理而是在录制的角度
                        // 这个命令记录的意义在于提供优化的空间，传递也不用在这里记录了
                        actionManage.add(action)
                        // browser.plugs('codeIde','writeCode',commandToString(action))
                    }
                }
            })

            page.webview.on('did-frame-navigate',(event:{isMainFrame:boolean,url :string}) => {
                const {isMainFrame,url} = event 
                if(isMainFrame && url !== 'about:blank') {
                    browser.plugs('codeIde','bindSignal', {name:'frame-navigate'})
                }
            })

            page.webview.on('jump-url', (url:string)=>{
                const _action :actions.OpenPageAction = {
                    id: nanoid(7),
                    name:'openPage',
                    url:url,
                }
                console.log('jump-url', _action)
                browser.plugs('codeIde','writeCode', [commandToString(_action)])
            })
        })

        await browser.newPage(config.url || 'https://baidu.com')
    
        browser.on('close',() => {
            if(!browser.webContent?.isDestroyed()){
                // 关闭时可以发送但是对应进程无法处理因为content已经被销毁,然而在销毁前无法处理相关事件
                // webview 可以监听关闭但必须用 windows.close 进行触发。 必须得加关闭事件，关闭浏览器前必须得关闭所有页面内容，因此应该禁止原生关闭，而自行封装浏览器关闭方法。
                // browser.webContent?.executeJavaScript('closeAllDevtools()')
            }
            // 在此处应该关闭所有的webview debug
            resolve({
                script: '',
                code: 1001
            })
        })
    
        // 监听录制结束获取到录制结果, 返回需要包含脚本以及code,以支持取消
        ipcMain.once('live_finished',(e,result)=>{
            resolve(result)
            // 不能立即关闭而是先关闭debug窗口
            if(!browser.isDestroyed()){
                browser.close()
            }
        })
    })
}
