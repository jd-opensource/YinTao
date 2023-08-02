export const argsToString = (args: any[]) => {
    let _str = ''
    for (let arg of args) {
        _str += JSON.stringify(arg) + ','
    }
    return _str.slice(0, _str.length - 1)
}