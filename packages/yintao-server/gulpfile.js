const { task, dest, src } = require('gulp')
const ts = require('gulp-typescript')

const tsProject = ts.createProject('tsconfig.json', {
    noEmitOnError: false,
})
  

task('default', function () {
    src([
        'src/**/*.ts',
        'main.ts',
    ], { base: '.' })
        .pipe(tsProject())
        .js
        .pipe(dest('lib'))
    return build_assets()
})

function build_assets() {
    return src([
        "src/**/assets/**/*",
    ]).pipe(dest('lib'))
}