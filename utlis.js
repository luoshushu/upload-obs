function  formatDate(t, format = 'yyyy-MM-dd hh:mm:ss.SSS') {
  t = new Date(t)
  let o = {
    'M+': t.getMonth() + 1,
    'd+': t.getDate(),
    'h+': t.getHours(),
    'm+': t.getMinutes(),
    's+': t.getSeconds(),
    'q+': Math.floor((t.getMonth() + 3) / 3),
    'S+': t.getMilliseconds(),
  }

  if (/(y+)/.test(format)) {
    format = format.replace(
      RegExp.$1,
      (t.getFullYear() + '').substr(4 - RegExp.$1.length),
    )
  }

  for (let k in o) {
    if (new RegExp('(' + k + ')').test(format)) {
      let formatStr = ''
      for (let i = 1; i <= RegExp.$1.length; i++) {
        formatStr += '0'
      }

      let replaceStr = ''
      if (RegExp.$1.length == 1) {
        replaceStr = o[k]
      } else {
        formatStr = formatStr + o[k]
        let index = ('' + o[k]).length
        formatStr = formatStr.substr(index)
        replaceStr = formatStr
      }
      format = format.replace(RegExp.$1, replaceStr)
    }
  }
  return format
}

module.exports = formatDate