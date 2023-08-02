import uniqueSelector from '@cypress/unique-selector'
import type * as actions from './actions'
import { Anchor, Point } from './actions'
import { InjectedScript } from './synthesisSelector/injectedScript'
import { getElementBySign, getElementSigns } from './utils'
import {nanoid} from 'nanoid'
import { ipcRenderer } from 'electron'
import { StorageIpc } from './storageIpc'
import { clearHighLight, getHighDom, __highDom } from './domHigh'
import { LogicPolicy, LogicStatus } from './logicPolicy'

export type HighlightModel = {
    selector: string
    elements: Element[]
}

/**
 * @method 通过sendToHost于浏览器通讯
 */
const sendToBrowser = (event: string, ...args: any[]) => {
    ipcRenderer.sendToHost(event, ...args)
}

export class Recorder {
    private _mode: 'none' | 'inspecting' | 'recording' = 'none'
    private _listeners: (() => void)[] = []
    private  _injectedScript:InjectedScript
    private _hoveredModel: HighlightModel | null = null
    private _hoveredElement: HTMLElement | null = null
    private _activeElement: HTMLElement | null = null
    private _iframe?:string
    private _logicPolicy:LogicPolicy

    constructor(iframe?:string ) {
        ipcRenderer.on('iframe-index', (e,index: any) => {
            if(typeof this._iframe !== 'string') { // 针对iframe id替换
                this._iframe = index
            }
        })

        this._injectedScript = new InjectedScript(false, 1, 'chromium',true ,[]);
        this._refreshListenersIfNeeded()
        this._iframe = iframe
        this._logicPolicy = new LogicPolicy()
    }

    /**
     * @method 以锚点修正命令及切换上下文
     */
    get anchor():Anchor {
        const _url = new URL(location.href)
        return {
            // mode
            iframe: this._iframe,
            pathname: _url.pathname,
            origin: _url.origin
        }
    }

    private recordAction(action: actions.Action) {
        sendToBrowser('record-action', action)
    }

    private _actionInProgress(event: Event): boolean {
        // If Playwright is performing action for us, bail.
        // Consume as the first thing.
        consumeEvent(event)
        return false
    }

    private async _onClick(event: MouseEvent) {
        if(event.detail === 0) return // 抬起时不记录命令
        console.log('_onClick',event)

        if (this._shouldIgnoreMouseEvent(event)) {
            console.log('click ignore _shouldIgnoreMouseEvent')
            return
        }
        const policy = await this._logicPolicy.parse(this._deepEventTarget(event), event.type)
        console.log('result',policy)
        if(policy.status === LogicStatus.Abolish) return
        else if(policy.status === LogicStatus.Remodeling && policy.action) {
            policy.action.map( action => {
                this.recordAction(action) 
            })
           return
        }
        // 录制还是按cherry的逻辑走
        const signs = policy.status == LogicStatus.Finalize ? [policy.selector] : getElementSigns(this._deepEventTarget(event), this._injectedScript)
        // 上传可以直接获取到完整路径，所以不用在包裹一层
        console.log('click debug',this._deepEventTarget(event))
  
        const _action: actions.Action = {
            name: 'click',
            signs,
            anchor:this.anchor,
            id: nanoid(7),
            position: positionForEvent(event), // 可以根据点击位置的宽高百分比推断修正的可靠性,一般不用
            button: buttonForEvent(event),
            modifiers: modifiersForEvent(event),
            clickCount: event.detail,
        }
        // 点击后需要把命令发送给辅助浏览器进行修正
        this.auxiliarySync(_action)
        // 监听到录制后获取标识列表
        this.recordAction(_action)
    }

    /**
     * @method  录制时将命令同步给辅助浏览器执行
     */
    auxiliarySync(cmd: any) {
        StorageIpc.auxiliarySync(cmd)
    }

    private _deepEventTarget(event: Event): HTMLElement {
        return event.composedPath()[0] as HTMLElement
    }

