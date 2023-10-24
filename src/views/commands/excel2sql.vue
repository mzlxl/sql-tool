<template>
  <h2 class="m-y-20px">EXCEL转SQL</h2>
  <el-upload
      class="upload-demo"
      drag
      action="#"
      accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
      :before-upload="handleBeforeUpload"
  >
    <el-icon class="el-icon--upload">
      <upload-filled/>
    </el-icon>
    <div class="el-upload__text">
      请拖入文件 或 <em>点击选择文件</em>
    </div>
    <template #tip>
      <div class="el-upload__tip">
        请选择后缀名为xlsx,xls的EXCEL文件，文件大小不超过100M
      </div>
    </template>
  </el-upload>
  <el-form label-position="left" label-width="120px" style="margin-top: 20px">
    <el-row>
      <el-col :span="12">
        <el-form-item label="生成SQL类型：" class="w-600px">
        <span slot="label" style="position: absolute;left: -25px;top:2px">
        <el-tooltip class="item" effect="dark"
                    content="下一个版本支持类型选择，敬请期待！"
                    placement="top" style="position: fixed">
          <el-icon><Warning/> </el-icon>
        </el-tooltip>
      </span>
          <el-select placeholder="请选择生成SQL类型" filterable v-model="type" class="w-150px" disabled>
            <el-option v-for="item in types" :key="item.type" :value="item.type"
                       :label="item.name" @change="typeChange"></el-option>
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="表名：" class="w-285px" label-width="55px">
          <el-input placeholder="请输入表名，不填时用xxx代替" v-model="tableName" clearable maxlength="20"></el-input>
        </el-form-item>
      </el-col>
    </el-row>

    <el-form-item label="SQL生成结果：" style="width: 600px">
      <el-input type="textarea" v-model="result" placeholder="请选择EXCEL文件生成SQL语句" disabled
                :autosize="{ minRows: 12, maxRows: 12 }"></el-input>
    </el-form-item>
  </el-form>
  <el-row style="margin-top: 20px">
    <el-button @click="clear" style="position: absolute;right: 130px">清空</el-button>
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
const tableName = ref('')
const tips = ref('INSERT:表头为字段名，内容行则为插入数据部分')
const result = ref('')
const maxSize = 100 * 1024 * 1024; // 100MB

const handleBeforeUpload = (file: File) => {
  showMainWindow()
  if (file.size > maxSize) {
    ElMessage.error('超过文件大小限制')
    return false; // 阻止文件上传
  }

  parseJsonByFile(file)
  return false
}

const showMainWindow = () => {
  //执行该方法将会显示 uTools 主窗口，包括此时正在主窗口运行的插件
  utools && utools.showMainWindow();
}

function parseJsonByFile(file: File) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const data = new Uint8Array(e.target?.result as ArrayBuffer);
    const workbook = XLSX.read(data, {type: 'array'});
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, {header: 1});

    const header: any = jsonData[0];
    const jsonDataWithoutHeader = jsonData.slice(1);

    const jsonDataWithHeaders = jsonDataWithoutHeader.map((row: any) => {
      const obj: any = {};
      header.forEach((col: any, index: any) => {
        obj[col] = row[index];
      });
      return obj;
    });
    let sql = json2sql({
      table: tableName.value.trim() ? tableName.value.trim() : 'xxx',
      data: jsonDataWithHeaders
    })
    result.value = sql ? sql : ''
  };
  reader.readAsArrayBuffer(file);
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
  tableName.value = ''
}

</script>

<style scoped lang="scss">
.truncate-text {
  white-space: nowrap; /* 防止文本换行 */
  overflow: hidden; /* 隐藏超出容器的部分 */
  text-overflow: ellipsis; /* 显示省略号 */
  width: 300px; /* 设置容器的宽度，适应你的需求 */
}
</style>
