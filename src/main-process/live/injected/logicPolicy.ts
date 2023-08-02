import { Action } from "./actions"
import { BasePolicy } from "./logics/BasePolicy"
import { elementUiPolicy } from "./logics/elementUiPolicy"

/**
 * 元素生成决策: 使产出更高效的定位方式,决策最终分为， 定案，废除，弃权
 * Finalize: selector 无需验证,稳定可用
 * Abolish: 废除定位生成.忽略后续处理
 * Remodeling: 重塑事件，标识重大改变例如从click变更为fill，需填充新的action
 * Waiver: 放弃决策，使用常规方案
 */
export enum LogicStatus { Finalize, Abolish, Remodeling ,Waiver}

export interface LogicResult {
    selector: string,
    status:LogicStatus,
    action?: Action[] 
}

export interface Logic {
    parse(element:Element, event:string) : Promise<LogicResult> 
}

export class LogicPolicy implements Logic {
    private logics:Logic[]
    constructor() {
        this.logics = []
        this.logics.push(
            new elementUiPolicy(),
            new BasePolicy())
    }

    /**
     * @method 通过元素以及事件进行定位生成决策,以更完美的方式辅助代码生成
     */
    async parse(element:Element, event:string) :Promise<LogicResult> {
        let result:LogicResult = {
            selector:'',
            status: LogicStatus.Waiver
        }
        console.log('进行解析',this.logics)
        for(const logic of this.logics){
            result = await logic.parse(element,event)
            if(result.status !== LogicStatus.Waiver){
                break
            }
        }
        console.log('fanhui',result)
        return result
    }
}