    private _shouldIgnoreMouseEvent(event: MouseEvent): boolean {
        const target = this._deepEventTarget(event)
        const nodeName = target.nodeName
        if (nodeName === 'SELECT') { return true }
        if (nodeName === 'INPUT' &&  target instanceof HTMLInputElement  && ['date','file'].includes(target.type)) {
            // 拦截文件上传后需要唤起原生上传
            // const signs = getElementSigns(target, this._injectedScript)
            // const filePromise =  ipcRenderer.invoke('system-dialog',target.accept,target.webkitdirectory)
            // filePromise.then(files=>{
            //     console.log('fileres',files)
            //     // 将文件传递至
            //     // 沿用cherry的自动上传方案
            //     upload(signs[0],files)
            // })
            return true
        }
        return false
    }

    private async _onInput(event: InputEvent) {
        console.log('cherry__input', event, this._activeElement)
        const target = this._deepEventTarget(event)
        const policy = await this._logicPolicy.parse(this._deepEventTarget(event), event.type)
        console.log('result',policy)
        if(policy.status === LogicStatus.Abolish) return
        else if(policy.status === LogicStatus.Remodeling && policy.action) {
            policy.action.map( action => {
                this.recordAction(action) 
            })
           return
        }
        // 录制还是按cherry的逻辑走
        const signs = policy.status == LogicStatus.Finalize ? [policy.selector] : getElementSigns(this._deepEventTarget(event), this._injectedScript)

        if (['INPUT', 'TEXTAREA'].includes(target.nodeName)) {
            const inputElement = target as HTMLInputElement
            const elementType = (inputElement.type || '').toLowerCase()
            if (['checkbox', 'radio'].includes(elementType)) {
                // Checkbox is handled in click, we can't let input trigger on checkbox - that would mean we dispatched click events while recording.
                return
            }

            if (elementType === 'file') {
                const _action: actions.Action = {
                    name: 'setInputFiles',
                    signs,
                    id: nanoid(7),
                    files: [...(inputElement.files || [])].map((file) => file.path),
                }
                console.log('file',_action)
                this.recordAction(_action)
                return
            }

            // Non-navigating actions are simply recorded by Playwright.
            // hint: 开启将导致移动端 https://baidu.com 输入无法记录
            // if (this._consumedDueWrongTarget(event)) {
            //     return
            // }

            const _action: actions.Action = {
                name: 'fill',
                signs,
                id: nanoid(7),
                text: inputElement.value,
            }
            console.log('记录这里的命令:',inputElement.value)
            this.auxiliarySync(_action)
            this.recordAction(_action)
        }

        if (target.nodeName === 'SELECT') {
            const selectElement = target as HTMLSelectElement
            if (this._actionInProgress(event)) { return }

            const _action: actions.Action = {
                name: 'select',
                id: nanoid(7),
                signs,
                options: [...selectElement.selectedOptions].map((option) => option.value),
            }
            this.recordAction(_action)
        }
    }

    private _consumedDueWrongTarget(event: Event): boolean {
        // 如果激活的等于当前操作的，则往下走，有效
        console.log('移动文本调试',this._activeElement,this._deepEventTarget(event),this._activeElement && this._activeElement === this._deepEventTarget(event))
        if (this._activeElement && this._activeElement === this._deepEventTarget(event)) { return false }
        consumeEvent(event)
        return true
      }

