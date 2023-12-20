<template>
  <h2 class="m-y-20px">SQL日志解析工具</h2>
  <el-form label-position="left" label-width="120px">
    <el-form-item label="解析SQl日志类型" class="w-500px">
      <el-select placeholder="请选择解析SQl日志类型" filterable v-model="type" class="w-250px">
        <el-option v-for="item in types" :key="item.type" :value="item.type"
                   :label="item.name"></el-option>
      </el-select>
    </el-form-item>
    <el-form-item label="SQL日志样本">
      <span slot="label" style="position: absolute;left: -25px;top:2px">
        <el-tooltip class="item" effect="dark"
                    :content="type === 'ShardingSphere'?shardingSphereExample: type === 'mybatis'?mybatisExample:normalExample"
                    placement="top" style="position: fixed">
          <el-icon @click="copySqlExample"><Warning/> </el-icon>
        </el-tooltip>
      </span>
      <el-input type="textarea" v-model="sqlSample"
                placeholder="请输入要解析的SQL日志样本"
                :autosize="{ minRows: 4, maxRows: 6 }"></el-input>
    </el-form-item>
    <el-form-item label="参数日志样本" v-if="type === 'normal'">
       <span slot="label" style="position: absolute;left: -25px;top:2px">
        <el-tooltip class="item" effect="dark" :content="paramExample"
                    placement="top" style="position: fixed">
          <el-icon @click="copyParamExample"><Warning/> </el-icon>
        </el-tooltip>
      </span>
      <el-input type="textarea" v-model="paramSample"
                placeholder="请输入要解析的参数日志样本"
                :autosize="{ minRows: 2, maxRows: 4 }"></el-input>
    </el-form-item>
    <el-form-item label="SQL解析结果">
      <el-input type="textarea" v-model="sqlResult" disabled
                placeholder=""
                :autosize="{ minRows: 10, maxRows: 26 }"></el-input>
    </el-form-item>
  </el-form>
  <div class="m-y-20px flex items-center justify-end">
    <el-button @click="clear">清 空</el-button>
    <el-button type="primary" @click="generateResultAndCopy">生 成</el-button>
    <el-button type="primary" @click="formatSql">美化SQL</el-button>
    <el-button @click="copyResult">复制结果</el-button>
  </div>

</template>

<script setup lang="ts">
import {ElMessage} from 'element-plus'
import {copyText, escapeQuotMarks, isNumber} from '../../utils'
import {format} from 'sql-formatter';

const types = ref([{name: 'mybatis日志解析', type: 'mybatis'},
  {name: 'ShardingSphere SQL日志解析', type: 'ShardingSphere'}, {name: '通用SQL日志解析', type: 'normal'}])
const type = ref('mybatis')
const separator = ref('_')

let numSuffixes = ["(Boolean)", "(Integer)", "(Double)", "(Long)", "(Float)", "(BigDecimal)", "(Timestamp)", "(Byte[])"];

const sqlSample = ref('')
const paramSample = ref('')
const sqlResult = ref('')
const shardingSphereExample = ref('示例：Actual SQL: dbName ::: SELECT *  FROM tableName WHERE  a=? AND b=? AND c=? ::: [1,b,c(String)]')
const normalExample = ref('示例：SELECT *  FROM tableName WHERE a=? AND b=? AND c=?')
const paramExample = ref('示例：[1,b,c(String)]')
const mybatisExample = ref('示例：DEBUG [main] org.mybatis.example.BlogMapper.selectBlogWithPosts - ==>  Preparing: SELECT * FROM tableName WHERE a=? AND b=? AND c=?\n' +
    'DEBUG [main] org.mybatis.example.BlogMapper.selectBlogWithPosts - ==> Parameters: 1,b,c(String)')

const generateResultAndCopy = () => {
  generateResult()
  copyResult()
}

const generateResult = () => {
  if (!sqlSample.value || sqlSample.value.trim() == '') {
    ElMessage.info(`请输入要解析的SQL日志样本`)
    return
  }
  if (type.value === 'mybatis') {
    generateMybatisResult()
  } else if (type.value === 'ShardingSphere') {
    generateShardingSphereResult()
  } else {
    generateNormalResult()
  }
}

