#!/usr/bin/env node
import httpControlServer from './src/httpServer/server'
export default httpControlServer
import { run } from './src/open-api';
export {run}

console.log("argv",process.argv)
const port = parseInt(process.argv[2]) || 8088

// ex: node app.js 8080
httpControlServer(port)