    private _onKeyDown(event: KeyboardEvent) {
        console.log('___onKeyDown', event, this._mode)

        const valids = [
            "Enter",
            "Tab",
            // "ArrowDown",
            // "ArrowUp",
            // "Backspace",
            // "ArrowLeft",
            // "ArrowRight",
        ];

        if (!valids.includes(event.key)) return // ignore not care event
        const _action: actions.Action = {
            name: 'press',
            id: nanoid(7),
            key:event.key,
            modifiers: modifiersForEvent(event),
        }
        this.recordAction(_action)
        // if (this._mode === 'inspecting') {
        //     consumeEvent(event)
        //     return
        // }
        // if (this._mode !== 'recording') { return }
        // if (!this._shouldGenerateKeyPressFor(event)) {
        //     console.log('_onKeyDown ignore _shouldGenerateKeyPressFor')
        //     return
        // }
        // if (this._actionInProgress(event)) {
        //     console.log('_onKeyDown ignore _actionInProgress')
        //     this._expectProgrammaticKeyUp = true
        //     return
        // }
        // if (this._consumedDueWrongTarget(event)) {
        //     console.log('_onKeyDown ignore _consumedDueWrongTarget')
        //     return
        // }
        // const selector = this._activeElement && generateSelector(this._injectedScript, this._activeElement, true).selector
        // if (selector == null) throw new Error('_activeElement selector null')
        // // Similarly to click, trigger checkbox on key event, not input.
        // if (event.key === ' ') {
        //     const checkbox = asCheckbox(this._deepEventTarget(event))
        //     if (checkbox) {
        //         this._performAction({
        //             name: checkbox.checked ? 'uncheck' : 'check',
        //             selector,
        //             signals: [],
        //         })
        //         return
        //     }
        // }
        // console.log('输入中文点击的debug', event)

        // // 输入中文时会触发这个，实际上再输入时不应该触发这里
        // this._performAction({
        //     name: 'press',
        //     selector,
        //     signals: [],
        //     key: event.key,
        //     modifiers: modifiersForEvent(event),
        // })
    }

    private _onKeyUp(event: KeyboardEvent) {
        // if (this._mode === 'none') { return }
        // if (!this._shouldGenerateKeyPressFor(event)) { return }

        // // Only allow programmatic keyups, ignore user input.
        // if (!this._expectProgrammaticKeyUp) {
        //     consumeEvent(event)
        //     return
        // }
        // this._expectProgrammaticKeyUp = false
    }

    private _onMouseDown(event: MouseEvent) {
        console.log('_onMouseDown _activeModel ')
        // if (this._shouldIgnoreMouseEvent(event)) { return }
        // if (!this._performingAction) { consumeEvent(event) }
        this._activeElement = this._hoveredElement
    }

    private _onMouseUp(event: MouseEvent) {
        // if (this._shouldIgnoreMouseEvent(event)) { return }
        // if (!this._performingAction) { consumeEvent(event) }
    }

    private _onMouseMove(event: MouseEvent) {
        const target = this._deepEventTarget(event)
        if (this._hoveredElement === target) { return }
        this._hoveredElement = target
    }

    private _onMouseLeave(event: MouseEvent) {
    }

    private _onFocus() {
        // const activeElement = this._deepActiveElement(document)
        // const result = activeElement ? generateSelector(this._injectedScript, activeElement, true) : null
        // console.log('_onFocus  this._activeModel', result && result.selector ? result : null)
        // this._activeElement = this._hoveredElement // result && result.selector ? result : null
        // if (this._injectedScript.isUnderTest) { console.error(`Highlight updated for test: ${result ? result.selector : null}`) } // eslint-disable-line no-console
    }

    private _refreshListenersIfNeeded() {
        // Ensure we are attached to the current document, and we are on top (last element);
        removeEventListeners(this._listeners)
        this._listeners = [
            addEventListener(document, 'click', (event) => this._onClick(event as MouseEvent), true),
            addEventListener(document, 'auxclick', (event) => this._onClick(event as MouseEvent), true),
            addEventListener(document, 'input', (event) => this._onInput(event as InputEvent), true),
            addEventListener(document, 'keydown', (event) => this._onKeyDown(event as KeyboardEvent), true),
            addEventListener(document, 'keyup', (event) => this._onKeyUp(event as KeyboardEvent), true),
            addEventListener(document, 'mousedown', (event) => this._onMouseDown(event as MouseEvent), true),
            addEventListener(document, 'mouseup', (event) => this._onMouseUp(event as MouseEvent), true),
            addEventListener(document, 'mousemove', (event) => this._onMouseMove(event as MouseEvent), true),
            addEventListener(document, 'mouseleave', (event) => this._onMouseLeave(event as MouseEvent), true),
            addEventListener(document, 'focus', () => this._onFocus(), true),
            addEventListener(document, 'scroll', () => {
                // this._hoveredModel = null
                // this._highlight.hideActionPoint()
                // this._updateHighlight()
            }, true),
        ]
    }
}

