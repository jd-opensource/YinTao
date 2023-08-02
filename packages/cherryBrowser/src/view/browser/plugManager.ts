
interface Plug{
    name:string;
    call:(name:string,data:any)=> void;
}

export class PlugManager {
    private _plugs:Plug[]
    constructor(){
        this._plugs = []
    }

    register(plug:Plug):void{
        this._plugs.push(plug);
    }

    get(name:string) : Plug | undefined{
        return this._plugs.find((plug)=>{ return plug.name === name})
    }
}