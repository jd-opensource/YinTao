
const {readSync} = require('read-file-relative')

const path = require('path')


c =  path('C:\\fakepath\\meinv.png')

// let ss  = readSync('./live.js')

console.log(c)


function test(obj){
    // 声明cache变量，便于匹配是否有循环引用的情况
    var cache = [];
    var str = JSON.stringify(obj, function(key, value) {
        if (typeof value === 'object' && value !== null) {
            if (cache.indexOf(value) !== -1) {
                // 移除
                return;
            }
            // 收集所有的值
            cache.push(value);
        }
        return value;
    });
    cache = null;
    console.log(str)
}