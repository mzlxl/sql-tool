<template>
  <h2 class="m-y-20px">列转行工具</h2>
  <el-form label-position="left" label-width="100px">
    <el-form-item label="分割符号" class="w-250px">
      <el-select placeholder="请选择分割符号" filterable v-model="separator">
        <el-option v-for="item in separators" :key="item.type" :value="item.type" :label="item.name"></el-option>
      </el-select>
    </el-form-item>
    <el-form-item label="数据类型" class="w-250px">
      <el-select placeholder="请选择数据类型" filterable v-model="type">
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
    <el-checkbox v-model="distinct">是否去重</el-checkbox>
  </el-form>
  <div class="m-y-20px flex items-center justify-end">
    <el-button @click="clear">清 空</el-button>
    <el-button type="primary" @click="col2row">列转行</el-button>
    <el-button type="primary" @click="row2col">行转列</el-button>
    <el-button @click="copyResult">复制结果</el-button>
  </div>

</template>

<script setup lang="ts">
import {ElMessage} from 'element-plus'
import {copyText} from '../../utils'

const separators = ref([{name: '逗号', type: 'comma', separator: ','},
  {name: '空格', type: 'space', separator: ' '}])
const types = ref([{name: '数字类型', type: 'num', char: ''},
  {name: '字符串：单引号', type: 'string-single', char: '\''},
  {name: '字符串：双引号', type: 'string-double', char: '"'}])
const separator = ref('comma')
const type = ref('num')
const input = ref('')
const result = ref('')
const distinct = ref(true)


const col2row = () => {
  if (!input.value || input.value.trim() == '') {
    ElMessage.info(`请输入要待转换数据`)
    return
  }
  let tmpResult = parseChar() + input.value.trim().replace(/\n/g, generateSeparator) + parseChar();

  if (distinct.value) {
    result.value = [...new Set(tmpResult.split(parseSeparator()))].join(parseSeparator())
  } else {
    result.value = tmpResult
  }
}

const row2col = () => {
  if (!input.value || input.value.trim() == '') {
    ElMessage.info(`请输入要待转换数据`)
    return
  }

  let char = parseChar();
  let str = input.value.trim().replace(eval('/' + generateSeparator() + '/g'), '\n')
  str = str.endsWith(char) && char != '' ? str.slice(0, -1) : str
  str = str.startsWith(char) && char != '' ? str.slice(1, str.length) : str

  if (distinct.value) {
    result.value = [...new Set(str.split('\n'))].join('\n')
  } else {
    result.value = str
  }
}

const generateSeparator = () => parseChar() + parseSeparator() + parseChar()

const parseChar = (): string => {
  for (let i = 0; i < types.value.length; i++) {
    if (types.value[i].type == type.value) {
      return types.value[i].char
    }
  }
  return '';
}

const parseSeparator = (): string => {
  for (let i = 0; i < separators.value.length; i++) {
    if (separators.value[i].type == separator.value) {
      return separators.value[i].separator
    }
  }
  return '';
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
</script>

<style scoped lang="scss">
:deep(.el-textarea__inner) {
  resize: none;
}
</style>
