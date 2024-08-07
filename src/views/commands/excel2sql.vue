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
      请拖入文件 或 <em>点击选择文件</em> 后缀必须是xlsx,xls
    </div>
    <template #tip>
      <div class="el-upload__tip">
        文件大小不超过{{ maxSize }}M，且只会读取第一个sheet前{{ maxRow }}行和前{{
          maxCol
        }}列数据，大文件读取可能导致窗口卡死。注意：单元格空值会输出空(null)，如果想输出空字符串，可在单元格填写''
      </div>
      <div class="el-upload__tip">
        单元格是日期格式：字段名.date 则转成yyyy-MM-dd格式，字段名.dateTime则转换成yyyy-MM-dd HH:mm:ss格式
      </div>
      <div class="el-upload__tip">
        字段名.date(format):则转换成对应的时间格式，支持格式：yyyy-MM-dd HH:mm:ss|yyyy-MM-dd HH:mm
        |yyyy-MM-dd|yyyy-MM|yyyyMM|yyyyMMdd，以上前提都是单元格必须是日期格式，若是其他格式则不做任何加工
      </div>
    </template>
  </el-upload>
  <el-form label-position="left" label-width="120px" style="margin-top: 20px">
    <el-row>
      <el-col :span="12">
        <el-form-item label="生成SQL类型：" class="w-600px">
        <span slot="label" style="position: absolute;left: -25px;top:2px">
        <el-tooltip class="item" effect="dark"
                    :content="tips"
                    placement="top" style="position: fixed">
          <el-icon><Warning/> </el-icon>
        </el-tooltip>
      </span>
          <el-select placeholder="请选择生成SQL类型" filterable v-model="type" class="w-150px" @change="typeChange">
            <el-option v-for="item in types" :key="item.type" :value="item.type"
                       :label="item.name"></el-option>
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
                :autosize="{ minRows: 8, maxRows: 12 }"></el-input>
    </el-form-item>
  </el-form>
  <el-row style="margin-top: 20px">
    <el-button @click="clear" style="position: absolute;right: 130px">清空</el-button>
    <el-button @click="copySql" style="position: absolute;right: 26px">复制结果</el-button>
  </el-row>
</template>

<script setup lang="ts">
import {ElMessage} from 'element-plus'
import {copyText, json2sql, isUtoolsEnv, isNumber} from '../../utils'
import * as XLSX from 'xlsx';

const types = ref([{name: 'INSERT', type: 'INSERT'},
  {name: 'UPDATE', type: 'UPDATE'}, {name: 'DELETE', type: 'DELETE'}])
const type = ref('INSERT')
const tableName = ref('')
const tips = ref('INSERT:表头为字段名，内容行则为插入数据部分')
const result = ref('')
const maxSize = 10; // 10MB
const maxRow = 10000
const maxCol = 30

const handleBeforeUpload = (file: File): boolean => {
  showMainWindow()
  if (file.size > maxSize * 1024 * 1024) {
    ElMessage.error('超过文件大小限制')
    return false; // 阻止文件上传
  }

  parseJsonByFile(file)
  return false
}

const showMainWindow = () => {
  //执行该方法将会显示 uTools 主窗口，包括此时正在主窗口运行的插件
  isUtoolsEnv() && utools.showMainWindow();
}

function parseJsonByFile(file: File) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const data = new Uint8Array(e.target?.result as ArrayBuffer);
    const workbook = XLSX.read(data, {type: 'array'});
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const sheetRange = worksheet['!ref']; // 区域范围字符串，例如 "A1:C20"
    if (!sheetRange) {
      return ElMessage.error('EXCEL文件读取失败，请重试')
    }
    // 解析区域范围字符串，获取起始行、起始列、结束行和结束列的索引
    const [startCell, endCell] = sheetRange.split(':');
    const startCol = XLSX.utils.decode_col(startCell.replace(/\d+/g, ''));
    const startRow = parseInt(startCell.replace(/\D+/g, '')) - 1;
    const endCol = XLSX.utils.decode_col(endCell.replace(/\d+/g, ''));
    const endRow = parseInt(endCell.replace(/\D+/g, '')) - 1;
    // 计算行数和列数
    const rowCount = endRow - startRow + 1;
    const colCount = endCol - startCol + 1;

    const range = {
      s: {r: 0, c: 0},
      e: {r: (maxRow > rowCount ? rowCount : maxRow) - 1, c: (maxCol > colCount ? colCount : maxCol) - 1}
    }; // { 起始行索引, 起始列索引, 结束行索引, 结束列索引 }
    if (rowCount > maxRow || colCount > maxCol) {
      ElMessage.info('超出行列读取限制，已为你自动截取最大行列读取数，请知晓')
    }

    const jsonData = XLSX.utils.sheet_to_json(worksheet, {header: 1, range: range});

    const header: any = jsonData[0];
    const jsonDataWithoutHeader = jsonData.slice(1);

    const jsonDataWithHeaders = jsonDataWithoutHeader.map((row: any) => {
      const obj: any = {};
      header.forEach((col: any, index: any) => {
        const format = extractStringFromBrackets(col)
        if (format) {
          obj[col.split('.date')[0]] = isNumber(row[index]) ? convertExcelDate(row[index], format) : row[index];
        } else if (col.endsWith('.date')) {
          obj[col.slice(0, -5)] = isNumber(row[index]) ? convertExcelDate(row[index], 'yyyy-MM-dd') : row[index];
        } else if (col.endsWith('.dateTime')) {
          obj[col.slice(0, -9)] = isNumber(row[index]) ? convertExcelDate(row[index], 'yyyy-MM-dd HH:mm:ss') : row[index];
        } else {
          obj[col] = row[index];
        }
      });
      return obj;
    });

    let sql = json2sql({
      table: tableName.value.trim() ? tableName.value.trim() : 'xxx',
      data: jsonDataWithHeaders
    }, type.value)
    result.value = sql ? sql : ''
    copySql()
  };
  reader.readAsArrayBuffer(file);
}

