import endpointUtils from 'endpoint-utils'
import fs from 'fs'

export function getValidPort() {
    return endpointUtils.getFreePort()
  }

export function getValidHostname() {
  return endpointUtils.getIPAddress();
}

/**
 * @method 确保文件路径存在
 */
export async function ensureFilePath( filePath: string ) {
  try {
      const stat = fs.statSync(filePath)
      if( !stat.isDirectory() ) {
        console.log('not find scripts dir,new create to:',filePath)
        fs.mkdirSync(filePath)
      }
  } catch (error) {
    console.log('not find scripts, new create to :', filePath)
    fs.mkdirSync(filePath)
  }
}

/**
 * @method 写入文件
 */
export const writeFileAsync = (filePath:string, body:string)=>{
  const writeStream = fs.createWriteStream(filePath) 
  writeStream.write(body)
  writeStream.end()
}