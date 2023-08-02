import { RequestSource, RunConfig } from '../typeApi'
import { run, ping } from '../open-api'

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
   * @method 运行脚本,需要先新建一个独立浏览器,这时候无法获取到url,但是需要先开浏览器,然后通过运行后续命令打开目标页面
   */
  static runScript(req, res, next) :void {
    const args: RunConfig = req.body
    if( req.headers['content-type'] !== 'application/json'){
      return res.json({
        code: 402,
        msg:`Incorrect request type, miss type by: ${req.headers['content-type']}, just use application/json!`
      })
    }
    console.log('runScript args:', JSON.stringify(args),"执行时间:",getCurrentTime())
    args.requestSource = RequestSource.http
    run(args,function(result){
      result.storage = args.storage
      res.json(result)
    })
  }

  static ping(req, res, next) :void {
    ping(function() {
      res.json({ok:1})
    })
  }
}