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
      <el-input type="textarea" v-model="sqlSample"
                placeholder="请输入要解析的SQL日志样本"
                :autosize="{ minRows: 4, maxRows: 6 }"></el-input>
    </el-form-item>
    <el-form-item label="参数日志样本" v-if="type === 'normal'">
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
    <el-button type="primary" @click="generateResult">生 成</el-button>
    <el-button type="primary" @click="formatSql">美化SQL</el-button>
    <el-button @click="copyResult">复制结果</el-button>
  </div>

</template>

<script setup lang="ts">
import {ElMessage} from 'element-plus'
import {copyText} from '../../utils'
import {format} from 'sql-formatter';

const types = ref([{name: '通用SQL日志解析', type: 'normal'},
  {name: 'shardingsphere SQL日志解析', type: 'shardingsphere'}])
const type = ref('normal')
const separator = ref('_')

const sqlSample = ref('')
const paramSample = ref('')
const sqlResult = ref('')

const generateResult = () => {
  if (!sqlSample.value || sqlSample.value.trim() == '') {
    ElMessage.info(`请输入要解析的SQL日志样本`)
    return
  }

  if (type.value === 'shardingsphere') {
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
  let param = paramSample.value.trim()
  param = param.startsWith('[') && param.endsWith(']') ?
      param.slice(1, param.length - 1) : param
  sqlResult.value = parseSql(sqlSample.value, param.split(","));
}

const generateShardingSphereResult = () => {
  let sqlSampleValue = sqlSample.value.trim().replace('Actual SQL: ', '')
  let sql = ''
  let dbName = ''
  let values = sqlSampleValue.slice(sqlSampleValue.indexOf('::: [') + 5, sqlSampleValue.indexOf(']')).split(",");

  let countSeq = countSeparator(sqlSample.value, ':::')
  if (countSeq == 1) {
    sql = sqlSampleValue.slice(0, sqlSampleValue.indexOf('::: ['));
  } else if (countSeq == 2) {
    sql = sqlSampleValue.slice(sqlSampleValue.indexOf(':::') + 4, sqlSampleValue.indexOf('::: ['));
    dbName = parseDbName(sqlSampleValue)
  } else {
    ElMessage.info(`请输入要正确的SQL日志和参数样本`)
    return
  }

  sql = sql.replace(/FROM /g, 'FROM ' + dbName + (dbName ? '.' : '')).replace(/from /g, 'from ' + dbName + '.')
  sqlResult.value = parseSql(sql, values);
}

const parseDbName = (sql: string): string => {
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

const parseSql = (sql: string, values: string[]): string => {
  if (!checkInput(sql, values)) {
    ElMessage.info(`请输入要正确的SQL日志和参数样本`)
    return '';
  }
  return sql.replace(/\?/g, (substring: string) => replaceParamType(values.shift()) || substring);
}

const checkInput = (sql: string, values: string[]): boolean => {
  return countSeparator(sql, '\\?') === values.length
}

const countSeparator = (sample: string, seq: string) => {
  let questionMarks = sample.match(eval('/' + seq + '/g'))
  return questionMarks ? questionMarks.length : 0
}

const replaceParamType = (p: string | undefined): string => {
  if (!p) {
    return ''
  }
  let param = p.toString().trim()
  let numSuffixes = ["(Boolean)", "(Integer)", "(Double)", "(Long)", "(Float)", "(BigDecimal)", "(Timestamp)", "(Byte[])"];
  let stringSuffixes = ["(String)", "(Date)"];
  if (numSuffixes.some(item => param.endsWith(item))) {
    return param.slice(0, param.lastIndexOf("("))
  } else if (stringSuffixes.some(item => param.endsWith(item))) {
    param = param.slice(0, param.lastIndexOf("("))
    return '"' + param.replace(/"/g, '\\"') + '"'
  } else {
    return isNumber(param) ? param : '"' + param.replace(/"/g, '\\"') + '"'
  }
}

const isNumber = (value: any) => {
  // 使用正则表达式判断是否为数字
  const regex = /^-?\d+\.?\d*$/;
  return regex.test(value);
}

const formatSql = () => {
  if (!sqlResult.value || sqlResult.value.trim() == '') {
    ElMessage.info(`请先生成SQL`)
    return
  }

  try {
    sqlResult.value = format(sqlResult.value, {language: 'mysql'})
  } catch (e) {
    sqlResult.value = ''
    return ElMessage.error('请输入正确的SQL')
  }
}

const copyResult = () => {
  if (!sqlResult.value || sqlResult.value.trim() == '') {
    return ElMessage.info('请先生成SQL')
  }
  copyText(sqlResult.value)
  ElMessage.success('复制成功')
}

const clear = () => {
  sqlResult.value = ''
  sqlSample.value = ''
}
</script>

<style scoped lang="scss">
:deep(.el-textarea__inner) {
  resize: none;
}
</style>
