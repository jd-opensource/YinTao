
import { clipboard } from 'electron'

/**
 * @method 适用于平台化建设过度
 */
export function pasteConfig(options:any) {
    // hosts, compatibility 
    const text = clipboard.readText()
    try {
       const config = JSON.parse(text)
       console.log("执行使用了粘贴板配置:", text)
       config.scipt = undefined  // 粘贴板禁止带入脚本内容 
       console.log('get pasteConfig', Object.assign(options, config))
       return  Object.assign(options, config)
    } catch (error) {
        // console.log('pasteConfig error', error)
        return options
    }
}

