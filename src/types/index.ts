/**
 * 存放node和es 公用的类型文件
 */

export interface CherryBrowserOptions {
    mode?: BrowserMode;
    headless?: boolean
    timeout?: number
}

export enum BrowserMode { run, live }

