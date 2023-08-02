/**
 * 提供与cherry桥接的ws库,共平台浏览器使用
 * 使用指南: copy file to your project utils
 * author: zhouyuan63
 * 注意事项: 在提供函数式调用时，我们需要一个唯一id, 提供在storage中，在内部我们使用__uid.
 * example: 
 *  const cherrylink = new CherryLink();
 *  cherrylink.run(config)
 */

 export interface LiveConfig {
  url?: string
  storage: any
  executablePath?: string
  auxiliaryVerify: boolean
  showAuxiliary?: boolean // 显示辅助浏览器
}

export interface RunConfig {
  browser?: string
  script: string
  executablePath?: string
  storage: any
  hosts?: Map<string, string>
  remoteReport?: {
      result: string
      image: string
      log: string
  }
}

export class CherryLink {
  private link: string
  socket: WebSocket
  private _uid: number // 动态id,调用后递增
  constructor(addr = 'ws://127.0.0.1', port = 8888) {
      this.link = `${addr}:${port}`
      this.socket = new WebSocket(this.link)
      this._uid = 0
  }

  /**
   * @method uid 采用随机数和自增键值对组合,足以保证本地化的唯一性
   */
  private get uid(): string {
      return this.raudom7() + this._uid++
  }

  async check(): Promise<boolean> {
      let resulet = false
      if (this.socket.readyState === 1) {
          // 检查连接
          return true
      }

      if ((await this.__installed()) === false) {
          console.log('未安装引擎,请手动安装cherry引擎')
          throw new Error('Not installed')
      }

      return resulet
  }

  private async __installed(): Promise<boolean> {
      let env = globalThis === window ? 'browser' : 'node'
      console.log('cherry-socket env', env)
      if (env === 'node') {
          console.log('node环境中无法检测cherry安装')
          return false
      }
      let urlProtocol = 'cherry://open'
      return new Promise((res) => {
          let target = document.createElement('input')
          target.style.width = '0'
          target.style.height = '0'
          target.style.position = 'fixed'
          target.style.top = '0'
          target.style.left = '0'
          document.body.appendChild(target)
          target.focus()

          let handler = this._registerEvent(target, 'blur', onBlur)
          function onBlur() {
              res(true)
              handler.remove()
              clearTimeout(timeout)
              document.body.removeChild(target)
          }
          //will trigger onblur
          window.location.href = urlProtocol
          // Note: timeout could vary as per the browser version, have a higher value
          // eslint-disable-next-line no-var
          var timeout = setTimeout(function () {
              res(false)
              handler.remove()
              document.body.removeChild(target)
          }, 1000)
      })
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  _registerEvent(target: any, eventType: string, cb: any) {
      if (target.addEventListener) {
          target.addEventListener(eventType, cb)
          return {
              remove: function () {
                  target.removeEventListener(eventType, cb)
              }
          }
      } else {
          target.attachEvent(eventType, cb)
          return {
              remove: function () {
                  target.detachEvent(eventType, cb)
              }
          }
      }
  }

  public async live(config: LiveConfig): Promise<any> {
      return new Promise((resolve) => {
          this.check().then((result) => {
              if (result === true) {
                  resolve(
                      this.onRecv({
                          api: 'live',
                          config
                      })
                  )
              }
          })
      })
  }

  private async onRecv(action: { api: string; config: { storage: any } }) {
      return new Promise((resolve) => {
          const call_uid = this.uid
          action.config.storage = action.config.storage || {}
          action.config.storage = {
              ...action.config.storage,
              __uid: call_uid
          }
          const onCall = (msg: any) => {
              const result = JSON.parse(msg.data)
              if (result.storage && result.storage.__uid === call_uid) {
                  this.socket.removeEventListener('message', onCall)
                  delete result.storage.__uid // 删除内部标识
                  resolve(JSON.stringify(result))
              }
          }
          this.socket.addEventListener('message', onCall)
          this.socket.send(JSON.stringify(action))
      })
  }

  public async run(config: RunConfig): Promise<any> {
      return new Promise((resolve) => {
          this.check().then((result) => {
              if (result === true) {
                  resolve(
                      this.onRecv({
                          api: 'run',
                          config
                      })
                  )
              }
          })
      })
  }

  public async ping(): Promise<void> {
      new Promise((resolve) => {
          resolve(
              this.onRecv({
                  api: 'ping',
                  config: {
                      storage: {}
                  }
              })
          )
      })
  }

  public async exit(): Promise<void> {
      new Promise((resolve) => {
          resolve(
              this.onRecv({
                  api: 'exit',
                  config: {
                      storage: {}
                  }
              })
          )
      })
  }

  /**
   * @returns 返回7位随机字符
   */
  private raudom7(): string {
      let str = 'qwertyuiopasdfghjklmnbvcxz1234567890'
      function getRandomNum(lbound: number, ubound: number) {
          return Math.floor(Math.random() * (ubound - lbound)) + lbound
      }
      let s = str.split('')
      let t = ''
      for (let i = 0; i < 7; i++) {
          t += s[getRandomNum(1, 36)]
      }
      return t
  }
}
