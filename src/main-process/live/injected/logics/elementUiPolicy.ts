import { nanoid } from "nanoid"
import { Logic, LogicResult, LogicStatus } from "../logicPolicy"
import { getElementStyleFixXPath, __sleep } from "../utils"


//div[contains(@class," el-date-picker") and contains(@style,"position: absolute")]//*[text()=4]  多个单选选择问题
export class elementUiPolicy implements Logic {
    __date_input?:HTMLInputElement
    __data_range_click: number = 0
    async parse(element: Element, event: string): Promise<LogicResult> {
        console.log('time Abolish',element,event)
        const result: LogicResult = {
            selector:'',
            status: LogicStatus.Waiver
        }
        // console.log('选择debug',element.closest('.el-upload') ,element instanceof HTMLElement,element)
        if (element.className.includes('el-')) {
            if (element instanceof HTMLInputElement){
                // 适配多选框
                if (element.type == 'checkbox') {
                    if(element.className.includes('el-checkbox__original')){
                        let parent =  element.closest('.el-checkbox')
                        const text = parent?.textContent
                        result.selector = `//*[text()="${text}"]//parent::label//input`
                    }
                }
                // 适配选择器
                if (element.type == 'text' && element.className.includes('el-input__inner') || element.className.includes('el-range-input')) {
                    this.__data_range_click = 0
                    this.__date_input = element
                    if(element.readOnly) {
                        if(element.closest('.el-cascader')) { // 先提前适配 cascader
                            let selector = getElementStyleFixXPath(`//*[@placeholder="${element.placeholder}"]`, element) 
                            result.status = LogicStatus.Remodeling
                            result.action = [{
                                name: 'click',
                                signs: [selector],
                                id: nanoid(7),
                                button: "left",
                                modifiers:1,
                                clickCount:1,
                            },{
                                name:'sleep',
                                id: nanoid(7),
                                value: 300
                            }]
                        }else{
                            // 只读元素无法进行填充优化,只能走通用逻辑
                            result.status = LogicStatus.Waiver
                        }
                    }else if(element.parentElement?.className.includes('el-date-editor')) {
                        // 点击时触发的应该不去关注
                        result.status = LogicStatus.Abolish
                    }
                    // 下拉框修正 
                    console.log('下啦选择器修正', element.closest('.el-select'),element)
                    if(element.closest('.el-select')) {
                        result.status = LogicStatus.Finalize
                        result.selector = getElementStyleFixXPath(`//*[@placeholder="${element.placeholder}"]`, element) 
                    }
                }else if(element.className == 'el-upload__input') {
                    result.selector = getElementStyleFixXPath(`//*[contains(@class,"el-upload__input")]`, element)
                    result.status = LogicStatus.Finalize
                }
            }
            else if (element instanceof HTMLButtonElement && element.className.includes("el-time-panel__btn confirm")){
                console.log('选择了时间')
                await __sleep(200); // input还未更新
                if(!this.__date_input) throw new Error('not find data input')
                result.action = [{
                    name: 'fill',
                    signs: [getElementStyleFixXPath(`//*[@placeholder="${this.__date_input.placeholder}"]`, this.__date_input)],
                    id: nanoid(7),
                    text: this.__date_input?.value || ''
                },
                {
                    name:'press',
                    id: nanoid(7),
                    modifiers:100,
                    key:'Enter'
                }
                ]
                result.status = LogicStatus.Remodeling
            }
            else if (element instanceof HTMLSpanElement){
                if(element.className.includes('el-checkbox__inner')){ // 复选框按钮
                    let checkbox = element.closest('.el-checkbox')
                    let label = checkbox?.querySelector('.el-checkbox__label')
                    const text = label?.textContent
                    result.selector = getElementStyleFixXPath(`//*[string()="${text}"]//parent::span//span`, element)
                    result.status = LogicStatus.Finalize
                }else if(element.className.includes('el-checkbox__label')){ // 复选框文字
                    result.selector = getElementStyleFixXPath(`//*[string()="${element.textContent}"]`, element) 
                    result.status = LogicStatus.Finalize
                }
                else if(element.className.includes('el-radio__label')){ // 单选框文字
                    result.selector = getElementStyleFixXPath(`//*[string()="${element.textContent}"]`, element)
                    result.status = LogicStatus.Finalize
                }else if(element.className.includes('el-radio__inner')){ // 单选框按钮,以文字为基准
                    let elRadio = element.closest('.el-radio')
                    let label = elRadio?.querySelector('.el-radio__label')
                    result.selector = getElementStyleFixXPath(`//*[string()='${label?.textContent}']/parent::label//span/span`, element)
                    result.status = LogicStatus.Finalize
                }else if(element.closest('.el-cascader-node')) { // cascader 
                    let text = element.textContent
                    result.selector = getElementStyleFixXPath(`//div[contains(@style,"position: absolute")]//span[string()='${text}']`, element)
                    result.status = LogicStatus.Finalize
                }
            }
            else if (element instanceof HTMLLIElement && element.className.includes('el-select-dropdown__item') ){ // select选择器适配
                let selector = `//div[contains(@style,"position: absolute")]//*[string()='${element.textContent}']`
                result.status = LogicStatus.Remodeling
                result.action = [ {
                    name:'sleep',
                    id: nanoid(7),
                    value: 300
                },{
                    name: 'click',
                    signs: [selector],
                    id: nanoid(7),
                    button: "left",
                    modifiers:1,
                    clickCount:1,
                }]
            }
            else if(element instanceof HTMLDivElement && element.className.includes('el-tabs__item')){  // tabs 适配
                if (element.textContent && element.textContent.trim().length > 0) {
                    result.selector = getElementStyleFixXPath(`//*[string()="${element.textContent}"]`, element)
                    result.status = LogicStatus.Finalize
                }
            }
            else if (element.closest('.el-upload')){ // 特殊区域文件上传适配
                console.log('点击了文件上传', element)
                result.status = LogicStatus.Abolish
            }
            else if (element instanceof HTMLElement ){
                // 不应该匹配hover使用xpath覆盖
                if(element.className.includes('el-select__caret')){ // select 右侧箭头
                    result.selector = getElementStyleFixXPath(`//*[contains(@class,'el-select__caret')]`, element)
                    result.status = LogicStatus.Finalize
                }else if(element.className.includes('el-icon-arrow-down')) {
                    result.selector = getElementStyleFixXPath(`//*[contains(@class,'el-icon-arrow-down')]`, element)
                    result.status = LogicStatus.Finalize
                }
            }
        } else if (element.closest('.el-upload')) { // el通用文件上传
            // 并且优化该命令记录
            console.log('点击了文件上传', element)
            result.status = LogicStatus.Abolish
        } else if (element.closest('.el-date-picker')) { // click date select
            // 日期单选逻辑
            if(!this.__date_input) throw new Error('not find data input')
            if(this.__date_input.readOnly) {
                // 日期可能多选，点击后并不会关闭选择
                result.status = LogicStatus.Waiver
                if(element instanceof HTMLSpanElement || element instanceof HTMLTableCellElement || element instanceof HTMLDivElement) {
                    result.status = LogicStatus.Finalize
                    result.selector =  getElementStyleFixXPath(`//div[contains(@style,"position: absolute")]//span[contains(text(),"${element.innerText}")]`, element) 
                }
            }else{
                result.status = LogicStatus.Remodeling
                await __sleep(200); // input还未更新
                result.action = [{
                    name: 'fill',
                    signs: [getElementStyleFixXPath(`//*[@placeholder="${this.__date_input.placeholder}"]`, this.__date_input)],
                    id: nanoid(7),
                    text: this.__date_input?.value || ''
                },
                {
                    name:'press',
                    id: nanoid(7),
                    modifiers:100,
                    key:'Enter'
                }
                ]
            }
        } else if (element.closest('.el-date-range-picker') && this.__date_input) { //  时间范围处理
            console.log('日期内处理',element,element.closest('.start-date'),element.parentElement?.parentElement ,element.parentElement?.parentElement?.className)
            await __sleep(200); // input还未更新 start-date 也需要等待
            // 无法通过 class 来判断日期是否选择完毕，这个逻辑很长
            this.__data_range_click++
            if(this.__data_range_click == 1){ // 只选了一段时间
                result.status = LogicStatus.Abolish
            }else { // 两端选择完毕，一般值为2，不会有其他值
                const dataParent = this.__date_input.parentNode
                const inputs = dataParent?.querySelectorAll('input')
                if(inputs && inputs.length == 2) { 
                    let [startInput, endInput] = inputs
                    console.log('startInput',startInput,endInput,element)
                    result.status = LogicStatus.Remodeling
                    result.action = []
                    result.action.push( {
                        name: 'fill',
                        signs: [getElementStyleFixXPath(`//*[@placeholder="${startInput.placeholder}"]`, startInput)],
                        id: nanoid(7),
                        text: startInput.value || ''
                    },    {
                        name:'press',
                        id: nanoid(7),
                        modifiers:100, // 等待100ms避免太快谈层未回收
                        key:'Enter'
                    },{
                        name: 'fill',
                        signs: [getElementStyleFixXPath(`//*[@placeholder="${endInput.placeholder}"]`, endInput)],
                        id: nanoid(7),
                        text: endInput.value || ''
                    },   {
                        name:'press',
                        id: nanoid(7),
                        modifiers:100,
                        key:'Enter'
                    })
                }
            }
        } else if (element.closest('.el-select-dropdown__item') && element instanceof HTMLElement){ // select选择项
            let selector = `//div[contains(@style,"position: absolute")]//*[text()="${element.innerText}"]`
            result.status = LogicStatus.Remodeling
            result.action = [ {
                name:'sleep',
                id: nanoid(7),
                value: 300
            },{
                name: 'click',
                signs: [selector],
                id: nanoid(7),
                button: "left",
                modifiers:1,
                clickCount:1,
            }]
        }
        return result
    }
}
