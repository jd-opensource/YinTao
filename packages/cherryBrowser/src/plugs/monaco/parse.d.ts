/**
 * 禁止使用export
 */

interface Route {
  /**
   * Aborts the route's request.
   * @param errorCode Optional error code. Defaults to `failed`, could be one of the following: - `'aborted'` - An operation was aborted (due to user action)
   * - `'accessdenied'` - Permission to access a resource, other than the network, was denied
   * - `'addressunreachable'` - The IP address is unreachable. This usually means that there is no route to the specified
   *   host or network.
   * - `'blockedbyclient'` - The client chose to block the request.
   * - `'blockedbyresponse'` - The request failed because the response was delivered along with requirements which are not
   *   met ('X-Frame-Options' and 'Content-Security-Policy' ancestor checks, for instance).
   * - `'connectionaborted'` - A connection timed out as a result of not receiving an ACK for data sent.
   * - `'connectionclosed'` - A connection was closed (corresponding to a TCP FIN).
   * - `'connectionfailed'` - A connection attempt failed.
   * - `'connectionrefused'` - A connection attempt was refused.
   * - `'connectionreset'` - A connection was reset (corresponding to a TCP RST).
   * - `'internetdisconnected'` - The Internet connection has been lost.
   * - `'namenotresolved'` - The host name could not be resolved.
   * - `'timedout'` - An operation timed out.
   * - `'failed'` - A generic failure occurred.
   */
  abort(errorCode?: string): Promise<void>;

  /**
   * Continues route's request with optional overrides.
   *
   * ```js
   * await page.route('**\/*', (route, request) => {
   *   // Override headers
   *   const headers = {
   *     ...request.headers(),
   *     foo: 'bar', // set "foo" header
   *     origin: undefined, // remove "origin" header
   *   };
   *   route.continue({headers});
   * });
   * ```
   *
   * @param options
   */
  continue(options?: {
    /**
     * If set changes the request HTTP headers. Header values will be converted to a string.
     */
    headers?: { [key: string]: string; };

    /**
     * If set changes the request method (e.g. GET or POST)
     */
    method?: string;

    /**
     * If set changes the post data of request
     */
    postData?: string|Buffer;

    /**
     * If set changes the request URL. New URL must have same protocol as original one.
     */
    url?: string;
  }): Promise<void>;

  /**
   * Fulfills route's request with given response.
   *
   * An example of fulfilling all requests with 404 responses:
   *
   * ```js
   * await page.route('**\/*', route => {
   *   route.fulfill({
   *     status: 404,
   *     contentType: 'text/plain',
   *     body: 'Not Found!'
   *   });
   * });
   * ```
   *
   * An example of serving static file:
   *
   * ```js
   * await page.route('**\/xhr_endpoint', route => route.fulfill({ path: 'mock_data.json' }));
   * ```
   *
   * @param options
   */
  fulfill(options?: {
    /**
     * Response body.
     */
    body?: string|Buffer;

    /**
     * If set, equals to setting `Content-Type` response header.
     */
    contentType?: string;

    /**
     * Wheb set to "allow" or omitted, the fulfilled response will have
     * ["Access-Control-Allow-Origin"](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Origin)
     * header set to request's origin. If the option is set to "none" then
     * [CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS) headers won't be added to the response. Note that all
     * CORS headers configured via `headers` option will take precedence.
     */
    cors?: "allow"|"none";

    /**
     * Response headers. Header values will be converted to a string.
     */
    headers?: { [key: string]: string; };

    /**
     * File path to respond with. The content type will be inferred from file extension. If `path` is a relative path, then it
     * is resolved relative to the current working directory.
     */
    path?: string;

    /**
     * [APIResponse] to fulfill route's request with. Individual fields of the response (such as headers) can be overridden
     * using fulfill options.
     */
    response?: APIResponse;

    /**
     * Response status code, defaults to `200`.
     */
    status?: number;
  }): Promise<void>;

  /**
   * A request to be routed.
   */
  request(): Request;
}

interface APIResponse {
  /**
   * Returns the buffer with response body.
   */
  body(): Promise<Buffer>;

  /**
   * Disposes the body of this response. If not called then the body will stay in memory until the context closes.
   */
  dispose(): Promise<void>;

  /**
   * An object with all the response HTTP headers associated with this response.
   */
  headers(): { [key: string]: string; };

  /**
   * An array with all the request HTTP headers associated with this response. Header names are not lower-cased. Headers with
   * multiple entries, such as `Set-Cookie`, appear in the array multiple times.
   */
  headersArray(): Array<{
    /**
     * Name of the header.
     */
    name: string;

    /**
     * Value of the header.
     */
    value: string;
  }>;

  /**
   * Returns the JSON representation of response body.
   *
   * This method will throw if the response body is not parsable via `JSON.parse`.
   */
  json(): Promise<Serializable>;

  /**
   * Contains a boolean stating whether the response was successful (status in the range 200-299) or not.
   */
  ok(): boolean;

  /**
   * Contains the status code of the response (e.g., 200 for a success).
   */
  status(): number;

