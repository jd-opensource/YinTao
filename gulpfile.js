const {task,dest,src} = require('gulp')
const ts = require('gulp-typescript')
const path                          = require('path');
const childProcess  = require('child_process');
const fs =  require('fs')
// const alias = require('@gulp-plugin/alias');  // 无法使用，还是别用了
const tsProject = ts.createProject("tsconfig.json")
const chromiumVersion = 'chromium-1001'
const envStore = path.resolve('./envStore')

task('default', function () {
    src([
        'src/**/main-process/**/*.ts',
        'src/**/const/**/*.ts',
        'src/**/types/**/*.ts',
        'src/**/utils/**/*.ts'
    ])
        .pipe(tsProject())
        .js
        .pipe(dest('lib'))
    return build_assets()
})

function build_assets(){
    return src([
        "src/**/assets/**/*",
        "src/**/testcafe-core.js",
        "src/**/testcafe-driver.js",
        "src/**/testcafe-automation.js",
        "src/**/testcafe-ui.js",
        "src/**/main-process/**/*"
    ]).pipe(dest('lib'))
}

// task('client_scripts',()=>{
//     return childProcess
//         .spawn('rollup -c', { shell: true, stdio: 'inherit', cwd: path.join(__dirname, 'src/client-script') });
// })


function start_engine(){
    const ls = childProcess.spawn('electron .', { shell: true, cwd: __dirname})
    return new Promise((resolve, reject)=>{
        ls.stdout.on('data', (data) => {
            if(data.includes('http listening')){
                resolve()
            }
        });
    })
}

/**
 * @method 测试完整引擎功能
 */
async function engine_test() {
    /** 先启动引擎，等待引擎正常启动 */
    await start_engine()
    // 测试引擎的功能
    console.log('cat __dirname:',__dirname)
    childProcess.spawnSync('jest --verbose ./test/engine', { shell: true, stdio: 'inherit',cwd: __dirname})

    // 关闭引擎
    console.log('close engine !')
}

task('test', async ()=>{
    // engine test
    await engine_test()
})

task('winEnv', async ()=>{
    let macDir = path.resolve(`./static/browsers/${chromiumVersion}/chrome-mac`)
    return await new Promise((res,rej)=>{
        fs.stat(macDir,function(err,stat){
            if(stat && stat.isDirectory()){
                fs.mkdirSync(envStore)
                childProcess.execSync(`mv ${macDir} ${envStore} `)
            }
            console.log('执行完毕')
            res(true)
        })
    })
})


task('macEnv', async ()=>{
    let hideDir = path.resolve(`./static/browsers/${chromiumVersion}/chrome-win`)
    return await new Promise((res,rej)=>{
        fs.stat(hideDir,function(err,stat){
            if(stat && stat.isDirectory()){
                fs.mkdirSync(envStore)
                childProcess.execSync(`mv ${hideDir} ${envStore} `)
            }
            console.log('执行完毕')
            res(true)
        })
    })
})

// 环境恢复初始状态
task('envReduction', async ()=>{
    childProcess.exec(`mv ${envStore}/* ./static/browsers/${chromiumVersion} && rm -rf ${envStore}`)
})

// task('default', function () {
//     return tsProject.src()
//         .pipe(tsProject())
//         .js.pipe(dest('lib'))
//         .pipe(alias(tsProject.config))

// })