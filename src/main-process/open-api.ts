/**
 * 提供开放的方法，共协议包装
 */
import { RunConfig, LiveConfig, RequestSource } from './typeApi'
import { app } from 'electron'
import { nanoid } from 'nanoid'
import axios from 'axios'
import path from 'path'
import fs from 'fs'
import {live as _live,apiLive as _apiLive} from '@cherry-jd/core/lib/cli/export'
import {live as el_live} from './live'
import { pasteConfig } from './utils/pasteConfig'
const {version} = require('../../package.json')
import {run as _run} from '@cherry-jd/cherry-server'

var ChromiumPath 
if(process.platform == 'win32') {
    ChromiumPath = './static/browsers/chromium-1001/chrome-win/chrome.exe'
}else{
    ChromiumPath = './static/browsers/chromium-1001/chrome-mac/Chromium.app/Contents/MacOS/Chromium'
}

const executablePath = path.resolve(app.getAppPath(), ChromiumPath)

/**
 * @method 录制脚本
 * @param config 配置信息
 * @param callback 录制结果回调
 */
export async function live(config: LiveConfig, callback: Function): Promise<void> {
    if(process.platform === 'linux'){
        return callback({msg: "Remote recording is not supported"})
    }
    config = config || {}
    config = pasteConfig(config)
    if(config.compatibility) { // 兼容模式
        config.auxiliaryVerify = Object.prototype.hasOwnProperty.call(config, 'auxiliaryVerify') ? config.auxiliaryVerify : true
        const _url = config.url || 'https://baidu.com'
        const optins = {
            executablePath: config.executablePath || executablePath
        }
        const script = await _live(_url,optins)
        console.log('script',script)
        callback({script,storage:config.storage})
    } else {
        // electron版: live
        const result = await el_live(config)
        callback({...result,storage:config.storage})
    }
}

/**
 * @method 录制接口
 * @param config 配置信息
 * @param callback 录制结果回调
 * @param url 打开浏览器时的地址，相当于homePage
 */
 export async function apiLive(url:string, config: LiveConfig, callback: Function,finishCallback:Function): Promise<void> {
    if(process.platform === 'linux'){
        return callback({msg: "Remote recording is not supported"})
    }
    config = config || {}
    config.auxiliaryVerify = Object.prototype.hasOwnProperty.call(config, 'auxiliaryVerify') ? config.auxiliaryVerify : true
    const executablePath = path.resolve(app.getAppPath(), ChromiumPath)
    const options = {
        // 如果传递执行路径则使用传递的，没传递则尝试获取原生
        executablePath: config.executablePath || executablePath,
        callback:callback
    }
    await _apiLive(url, options)
    finishCallback()
}

/**
 * todo: 目前需要保持两个执行脚本, 因server服务无法完全和cherry做切割，具体原因如下:
 * 1. live 接口目前依赖electron实现
 * 2. 如果拆分不干净则导致两边都有server依赖,将严重影响代码清洁
 * @method 执行脚本
 * @param config 运行配置
 * @param callback 结果回调
 */
export const run = _run

/**
 * @method 远程上报运行结果
 * @argument res 运行结果
 * @argument args 远程上报携带的参数
 */
async function sendRemoteReport(config: RunConfig, res: any, args?: any[]) {
    const addr = config.remoteReport && config.remoteReport.result
    res.storage = config.storage
    axios.post(addr, res, {
        headers: {
            'Content-Type': 'application/json'
        },
        timeout: 3000
    }).then(res => {
        if (res.status === 200) {
            console.log('运行结果,远程上报完成!')
        } else {
            console.log(`remoteReport error code:${res.status}`)
        }
    }).catch((e: Error) => {
        console.log(`remoteReport error code:${e.message}`)
    })
}

/**
 * @@method 获取本地浏览器列表
 */
export function getBrowserList(callback: Function): void {
    const browserProviderPool = require('@cherry-next/cherry-core/lib/browser/provider/pool')
    const providerName = 'locally-installed'
    browserProviderPool.getProvider(providerName).then((provider) => {
        provider.getBrowserList().then(browserNames => {
            console.log('browserNames222', browserNames)
            callback({ browsers: browserNames })
        })
    })
}

export function getVersion() {
    return {version,"success":true}
}

export function ping(callback: Function): void {
    callback()
}

export function exit(callback: Function): void {
    callback()
    app.exit()
}

/**
 * @method 截图上报
 */
function reportImages(config: RunConfig, result: any): void {
    if (config.remoteReport?.image) {
        const imgPaths = filterImages(result)
        __reportImages(imgPaths, config.remoteReport.image)
    }
}

/** 
 * @method 远程图片上报
 */
function __reportImages(files: string[], url: string): void {
    if (!files || files.length == 0) return
    for (let file of files) {
        let data = fs.readFileSync(file)
        const buffer = Buffer.from(data)
        let base64Img = `data:image/png;base64,` + buffer.toString('base64')
        if (!url || url == '') return
        const res = axios.post(
            url,
            {
                image: base64Img,
                name: nanoid(7) + '.png'
            },
            { timeout: 5000 }
        )
    }
}

/**
 * @method 过滤图片地址(忽略缩略图) 
 */
function filterImages(result: any): string[] {
    const imgPaths: string[] = []
    const { fixtures } = result
    for (let fixture of fixtures) {
        const { tests } = fixture
        for (let test of tests) {
            const { screenshotPath } = test
            if (screenshotPath == null) break;
            if (/(\.png)$/.test(screenshotPath)) {
                imgPaths.push(screenshotPath)
            } else { // images return dirPath
                const files = fs.readdirSync(screenshotPath)
                files.forEach(function (item, index) {
                    if (/(\.png)$/.test(item)) {
                        imgPaths.push(path.resolve(screenshotPath, item))
                    }
                })
            }
        }
    }
    return imgPaths
}