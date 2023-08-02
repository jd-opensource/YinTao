import { BrowserWindow, dialog, ipcMain, webContents } from 'electron'
import { querySelector } from './bugger'
import path from 'path'
import os from 'os'
import { writeFile } from 'original-fs'

export function registerIpcMain() :void {
    // 阻止页面内部弹窗
    ipcMain.handle('webContents-fromId', (e, id) => {
        const wc = webContents.fromId(id)
        wc.on('new-window', (event) => {
            event.preventDefault()
        })
        return true
    })

    // 窗口最小化
    ipcMain.handle('window-minimize', (e) => {
        const win = BrowserWindow.getFocusedWindow()
        if (!win?.isMinimized()) {
            win?.minimize()
        }
        return true
    })

    // 开启调试
    ipcMain.handle('open-dev-tools', (e) => {
        const contents = BrowserWindow.getFocusedWindow()?.webContents
        if (!contents?.isDevToolsOpened()) {
            contents?.openDevTools()
        }
        return true
    })

    ipcMain.handle('captureScreenshot',async (e,clip:any) => {
        console.log('captureScreenshot')
        const wc = webContents.getFocusedWebContents()
        try {
            wc.debugger.detach()
            wc.debugger.attach('1.1')
           
            console.log('args:',JSON.stringify(clip))
            return await wc.debugger.sendCommand('Page.captureScreenshot',{
                format:'jpeg',
                quality:100,
                clip,
            }).then((res: any) => {
                console.log('截图成功!')
                wc.debugger.detach();
                // 截图保存在本地
                const imgPath = path.resolve(os.tmpdir(),`__cherry_captureScreenshot_${new Date().getTime()}.jpg`)
                writeFile(imgPath,new Buffer(res.data, 'base64'),()=>{
                    console.log('文件写入成功:',imgPath)
                })
                return imgPath
              }).catch(err => {
                console.error('captureScreenshot failed: ' + err)
              })
        } catch (error) {
            console.log('captureScreenshot error:',error)
            return false
        }
    })

    ipcMain.handle('dom-upload', async (e,selector,files,ifrmae=null) => {
        console.log('dom-upload args32:',selector,files,ifrmae)
        const wc = webContents.getFocusedWebContents()
        try {
            wc.debugger.detach()
            wc.debugger.attach('1.1')
            let attachParams = (res: any) => {
                return { nodeId: res.nodeId, files }
              };
            const searchId = (await querySelector(selector,ifrmae)).nodeId // await getIframe(docRes.root, selector)
            console.log('文件上传获取到的searchId', searchId)
            await wc.debugger.sendCommand('DOM.setFileInputFiles', attachParams({ nodeId: searchId })).then((err: any) => {
                console.log('上传成功')
                wc.debugger.detach();
                err && err.code ? console.log(err.toString()) : ''
              }).catch(err => {
                console.error('file upload failed: ' + err)
              })
            return true
            
        } catch (error) {
            console.log('dom-upload error:',error)
            return false
        }
    })

    // 修改上传窗口,以获取文件路径
    ipcMain.handle('system-dialog', (e: any, accept: string, webkitdirectory: boolean = false) => {
        console.log('systemdialog', typeof accept, accept)
        let properties
        let extensions = ['*']
        if (webkitdirectory) {
            properties = ['openFile', 'openDirectory']
        }

        if (typeof accept === 'string') {
            if (accept.indexOf('image/*') > -1) {
                extensions = ['jpg', 'png', 'gif']
            }
        }
        const selectPath = dialog.showOpenDialogSync({
            filters: [
                {
                    name: 'select',
                    extensions
                },
                {
                    name: 'All Files',
                    extensions: ['*']
                }
            ],
            properties
        })
        return selectPath
    })
}