/** 上传文件 */
export async function upload(selector: string, filePath: string) {
    console.log('upload func start！')
    // 这里需要新增逻辑根据url地址上传
    // let { remote } = require('electron')
    // let wc = remote.getCurrentWebContents()
    // 获取WebContents, 怎么获取当前页面的webcontenty
    // 当前环境已经无法获取主进程方法, 因此我们在主进程中提供类似函数
    await ipcRenderer.invoke('dom-upload',selector,filePath)
    // try {
    //   wc.debugger.detach()
    //   wc.debugger.attach('1.1')
    //   // const selectorParams = (nodeId: any) => { return { nodeId, selector} };
    //   let attachParams = (res: any) => {
    //     return { nodeId: res.nodeId, files: [filePath] }
    //   };
    //   // const docRes = await wc.debugger.sendCommand('DOM.getDocument', { pierce: true, depth: -1 })
    //   const searchId = (await querySelector(selector)).nodeId // await getIframe(docRes.root, selector)
    //   console.log('文件上传获取到的searchId', searchId)
    //   // const domRes = await wc.debugger.sendCommand('DOM.querySelector', selectorParams(searchId)).catch((err)=>{
    //   //   console.error('DOM.querySelector err',err,'search id:',searchId,' selector:', selector)
    //   // })
    //   // console.log('文件上传', domRes, searchId)
    //   // if(domRes.nodeId === 0){
    //   //   return console.error('file upload error: no\'t find target', selector)
    //   // }
    //   wc.debugger.sendCommand('DOM.setFileInputFiles', attachParams({ nodeId: searchId })).then((err: any) => {
    //     console.log('上传成功')
    //     wc.debugger.detach();
    //     err && err.code ? console.log(err.toString()) : ''
    //   }).catch(err => {
    //     cb('file upload failed: ' + err)
    //   })
    //   return
    // } catch (err) {
    //   cb('Debugger attach failed: ' + err, selector, filePath)
    //   return
    // }
  }


function addEventListener(target: EventTarget, eventName: string, listener: EventListener, useCapture?: boolean): () => void {
    target.addEventListener(eventName, listener, useCapture)
    const remove = () => {
        target.removeEventListener(eventName, listener, useCapture)
    }
    return remove
}

function removeEventListeners(listeners: (() => void)[]) {
    for (const listener of listeners) { listener() }
    listeners.splice(0, listeners.length)
}

function positionForEvent(event: MouseEvent): Point | undefined {
    const targetElement = (event.target as HTMLElement)
    if (targetElement.nodeName !== 'CANVAS') { return }
    return {
        x: event.offsetX,
        y: event.offsetY,
    }
}

function modifiersForEvent(event: MouseEvent | KeyboardEvent): number {
    return (event.altKey ? 1 : 0) | (event.ctrlKey ? 2 : 0) | (event.metaKey ? 4 : 0) | (event.shiftKey ? 8 : 0)
  }

function buttonForEvent(event: MouseEvent): 'left' | 'middle' | 'right' {
    switch (event.which) {
        case 1: return 'left'
        case 2: return 'middle'
        case 3: return 'right'
    }
    return 'left'
}

/**
   * @method 停止事件传递,将阻止点击事件
   */
function consumeEvent(e: Event) {
    e.preventDefault()
    e.stopPropagation()
    e.stopImmediatePropagation()
}

