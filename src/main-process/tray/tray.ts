import { Tray, app, Menu } from 'electron'
import { checkForUpdates } from '../update/update'
import path from 'path'

const {version} = require('../../../package.json')
var tray:Tray

/**
 * @method 注册系统托盘
 */
export function registerTray() {
  const iconPath = path.join(__dirname, '../../assets/cherry_tray.png') 
  tray = new Tray(iconPath)
  const contextMenu = Menu.buildFromTemplate([
<<<<<<< HEAD
    // { label: '检测更新', click: () => {
    //   checkForUpdates()
    // }},
=======
    { label: '检测更新', click: () => {
      checkForUpdates()
    }},
>>>>>>> 85b4e57 (自动更新)
    { label: '退出', click: () => {
      app.exit()
    }},
  ])
<<<<<<< HEAD
  tray.setToolTip('YinTao- ' + version)
=======
  tray.setToolTip('Cherry ' + version)
>>>>>>> 85b4e57 (自动更新)
  tray.setContextMenu(contextMenu)
}

exports.registerTray = registerTray