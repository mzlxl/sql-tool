<template>
  <h2 class="m-y-20px">EXCEL转SQL</h2>
  <el-form label-position="left" label-width="120px">
    <el-form-item label="选择文件：" class="w-600px">
      <el-button @click="openFile">
        <el-icon style="margin-right: 5px">
          <Folder/>
        </el-icon>
        选择EXCEL文件
      </el-button>
      <span class="truncate-text" style="line-height: 32px;margin-left: 20px;color: #888">{{fileDesc}}</span>
    </el-form-item>
    <el-form-item label="生成SQL类型：" class="w-600px">
        <span slot="label" style="position: absolute;left: -25px;top:2px">
        <el-tooltip class="item" effect="dark"
                    :content="tips"
                    placement="top" style="position: fixed">
          <el-icon><Warning/> </el-icon>
        </el-tooltip>
      </span>
      <el-select placeholder="请选择生成SQL类型" filterable v-model="type" class="w-150px">
        <el-option v-for="item in types" :key="item.type" :value="item.type"
                   :label="item.name" @change="typeChange"></el-option>
      </el-select>
    </el-form-item>
    <el-form-item label="生成结果：" style="width: 600px">
      <el-input type="textarea" v-model="result" placeholder="请选择EXCEL文件生成SQL语句" disabled
                :autosize="{ minRows: 15, maxRows: 15 }"></el-input>
    </el-form-item>
  </el-form>
  <el-row style="margin-top: 20px">
    <el-button @click="clear" style="position: absolute;right: 150px">清空</el-button>
    <el-button @click="copySql" style="position: absolute;right: 26px">复制结果</el-button>
  </el-row>
</template>

<script setup lang="ts">
import {ElMessage} from 'element-plus'
import {copyText, json2sql} from '../../utils'
import * as XLSX from 'xlsx';

const types = ref([{name: 'INSERT', type: 'INSERT'},
  {name: 'UPDATE', type: 'UPDATE'}, {name: 'DELETE', type: 'DELETE'}])
const type = ref('INSERT')
const fileDesc = ref('只支持xlsx, xls文件格式 111111111111111111111111111111111111111111111')
const tips = ref('INSERT:表头为字段名，内容行则为插入数据部分')
const result = ref('')

const openFile = () => {
  let filePaths: string[] | undefined = utools.showOpenDialog({
    title: '选择Excel文件',
    properties: ['openFile'],
    filters: [
      {name: 'Excel文件', extensions: ['xlsx', 'xls']}
    ]
  })
  if (!filePaths || filePaths.length <= 0) {
    return
  }
  if (filePaths.length > 1) {
    return ElMessage.info('请先选择单个excel文件')
  }
  parseJsonByFile(filePaths[0]);
}

function parseJsonByFile(filePath: string) {

  fileDesc.value = filePath

  // 读取 Excel 文件
  const workbook = XLSX.readFile(filePath);

  // 假设 Excel 文件中只有一个表单（sheet），你可以根据实际情况进行调整
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  // 将 Excel 表单数据转换为 JSON
  const jsonData = XLSX.utils.sheet_to_json(sheet);
  let sql = json2sql(jsonData)
  result.value = sql ? sql : ''
  console.log(jsonData);
  console.log(sql);
}

const typeChange = () => {
  if (type.value === 'UPDATE') {
    tips.value = 'UPDATE:在INSERT规范上增加了一列，列名必须为WHERE或where，更新语句中将会以该列作为更新条件'
  } else if (type.value === 'DELETE') {
    tips.value = 'DELETE:表头为字段名，内容行则为删除的where条件'
  } else {
    tips.value = 'INSERT:表头为字段名，内容行则为插入数据部分'
  }
}

const copySql = () => {
  if (!result.value || result.value.trim() == '') {
    return ElMessage.info('请先选择excel文件生成SQL')
  }
  copyText(result.value.trim())
  ElMessage.success('复制成功')
}

const clear = () => {
  result.value = ''
  fileDesc.value = '只支持xlsx, xls文件格式'
}

</script>

<style scoped lang="scss">
.truncate-text {
  white-space: nowrap;     /* 防止文本换行 */
  overflow: hidden;       /* 隐藏超出容器的部分 */
  text-overflow: ellipsis; /* 显示省略号 */
  width: 300px;           /* 设置容器的宽度，适应你的需求 */
}
</style>
