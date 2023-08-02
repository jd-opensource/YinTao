<template>
  <div class="cherryHelp" id="cherryHelp" v-if="helper.visible">
    <div v-show="!helper.fold">
      <el-button class="helpBn" size="small" @click="helper.assert.click"
        >断言</el-button
      >
      <el-button class="helpBn" size="small" @click="helper.autoCookie.click"
        >自动登录</el-button
      >
      <el-button class="helpBn" size="small" @click="helper.sleep.click"
        >休眠</el-button
      >
      <el-button class="helpBn" size="small" @click="helper.opencv.click">图像点击</el-button>
      <el-button class="helpBn" size="small" @click="helper.onFinish"
        >结束录制</el-button
      >
      <el-button
        class="helpBn"
        size="small"
        :icon="ArrowLeftBold"
        @click="helper.floded"
      ></el-button>
    </div>
    <el-button
      class="helpBn"
      size="small"
      :icon="ArrowRightBold"
      v-show="helper.fold"
      @click="helper.unfold"
    ></el-button>
  </div>

  <div id="uirecorder-dialog" class="uirecorder" v-show="helper.assert.visible">
    <h2 id="uirecorder-dialog-title">添加断言:</h2>
    <div id="uirecorder-dialog-content">
      <ul>
        <li>
          <label>断言类型: </label
          ><select
            id="uirecorder-expect-type"
            @change="helper.assert.changeType($event)"
            v-model="helper.assert.type"
          >
            <option value="innerText">innerText</option>
            <option value="value">value</option>
            <option value="class">class</option>
            <option value="id">id</option>
          </select>
        </li>
        <li id="uirecorder-expect-dom-div" style="display: block">
          <label style="width:64px;">元素:</label
          >
          <i class="iconfont iconcopy" title="copy"  style="padding: 0 10px;" @click="helper.copy(helper.assert.dom)"></i>
          <select
            style="width:400px"
            id="uirecorder-expect-type"
            v-model="helper.assert.dom"
          >
            <option :value="sign" v-for="sign of helper.assert.signs" :key="sign" >{{sign}}</option>
          </select>
        </li>
        <li>
          <label>比较方式: </label>
          <select
            id="uirecorder-expect-compare"
            v-model="helper.assert.operate"
          >
            <option :value="0">equal</option>
            <option :value="1">notEqual</option>
            <option :value="2">contain</option>
            <option :value="3">notContain</option>
          </select>
        </li>
        <li>
          <label>预期结果: </label
          ><textarea
            id="uirecorder-expect-to"
            v-model="helper.assert.preResult"
          ></textarea>
        </li>
      </ul>
    </div>
    <div class="PopupWindow_bn">
      <el-button round @click="helper.assert.add">确定</el-button>
      <el-button round @click="helper.assert.cancel">取消</el-button>
    </div>
  </div>

  <div class="PopupWindow" v-show="helper.sleep.visible">
    <div class="PopupWindow_title">休眠</div>
    <div>
      <input
        type="text"
        v-model="helper.sleep.value"
        class="PopupWindow_input"
      />ms
    </div>
    <div class="PopupWindow_bn">
      <el-button round @click="helper.sleep.submit">确定</el-button>
      <el-button round @click="helper.sleep.visible = false">取消</el-button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { argsToString } from "../../utils";
import { ArrowRightBold, ArrowLeftBold } from "@element-plus/icons-vue";
import { nanoid } from "nanoid";
import {scshot} from "./eazyScreenshot"

import {
  onMounted,
  reactive,
  toRefs,
  nextTick,
  ref,
  getCurrentInstance,
} from "vue";

enum operateType {
  equal,
  notEqual,
  contain,
  notContain,
}

const internalInstance = getCurrentInstance();
const ipcRenderer = window["electron"].ipcRenderer;

