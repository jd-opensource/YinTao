import {
  BrowserWindow,
  ipcMain,
  nativeImage
} from "electron";
const { autoUpdater } = require('electron-updater'); // 引入自动更新模块
const feedUrl = 'http://storage.jd.local/public-ns/cherry/'; // 更新包位置
var updateWin:BrowserWindow
autoUpdater.autoDownload = false

// 主进程主动发送消息给渲染进程函数
function sendUpdateMessage(message, data) {
  console.log({ message, data });
  (updateWin as BrowserWindow).webContents.send('message', { message, data });
}

// 自动更新
function checkAndUpload() {
  // 配置安装包远端服务器
  autoUpdater.setFeedURL(feedUrl);
  // 下面是自动更新的整个生命周期所发生的事件
  autoUpdater.on('error', function(message) {
      sendUpdateMessage('error', message.error);
  });
  //检查更新
  autoUpdater.on('checking-for-update', function(message) {
      sendUpdateMessage('checking-for-update', message);
  });

  // // 本地开发环境，改变app-update.yml地址
  // if (process.env.NODE_ENV === 'development' && !isMac) {
  //   autoUpdater.updateConfigPath = path.join(__dirname,'win-unpacked/resources/app-update.yml')
  // }

  //有更新
  autoUpdater.on('update-available', function(message) {
      sendUpdateMessage('update-available', message);
  });
  //无更新
  autoUpdater.on('update-not-available', function(message) {
      sendUpdateMessage('update-not-available', message);
  });
  // 更新下载进度事件
  autoUpdater.on('download-progress', function(progressObj) {
      sendUpdateMessage('downloadProgress', progressObj);
  });
  // 更新下载完成事件
  autoUpdater.on('update-downloaded', function(event, releaseNotes, releaseName, releaseDate, updateUrl, quitAndUpdate) {
      sendUpdateMessage('isUpdateNow',event);
      ipcMain.on('updateNow', (e, arg) => {
          autoUpdater.quitAndInstall();
      });
  });
  ipcMain.on('updateNow', (e, arg) => {
    autoUpdater.downloadUpdate()
  });
  //执行自动更新检查
  autoUpdater.checkForUpdates();
}

export function checkForUpdates(){
  updateWin = new BrowserWindow({
    width: 400,
    height: 230,
    autoHideMenuBar:true,
    backgroundColor: "#fff",
    title: 'update',
    icon: nativeImage.createFromPath('./strawberry.ico'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation:false,
      // enableRemoteModule: true,
      javascript: true,
      webSecurity: false,
    }
  });
  const site = `http://127.0.0.1:8777/#/update/`

  updateWin.loadURL(site).then(()=>{
    checkAndUpload();
  })

  // updateWin.webContents.openDevTools()
}

exports.checkForUpdates = checkForUpdates