  /**
   * Contains the status text of the response (e.g. usually an "OK" for a success).
   */
  statusText(): string;

  /**
   * Returns the text representation of response body.
   */
  text(): Promise<string>;

  /**
   * Contains the URL of the response.
   */
  url(): string;
}

/**
 * Can be converted to JSON
 */
type Serializable = any;

interface FCherryBrowser {
  /**
   * @method 监听页面请求
   * @param event 
   * @param callback 
   */
  on(event:string, callback:any)
  /**
   * @method 拦截页面请求并修改
   * @param url 
   * @param handler 
   * @param options 
   */
  route(url: string|RegExp|((url: URL) => boolean), handler: ((route: Route, request: Request) => void), options?: {
    times?: number;
  }) 
}
interface FCherryPage {
   /**
     * 
     * @method 设置h5设备模拟
     * @param name 设备名称 examples: iPhone 6, Iphone 12
     */
    setDevice(name:string): Promise<void>
    /***
     * @method 等待url响应结果
     */
    waitForResponse(urlOrPredicate: string|RegExp|((response: Response) => boolean|Promise<boolean>), options?: {
      timeout?: number;
    }): Promise<Response>

    /**
     * @method 等待并切换至跳转页面
     * 
     */
    waitPopup(optionsOrPredicate?:{
      predicate:Function,
      timeout?: 30000
    }): Promise<void>

    /**
     * @method 等待页面事件
     */
    waitForEvent(event:"framenavigated",optionsOrPredicate?:{
      predicate:Function,
      timeout?: 30000
    }): Promise<void>
    
    /**
     * @method 打开新页面
     * @param url 页面地址
     * @param options 
     */
    create(url: string, options?: {
      referer?: string;
      timeout?: number;
      waitUntil?: 'load' | 'domcontentloaded' | 'networkidle' | 'commit';
    }): Promise<void>

    /**
     * @method 刷新页面
     */
    refresh(options?:{
      referer?: string;
      timeout?: number;
      waitUntil?: 'load' | 'domcontentloaded' | 'networkidle' | 'commit';
    }): Promise<void>
    
    /**
     * @method 页面跳转
     * @param url 
     * @param options 
     */
    to(url: string, options?: {
      referer?: string;
      timeout?: number;
      waitUntil?: 'load' | 'domcontentloaded' | 'networkidle' | 'commit';
    }):Promise<void>

    /**
     * @method 页面截图
     * @param imgPath 截图存放路径
     */
    screenshot(imgPath: string): Promise<void>
    /**
     * @method 页面后退
     */
    back(): Promise<void>
    /**
     * @method 页面前进
     */
    forward(): Promise<void>
    /**
     * @method 获取页面url地址
     */
    getURL(): Promise<string>
    /**
     * @method 根据规则切换控制页面
     * @param rule 可以传递url包含的字符进行切换，或采用index下标
     */
    change(rule: number | string): Promise<void>
    /**
     * @method 切换页面的iframe
     * @param index iframe 下表索引或id名称
     * @param tinmeout 超时时间
     */
    changeIframe(index: number| string, tinmeout:number): Promise<void>
}

interface FCherryDom {
  /**
   * @method 将页面视图滚动到定位元素
   * @param sign 混合定位符xpath,selector
   */
  viewTo(sign:string):Promise<void>
  /**
   * @method 点击目标元素
   * @param sign 混合定位符xpath,selector
   * @param options 
   */
  click(sign: string,  options?: {
    /**
     * Defaults to `left`.
     */
    button?: "left"|"right"|"middle";

    /**
     * defaults to 1. See [UIEvent.detail].
     */
    clickCount?: number;

    /**
     * Time to wait between `mousedown` and `mouseup` in milliseconds. Defaults to 0.
     */
    delay?: number;

    /**
     * Whether to bypass the [actionability](https://playwright.dev/docs/actionability) checks. Defaults to `false`.
     */
    force?: boolean;

    /**
     * Modifier keys to press. Ensures that only these modifiers are pressed during the operation, and then restores current
     * modifiers back. If not specified, currently pressed modifiers are used.
     */
    modifiers?: Array<"Alt"|"Control"|"Meta"|"Shift">;

    /**
     * Actions that initiate navigations are waiting for these navigations to happen and for pages to start loading. You can
     * opt out of waiting via setting this flag. You would only need this option in the exceptional cases such as navigating to
     * inaccessible pages. Defaults to `false`.
     */
    noWaitAfter?: boolean;

    /**
     * A point to use relative to the top-left corner of element padding box. If not specified, uses some visible point of the
     * element.
     */
    position?: {
      x: number;

      y: number;
    };

    /**
     * When true, the call requires selector to resolve to a single element. If given selector resolves to more then one
     * element, the call throws an exception.
     */
    strict?: boolean;

    /**
     * Maximum time in milliseconds, defaults to 30 seconds, pass `0` to disable timeout. The default value can be changed by
     * using the
     * [browserContext.setDefaultTimeout(timeout)](https://playwright.dev/docs/api/class-browsercontext#browser-context-set-default-timeout)
     * or [page.setDefaultTimeout(timeout)](https://playwright.dev/docs/api/class-page#page-set-default-timeout) methods.
     */
    timeout?: number;

    /**
     * When set, this method only performs the [actionability](https://playwright.dev/docs/actionability) checks and skips the action. Defaults to
     * `false`. Useful to wait until the element is ready for the action without performing it.
     */
    trial?: boolean;
  })
  /**
   * @method 获取元素属性内容
   * @param sign 
   * @param attr 
   */
  getAttributes(sign:string, attr:string)
  /**
   * @method 等待目标元素出现
   * @param sign 
   * @param timeout 
   */
  wait(sign: string, timeout?: number)
  /**
   * @method 元素悬浮触发hover事件
   * @param sign 
   */
  hover(sign: string)

