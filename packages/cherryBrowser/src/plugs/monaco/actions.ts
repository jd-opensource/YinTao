export type ActionName =
    'check' |
    'click' |
    'closePage' |
    'fill' |
    'navigate' |
    'openPage' |
    'press' |
    'select' |
    'uncheck' |
    'setInputFiles' |
    'setDevice' |
    'changeIframe' |
    'assert.custom' |
    'cookies.setAll' |
    'change-page' |
    'sleep'

export type Action = ClickAction | SleepAction | CheckAction | ClosesPageAction | changePage| cookiesSetAll | OpenPageAction | assertCustom | UncheckAction | FillAction | NavigateAction | PressAction | SetDevice | SelectAction | SetInputFilesAction | ChangeIframeAction

export interface Anchor{
    iframe?: string,
    pathname: string,
    origin:string
}

export type ActionBase = {
    name: ActionName,
    signals?: any[]
    fix?:boolean,
    id:string,
}

export type SetDevice = ActionBase & {
    name: 'setDevice',
    value: string,
}

export type changePage = ActionBase & {
    name: 'change-page',
    value: string | number,
}

export type assertCustom = ActionBase & {
    name: 'assert.custom',
    value: string,
}

export type cookiesSetAll = ActionBase & {
    name: 'cookies.setAll',
    value: string,
    url:string
}

export type CheckAction = ActionBase & {
    name: 'check',
    signs: string[],
}

export type UncheckAction = ActionBase & {
    name: 'uncheck',
    signs: string[],
}

export type ChangeIframeAction = ActionBase & {
    name: 'changeIframe',
    value: string | number
}

export type SelectAction = ActionBase & {
    name: 'select',
    signs: string[],
    options: string[],
}

export type SetInputFilesAction = ActionBase & {
    name: 'setInputFiles',
    signs: string[],
    files: string[],
}

export type FillAction = ActionBase & {
    name: 'fill',
    signs: string[],
    text: string,
}

export type NavigateAction = ActionBase & {
    name: 'navigate',
    url: string,
}

export type OpenPageAction = ActionBase & {
    name: 'openPage',
    url: string,
}

export type ClosesPageAction = ActionBase & {
    name: 'closePage',
}

export type PressAction = ActionBase & {
    name: 'press',
    signs?: string[],
    key: string,
    modifiers: number,
}

export type Point = { x: number, y: number };

export type ClickAction = ActionBase & {
    anchor?:Anchor,
    name: 'click',
    signs: string[],
    button: 'left' | 'middle' | 'right',
    modifiers: number,
    clickCount: number,
    position?: Point,
    delay?:number
}

export type SleepAction = ActionBase & {
    name:'sleep'
    value:number
}
