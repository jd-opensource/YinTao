const express = require('express')
const bodyParser = require('body-parser') 
const httpserver = express()
const formidable = require('express-formidable')

// 注释开启会导致收不到post请求
// httpserver.use(bodyParser.urlencoded({ extended: false }))
// httpserver.use(bodyParser.json({limit:"100mb"}))
// httpserver.use(formidable())
httpserver.use(bodyParser.json())

const serviceImpl = {
    result: function(req, res, next)  {
        console.log("收到了结果上报:",req.body)
        res.json({ok:1})
      },
      log:function(req, res, next)  {
        console.log("收到了log请求",req.body)
        res.json({ok:1})
      },
      trace:function(req, res, next)  {
        console.log("收到了trace请求",req.body)
        console.log("接收到的文件",req.files,req.fields)
        res.json({ok:1})
      },
      image:function(req, res, next)  {
        console.log("收到了images请求")
        res.json({ok:1})
    },
    test:function(req, res, next)  {
        console.log("收到了test请求")
        res.json({ok:1})
    }
}


const httpControlServer = function( port ) {
    var server = httpserver.listen(port, '0.0.0.0')
    console.log(`http listening on *:${port}`)
    server.on('error', function( err ) {
      if (err.code === 'EADDRINUSE') { // 端口已经被使用
        /**
         * 当端口被占用时，不要采用dialog弹窗，
         * 采用node-notifier 试试(todo: 需要测试,以及先修复服务二次执行问题)
         */
        console.log('The port is occupied.', port)
        app.exit()
      }
    })
  
    httpserver.post('/result', serviceImpl.result)
    httpserver.post('/log', serviceImpl.log)
    httpserver.post('/image', serviceImpl.image)
    httpserver.post('/trace', serviceImpl.trace)
    httpserver.get('/*', serviceImpl.test)
    httpserver.post('/*', serviceImpl.test)
  }

  httpControlServer(8910)