const generateNormalResult = () => {
  if (!paramSample.value || paramSample.value.trim() == '') {
    ElMessage.info(`请输入要解析的参数日志样本`)
    return
  }
  // 替换换行为空格  再将连续空格再处理成单个空格
  let sqlSampleValue = sqlSample.value.replace(/\n/g, ' ').replace(/ +/g, " ")
  let paramsStr = paramSample.value.trim().replace(/\n/g, ' ').replace(/ +/g, " ")
  paramsStr = paramsStr.startsWith('[') && paramsStr.endsWith(']') ? paramsStr.slice(1, -1) : paramsStr
  let params: any[] = []
  parse2Arr(params, paramsStr)
  sqlResult.value = parseSql(sqlSampleValue, params);
}

const generateMybatisResult = () => {
  let sqlSampleValue = sqlSample.value
  let sqlEndIndex = sqlSampleValue.indexOf('\n')
  sqlEndIndex = sqlEndIndex > 0 ? sqlEndIndex : sqlSampleValue.indexOf('DEBUG', 10)
  let sql: string = sqlSampleValue.slice(sqlSampleValue.indexOf('Preparing:') + 10, sqlEndIndex).trim()
  let paramsStr: string = sqlSampleValue.slice(sqlSampleValue.indexOf('Parameters:') + 11, sqlSampleValue.length).trim()
  // 替换换行为空格  再将连续空格再处理成单个空格
  sql = sql.replace(/\n/g, ' ').replace(/ +/g, " ")
  paramsStr = paramsStr.replace(/\n/g, ' ').replace(/ +/g, " ")
  let params: any[] = []
  parse2Arr(params, paramsStr)
  sqlResult.value = parseSql(sql, params);
}

// 解析shardingsphere
const generateShardingSphereResult = () => {
  // 替换换行为空格  再将连续空格再处理成单个空格
  let sqlSampleValue = sqlSample.value.replace(/\n/g, ' ').replace(/ +/g, " ")
  sqlSampleValue = sqlSampleValue.slice(sqlSampleValue.indexOf('Actual SQL:') + 11, sqlSampleValue.length).trim()
  let sql = ''
  let dbName = ''
  let paramsStr: string = sqlSampleValue.slice(sqlSampleValue.indexOf('::: [') + 5, sqlSampleValue.lastIndexOf(']'))
  let params: any[] = []
  parse2Arr(params, paramsStr.trim())

  let countSeq = countSeparator(sqlSample.value, ':::')
  if (countSeq == 1) {
    sql = sqlSampleValue.slice(0, sqlSampleValue.indexOf('::: ['));
  } else if (countSeq == 2) {
    sql = sqlSampleValue.slice(sqlSampleValue.indexOf(':::') + 4, sqlSampleValue.indexOf('::: ['));
    dbName = parseShardingSphereDbName(sqlSampleValue)
  } else {
    return ElMessage.info(`请输入要正确的SQL日志和参数样本`)
  }

  sql = replaceDbName(sql, 'FROM ', dbName)
  sql = replaceDbName(sql, 'INSERT INTO ', dbName)
  sql = replaceDbName(sql, 'UPDATE ', dbName)
  sqlResult.value = parseSql(sql, params);
}

const replaceDbName = (sql: string, dbBeforeStr: string, dbName: string): string => {
  if (!sql) {
    return ''
  }
  let replaceSql = sql.replace(eval('/' + dbBeforeStr.toLowerCase() + '/g'), dbBeforeStr.toLowerCase() + dbName + (dbName ? '.' : ''))
  return sql.replace(eval('/' + dbBeforeStr.toUpperCase() + '/g'), dbBeforeStr.toUpperCase() + dbName + (dbName ? '.' : ''))
}

// 解析参数到数组中
const parse2Arr = (arr: any[], params: string) => {
  params = params.trim()
  if (!params) {
    return
  }
  if (params.indexOf(',') < 0) {
    arr.push(params)
  } else {
    let isObj: boolean = tryParseObj(arr, params, '{', '}', 0) || tryParseObj(arr, params, '[', ']', 0)
    if (!isObj) {
      arr.push(params.slice(0, params.indexOf(',')))
      parse2Arr(arr, params.slice(params.indexOf(',') + 1, params.length).trim())
    }
  }
}

