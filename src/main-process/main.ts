import { WSControlServer } from './websocket/server'
import {startHttpControlServer} from './httpServer/server'
import { registerIpcMain } from './utils/ipc'
import { defaultConfig } from '../const/const'
import { registerTray } from './tray/tray'
import ArgumentParser from './utils/argument-parser'
import { app, screen,crashReporter} from 'electron'
/**
 * this can jump testcafe iframe not inject preload.js bug!
 */
const PROTOCOL = 'cherry'
app.setAsDefaultProtocolClient(PROTOCOL); // server rouse

// server 逻辑应该都拆给cherry-server, 但由于目前live基于 electron所以无法拆分干净
/** 主逻辑入口 */
(async function start() {
  // 防止主进程堵塞
  process.on('uncaughtException',(e)=>{
    console.log('uncaughtException',e)
  })

  if(process.platform === 'linux'){ // 设置奔溃报告位置
      app.setPath('crashDumps', '/export/App')
  }
  // https://www.electronjs.org/docs/latest/api/crash-reporter 奔溃文档
  crashReporter.start({uploadToServer:false}) // 增加奔溃监控报告

  parseArgv()
  console.log('platform:',process.platform)
  const arg = new ArgumentParser(process.argv)
  arg.apple(defaultConfig)
  // 注册ipcMain
  registerIpcMain()
  // 启动服务
  startHttpControlServer(defaultConfig.HttpPort)
  if(!defaultConfig.DisableWS) WSControlServer(8888)
})()

function parseArgv() {
  const argv = process.argv
  for(let arg of argv){
    if(arg.includes('httpPort')){
      let [,value] = arg.split(',')
      defaultConfig.HttpPort = Number(value)
    }
  }
}

// 辅助程序挂载,非逻辑内容
app.whenReady().then(() => {
    registerTray()
    let {width,height} = screen.getPrimaryDisplay().workAreaSize;
    (global as any).screen = {width,height}
})
app.on('window-all-closed', () => {});

// doc: https://www.electronjs.org/zh/docs/latest/api/app#%E4%BA%8B%E4%BB%B6-continue-activity-macos  
app.on('child-process-gone',(event,details)=>{
  let {name,reason} = details
  console.log(`子进程${name}奔溃原因为:${reason}`)
})

process.on('SIGTERM', (e) => {
  console.log('cherry next error: exit', e)
  app.quit()
})