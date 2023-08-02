/**
 * @method 获取高亮的dom元素
 */
export function getHighDom(): HTMLElement | null {
    const eles = document.getElementsByClassName('cherry_hint')
    if (eles.length > 0 && eles.length == 1) {
        return eles[0] as HTMLElement
    }
    return null
}

/**
* @method 清除元素高亮
*/
export function clearHighLight(dom: Element | null) {
    if (dom !== null) {
        dom.className = dom.className.replace('cherry_hint', '')
    }
}

/**
 * @method 高亮dom元素,传入元素的x,y坐标
 * @param {*} mouseX 
 * @param {*} mouseY 
 */
export function __highDom(mouseX: number, mouseY: number) {
    //  注入样式
    var StyleHigh = document.getElementById('c_inject_high_light_css')
    if (!StyleHigh) {
        StyleHigh = document.createElement('style')
        StyleHigh.innerHTML = '.cherry_hint{ background: rgba(151, 232, 81,0.5) !important; }'
        StyleHigh.id = 'c_inject_high_light_css'
        document.getElementsByTagName('head')[0].appendChild(StyleHigh)
    }

    //  获取选择的dom
    var hoverDom = document.elementFromPoint(mouseX, mouseY);
    let old = getHighDom()

    if (hoverDom?.tagName === 'IFRAME') { // 下发
        clearHighLight(old);
        (hoverDom as HTMLIFrameElement).contentWindow?.postMessage({
            instruct: 'high-dom',
            args: [mouseX - hoverDom.getBoundingClientRect().left, mouseY - hoverDom.getBoundingClientRect().top]
        }, '*')
    } else {
        if (old?.tagName === 'IFRAME' && old instanceof HTMLIFrameElement) { // 清理iframe内的
            old.contentWindow?.postMessage({
                instruct: 'clear-high',
                args: []
            }, '*')
        }
        if (old !== hoverDom) {
            clearHighLight(old)
            if (hoverDom?.className.indexOf('cherry_hint') == -1) {
                hoverDom.className += ' cherry_hint'
            }
        }
    }
}
