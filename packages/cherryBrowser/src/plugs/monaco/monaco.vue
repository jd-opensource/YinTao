<template>
  <div ref="monacoIde" class="vue-monaco"></div>
</template>

<script lang="ts" setup>
// @ts-ignore
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'
// @ts-ignore
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
// @ts-ignore
import parse from './parse.d.ts?raw'
import { ref,Ref,reactive, onMounted,toRefs } from 'vue'
import type * as actions from "./actions"
import * as monaco from 'monaco-editor'
import { camelCase } from "lodash"

//  @ts-ignore
self.MonacoEnvironment = {
  getWorker(_: string, label: string) {
    if (['typescript', 'javascript'].includes(label)) {
      return new tsWorker()
    }
    return new EditorWorker()
  }
}

interface Props{
  script:string
}
const props = withDefaults(defineProps<Props>(),{
  script: '',
})

const monacoIde:Ref<HTMLDivElement | null> = ref(null)
const state = reactive({
  commands: <any[]>[],
})
var { commands } = toRefs(state)
var _Monaco :monaco.editor.IStandaloneCodeEditor

onMounted(()=>{
  console.log('ide插件渲染container',monacoIde.value,props,props.script)
  if(monacoIde.value) {
    var libSource = [parse,
    `
          declare const page :FCherryPage
          declare const cookies :FCherryCookies
          declare const keyboard :FCherryKeyboard
          declare const mouse :FCherryMouse
          declare const dom :FCherryDom
          declare const browser :FCherryBrowser
          declare const assert :FCherryAssert
          declare const sleep :(ms:number)=> Promise<void>
          declare const execJavaScript :(script:string) => Promise<any>
    `].join('\n')
    var libUri = 'ts:filename/cherry.d.ts'
    monaco.languages.typescript.javascriptDefaults.addExtraLib(libSource, libUri)
    _Monaco = monaco.editor.create(monacoIde.value, {
      value: props.script,
      language: 'javascript',
      scrollBeyondLastLine: false,
      automaticLayout:true,
      fixedOverflowWidgets: true,
    });
  }
})

function bindSignal(signal:any) {
  const lastCommand = commands.value.pop()
  if(!lastCommand) return
  switch(signal.name){
    case 'popup':
      {
        // 几乎90%的弹出都是以click 触发,因此先简单化处理
        if(lastCommand.name && lastCommand.name == 'click'){
          lastCommand.signals = lastCommand.signals || []
          lastCommand.signals.push(signal)
        }
      }
      break;
    case 'frame-navigate':
      {
        if(lastCommand.name && lastCommand.name == 'click') {
          lastCommand.signals = lastCommand.signals || []
          if( lastCommand.signals.find(i=>{return i.name === 'popup'}) === undefined) {
            // on popup not push frame-navigate
            lastCommand.signals.push(signal)
          }
        }
      }
      break
    default:
      console.error('Unknown signal ',signal.name)
  }
  commands.value.push(lastCommand)
  renderCommands()
}

function commandToString(command: actions.Action) {
  let args: any[] = [];
  const argsToString = (args: any) => {
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

function renderCommands() {
  const text :string[] = []
  for (let command of commands.value) {
    const commandString = command.native ? command.nativeStr : commandToString(command)
    text.push(commandString)
  }
  setScript(text.join('\n'));
}

// 需要禁止全量刷新，而是录制仅支持追加
function setScript(script: string) {
  _Monaco.setValue(script)
}

/**
* @method 仅支持写入，追加或前置(无法获取到用户的更改，因此在任何时候都不能进行重写)
* @param text 写入的文本内容
* @param after 是否在写入在最前面
*/
function write(text:string, after:boolean = false) {
    if (after) {
        setScript(text + '\n' + _Monaco.getValue())
    }else{
      setScript(_Monaco.getValue() + text + '\n')
    }
}

function replaceOp(text:string,bug:string,now:string) :string{
    const op = (text:string) => { return text.split('').reverse().join('')}
    return op(op(text).replace(op(bug),op(now)))
}

function fix(oldText:string, newText:string) {
    // const bugString = new RegExp(`${oldText}$`)
    // console.log('测试修正', _Monaco.getValue(),'----',bugString,'----',newText)
    const value = replaceOp(_Monaco.getValue(), oldText, newText)
    console.log('修正后', value)
    _Monaco.setValue(value)
}
/**
 * @method 获取脚本内容
 */
function getValue() {
  return _Monaco.getValue()
}

defineExpose({
  write,
  fix,
  setScript,
  bindSignal,
  getValue,
});
</script>

<style scoped>
@import "./main.css";
</style>
