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
export const json2sql = (jsonData: any, type: string): string | undefined => {
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

  const columns = Object.keys(data[0]).join(', ');
  let sql = ''
  if (type === 'INSERT') {
    const values = data.map((obj: any) => `(${parseValues(obj)})`).join(', ');
    sql = `INSERT INTO ${tableName} (${columns})` + ` VALUES ${values};`
  } else if (type === 'UPDATE') {
    const setValues = data.map((obj: any) => `(${parseKvValues(obj)})`).join(', ');
    const whereValues = data.map((obj: any) => `(${parseKvValues(obj)})`).join(' AND ');
    sql = `UPDATE ${tableName}
           SET (${setValues})` + ` WHERE ${whereValues};`
  } else if (type === 'DELETE') {
    const whereValues = data.map((obj: any) => `(${parseKvValues(obj)})`).join(' AND ');
    sql = `DELETE
           FROM ${tableName}
           WHERE ${whereValues};`
  }
  return format(sql, {language: 'mysql'});
}

const parseKvValues = (obj: any): string => {

  return ''
}

const parseValues = (obj: any): string => {
  let arr: any[] = []
  for (let key in obj) {
    arr.push(transferObj(obj[key]))
  }
  return arr.map(item => String(item)).join(",")
}

const transferObj = (obj: any): string | null => {
  if (!obj) {
    return null
  }
  if (obj.toString() === "''" || obj.toString() === "'") {
    return `''`
  }
  if (typeof obj === 'number' || typeof obj === 'boolean') {
    return obj.toString()
  }
  if (Array.isArray(obj) || typeof obj === 'object') {
    return `'${escapeQuotMarks(JSON.stringify(obj))}'`
  }
  return `'${escapeQuotMarks(obj.toString())}'`
}

export const isNumber = (value: any) => {
  // 使用正则表达式判断是否为数字
  const regex = /^-?\d+\.?\d*$/;
  return regex.test(value);
}

export const escapeQuotMarks = (value: string): string => {
  if (!value) {
    return ''
  }
  return value.trim().replace(/"/g, '\\"').replace(/'/g, "\\'")
}