const extractStringFromBrackets = (str: string): string => {
  // 正则表达式匹配 .date(任意字符，非贪婪模式) 并捕获括号内的内容
  const regex = /date\(([^)]+)\)/;
  const match = str.match(regex);

  // 如果正则表达式匹配成功，返回括号内的字符串
  if (match && match[1]) {
    return match[1];
  } else {
    return '';
  }
}

const convertExcelDate = (excelDate: number, format: string): string | null => {
  if (!excelDate) {
    return null
  }
  // Excel日期1900年1月0日到1970年1月1日的天数
  const excelBaseDate = 25569;

  // 将Excel日期转换为从1970年1月1日开始的毫秒数(考虑时区差异)
  // const excelDateInMilliseconds = (excelDate - excelBaseDate) * 24 * 60 * 60 * 1000;
  const excelDateInMilliseconds = (excelDate - excelBaseDate) * 24 * 60 * 60 * 1000
  -(7 * 60 * 60 * 1000 + 59 * 60 * 1000 + 59 * 1000 + 999);

  // 创建一个新的日期对象，设置为1970年1月1日
  var baseDate = new Date(Date.UTC(1970, 0, 1));

  // 设置日期为1970年1月1日加上转换后的毫秒数
  var date = new Date(baseDate.getTime() + excelDateInMilliseconds);

  // 定义一个辅助函数来获取指定位数的日期部分
  var getFormattedPart = (value: any) => String(value).padStart(2, '0');
  // 定义一个辅助函数来获取毫秒部分
  var getMilliseconds = () => String(date.getUTCMilliseconds()).padStart(3, '0');
  // 根据目标格式返回格式化的日期字符串
  switch (format) {
    case 'yyyy-MM-dd HH:mm:ss':
      return `${date.getFullYear()}-${getFormattedPart(date.getMonth() + 1)}-${getFormattedPart(date.getDate())} ${getFormattedPart(date.getHours())}:${getFormattedPart(date.getMinutes())}:${getFormattedPart(date.getSeconds())}`;
    case 'yyyy-MM-dd HH:mm:ss.SSS':
      return `${date.getFullYear()}-${getFormattedPart(date.getMonth() + 1)}-${getFormattedPart(date.getDate())} ${getFormattedPart(date.getHours())}:${getFormattedPart(date.getMinutes())}:${getFormattedPart(date.getSeconds())}.${getMilliseconds()}`;
    case 'yyyy-MM-dd HH:mm':
      return `${date.getFullYear()}-${getFormattedPart(date.getMonth() + 1)}-${getFormattedPart(date.getDate())} ${getFormattedPart(date.getHours())}:${getFormattedPart(date.getMinutes())}`;
    case 'yyyy-MM-dd':
      return `${date.getFullYear()}-${getFormattedPart(date.getMonth() + 1)}-${getFormattedPart(date.getDate())}`;
    case 'yyyy-MM':
      return `${date.getFullYear()}-${getFormattedPart(date.getMonth() + 1)}`;
    case 'yyyyMM':
      return `${date.getFullYear()}${getFormattedPart(date.getMonth() + 1)}`;
    case 'yyyyMMdd':
      return `${date.getFullYear()}${getFormattedPart(date.getMonth() + 1)}${getFormattedPart(date.getDate())}`;
    default:
      ElMessage.error('日期格式不支持' + format)
      throw new Error('Unsupported format');
  }
}

const typeChange = () => {
  if (type.value === 'UPDATE') {
    tips.value = 'UPDATE:表头为字段名，内容行则为更新数据部分，通过在表头列增加.where后缀标识是更新where条件列'
  } else if (type.value === 'DELETE') {
    tips.value = 'DELETE:表头为字段名，内容行则为删除的where条件'
  } else {
    tips.value = 'INSERT:表头为字段名，内容行则为插入数据部分'
  }
  result.value = ''
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
