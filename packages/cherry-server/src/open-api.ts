/**
 * 提供开放的方法，共协议包装
 */
import { getValidPort } from './utils'
import { RunConfig, RequestSource } from './typeApi'
import DnsAnalysisServer from './dnsServer'
import {live as _live,apiLive as _apiLive, run as _run} from '@cherry-jd/core/lib/cli/export'
import ip from "ip"
import { env } from 'process'
const {version} = require('../../package.json')

/**
 * @method 执行脚本
 * @param config 运行配置
 * @param callback 结果回调
 */
export async function run(config: RunConfig, callback?: Function): Promise<void> {
    const hosts = new Map(Object.entries(config.hosts || ''))
    const dnsPort = await getValidPort()
    const dnsServer =  hosts.size !== 0 && DnsAnalysisServer(dnsPort, hosts) || undefined
    const browser = !config.browser ? 'chromium' : config.browser
    // 异步上报
    const remoteReport = config.remoteReport && config.remoteReport.result
    console.log('remoteReport',remoteReport)
    if (remoteReport !== void 0) {
        callback ? callback({ msg: 'Please wait a moment, Results sent asynchronously!', serverIp: ip.address() }) : ''
    }

    console.log("env:", env.loacl_cheryy_browser)
    if ( env.loacl_cheryy_browser ) {
        config.executablePath = env.loacl_cheryy_browser
        console.log("use local browser:", config.executablePath)
    }

    const optins = {
        // 如果传递执行路径则使用传递的，没传递则尝试获取原生
        cookies:config.cookies || [],
        executablePath: config.executablePath,
        audio: config.audio ,
        browser,
        headless:config.headless,
        remoteReport: config.remoteReport,
        hosts: config.hosts,
        storage: config.storage,
        proxy:  dnsServer !== undefined  ? {server: `http://127.0.0.1:${dnsPort}`} : undefined,
        screen: (global as any).screen
    }
    let result
    try {
        let _callback:Function|undefined = undefined
        if(config.requestSource == RequestSource.ws){
            _callback = callback
        }
        result = await _run(config.script, optins, _callback)
    }catch (err) {
        console.log("err80", err)
    }
    finally {
        if(dnsServer) await dnsServer.close(true)
        // 远程报告已在core中实现
        if (remoteReport === void 0 && callback) callback(result);
    }
    console.log('run filish~')
}

export function getVersion() {
    return {version,"success":true}
}

export function ping(callback: Function): void {
    callback()
}

export function exit(callback: Function): void {
    callback()
    process.exit()
}