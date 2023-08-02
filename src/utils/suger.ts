/**
 *  this file need build es and cms!
 */

/**
 * @method 将代理地址转为访问地址
 */
export function transformShortUrl(url:string) :string {
    const proxyUrl = extractProxyUrl(url)
    return url.slice(proxyUrl.length)
}

/**
 * @method 提取代理地址
 */
 export function extractProxyUrl(url:string) :string {
    const _url = new URL(url)
    const regx =  /\/(.+?)\//.exec(_url.pathname)
    if(regx == null){
        console.warn('Non-proxy address:' + url)
        return ''
    }
    var [proxyId] = regx
    let proxyUrl = _url.origin + proxyId
    return proxyUrl
}


