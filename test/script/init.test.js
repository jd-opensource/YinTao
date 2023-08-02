beforeAll(() => {
    console.log('自动唤起测试程序')
    const {exec} = require('child_process')
    const path = require('path')
    const os = require('os')
    cherryBin =  os.platform === 'win' ? path.resolve('/dist/win-unpacked/cherry.exe') : ''
    console.log('cherryBin',cherryBin)
    exec(cherryBin)
});
  
afterAll(() => {
    // 退出被测程序
});