import { InjectedScript } from "./synthesisSelector/injectedScript"
import { generateSelector } from "./synthesisSelector/selectorGenerator"
import uniqueSelector from '@cypress/unique-selector'
import { parseSelector } from "./common/selectorParser"

export const __sleep = (ms:number) => new Promise((res) => setTimeout(res, ms))

export const argsToString = (args: any[]) => {
    let _str = ''
    for (let arg of args) {
        _str += JSON.stringify(arg) + ','
    }
    return _str.slice(0, _str.length - 1)
}

/**
* @method 通过元素获取xpath
*/
function getElementXPath(element: Element, ignoreId: boolean = false): string {
    if (ignoreId && element.id !== '') return `//*[@id="${element.id}"]`
    if (element === document.body) return element.tagName.toLowerCase()
    let ix = 0
    const siblings = element.parentElement?.children
    for (let i = 0; siblings != undefined && i < siblings.length; i++) {
        const sibling = siblings[i]
        if (sibling === element && element.parentElement != null) {
            return (
                `${getElementXPath(element.parentElement)
                }/${element.tagName.toLowerCase()
                }[${ix + 1
                }]`
            )
        }
        if (sibling.nodeType === 1 && sibling.tagName === element.tagName) ix++
    }
    return ''
}

/**
 * @method 将元素和xpath圈定范围绑定
 */
 export function getElementStyleFixXPath(xpath:string,element: Element): string {
    const iterate = document.evaluate(
      xpath,
      document,
      null,
      XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE,
      null
    );
    for (var index = 0; index < iterate.snapshotLength; index++) {
      let item = iterate.snapshotItem(index);
      if (element.contains(item)) {
        xpath = `(${xpath})[${index + 1}]`;
        break;
      }
    }
    return xpath;
  }

export function getElementSigns(targetElement: Element, injectedScript: InjectedScript) :string[] {
    const signs:string[] = []
    const addSign = (sign) => { if (sign) signs.push(sign) }
    // 首先通过plawwright方法获取
    const { selector } = generateSelector(injectedScript, targetElement, true)
    
    console.log('playwright selector:', selector)
    const {parts} = parseSelector(selector)
    // 放弃超字符虽然通用但并不完美，我们应该区分select 或 option ， 当select 触发是因避免text因为这不稳定，而option的text 是稳定且高效的
    // text 如果文本太多应该避免使用, 并不易于维护并且会减少编辑的可用率
    // 7 个字符以上不在使用它
    // 触发的元素本身 input text 应该避免使用 text定位，他们通常都不够问题。
    let used:any = undefined
    if (targetElement instanceof HTMLInputElement) {
        if(targetElement.type === 'text') {
            used = parts.find(part => {
                if (part.name == 'text') {
                    return part
                }
            })
        }
    }else {
        // 如果 点击元素 class 包含 el-select-dropdown__item ，则推荐使用text 因为通常很稳定，即使它超过长度限制
        used = parts.find(part => {
            if (part.name == 'text' && part.source.length > 7) {
                return part
            }
        })
    }
    if(used === undefined){
        addSign(selector)
    }
 
    // cypress selector
    addSign(uniqueSelector(targetElement))

    // 获取xpath
    addSign(getElementXPath(targetElement, true))
    addSign(getElementXPath(targetElement, false))

    console.log('get signs',targetElement,signs)
    return signs
}

/**
 * @method 通过sign获取目标元素
 */
export function getElementBySign(sign:string) : Element | undefined {
    const selector = parseSelector(sign)
    const _injectedScript = new InjectedScript(false, 1, 'chromium',true ,[]);
    const elements = _injectedScript.querySelectorAll(selector, document)
    console.log('sign', elements)
    if(elements.length > 0){
        return elements[0]
    }else{
        return undefined
    }
}

