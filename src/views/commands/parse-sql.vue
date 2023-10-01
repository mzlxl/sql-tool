<template>
  <h2 class="m-y-20px">SQL日志解析工具（仅支持ShardingSphere-SQL日志解析）</h2>
  <el-form label-position="left" label-width="100px">
    <!--    <el-form-item label="库名分割符号" class="w-250px">-->
    <!--      <el-select placeholder="请选择表名分割符号" filterable v-model="separator">-->
    <!--        <el-option v-for="item in separators" :key="item.separator" :value="item.separator"-->
    <!--                   :label="item.name"></el-option>-->
    <!--      </el-select>-->
    <!--    </el-form-item>-->
    <el-form-item label="SQL日志样本">
      <el-input type="textarea" v-model="sqlSample"
                placeholder="请输入要解析的SQL日志样本"
                :autosize="{ minRows: 4, maxRows: 6 }"></el-input>
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

const separators = ref([{name: '下划线', separator: '_'},
  {name: '中划线', separator: '-'}])
const separator = ref('_')

const sqlSample = ref('')
const sqlResult = ref('')

const generateResult = () => {
  if (!sqlSample.value || sqlSample.value.trim() == '') {
    ElMessage.info(`请输入要解析的SQL日志样本`)
    return
  }
  let sqlSampleValue = sqlSample.value.trim().replace('Actual SQL: ', '')
  let sql = sqlSampleValue.slice(sqlSampleValue.indexOf(':::') + 4, sqlSampleValue.indexOf('::: ['));
  let values = sqlSampleValue.slice(sqlSampleValue.indexOf('::: [') + 5, sqlSampleValue.indexOf(']')).split(",");
  let dbName = parseDbName(sqlSampleValue)
  sql = sql.replace(/FROM /g, 'FROM ' + dbName + '.').replace(/from /g, 'from ' + dbName + '.')
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
  return sql.replace(/\?/g, (substring: string) => assembelParam(values.shift()) || substring);
};

const assembelParam = (param: string | undefined): string => {
  if (!param) {
    return ''
  }
  param = param.trim()
  if (isNumber(param)) {
    return param
  }
  return "'" + param + "'"
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
