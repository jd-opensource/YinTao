const axios = require('axios')
const http = require('http')


const maxTimeout = 30000

/**
 * @method 远程结果上报
 */
test('run remote report',async () => {
    const port = 3001
    var server 
    const Httpresult = new Promise((resolve, reject) => {
        const timeout = setTimeout(() =>{ // 校验失败
            resolve(false);
        },20000)

        server = http.createServer(function(request, response){
            clearTimeout(timeout)
            resolve(true)
        })

        server.listen(port)
    })

    await axios.post("http://localhost:8777/run",{
        "script": "test('new test',async t =>{await t.navigateTo('https://baidu.com/')})",
        "remoteReport":{
            "result":`http://localhost:${port}/result`
        }
   })

    const data = await Httpresult
    server.close()
    expect(data).toBe(true)
}, maxTimeout)

/** 基本运行测试 */
test('base run', async () => {
    const  res = await axios.post("http://localhost:8777/run",{
        "script": "test('new test',async t =>{await t.navigateTo('https://baidu.com/')\nawait t.click(\"#kw\")\nawait t.typeText(\"#kw\",\"京东\")\nawait t.click(\"#su\")\n})",
    })
    expect(res.data.passed).toBe(1)
}, maxTimeout)

/** 多任务测试 */
test('more case run', async () => {
    const  res = await axios.post("http://localhost:8777/run",{
        "script": "test('new test',async t =>{await t.navigateTo('https://baidu.com/')\nawait t.click(\"#kw\")\nawait t.typeText(\"#kw\",\"京东1\")\nawait t.click(\"#su\")\n});test('new test',async t =>{await t.navigateTo('https://baidu.com/')\nawait t.click(\"#kw\")\nawait t.typeText(\"#kw\",\"京东2\")\nawait t.click(\"#su\")\n})",
    })
    expect(res.data.passed).toBe(2)
}, maxTimeout)