const state = reactive({
  script: <string>"",
  helper: {
    visible: true,
    fold: false, // 是否折叠
    copy: (text:string) => {
      const aux = document.createElement('input')
      aux.setAttribute('value', text)
      aux.style.position = 'fixed';
      aux.style.clip = 'rect(0 0 0 0)';
      aux.style.top = '10px';
      document.body.appendChild(aux)
      aux.select()
      document.execCommand('copy')
      document.body.removeChild(aux)
    },
    opencv:{
      click:() => {
        var cover = document.getElementById("webviewCover") as HTMLElement;
        var bc = document.getElementById("BrowerContainer") as HTMLElement;
        cover.style.width = bc.offsetWidth + "px";
        const parent = internalInstance?.parent;
        scshot.clipOn(cover).then(scshopRange => {
          // 截图完成，撤掉遮盖
          cover.style.width = '0px'
          if (scshopRange != null){
            scshopRange.scale = 1  // 缩放设置为1
            scshopRange.y -= 65 // 因为特殊的误差y轴需要 -65
            ipcRenderer.invoke('captureScreenshot', scshopRange).then((imagePath)=>{
              console.log('图片路径为:' + imagePath)
              const args = [imagePath]
              parent?.exposed?.writeCommand(`await img.click(${argsToString(args)})`)
            })
          }
        })

      }
    },
    autoCookie: {
      click: () => {
        // 获取当前页面url
        const parent = internalInstance?.parent;
        const page = parent?.exposed?.getCurrentPage();
        /**
         * @description 根据url解析doman
         */
        const getDomain = (url) => {
          const urlReg =
            /[a-zA-Z0-9][-a-zA-Z0-9]{0,62}(\.[a-zA-Z0-9][-a-zA-Z0-9]{0,62})+\.?/;
          const cc = url.match(urlReg);
          if (cc !== null && cc.length > 1) {
            const coms = cc[0].split(".")
            if (coms.length > 2) {
              coms.shift();
              return `.${coms.join('.')}`
            }
          }
          return ''
        };
        const domain = getDomain(page.show_url)
        ipcRenderer.invoke('get-coookie-by-domain',domain).then((cookies:any[])=>{
          let cookieStr = ''
          for(let cookie of cookies){
            cookieStr += `${cookie.name}=${cookie.value};`
          }
          const _action =  {
            url: new URL(page.show_url).origin,
            name: "cookies.setAll",
            value: cookieStr
          }
          const args = [_action.url, _action.value]
          parent?.exposed?.writeCommand(`await cookies.setAll(${argsToString(args)})`, true);
        })
      },
    },
    sleep: {
      visible: false,
      click: () => {
        helper.value.sleep.visible = true;
      },
      value: 1000,
      submit: () => {
        const code = `await sleep(${helper.value.sleep.value})`;
        const parent = internalInstance?.parent;
        parent?.exposed?.writeCommand(code);
        helper.value.sleep.visible = false;
      },
    },
    assert: {
      visible: false,
      type: "innerText", // 断言类型
      operate: <operateType>operateType.equal, // 比较方式
      dom: "",
      signs:<string[]>[],
      preResult: "",
      point: {
        x: 0,
        y: 0,
      },
      init: () => {
        helper.value.assert = Object.assign(helper.value.assert, {
          dom: "",
          type: "innerText",
          preResult: "",
          operate: 0,
        });
      },
      add: () => {
        const { dom, preResult, type, operate } = helper.value.assert;
        console.log("export:", dom, preResult, type, operate);
        const parent = internalInstance?.parent;
        const _action = {
          id: nanoid(7),
          name: "assert.custom",
          value: [dom, type, preResult, operate],
        };
        const args = _action.value
        parent?.exposed?.writeCommand(`await assert.custom(${argsToString(args)})`);
        helper.value.assert.visible = false;
        helper.value.assert.init();
      },
      cancel: () => {
        helper.value.assert.visible = false;
        helper.value.assert.init();
      },
      click: () => {
        console.log("this", helper.value.assert);
        var cover = document.getElementById("webviewCover") as HTMLElement;
        var bc = document.getElementById("BrowerContainer") as HTMLElement;
        cover.style.width = bc.offsetWidth + "px";
        const parent = internalInstance?.parent;
        cover.onmousemove = (event) => {
          const page = parent?.exposed?.getCurrentPage();
          page?.webview?.send("high-dom", {
            x: event.clientX,
            y: event.clientY - 65,
          });
        };
        cover.onmouseup = (event) => {
          // used up, prevent record click.
          helper.value.assert.visible = true;
          helper.value.assert.point = {
            x: event.clientX,
            y: event.clientY - 65,
          };
          const page = parent?.exposed?.getCurrentPage();
          page?.webview?.send("get-assest-dom", {
            x: helper.value.assert.point.x,
            y: helper.value.assert.point.y,
          }); // send x,y use when iframe click, get iframe dom
          cover.onmousemove = function () {};
          cover.onmouseup = function () {};
          cover.style.width = "0px";
        };
      },
      changeType: (e: any) => {
        let key = e.target.value;
        const sign = helper.value.assert.dom;
        const parent = internalInstance?.parent;
        const page = parent?.exposed?.getCurrentPage();
        if (key == "class") {
          // class 特殊适配
          key = "className";
        }
        page?.webview?.send("get-assest-attr", {
          key,
          sign,
          point: {
            x: helper.value.assert.point.x,
            y: helper.value.assert.point.y,
          },
        });
      },
    },
    onFinish: () => {
      const parent = internalInstance?.parent
      const script = parent?.exposed?.getScript() || ''
      // 将消息传递出去以结束录制
      ipcRenderer.send("live_finished", {
        script,
        msg: "live filish!",
        code: 2000,
      });
    },
    // 展开
    unfold: () => {
      helper.value.fold = false;
    },
    //收起
    floded: () => {
      helper.value.fold = true;
    },
  },
});
let { script, helper } = toRefs(state);

