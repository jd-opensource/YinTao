/**
 * 需要保持单例模式
 */

export interface DefaultConfig {
    ScriptsPath: string // 零时脚步文件存储路径
    HttpPort: number
    DisableWS: boolean // 禁止ws服务
}

export const defaultConfig: DefaultConfig = {
    ScriptsPath: '',
    HttpPort: 8777,
    DisableWS: false
}

export default defaultConfig