/**
 * publish file on  cherry-driver-socket
 * zh:
 *    公用类型文件，在所有api模块中统一
 */

/**
 * 浏览器运行模式
 */
 export enum modeType {
    nil, execute, record, auxiliary
}

export enum RequestSource {ws,http}

/**
 * 运行参数
 */
 export type RunConfig = {
    requestSource: RequestSource // 来源区分http和ws请求
    browser?: string // 浏览器
    script: string
    executablePath?:string
    storage?: any
    cookies: any[] | {url:string,data:string} ,
    hosts:Map<string, string>
    remoteReport: {
        result: string
        image: string
        log:string
    }
}

/**
 * 录制参数
 */
export type LiveConfig = {
    url?:string
    executablePath?:string
    compatibility?:boolean // 兼容模式默认为false，兼容采用chrome录制
    storage?: any
    device?:string
    auxiliaryVerify : boolean,
    cookies: any[],
    showAuxiliary?: boolean // 显示辅助浏览器
}