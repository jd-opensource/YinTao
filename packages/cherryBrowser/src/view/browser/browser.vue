
<template>
  <div class="browser">
    <header>
      <section style="-webkit-app-region: no-drag" class="bowerTop"></section>
      <!-- 标签页 -->
      <section
        style="-webkit-app-region: drag"
        class="bowerHeader"
        id="bowerHeader"
      >
        <ul
          class="bowerCreaterWindow"
          style="-webkit-app-region: drag padding: 15px 0 0"
          ref="bowerCreaterWindow"
        >
          <li
            v-for="(page, index) in browerPages"
            :key="index"
            :class="page.visible ? 'BrowerActive' : ''"
            class="BrowerList"
            draggable="true"
            @click="changePage(page)"
            v-show="page.showHeadless || page.headless !== true"
          >
            <div class="BrowerListBody" ripple draggable="false">
              <img class="tag_favicon" :src="page.favicons" />
              <p class="Webname">{{ page.title }}</p>
              <i
                class="iconfont iconguanbi"
                @click.stop="closePage(page.id)"
              ></i>
            </div>
          </li>
          <button class="BrowwerAdd" @click="addEmptyTab"></button>
        </ul>
        <section
          v-if="!isMac()"
          style="-webkit-app-region: no-drag"
          class="browerHeaderControl clearfix"
        >
          <button
            type="button"
            class="iconfont iconzuixiaohua"
            @click="minimize"
          ></button>
          <button
            type="button"
            class="iconfont iconzuidahua"
            @click="maximize"
          ></button>
          <button
            type="button"
            class="iconfont iconguanbi"
            @click="closeBrowser()"
            style="font-size: 16px"
          ></button>
        </section>
      </section>

      <!-- 工具栏 -->
      <div class="BrowerHead">
        <!-- <button id="goBack" class="icon-left" @click="goBack" :disabled="!canGoBack" ></button> -->
        <!-- <button id="goForward" class="icon-right" @click="goForward" :disabled="!canGoForward" ></button> -->
        <button class="iconfont iconshuaxin" @click="pageRefash"></button>
        <div class="BrowerUrlArea">
          <span class="iconfont iconsousuo"></span>
          <input
            type="text"
            placeholder="在此输入网址或关键词"
            id="search"
            v-model="currentAddr"
            @keyup.enter="jumpUrl()"
          />
        </div>

        <div class="plugs">
          <button
            class="iconfont icondebug"
            title="debug"
            @click="openPageDebug()"
          ></button>
          <button
            class="iconfont iconcode1"
            id="MouseMenuMainerBtn"
            title="code"
            @click="showCode"
          ></button>
          <button
            @click="test()"
            title="test"
            class="iconfont icontishi"
          ></button>
          <!-- <component :is="item"  v-for="(item,index) in plugList" :key="index"></component> -->
        </div>
      </div>
    </header>

    <ul class="MouseMenuMainer" style="right: 1px top: 81px display: none"></ul>

    <!-- 标签页右键菜单 -->
    <ul id="US_TagSet" class="US_TagSet MouseMenuMain">
      <li id="OpenTags" onclick="US_Browser.CreatBrower('')">打开新的标签页</li>
      <li id="OpenTagser" onclick="US_Browser.reFresh()">重新加载</li>
      <li id="DelectTags">关闭标签页</li>
    </ul>

    <!-- 书签右键菜单 -->
    <ul id="US_BookmarkSet" class="US_BookmarkSet MouseMenuMain">
      <li id="OpenBookmark">在新的标签页打开</li>
      <li id="OpenBookmarker">在新窗口打开</li>
      <li id="DelectBookmark">删除书签</li>
      <!--<li class="MouseMenuMainStep"></li>-->
    </ul>

    <!-- 网页右键菜单 -->
    <ul class="MouseMenuMain" id="webviewBrowserMenu">
      <li class="US_OpenLinkInNew" style="display: none">
        在新标签页中打开链接
      </li>
      <li class="US_OpenImgInNew" style="display: none">
        在新标签页中打开图片
      </li>
      <li class="US_Browers_Back" onclick="goBack()">
        返回<span>Alt+左箭头</span>
      </li>
      <li class="US_Browers_go" onclick="goForward()">
        前进<span>Alt+右箭头</span>
      </li>
      <li onclick="US_Browser.reFresh()">重新加载<span>Ctrl+R</span></li>
      <li onclick="US_Browser.Print()">打印<span>Ctrl+P</span></li>
      <li class="MouseMenuMainStep"></li>
      <li onclick="US_Browser.SourceCode()">
        查看网页源代码<span>Ctrl+U</span>
      </li>
      <li onclick="US_Browser.DevTools()">检查<span>F12/Ctrl+Shift+I</span></li>
    </ul>

    <!-- ctrl F 搜索 -->
    <div class="BrowerFind">
      <input type="text" placeholder="搜索网页内容" />
      <span>0/0</span>
      <button class="icon-angle-up" style="cursor: no-drop"></button>
      <button class="icon-angle-down"></button>
      <button class="icon-times"></button>
    </div>
    <p class="BrowerTips"></p>

    <!-- body部分 -->
    <div id="mainCotrol">
      <!-- webview蒙层 -->
      <div id="webviewCover"></div>

      <!-- webViews视图 -->
      <div class="BrowerContainer" id="BrowerContainer">
        <div
          style="height: 100%; min-width: 300px"
          v-for="(page, index) in browerPages"
          :key="index"
          v-show="page.visible"
        >
        <!-- disablewebsecurity must in order to frameElement -->
        <!-- disablewebsecurity 不能使用，添加将影响request Origin 造成部分页面无法访问 -->
          <webview
            :src="page.url"
            :id="page.id"
            :useragent="page.useragent"
            nodeintegrationinsubframes="true"
            webpreferences="contextIsolation=no"
            allowpopups
            :preload="page.preload"
            style="height: 100%"
          />
        </div>
      </div>
      <div id="line" v-show="plugs.codeIde.visible"></div>
      <div id="codeControl" v-show="plugs.codeIde.visible">
        <monaco ref="codeIde" :script="plugs.codeIde.script"></monaco>
      </div>
    </div>

    <!-- 录制提示框 -->
    <floatBtn @getScript="getScript"></floatBtn>
  </div>
