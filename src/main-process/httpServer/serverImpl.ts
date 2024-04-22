import { LiveConfig, RequestSource, RunConfig } from '../typeApi'
import { live, ping, exit, getBrowserList,getVersion, run } from '../open-api'
import path from 'path'
import axios from 'axios'

export interface PagePaginationInfe { // 分页
  current: number
  limit: number
}

/**
 * @method 获取当前时间
 */
function getCurrentTime() :string{
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  const formattedDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  return formattedDate
}

export class serviceImpl {
   /**
   * @method 录制脚本，关闭后返回脚本内容
   */
  static liveScript(req, res, next) :void {
    // 仅获取数据不做多余的处理，处理应放置在live中通一进行以保障live拆分的纯度
    if( req.headers['content-type'] !== 'application/json'){
      return res.json({
        code: 402,
        msg:'Incorrect request type!'
      })
    }
    const args: LiveConfig = req.body
    console.log('liveScript args:', JSON.stringify(args))
    live(args,function(result) :void {
      result.storage = args.storage
      res.json(result)
    })
  }

   /**
   * @method 获取可用的浏览器
   */
  static getBrowsers(req, res, next) :void {
    getBrowserList(function(result) {
      res.json(result)
    })
  }

  static exit(req, res, next) :void {
    exit(function() {
      res.json({ok:1})
    })
  }

  static errorImage(req, res, next) :void {
    console.log("Request for errorimage received.");
    res.sendFile("/tmp/cherry_auto.jpeg");
  }

  static ping(req, res, next) :void {
    ping(function() {
      res.json({ok:1})
    })
  }

  /**
   * @method 获取版本号er
   */
  static version(req,res,next) :void {
    res.json(getVersion())
  }

  static releaseLog(req,res,next):void{
    axios.get('http://storage.jd.local/public-ns/cherry/package.json')
    .then(response => {
      res.json({
        version:response.data.version,
        desc:response.data.description
      })
    })
    .catch(error => console.log('error:',error))
  }
}