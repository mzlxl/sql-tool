<template>
  <h2 class="m-y-20px">JSON转SQL工具</h2>

  <el-row>
    <el-col :span="12">
      <div id="jsoneditor" style="height: 535px;"></div>
      <el-button @click="copyJson" style="position: relative;left: 222px;top: 10px;">复制JSON
      </el-button>
    </el-col>
    <el-col :span="3">
      <el-row>
        <el-button @click="jsonToSql" style="width: 70px;margin:180px auto 10px auto">SQL&nbsp;&nbsp;&gt;&gt;
        </el-button>
        <el-button @click="sqlToJson" style="width: 70px;margin: 10px auto">&lt;&lt;JSON</el-button>
        <el-button @click="example" style="width: 70px;margin: 10px auto 10px auto">示 例</el-button>
        <el-button @click="clear" style="width: 70px;margin: 10px auto">清 空</el-button>
      </el-row>
    </el-col>
    <el-col :span="9">
      <el-input type="textarea" v-model="sqlInput" placeholder=""
                :autosize="{ minRows: 25, maxRows: 25 }"></el-input>
      <el-button @click="copySql" style="position: relative;left: 150px;top: 10px;">复制SQL</el-button>
    </el-col>
  </el-row>
</template>

<script setup lang="ts">
import {ElMessage} from 'element-plus'
import {copyText, json2sql, isNumber, saveDb, queryDb, removeDb} from '../../utils'
import JSONEditor from 'jsoneditor'
import type {JSONEditorOptions} from 'jsoneditor'
import 'jsoneditor/dist/jsoneditor.min.css'
import {format} from 'sql-formatter';


let editor: any
const sqlInput = ref('')
const fillEditorText = ref(false)

if (onMounted) {
  onMounted(() => {
    const container = document.getElementById('jsoneditor')
    if (container) {
      const options: JSONEditorOptions = {
        mode: "code",
        modes: ["code", "tree"],
        search: false, // 搜索
        enableSort: false,  // 排序
        enableTransform: false, // 设置是否启用转换功
        navigationBar: false, // 设置导航栏是否可见
        statusBar: true, // 设置状态栏是否可见
      }
      editor = new JSONEditor(container, options)
      initCache()
    }
  })

  onUnmounted(() => {
    if (editor) {
      editor.destroy()
    }
  })
}

const initCache = () => {
  if (fillEditorText.value) {
    return;
  }
  let cache: string | null = queryDb("enter_cache:json2sql")
  if (!cache) {
    initJson()
    return
  }
  try {
    removeDb("enter_cache:json2sql")
    setData({table: 'table', data: [JSON.parse(cache)]})
    jsonToSql()
  } catch (e) {
  }
}

const initJson = () => {
  fillEditorText.value = true
  setData({table: '', data: []})
}

const setData = (json: any) => {
  editor.set(json)
}
const getData = (): any => {
  return editor.get()
}

const example = () => {
  var json = {
    table: 'table', data: [{
      "Array": [1, 2, 3],
      "Boolean": true,
      "Number": 123,
      "Object": {"a": "b", "c": {"d": "e"}},
      "String": "Hello World"
    }, {
      "Array": ["1", "2", "3"],
      "Boolean": true,
      "Number": 123,
      "Object": {"a": "b", "c": {"d": "e"}},
      "String": "Hello World"
    }]
  };
  setData(json)
  jsonToSql()
}

const copyJson = () => {
  let json: any = getData()
  if (!json || Object.keys(json).length === 0) {
    return ElMessage.info('请先生成JSON')
  }
  copyText(JSON.stringify(json))
  ElMessage.success('JSON复制成功')
}
const copySql = () => {
  if (!sqlInput.value || sqlInput.value.trim() == '') {
    return ElMessage.info('请先生成SQL')
  }
  copyText(sqlInput.value)
  ElMessage.success('SQL复制成功')
}

const clear = () => {
  initJson()
  sqlInput.value = ''
}

// json转sql
const jsonToSql = () => {
  try {
    let sql = json2sql(getData(), 'INSERT')
    sqlInput.value = sql ? sql : ''
  } catch (error) {
    sqlInput.value = ''
    return ElMessage.info('请输入正确JSON数据')
  }
  copySql()
}

// sql转json
const sqlToJson = () => {
  let matches
  try {
    // 换行替换空格，连续空格再处理成单个空格
    let sql = format(sqlInput.value, {language: 'plsql'}).trim()
    sql = sql.endsWith(";") ? sql : sql + ';'
    matches = sql.replace(/\n/g, ' ')
    .replace(/ +/g, " ").match(/INSERT INTO (\w+) \((.+)\) VALUES (.+);/);
  } catch (error) {
  }
  if (!matches) {
    initJson()
    return ElMessage.info('请输入正确的SQL');
  }
  const tableName = matches[1];
  const columns = matches[2].split(', ');
  let tmpValues = matches[3];
  tmpValues = tmpValues.slice(1, -1)
  if (!tableName || !columns || columns.length === 0 || !tmpValues) {
    initJson()
    return ElMessage.info('请输入正确的SQL')
  }
  const values = tmpValues.split('), (').map(val => {
    const obj: { [key: string]: any } = {};
    val.split(', ').forEach((v, i) => obj[columns[i] as string] = parseColumnValue(v));
    return obj;
  });
  setData({
    table: tableName,
    data: values
  })

  copyJson()
}

const parseColumnValue = (v: string): any => {
  v = v.trim()
  try {
    let data = JSON.parse(v.startsWith("'") && v.endsWith("'") ? `"${v.slice(1, -1)}"` : v)
    if (isNumber(v)) {
      return Number(v)
    } else if (Array.isArray(data) || typeof data === 'boolean' || typeof data === 'object') {
      return data
    } else {
      try {
        data = JSON.parse(data)
      } catch (e) {
        return data
      }
      if (Array.isArray(data) || typeof data === 'object') {
        return data
      }
      return v
    }
  } catch (e) {
    return v
  }
}

</script>

<style scoped lang="scss">

</style>