  /**
   * @method 判断元素是否存在
   * @param sign 
   * @param timeout 超时时间 default:2000ms
   */
  exist(sign: string, timeout:number) : Promise<boolean>

  /**
   * @method text文字填充
   * @param sign 
   * @param value 
   * @param options 
   */
  fill(sign: string, value: string, options?: {
    force?: boolean; // jump chencks Defaults to 'false'
    noWaitAfter?: boolean; // When true, the call requires selector to resolve to a single element.
    strict?: boolean; // When true, the call requires selector to resolve to a single element.
    timeout?: number; // Maximum time in milliseconds, defaults to 30 seconds, pass '0' to disable timeout. The default value can be changed by
  }) 

  /**
   * @method 模拟触发元素js事件
   * @param sign 
   * @param event 
   * @param eventInit 
   * @param options 
   */
  dispatchEvent(sign:string, event:string, eventInit: any, options:any)

  /**
   * @method select控件选择
   * @param sign 
   * @param value 
   */
  select(sign:string, value: any)
  /**
   * @method inputFile文件上传
   * @param sign 
   * @param files 
   */
  upload(sign: string, files: string | string[]): Promise<void>
}

interface FCherryCookies {
  /**
   * @method 设置浏览器cookie
   * @param value 
   */
  set(value:any[]) :Promise<void>
  /**
   * @method 通过请求cookie批量设置
   * @param url cookie网页地址
   * @param cookieText 请求中cookie键值对
   */
  setAll(url:string, cookieText:string) :Promise<void>
  /**
   * @method 清空浏览器cookie
   */
  clear() :Promise<void>
}

interface FCherryAssert {
  /**
   * @method 页面文案断言，在页面中断言text文本
   * @param text 
   * @param times 
   */
  all(text:string, times:number) 
  /**
   * @method 页面地址断言(包含关系)
   * @param url 
   */
  location(url:string)
  /**
   * @method 页面标题断言
   * @param title 
   */
  title(title:string) 
  /**
   * @method 元素属性断言
   * @param sign 混合定位符xpath,selector
   * @param attr 元素属性例如: innertext,id,name
   * @param will 预期结果
   * @param opreate 比较方式: 0.相等、1.不相等、2.包含、3.不包含
   */
  custom(sign: string, attr: string, will: any, opreate: number)
}

interface FCherryKeyboard{
  /**
   * @method 模拟操作按键
   * @param key 
   * @param options 
   */
  press(key: string, options?: {
    /**
     * Time to wait between 'keydown' and 'keyup' in milliseconds. Defaults to 0.
     */
    delay?: number;
  })
  /**
   * @method 模拟按键按下
   * @param key 
   */
  down(key:string)
  /**
   * @method 模拟按键抬起
   * @param key 
   */
  up(key:string)
  /**
   * @method 模拟键盘输入
   * @param text 文本内容
   * @param options 
   */
  type(text: string, options?: {
    delay?: number;
  })
}

interface FCherryMouse{
  /**
   * @method 模拟鼠标进行坐标点击
   * @param x 
   * @param y 
   * @param options 
   */
  click(x: number, y: number, options?: {
    /**
     * Defaults to 'left'.
     */
    button?: "left"|"right"|"middle";

    /**
     * defaults to 1. See [UIEvent.detail].
     */
    clickCount?: number;

    /**
     * Time to wait between 'mousedown' and 'mouseup' in milliseconds. Defaults to 0.
     */
    delay?: number;
  })
  /**
   * @method 模拟鼠标按下
   * @param options 
   */
  down(options?: {
    button?: "left"|"right"|"middle"; // Defaults to 'left'.
    clickCount?: number; // defaults to 1. See [UIEvent.detail].
  })
  /**
   * @method 模拟鼠标抬起
   * @param options 
   */
  up(options?: {
    button?: "left"|"right"|"middle"; // Defaults to 'left'.
    clickCount?: number; // defaults to 1. See [UIEvent.detail].
  })
 /**
  * @method 模拟鼠标滚轮
  * @param deltaX  控制x轴滚动
  * @param deltaY  控制y轴滚动 Examples: 300-向下滚动300像素
  */
  wheel(deltaX: number, deltaY: number)
}

declare const sleep : (ms:number)=> void