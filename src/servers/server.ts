/**
 * 将服务独立与node, 支持单独node执行,而不再依赖electron跨平台打包
 */
import httpControlServer from "@/main-process/httpServer/server"
import { defaultConfig } from '../const/const'

function mian() {
    console.log("启动http-server")
    httpControlServer(defaultConfig.HttpPort)
}

mian()