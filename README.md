# YinTao

<div align=center><img width="150" height="150" src="https://yintao.jd.com/icon.png"/></div>

<p align="center">
<a href="#"><img alt="Tests" src="https://badgen.net/badge/webUi/auto/blue?icon=test"></a>
<a href="#"><img alt="Test Dependencies" src="https://badgen.net/badge/webUi/auto/red?icon=github" /></a>
<a href="#"><img alt="NPM Version" src="https://badgen.net/badge/npm/8.19.3/yellow" style="max-width:100%;"></a>
<a href="#"><img alt="NPM Version" src="https://badgen.net/badge/license/MIT/blue" style="max-width:100%;"></a>
</p>

<div align=center>
    <i>用于web、h5自动化测试,
    </br>使用js编写测试并动态执行.</i>
</div>
<br/>

新一代ui自动化引擎，基于`playwright` 进行上层应用搭建, 
提供智能录制，快速、远程执行等完备的自动化体验，易于第三方混合调用执行。

* **适用于所有流行环境:** `YinTao` 可以在 `Windows`、`MacOS` 和 `Linux` 上运行。它支持桌面、移动、远程和云浏览器（UI 或无头）。
* **简单智能录制:** 内置智能识别录制策略，99%的网页功能交互都可在操作中自动生成并稳定回放，提供`GUI`界面轻松增加自定义断言。

* **免费和开源:** `YinTao`在`Apache License 许可`下使用。

## 立即体验
[YinTao预览版 在线体验](https://renranbk.gitee.io/cherry-preview)
## 目录

* [为什么是YinTao](#why)

* [快速入门](#fastStart)

* [使用文档](#doc)

* [参与贡献](#contribution)

* [合作伙伴](#cooperation)

* [保持联系](#contact)


##  <span id="v2">V2版本有那些变化</span>

1. 使用tarui编译运行启动速度更快,打包体积更小.
2. 去除electron自研录制逻辑，拥抱chrome生态录制。

##  <span id="why">为什么是YinTao</span>
聊到ui自动化框架,绕不开`selenium`, `selenium` 基于`webdriver` 提供编程式自动化操作体验,同时也存在一些问题。运行缓慢、稳定性差、`driver`版本众多
需与浏览器版本适配，造成了使用门槛过高。

而 `cypress` 、`testcafe` 等采用`e2e`方案实现的自动化框架。
这些框架运行速度更快、脚本设计更简洁、社区更为活跃，但使用方式仍以脚本开发为主
提供的录制功能，易用性较差，需要一定的编程经验。

与之相对 `YinTao` 将提供更轻松、灵活的自动化体验，`YinTao` 内部继承了初代`YinTao-driver` 中的智能录制模式,轻松录制生成复杂脚本。通过融合`testcafe` + `cypress` 执行逻辑构建 [YinTao-core](https://coding.jd.com/YinTao/YinTao-core/) 核心执行引擎,提供多终端稳定运行能力。

`YinTao` 不再以框架的形式提供服务, 而是提供C端一体化自动化工具，用户可以轻松的通过它提供的`web api`,体验一站式，轻量极简的全新更具现代化的交互体验。
 

## <span id="fastStart">快速入门</span>
 [快速入门](https://yintao.jd.com)

### <span id="installed">安装</span>
 我们提供最简洁的安装方式,请参阅[安装文档](https://yintao.jd.com/guide/introduce/download.html)

### <span id="run">运行</span>
双击`icon`<img alt="NPM Version" src="https://yintao.jd.com/icon.png" style="width:25px;vertical-align: bottom;" />运行



## <span id="doc">使用文档</span>
我们知道好的工具需要配套通俗易懂的用户文档。

它就在这里[YinTao使用文档](https://yintao.jd.com/guide/introduce/introduce.html)

我们希望提供足够友好的示例,让用户使用起来更加省心,因此我们需要更多不同的用户视角用例。
文档采用代码动态更新机制，我们将积极的邀请用户一同前来完善它。

## 2023路线图
  - 剔除electron转pkg + tauri,降低包依赖大小，提升启动速度(进行中) 
  - dockerfile 一键部署环境. (待进行)
  - 使用chrome重写录制逻辑。(待进行)
  - 执行浏览器监控管理页面.(待进行)


## <span id="contribution">参与贡献</span> 
  我们欢迎任何人,任何程度的贡献。
  
  如果你喜欢这个项目,并想要做点什么,请参阅[贡献文档](https://github.com/jd-opensource/YinTao/blob/main/CONTRIBUTING.md)

## <span id="contact">保持联系</span> 

*email:* zhouyuan11@jd.com 

## 合作伙伴  <span id="cooperation"> 
  他们都在使用`YinTao`, 如果你也是请联系我们!
  
![UiTest](http://storage.jd.com/jacp.plugins/app_store/icons/1634130778922_1.png)
![DeepTest](http://storage.jd.com/jacp.plugins/app_store/icons/1631874599689_256图标4.png)

## help:

zhouyuan11@jd.com