</template>

<script lang='ts' setup>
//  @ts-ignore
import monaco from "../../plugs/monaco/monaco.vue";
// import codemirror from "../../plugs/codemirror/codemirror.vue";

//  @ts-ignore
import floatBtn from '../../plugs/floatBtn/floatBtn.vue'
import { ElButton } from "element-plus";
import { onMounted, reactive, toRefs, ref, nextTick, computed } from "vue";
import { Page, PageOptions } from "./page";
import { BrowserMode, CherryBrowserOptions } from "../../types";
import { PlugManager } from "./plugManager";

/** * 是否为mac系统（包含iphone手机） * */ 
function isMac() { 
    return /macintosh|mac os x/i.test(navigator.userAgent)
}

const plugManager = new PlugManager()
const ipcRenderer = window["electron"].ipcRenderer;
enum operateType {
  equal,
  notEqual,
  contain,
  notContain,
}

interface CherryBrowserRunTime {
  mode: BrowserMode;
  proxy_id: string;
}

const codeIde = ref<null | any>(null);
var _browserOptions:CherryBrowserOptions;
const currentAddr = computed(() => {
  return (
    browerPages.value.find((i) => {
      return i.visible === true
    })?.show_url || ''
  );
});

const state = reactive({
  browerPages: <PageOptions[]>[],
  plugs: {
    codeIde: {
      visible: false,
      script:''
    },
    live: {
      helper: {
        visible: false, // 是否显示
        fold: false, // 是否折叠
        sleep: {
          visible: false,
          click: () => {
            plugs.value.live.helper.sleep.visible = true;
          },
          value: 1000,
          submit: () => {
            const code = `await t.wait(${plugs.value.live.helper.sleep.value})`;
            plugs.value.codeIde.script += `await t.wait(${plugs.value.live.helper.sleep.value})\n`
            // writeCommand(code, true);
            plugs.value.live.helper.sleep.visible = false;
          },
        },
        onFinish: () => {
          // @ts-ignore
          const script = codeIde.value?.script || "";
          window &&
            window["electron"].ipcRenderer.liveFinish(runtime.value.proxy_id, {
              script,
              code: 0,
            });
        },
      },
    },
  }, // 插件管理
  runtime: <CherryBrowserRunTime>{},
});
let { browerPages, plugs, runtime } = toRefs(state);