const tryParseObj = (arr: any[], params: string, seqStart: string, seqEnd: string, index: number): boolean => {
  let indexEnd = params.indexOf(seqEnd, index) + 1
  if (!params.startsWith(seqStart) || indexEnd <= 1) {
    // 不是对象和数组开头  或者不包含seqEnd
    return false
  }
  // 截取0-indexEnd的字符串，尝试去转换对象，如果转换成功，则证明此段截取内容为完成对象
  let subStr: string = params.slice(0, indexEnd)
  let obj = parseObj(subStr)
  if (obj) {
    // 将对象添加到参数数组中 并递归去找下一个参数
    arr.push(obj)
    parse2Arr(arr, params.slice(indexEnd + 1, params.length).trim())
    return true
  } else {
    // 根据当前的indexEnd继续找下一个seqEnd，尝试截取到下一个seqEnd看是不是一个对象
    return tryParseObj(arr, params, seqStart, seqEnd, indexEnd)
  }
}

const parseObj = (str: string): any | null => {
  try {
    if (isNumber(str)) {
      // json parse对比较大的数字有精度丢失的问题
      return BigInt(str)
    } else {
      return JSON.parse(str)
    }
  } catch (e) {
    try {
      let tmp = str.replace(/\\"/g, '"')
      if(isNumber(tmp)){
        return BigInt(str)
      }
      return JSON.parse(tmp)
    } catch (e) {
      return null
    }
  }
}

// 解析sharingsphere的库名
const parseShardingSphereDbName = (sql: string): string => {
  let dbName = sql.slice(0, sql.indexOf(':::')).trim()
  if (!dbName) {
    return ''
  }
  let suffixes = ["-w", "-r", "-rw", "-r0", "-r1", "-w0", "-w1", "-rw0", "-rw1"];
  let suffix = null;

  for (let s of suffixes) {
    if (dbName.endsWith(s)) {
      suffix = s;
      break;
    }
  }

  dbName = suffix ? dbName.slice(0, -suffix.length) : dbName
  return dbName.replace(/-/g, separator.value).replace(/_/g, separator.value);
}

// 解析出sql
const parseSql = (sql: string, params: any[]): string => {
  if (!checkInputParamCount(sql, params)) {
    ElMessage.info(`请输入要正确的SQL日志和参数样本`)
    return '';
  }
  // 将参数替换到问号中
  return sql.replace(/\?/g, (substring: string) => parseParamByType(params.shift()) || substring);
}

// 检查输入值的问号数量和参数数量是否一致
const checkInputParamCount = (sql: string, params: string[]): boolean => {
  return countSeparator(sql, '\\?') === params.length
}

// 计算符号数量
const countSeparator = (sample: string, seq: string) => {
  let questionMarks = sample.match(eval('/' + seq + '/g'))
  return questionMarks ? questionMarks.length : 0
}

const parseParamByType = (p: any | undefined): string => {
  if (!p) {
    return ''
  }
  let param = p.toString().trim()
  if (typeof p === 'object') {
    param = JSON.stringify(p)
  }
  let numSuffixes = ["(Boolean)", "(Integer)", "(Double)", "(Long)", "(Float)", "(BigDecimal)", "(Timestamp)", "(Byte[])"];
  let stringSuffixes = ["(String)", "(Date)"];
  if (numSuffixes.some(item => param.endsWith(item))) {
    return param.slice(0, param.lastIndexOf("("))
  } else if (stringSuffixes.some(item => param.endsWith(item))) {
    param = param.slice(0, param.lastIndexOf("("))
    return `'${escapeQuotMarks(param)}'`
  } else {
    let obj = parseObj(param)
    if (obj && typeof obj === 'number') {
      return obj.toString()
    }
    return `'${escapeQuotMarks(param)}'`
  }
}

const formatSql = () => {
  generateResult()

  try {
    sqlResult.value = format(sqlResult.value, {language: 'mysql'})
  } catch (e) {
    sqlResult.value = ''
    return ElMessage.error('请输入正确的SQL')
  }
  copyResult()
}

const copyResult = () => {
  if (!sqlResult.value || sqlResult.value.trim() == '') {
    return ElMessage.info('请先生成SQL')
  }
  copyText(sqlResult.value)
  ElMessage.success('复制成功')
}

const copySqlExample = () => {
  sqlSample.value = type.value === 'ShardingSphere' ? shardingSphereExample.value.replace('示例：', '') :
      type.value === 'mybatis' ? mybatisExample.value.replace('示例：', '') : normalExample.value.replace('示例：', '')
}

const copyParamExample = () => {
  paramSample.value = paramExample.value.replace('示例：', '')
}

const clear = () => {
  sqlResult.value = ''
  sqlSample.value = ''
  paramSample.value = ''
}
</script>

<style scoped lang="scss">

</style>