function listenerStyleEvent() {
  window.addEventListener("assert-select", (event: any) => {
    console.log("assert-select", event);
    const [signs, innerText] = event.detail[0];
    helper.value.assert.dom = signs[0];
    helper.value.assert.signs = signs
    helper.value.assert.preResult = innerText;
  });

  window.addEventListener("set-assest-result", (event: any) => {
    console.log("set-assest-result", event);
    const result = event.detail || "";
    helper.value.assert.preResult = result;
  });
}

onMounted(async () => {
  registerHelperDrag();
  listenerStyleEvent();
});

/**
 * @method 注册帮助拖拽
 */
async function registerHelperDrag() {
  await nextTick();
  var Drag = document.getElementById("cherryHelp") as HTMLElement;
  Drag.onmousedown = function (event: any) {
    var ev = event || window.event;
    event.stopPropagation();
    var cover = document.getElementById("webviewCover") as HTMLElement;
    var bc = document.getElementById("BrowerContainer") as HTMLElement;
    cover.style.width = bc.offsetWidth + "px";
    var disX = ev.clientX - Drag.offsetLeft;
    var disY = ev.clientY - Drag.offsetTop;
    cover.onmousemove = function (event: any) {
      var ev = event || window.event;
      Drag.style.left = ev.clientX - disX + "px";
      Drag.style.top = ev.clientY - disY + "px";
      Drag.style.cursor = "move";
    };
    Drag.onmousemove = function (event: any) {
      var ev = event || window.event;
      Drag.style.left = ev.clientX - disX + "px";
      Drag.style.top = ev.clientY - disY + "px";
      Drag.style.cursor = "move";
    };
  };
  Drag.onmouseup = function () {
    var cover = document.getElementById("webviewCover") as HTMLElement; // webview 蒙层
    cover.style.width = "0px";
    cover.onmousemove = function () {};
    Drag.onmousemove = function () {};
    Drag.style.cursor = "default";
  };
}

defineExpose({
  script,
});
</script>

<style   scoped>
@import "./main.css";
</style>

<style>
@import "./screenshot.css";
</style>

