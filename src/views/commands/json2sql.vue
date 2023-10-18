<template>
  <h2 class="m-y-20px">JSON转SQL工具</h2>
  <el-form label-position="left" label-width="100px">
    <el-form-item label="转换类型" class="w-250px">
      <el-select placeholder="请选择转换类型" filterable v-model="type" onchange="typeChange">
        <el-option v-for="item in types" :key="item.type" :value="item.type" :label="item.name"></el-option>
      </el-select>
    </el-form-item>
    <el-form-item label="待转换数据">
      <el-input type="textarea" v-model="input"
                placeholder="请输入要待转换数据"
                :autosize="{ minRows: 4, maxRows: 6 }"></el-input>
    </el-form-item>
    <el-form-item label="转换结果">
      <el-input type="textarea" v-model="result" disabled
                placeholder=""
                :autosize="{ minRows: 4, maxRows: 6 }"></el-input>
    </el-form-item>
  </el-form>
  <div class="m-y-20px flex items-center justify-end">
    <el-button @click="clear">清 空</el-button>
    <el-button type="primary" @click="generateResult">生成</el-button>
    <el-button @click="copyResult">复制结果</el-button>
  </div>

</template>

<script setup lang="ts">
import {ElMessage} from 'element-plus'
import {copyText} from '../../utils'

const types = ref([{name: 'JSON转SQL', type: 'json2sql'},
  {name: 'SQL转JSON', type: 'sql2json'}])
const type = ref('json2sql')
const input = ref()
const result = ref('')


if (onMounted) {
  onMounted(() => typeChange())
}

const typeChange = () => {
  if (type.value === 'json2sql') {
    input.value = '{\n' +
        '  "table": "table",\n' +
        '  "data": [\n' +
        '    { "field": "value" }\n' +
        '  ]\n' +
        '}'
  } else if (type.value === 'sql2json') {
    input.value = 'INSERT INTO table (field) VALUES ("value");'
  }
}
const generateResult = () => {
  if (!type.value) {
    return ElMessage.info('请选择转换类型')
  }
  if (!input.value.trim()) {
    return ElMessage.info('请输入要待转换数据')
  }

  if (type.value === 'json2sql') {
    result.value = jsonToSql(input.value)
  } else if (type.value === 'sql2json') {
    result.value = JSON.stringify(sqlToJson(input.value))
  } else {
    return ElMessage.info('请选择正确的转换类型')
  }
}
const copyResult = () => {
  if (!result.value || result.value.trim() == '') {
    return ElMessage.info('请先生成转换结果')
  }
  copyText(result.value)
  ElMessage.success('复制成功')
}

const clear = () => {
  input.value = ''
  result.value = ''
}

// json转sql
const jsonToSql = (jsonStr: string): string => {
  let jsonData: any
  try {
    jsonData = JSON.parse(jsonStr)
  } catch (error) {
    ElMessage.info('请输入正确的待转换数据')
    return ''
  }
  const tableName = jsonData['table'];
  const columns = Object.keys(jsonData['data'][0]).join(', ');
  const values = jsonData['data'].map((obj: any) => `(${parseValues(obj)})`).join(', ');
  return `INSERT INTO ${tableName} (${columns})` + ` VALUES ${values};`;
}

const parseValues = (obj: any): string => {
  let arr: string[] = []
  for (let key in obj) {
    arr.push(typeof obj[key] === 'string' ? "\"" + obj[key] + "\"" : obj[key])
  }
  return arr.join(', ')
}

// sql转json
const sqlToJson = (sql: string): any | null => {
  const matches = sql.match(/INSERT INTO (\w+) \((.+)\) VALUES (.+);/);
  if (!matches) return null;

  const tableName = matches[1];
  const columns = matches[2].split(', ');
  let tmpValues = matches[3];
  tmpValues = tmpValues.slice(1, tmpValues.length - 1)
  const values = tmpValues.split('), (').map(val => {
    const obj: { [key: string]: any } = {};
    val.split(', ').forEach((v, i) => obj[columns[i] as string]
        = v.startsWith("\"") && v.endsWith("\"") ? v.slice(1, -1) : isNumber(v) ? Number(v) : v);
    return obj;
  });
  return {
    table: tableName,
    data: values
  }
}

const isNumber = (value: any) => {
  // 使用正则表达式判断是否为数字
  const regex = /^-?\d+\.?\d*$/;
  return regex.test(value);
}


</script>

<style scoped lang="scss">
:deep(.el-textarea__inner) {
  resize: none;
}
</style>