onMounted(async () => {
  init();
  const _url: URL = new URL(location.href);
  _browserOptions = JSON.parse(_url.searchParams.get("browserOptions")!);

  registerDragLine()
  // 窗口以插件的形式展示
  console.log("browser init opt:", _browserOptions);
});

function getScript() {
  return codeIde.value?.getValue() || ''
}

  /**
   * @description 执行跳转
   */
  function jumpUrl() {
    let url = (document.getElementById('search') as HTMLInputElement).value;
    let http = /^(http)/;
    let https = /^(https)/;
    let www = /^(www)/;
    let secondary = /([a-z0-9--]{1,200})\.([a-z]{2,10})(\.[a-z]{2,10})?/;
    console.log('jumpUrl', url)

    const currentPage =  getCurrentPage()
    if (!currentPage) {
      throw new Error("not find usable page!")
    }

    if (url.length) {
      //如果存在值
      if (!http.test(url) && !https.test(url)) {
        if (url.match(www) || secondary.test(url)) {
          url = "http://" + url;
        } else {
          url = "https://www.baidu.com/s?cl=3&wd=" + url;
        }
      }
    }
    currentPage.url = url
    console.log('currentPage',currentPage,`${currentPage.id}-jump-url`)
    ipcRenderer.send(`${currentPage.id}-jump-url`, url)
  }

/**
 * @description 注册拖拽辅助线
 */
function registerDragLine() {
  nextTick().then(() => {
    let box = document.getElementById("codeControl");
    let line = document.getElementById("line");
    let mainCotrol = document.getElementById("mainCotrol");
    if (box != null && line != null && mainCotrol != null) {
      dargLine(box, line, mainCotrol);
    }
  });
}

/**
 * @description 可拖拽的线传入box对象，和线以及父对象。
 *  这个比较特殊，webview会阻挡onmousemove事件传递
 *  拖拽线快速往右会变宽是因为webview标签刷新太慢导致，背部div底色漏出,目前没有很好的办法嫩解决。
 *  已改为中转的方案，拖拽线松手后，在变更宽度,降低频率。
 */
function dargLine(
  box: HTMLElement,
  line: HTMLElement,
  parent: HTMLElement,
  min_size: number = 250
) {
  // 目前的box为代码编辑框
  var cover = document.getElementById("webviewCover") as HTMLElement; // webview 蒙层
  line.onmousedown = function (ev) {
    // 呼起遮罩层
    let coverWidth = parent.offsetWidth - box.offsetWidth; // 遮罩的宽度为父宽度-代码编辑框的宽度
    cover.style.width = `${coverWidth}px`;
    var iEvent = ev || event;
    // @ts-ignore
    var dx = iEvent.clientX; //当你第一次单击的时候，存储x轴的坐标。
    var dw = box.offsetWidth; //存储默认的div的宽度。
    line.style.position = "absolute"; // fix debug时宽度问题
    parent.onmousemove = function (ev) {
      var iEvent = ev || event;
      // @ts-ignore
      var mouseX = iEvent.clientX;
      if (mouseX < 350) {
        return;
      }
      const boxWidth = dw - (mouseX - dx); // 修改后box的宽度
      line.style.right = boxWidth + "px"; //disright表示盒子右边框距离左边的距
    };
    parent.onmouseup = function (e) {
      const boxWidth = parent.offsetWidth - line.offsetLeft - 4; // 4为拖拽线的宽度
      if (boxWidth < min_size) {
        //  代码框有最小限制
        plugs.value.codeIde.visible = false;
        box.style.width = `${min_size}px`; // 关闭后再开,为最小尺寸
        line.style.right = `${min_size}px`;
        if (cover != null) {
          cover.style.width = `${parent.offsetWidth}px`;
        }
      } else {
        plugs.value.codeIde.visible = true;
        box.style.width = boxWidth + "px"; //disright表示盒子右边框距离左边的距离，disright-当前的盒子宽度，就是当前盒子距离左边的距离
      }
      cover.style.width = "0px"; // 关闭遮罩
      parent.onmousedown = null;
      parent.onmousemove = null;
      line.style.position = "initial";
    };
  };
}

