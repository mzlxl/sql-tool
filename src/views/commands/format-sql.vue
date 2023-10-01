<template>
  <h2 class="m-y-20px">SQL美化工具</h2>
  <el-form label-position="left" label-width="100px">
    <el-form-item label="待美化SQL">
      <el-input type="textarea" v-model="sql"
                placeholder="请输入要美化的SQL样本"
                :autosize="{ minRows: 4, maxRows: 6 }"></el-input>
    </el-form-item>
    <el-form-item label="SQL美化结果">
      <el-input type="textarea" v-model="sqlResult" disabled
                placeholder=""
                :autosize="{ minRows: 10, maxRows: 26 }"></el-input>
    </el-form-item>
  </el-form>
  <div class="m-y-20px flex items-center justify-end">
    <el-button @click="clear">清 空</el-button>
    <el-button type="primary" @click="generateResult">生 成</el-button>
    <el-button @click="copyResult">复制结果</el-button>
  </div>

</template>

<script setup lang="ts">
import {ElMessage} from 'element-plus'
import {copyText} from '../../utils'
import { format } from 'sql-formatter';

const sql = ref('')
const sqlResult = ref('')

const generateResult = () => {
  if (!sql.value || sql.value.trim() == '') {
    ElMessage.info(`请输入要美化的SQL样本`)
    return
  }
  try {
    sqlResult.value = format(sql.value, { language: 'mysql' })
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

const clear=()=>{
  sqlResult.value = ''
  sql.value = ''
}
</script>

<style scoped lang="scss">
:deep(.el-textarea__inner) {
  resize: none;
}
</style>
