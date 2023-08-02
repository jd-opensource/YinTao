import { Logic, LogicResult, LogicStatus } from "../logicPolicy"

export class BasePolicy implements Logic {
    async parse(element: Element, event: string): Promise<LogicResult> {
        const result = {
            selector:'',
            status: LogicStatus.Waiver
        }
        return result
    }
}