function init() {
  // 初始化先注册ipc
  // writeCode
  registerIpc(ipcRenderer);
  plugManager.register({
    name: "codeIde",
    call: (func: string, args: any[]) => {
      switch(func){
        case 'writeCode':
          const [text,after] = args
          writeCommand(text,after)
          break
        case 'fixCode':
          console.log('fixCode',args)
          const [oldText,newText] = args
          fixCommand(oldText,newText)
          break
        // case 'bindSignal':
          // bindSignal(data)
          // break
      }
    },
})
  // 注册插件事件
  ipcRenderer.on('plugs', (msg:{name:string,func:string,args:any[]})=>{
    console.log("收到的内容",msg)
    const {name,func,args} = msg
    try {
      const plug = plugManager.get(name)
      plug?.call(func,args)
    } catch (error) {
      console.error(`err: 无效的插件${name}或方法${func}`, error);
    }
  })
}

// 这种插件注册时有问题的，后续会优化
function writeCommand(text:string, after:boolean = false) {
  codeIde.value?.write(text,after)
}

function fixCommand(oldText:string, newText:string) {
  codeIde.value?.fix(oldText, newText)
}

// function bindSignal(data:any) {
//   codeIde.value?.bindSignal(data)
// }

function test() {
  console.log("test", browerPages.value);
}

function registerIpc(ipc: any) {
  ipc.on("write-code", (command: any) => {
    writeCommand(command);
  })

  ipc.on("close-webviews", (command: any) => {
    const webviews = document.querySelectorAll('webview')
    webviews.forEach((webview)=>{
      //  @ts-ignore
      (webview as Electron.WebviewTag).executeJavaScript(`window.close()`)
    })
    // setTimeout(() => {
    //   ipcRenderer.send('close-browser')
    // }, 1000)
  })

  ipc.on(
    "page-create",
    async (page: { webviewId: string; url: string; headless: boolean,preload?:string,useragent?:string, showHeadless:boolean}) => {
      // 创建动态属性,并将它给与page对象,来帮助我们再class中动态更新视图
      console.log('page-create',page)
      const pagePorxy: PageOptions = reactive({
        id: page.webviewId,
        showHeadless:page.showHeadless,
        headless: page.headless,
        show_url: page.url,
        url: page.url,
        visible: page.headless === true ? false : true,
        title: "",
        preload: page.preload,
        useragent: page.useragent
      });

      const _page = new Page(page.url, pagePorxy);
    
      browerPages.value.push(pagePorxy);
      await nextTick();
      if (!pagePorxy.headless) {
        // 无痕页面不切换
        changePage(pagePorxy);
      }
      _page.bindWebview();
    }
  );
}

function openPageDebug() {
  window && window['electron'].browserWindow.openDevTools()
  browerPages.value.map((page) => {
    if (page.webview ) {
      // ready before don't open dev
      page.webview.openDevTools();
    }
  });
}

function getCurrentPage(): Page | any {
  return browerPages.value.find((page) => {
    return page.visible === true;
  });
}

function changePage(page: PageOptions) {
  if(page.visible === false) {
    ipcRenderer.send('change-tap', page.show_url)
  }
  console.log('changePage',page)
  browerPages.value.map((page) => (page.visible = false))
  page.visible = true;
  // tab修改时需要触发事件
}

function pageRefash() {}

/**
 * @description 显示code插件
 */
async function showCode() {
  let codeControl = document.getElementById('codeControl')
  if (codeControl == null || codeControl.offsetWidth < 1) {
    plugs.value.codeIde.visible = true;
  } else {
    plugs.value.codeIde.visible = false;
  }
}

/**
 * @method 关闭页面
 */
function closePage(pageId: string) {
  console.log(pageId, browerPages.value);
  let del_index = browerPages.value.findIndex((page) => {
    return page.id == pageId;
  });
  if (del_index != -1) {
    browerPages.value.splice(del_index, 1);
    //  删除后,自动显示前一个网页
    if (del_index - 1 > -1) {
      const page = browerPages.value[del_index - 1];
      page.visible = true;
    }
  }
}

function addEmptyTab() {}

function closeBrowser() {
  const msg = "正在放弃录制? \n请确认!";
  if (confirm(msg) == true) {
    // 执行关闭
    window.close()
  }
}

function minimize() {
   window && window['electron'].browserWindow.minimize()
}

function maximize() {
  window && window['electron'].browserWindow.maximize()

}

defineExpose({
  getScript,
  getCurrentPage,
  writeCommand,
  script: plugs.value.codeIde.script
});
</script>

<style rel="stylesheet/scss" lang="css" scoped>
@import "./main.css";
</style>