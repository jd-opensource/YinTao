import { Debugger, webContents } from "electron";

/**
 * @method 按selector获取页面元素的node节点
 * @param {*} selector 查找的元素标识
 * @param {*} fromNodeId 如果传入则从此父id往下找
 */
export  async function querySelector(selector: string, iframeId:string, fromNodeId: null | string = null) {
    var root
    if (fromNodeId === null) {
      root = (await getDocument()).root;
      fromNodeId = root.nodeId;
    }
    // todo: iframe 段上传可能存在问题,但目前没有测试场景支撑
    fromNodeId = iframeId ? await getIframe(root, selector) : fromNodeId
    let _nodeId = await getAttachDebugger().sendCommand('DOM.querySelector', { selector, nodeId: fromNodeId }).catch(e=>{
        console.error('DOM.querySelector error:' + e)
    })
    return _nodeId
  }

  /**
 * @method 获取页面根元素节点
 */
export async function getDocument () {
    return  await getAttachDebugger().sendCommand('DOM.getDocument', {pierce: true, depth: 999})
  }


  /**
 * @method 获取调试附加器,失败则返回null,这里可能会报错，但目前没有能力处理
 */
export function getAttachDebugger(): Debugger {
    const wc = webContents.getFocusedWebContents()
    if (!wc.debugger.isAttached()) wc.debugger.attach("1.1");
    const attach = wc.debugger;
    return attach
  }


  async function getIframe(node: any, selector: string): Promise<string> {
    // 尝试后去原始页面所有的iframe
    if (node.nodeName === 'HEAD' || !node.children) return ''
    if (node.nodeName === "IFRAME" || node.nodeName === 'FRAME') {
      if (typeof selector === 'string') {   // 这里取id标识，从#id -> id
        /**
        * 由于上传文件基本上多个iframe也不大会冲突，所以临时只简单在内部判断一下，
        * 如果一个页面多个iframe都有上传文件，切没id区分将会导致上传错误，
        * 当前目前没找到很好的解决办法，除非升级版本后可以通过mianfrom来获取nodeid。
        * 
        *  */
        const selectorParams = () => { return { nodeId: node.contentDocument?.nodeId, selector: selector } };
        const domRes = await getAttachDebugger().sendCommand("DOM.querySelector", selectorParams())
        if (domRes.nodeId !== 0) { // 找到了
          console.log('成功获取上传对象', domRes, node, 'src:', node.attributes[1], 'selector:', selector)
          return node.contentDocument?.nodeId
        }
        //  在子集里面继续找
        return await getIframe(node.contentDocument, selector)
      }
    } else {
      for (let i = 0; i < node.children.length; i++) {
        const argument = node.children[i];
        const res = await getIframe(argument, selector)
        if (res) {
          return res
        }
      }
    }
    return ''
  }
  