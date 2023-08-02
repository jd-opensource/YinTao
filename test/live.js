"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.monitor = exports.__hearFileInput = exports.__hearClick = exports._interopDefaultLegacy = exports.sendXHR = void 0;
function sendXHR(url, createXHR, { method = 'GET', data = null, parseResponse = true } = {}) {
    return new Promise((resolve, reject) => {
        const xhr = createXHR();
        xhr.open(method, url, true);
        xhr.onreadystatechange = () => {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    let responseText = xhr.responseText || '';
                    if (responseText && parseResponse)
                        responseText = JSON.parse(xhr.responseText); //eslint-disable-line no-restricted-globals
                    resolve(responseText);
                }
                else
                    reject('disconnected');
            }
        };
        xhr.send(data);
    });
}
exports.sendXHR = sendXHR;
function _interopDefaultLegacy(e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }
exports._interopDefaultLegacy = _interopDefaultLegacy;
;
function recordCode(code) {
    console.log('code:', code);
}
/**
 * @method 监听ide类型输入
 */
function __hearTextIde(ide) {
    const filters = ['insertText', 'insertCompositionText'];
    if (!ide.dataset.cherry_input) {
        ide.dataset.cherry_input = "1";
        ide.addEventListener('input', (_e) => {
            const e = _e;
            if (filters.indexOf(e.inputType) !== -1) {
                //   getDomTargets(e.target as HTMLDivElement).then(targets=>{
                //     const text = e.data
                //     const cmd = new Command("dom.set", text, targets, [text, targets[0]])
                //     ipc.sendToHost("recordControlScript", cmd)
                //     auxiliarySync(cmd);
                //   })
                recordCode("dom.set:" + e.data);
            }
        });
    }
}
function __hearClick() {
    var mouseDownX = 0, mouseDownY = 0;
    var mouseDownE = undefined;
    const mouseDownEventMonitor = function (e) {
        __hearFileInput();
        mouseDownX = e.x;
        mouseDownY = e.y;
        mouseDownE = e;
    };
    window.onmouseup = function (e) {
        if (Math.abs(e.x - mouseDownX) < 4 &&
            Math.abs(e.y - mouseDownY) < 4 &&
            mouseDownE) {
            e = mouseDownE;
        }
        const target = e.target;
        console.log('鼠标点击DOM', target, '坐标:', e.x, ',', e.y);
        const inputTypes = ["text", "password", "number", "search", "tel"];
        if ((target.tagName === "INPUT" && inputTypes.indexOf(target.type) != -1) ||
            target.tagName === "TEXTAREA") {
            // __hearFileInput(e.target);
            __hearTextInputs(e.target);
            //  首先获取当前的光标位置，然后发送给辅助浏览器进行对比，如果不一致则切换光标位置。
            var start = target.selectionStart; //获取文本框中选择的初始位置
            //   setTimeout(() => {
            //     const cmd = new Command("dom.selectText", "", `${start},${start}`, [
            //       start,
            //       start,
            //     ]);
            //     auxiliarySync(cmd);
            //   }, 50);
        }
        else if (target.tagName === 'DIV') {
            __hearTextIde(e.target);
        }
        // const iframeId = COMMON.IFRAME_ID !== null ? COMMON.IFRAME_ID : -1;
        // const cmd = new Command("page.changeIframe", iframeId);
        // ipc.sendToHost("recordControlScript", cmd);
        // getDomTargets(target).then((targets:any) => {
        //   var cmd_click = new Command("dom.click", "", targets, [targets[0]]);
        //   console.warn(`click target signs:`,targets)
        //   auxiliarySync(cmd_click);
        //   ipc.sendToHost("recordControlScript", cmd_click);
        // });
        recordCode("dom.click:");
    }.bind(window);
    window.onmousedown = mouseDownEventMonitor;
}
exports.__hearClick = __hearClick;
/**
 * @method 监听文件上传
 */
function __hearFileInput() {
    let inputFiles = document.querySelectorAll("input[type='file']");
    console.log('获取添加标记的input file', inputFiles);
    inputFiles.forEach((val, index) => {
        if (val.id == "") {
            val.id = `fileAutoId${index}`;
        }
        // 判断是否已经加了事件了
        if (!val.dataset.cherry_file_input) {
            val.onclick = (e) => {
                e.preventDefault();
                // 只有在录制时允许打开上传弹框，否则执行时会导致堵塞。
                //   if(COMMON.MODE === modeType.record){
                //     let selectFiles,selectFile
                //     selectFiles =  ipc.sendSync('systemDialog',val.accept)
                //     if(selectFiles != undefined && selectFiles.length > 0){
                //       selectFile = selectFiles[0]
                //     }
                //     console.log('拿到的路径是',selectFile)
                //     // 这里拿到路径应该真实上传
                //     const selector = `#${(e.target as HTMLElement).id}`
                //     const cmd = new Command("dom.upload", selectFile,[selector],[selector,selectFile]);
                //     upload(selector, selectFile)
                //     //  hint: The node ID of the secondary browser will be invalid if the delay is too fast
                //     setTimeout(() => {
                //       auxiliarySync(cmd)
                //     }, 500);
                //     ipc.sendToHost("recordControlScript", cmd);
                //   }
            };
            val.dataset.cherry_file_input = '1';
        }
        //   if(COMMON.MODE === modeType.auxiliary && val.disabled === false){
        //     console.log('设置了禁用', val)
        //     val.disabled = true
        //   }
    });
}
exports.__hearFileInput = __hearFileInput;
/**
 * @method 为input按钮绑定事件,监控文字输入
 */
