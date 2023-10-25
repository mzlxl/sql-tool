import {ElMessage} from "element-plus";
import {format} from "sql-formatter";

export const debug = (...args: any) => {
  if (utools.isDev?.()) {
    console.log(...args)
  }
}

export const openUrl = (url: string) => {
  window.utools ? utools.shellOpenExternal(url) : window.open(url, '_blank')
}

export const copyText = (text: string) => {
  window.utools ? utools.copyText(text) : navigator.clipboard.writeText(text)
}

export const isUtoolsEnv = (): boolean => {
  return !!window.utools
}

export const saveDb = (key: string, value: string): void => {
  if (isUtoolsEnv()) {
    utools.dbStorage.setItem(key, value)
  } else {
    localStorage.setItem(key, value);
  }
}

export const queryDb = (key: string): string | null => {
  if (isUtoolsEnv()) {
    return utools.dbStorage.getItem(key)
  } else {
    return localStorage.getItem(key);
  }
}


// json转sql
export const json2sql = (jsonData: any): string | undefined => {
  if (Object.keys(jsonData).length === 0) {
    ElMessage.info('请输入待转换的属性字段')
    return
  }
  const tableName = jsonData['table'];
  if (!tableName || tableName.trim() === '') {
    ElMessage.info('请输入表名[table]属性')
    return
  }
  let data: any | undefined = jsonData['data']
  if (Array.isArray(data)) {
    if (data.length === 0 || Object.keys(data[0]).length === 0) {
      ElMessage.info('请输入[data]属性')
      return
    }
  } else if (typeof data === 'object') {
    if (Object.keys(data).length === 0) {
      ElMessage.info('请输入[data]属性')
      return
    }
    data = [data]
  } else {
    ElMessage.info('请输入[data]属性')
    return
  }
  const columns = '`' + Object.keys(data[0]).join('`, `') + '`';
  const values = data.map((obj: any) => `(${parseValues(obj)})`).join(', ');
  let sql = `INSERT INTO ${tableName} (${columns})` + ` VALUES ${values};`
  return format(sql, {language: 'mysql'});
}

const parseValues = (obj: any): string => {
  let arr: any[] = []
  for (let key in obj) {
    arr.push(transferObj(obj[key]))
  }
  return arr.map(item => String(item)).join(",")
}

const transferObj = (obj: string): string | null => {
  if (obj === 'null' || obj === 'NULL') {
    return null
  }
  if (!obj) {
    return "''"
  }
  if(typeof obj === 'number' || typeof obj === 'boolean'){
    return obj
  }
  if (Array.isArray(obj) || typeof obj === 'object') {
    return "'" + JSON.stringify(obj).replace(/"/g, '\\"').replace(/'/g, "\\'") + "'"
  }
  return "'" + obj.toString().replace(/"/g, '\\"').replace(/'/g, "\\'") + "'"
}

export const isNumber = (value: any) => {
  // 使用正则表达式判断是否为数字
  const regex = /^-?\d+\.?\d*$/;
  return regex.test(value);
}