function initIpc(){
    ipcRenderer.on('high-dom', (e,data: any) => {
        __highDom(data.x, data.y)
      })

    // iframe 不需要注册该事件因为传递不能直接抵达
      ipcRenderer.on('get-assest-dom', (e,point:{x: number, y: number}) => {
        // todo: 第一次早了
        var highDom = document.elementFromPoint(point.x, point.y);
        // 查找优先下发page,如果指向page中的frame 则必须获取高亮的frame 才能往下传递
        console.log('get-assest-dom',highDom)
        if(!highDom) {return console.error(`hign dom no\'t is ${highDom}`)}
        clearHighLight(highDom) // claer guarantee clase name accuracy
        if (highDom?.tagName === 'IFRAME' && highDom instanceof HTMLIFrameElement) {
          console.log('xiang ifaem send 388')
          highDom?.contentWindow?.postMessage({
            instruct: 'get-high-dom-sign',
            args: []
          }, '*')
        } else {
            const signs = getElementSigns(highDom, new InjectedScript(false, 1, 'chromium',true ,[]))
            ipcRenderer.sendToHost('assert-select', [signs, highDom['innerText'] || ''])
        }
      });

      ipcRenderer.on('get-assest-attr', (e,data) => {
        const {sign,key,point} = data
        // 替换执行的查找方式
        const highDom = document.elementFromPoint(point.x, point.y);
        if (highDom == undefined) return console.error(`invalid x,y '${point.x},${point.y}' not find element`)
        if(highDom !== null) {
          if(highDom.nodeName === 'IFRAME') {
            (highDom as HTMLIFrameElement).contentWindow?.postMessage({
              instruct: 'get-element-attr',
              args:[sign,key]
            },'*')
          }else{
            let result = (highDom as any)[key]
            ipcRenderer.sendToHost("set-assest-result", result);
          }
        }
      })
}

/**
 *  @method 为iframe增加消息监听
 */
 export function iframeOnMessage() {
    window.addEventListener("message", function (event) { // iframe中高亮操作
      const _arguments = event.data
      const instruct = _arguments.instruct
      switch (instruct) {
        case 'high-dom':
          {
            let [x, y] = _arguments.args
            __highDom(x, y)
          }
          break
        case 'get-high-dom-sign':
          {
            console.log('ifame 434')
            const highDom = getHighDom()
            clearHighLight(highDom)
            if(!highDom) return console.error('frame high dom not found')
            const signs = getElementSigns(highDom, new InjectedScript(false, 1, 'chromium',true ,[]))
            console.log('ifame get-high-dom-sign',[signs,highDom?.innerText])
            ipcRenderer.sendToHost('assert-select', [signs,highDom?.innerText])
          }
          break
        case 'clear-high':
          {
            const highDom = getHighDom()
            clearHighLight(highDom)
          }
          break
        case 'get-element-attr':
          {
            let [sign, key] = _arguments.args
            const highDom = getElementBySign(sign)
            let result = (highDom as any)[key]
            ipcRenderer.sendToHost("set-assest-result", result);
          }
          break
      }
    })
  }
  
(() => {
    // 注入时需要判断自身是否为iframe,之后再选取iframe标识
    console.log('Recorder inject!','url:',window.location, window.frameElement,window.top, typeof window.top, window.top instanceof Window)
    let iframe,routingId
    if (!(window.top instanceof Window)) { // 当top为window时则为iframe
        // 通过再top对象,间接换算iframe注册逻辑
        // const {top} = window as any
        // if(!top.iframeIndex) {
        //     top.iframeIndex = 1 // 初始从1开始，适配执行时会将页面本身也置换为frame
        // }else{
        //     top.iframeIndex++
        // }
        const {webFrame} = require('electron') 
        routingId = webFrame.routingId || 1
        // iframe = top.iframeIndex
        // 如果快速的解决问题的话，需要一开始把 routingId 切换为索引
        ipcRenderer.sendToHost('register-iframe', routingId)
        // 为frame对象单独添加一些事件
        iframeOnMessage()
    }
    new Recorder(routingId)
    initIpc()
})()
export default Recorder