function __hearTextInputs(val) {
    const keydownEvt = function (e) {
        const valids = [
            "Enter",
            "Tab",
            "ArrowDown",
            "ArrowUp",
            "Backspace",
            "ArrowLeft",
            "ArrowRight",
        ];
        if (valids.indexOf(e && e.key) > -1 && e.target != null) {
            // getDomTargets(e.target as HTMLElement).then((targets:any) => {
            //   const cmd = new Command("keyboard.press", e.key, targets, [e.key]);
            //   ipc.sendToHost("recordControlScript", cmd);
            //   auxiliarySync(cmd);
            // });
            recordCode("keyboard.press" + e.key);
        }
    };
    if (!val.dataset.cherry_input) {
        val.dataset.cherry_input = "1";
        val.addEventListener("keydown", (_e) => {
            const e = _e;
            const valids = [
                "Enter",
                "Tab",
                "ArrowDown",
                "ArrowUp",
                "Backspace",
                "ArrowLeft",
                "ArrowRight",
            ];
            if (valids.indexOf(e && e.key) > -1 && e.target != null) {
                //   getDomTargets(e.target as HTMLElement).then((targets :any) => {
                //     const cmd = new Command("keyboard.press", e.key, targets, [e.key]);
                //     ipc.sendToHost("recordControlScript", cmd);
                //     auxiliarySync(cmd);
                //   });
                recordCode("keyboard.press" + e.key);
            }
        });
        val.addEventListener("input", (_e) => {
            const e = _e;
            console.log('触发了input', e);
            recordCode("dom.set:" + e.data);
            // if (COMMON.MODE === modeType.execute) return;
            // if (e.inputType == "insertText" && e.target != null) {
            //   var text = e.data || "";
            //   getDomTargets(e.target as HTMLElement).then((targets:any) => {
            //     const cmd = new Command("dom.set", text, targets, [
            //       text,
            //       targets[0],
            //     ]);
            //     ipc.sendToHost("recordControlScript", cmd);
            //     auxiliarySync(cmd);
            //   });
            // }
        });
        val.addEventListener("compositionend", (_e) => {
            const e = _e;
            var text = e.data;
            if (e.target == null)
                return;
            // getDomTargets(e.target as HTMLElement).then((targets:any) => {
            //   const cmd = new Command("dom.set", text, targets, [text, targets[0]])
            //   auxiliarySync(cmd);
            //   ipc.sendToHost("recordControlScript", cmd);
            // })
            recordCode("dom.set:" + text);
        });
        val.addEventListener('paste', (_e) => {
            var _a;
            const e = _e;
            let paste = (_a = e.clipboardData) === null || _a === void 0 ? void 0 : _a.getData('text');
            if (paste !== '') {
                recordCode("dom.set:" + paste);
                //   getDomTargets(e.target as HTMLElement).then((targets:any) => {
                //     const cmd = new Command("dom.set", paste, targets, [
                //       paste,
                //       targets[0],
                //     ]);
                //     ipc.sendToHost("recordControlScript", cmd)
                //     auxiliarySync(cmd)
                //   })
            }
        });
        val.addEventListener("select", (_e) => {
            var _a, _b;
            const e = _e;
            var start = (_a = e.target) === null || _a === void 0 ? void 0 : _a.selectionStart;
            var end = (_b = e.target) === null || _b === void 0 ? void 0 : _b.selectionEnd;
            var args = start === 0 && end === e.target.value.length ? [-1] : [start, end];
            // const cmd = new Command("dom.selectText", "", [], args)
            // // ipc.sendToHost('recordControlScript', cmd);
            // setTimeout(() => {
            //   auxiliarySync(cmd)
            // }, 100)
        });
        val.addEventListener('click', (_e) => {
            const e = _e;
            const { selectionStart, selectionEnd } = e.target;
            // 交给select处理
            if (selectionStart !== selectionEnd)
                return;
            // 用于切换input光标
        });
    }
}
/**
* @method 监控用户对页面的操作
*/
function monitor() {
    console.log('开始监控用户操作');
    __hearClick();
}
exports.monitor = monitor;
(() => {
    monitor();
})();
