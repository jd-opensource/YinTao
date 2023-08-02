const {task,dest,src} = require('gulp')
const ts = require('gulp-typescript')
const tsProject = ts.createProject("tsconfig.json")

task('default', function (cb) {
    src([
        'src/**/main/**/*.ts',
        'src/**/types/**/*.ts',
    ])
        .pipe(tsProject())
        .js
        .pipe(dest('lib'))
    return build_assets()
})

function build_assets(){
    return src([
        "src/**/main/**/browserPreload.js"
    ]).pipe(dest('lib'))
}