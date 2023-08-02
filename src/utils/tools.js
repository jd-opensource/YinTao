export function checkURL(URL) {
    var str = URL,
        Expression = /http(s)?:\/\/([\w-]+\.)+[\w-]+(\/[\w- .\/?%&=]*)?/,
        objExp = new RegExp(Expression);
    return objExp.test(str)
}