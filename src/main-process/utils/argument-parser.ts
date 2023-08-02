import { DefaultConfig } from '@/const/const'

export class ArgumentParser{
    httpPort?:number
    disableWS:boolean = false

    constructor(inp: string[]) {
        for(let arg of inp){
            if(arg.indexOf('httpPort=') > -1){
              let [,value] = arg.split('=')
              this.httpPort = Number(value) 
            }
            if(arg.indexOf('disableWS') > -1){
                this.disableWS = true
            }
          }
    }

    apple(config:DefaultConfig) {
        config.DisableWS = this.disableWS
        config.HttpPort = this.httpPort || config.HttpPort
    }
}

export default ArgumentParser