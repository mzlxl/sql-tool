<template>
  <h2 class="m-y-20px">时间戳转日期 SQL</h2>

  <el-form label-position="left" label-width="110px">
    <!-- 数据库选择 -->
    <div class="flex flex-wrap gap-x-8">
      <el-form-item label="数据库类型">
        <el-radio-group v-model="databaseType" class="db-radio-group">
          <el-radio-button value="mysql">MySQL</el-radio-button>
          <el-radio-button value="hive">Hive</el-radio-button>
          <el-radio-button value="doris">Doris</el-radio-button>
          <el-radio-button value="postgresql">PostgreSQL</el-radio-button>
          <el-radio-button value="oracle">Oracle</el-radio-button>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="时间戳单位">
        <el-radio-group v-model="timestampUnit" class="timestamp-radio-group">
          <el-radio-button value="nanosecond">纳秒</el-radio-button>
          <el-radio-button value="millisecond">毫秒</el-radio-button>
          <el-radio-button value="second">秒</el-radio-button>
        </el-radio-group>
      </el-form-item>
    </div>

    <!-- 目标格式 -->
    <el-form-item label="目标格式" class="w-400px">
      <el-select placeholder="请选择目标日期格式" filterable v-model="targetDateFormat" allow-create>
        <el-option label="YYYY-MM-DD HH:mm:ss" value="YYYY-MM-DD HH:mm:ss" />
        <el-option label="YYYY-MM-DD" value="YYYY-MM-DD" />
        <el-option label="YYYY/MM/DD HH:mm:ss" value="YYYY/MM/DD HH:mm:ss" />
        <el-option label="YYYY/MM/DD" value="YYYY/MM/DD" />
        <el-option label="MM/DD/YYYY HH:mm:ss" value="MM/DD/YYYY HH:mm:ss" />
        <el-option label="DD-MM-YYYY HH:mm:ss" value="DD-MM-YYYY HH:mm:ss" />
        <el-option label="YYYYMMDD" value="YYYYMMDD" />
        <el-option label="YYYYMMDDHHmmss" value="YYYYMMDDHHmmss" />
      </el-select>
    </el-form-item>

    <!-- 字段输入 -->
    <el-form-item label="快捷选择">
      <div class="quick-buttons">
        <el-button
          v-for="field in quickFields"
          :key="field"
          size="small"
          :type="fieldName === field ? 'primary' : 'default'"
          @click="fieldName = field"
        >
          {{ field }}
        </el-button>
      </div>
    </el-form-item>
    <el-form-item label="字段名">
      <div class="input-with-result">
        <el-input
          v-model="fieldName"
          placeholder="请输入字段名，如 create_time"
          clearable
          class="w-300px"
        />
      </div>
    </el-form-item>

    <!-- 生成结果 -->
    <el-form-item label="SQL 语句">
      <div class="result-container">
        <el-input
          v-model="generatedSQL"
          type="textarea"
          :rows="3"
          placeholder="生成的 SQL 将显示在这里"
          class="sql-textarea"
        />
        <div class="result-actions">
          <el-button type="primary" @click="handleCopy" :disabled="!generatedSQL">
            <el-icon><DocumentCopy /></el-icon>
            复制
          </el-button>
          <el-button @click="clear" plain>清 空</el-button>
        </div>
      </div>
    </el-form-item>

    <!-- 格式说明 -->
    <el-divider content-position="left">格式说明</el-divider>
    <div class="format-tips">
      <div class="tip-item" v-for="tip in formatTips" :key="tip.db">
        <span class="db-name">{{ tip.db }}:</span>
        <code class="format-example">{{ tip.example }}</code>
      </div>
    </div>
  </el-form>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { DocumentCopy } from '@element-plus/icons-vue'
import { copyText } from '../../utils'

// 数据库类型
const databaseType = ref('mysql')

// 时间戳单位
const timestampUnit = ref('millisecond')

// 目标日期格式
const targetDateFormat = ref('YYYY-MM-DD HH:mm:ss')

// 字段名
const fieldName = ref('')

// 生成的 SQL
const generatedSQL = ref('')

// 快捷字段列表
const quickFields = [
  'create_time',
  'update_time',
  'delete_time',
  'created_at',
  'updated_at',
  'deleted_at',
  'publish_time',
  'start_time',
  'end_time',
]

// 格式说明
const formatTips = computed(() => {
  const tips: Record<string, { db: string; example: string }> = {
    mysql: {
      db: 'MySQL',
      example: "FROM_UNIXTIME(field, '%Y-%m-%d %H:%i:%s')",
    },
    hive: {
      db: 'Hive',
      example: "FROM_UNIXTIME(field, 'yyyy-MM-dd HH:mm:ss')",
    },
    doris: {
      db: 'Doris',
      example: "FROM_UNIXTIME(field, '%Y-%m-%d %H:%i:%s')",
    },
    postgresql: {
      db: 'PostgreSQL',
      example: "TO_CHAR(TO_TIMESTAMP(field), 'YYYY-MM-DD HH24:MI:SS')",
    },
    oracle: {
      db: 'Oracle',
      example: "TO_CHAR(TO_DATE('1970-01-01','YYYY-MM-DD') + field / 86400, 'YYYY-MM-DD HH24:MI:SS')",
    },
  }
  return tips
})

// 格式映射：通用格式 -> 数据库特定格式
const formatMappings: Record<string, Record<string, string>> = {
  mysql: {
    'YYYY-MM-DD HH:mm:ss': '%Y-%m-%d %H:%i:%s',
    'YYYY-MM-DD': '%Y-%m-%d',
    'YYYY/MM/DD HH:mm:ss': '%Y/%m/%d %H:%i:%s',
    'YYYY/MM/DD': '%Y/%m/%d',
    'MM/DD/YYYY HH:mm:ss': '%m/%d/%Y %H:%i:%s',
    'DD-MM-YYYY HH:mm:ss': '%d-%m-%Y %H:%i:%s',
    'YYYYMMDD': '%Y%m%d',
    'YYYYMMDDHHmmss': '%Y%m%d%H%i%s',
  },
  hive: {
    'YYYY-MM-DD HH:mm:ss': 'yyyy-MM-dd HH:mm:ss',
    'YYYY-MM-DD': 'yyyy-MM-dd',
    'YYYY/MM/DD HH:mm:ss': 'yyyy/MM/dd HH:mm:ss',
    'YYYY/MM/DD': 'yyyy/MM/dd',
    'MM/DD/YYYY HH:mm:ss': 'MM/dd/yyyy HH:mm:ss',
    'DD-MM-YYYY HH:mm:ss': 'dd-MM-yyyy HH:mm:ss',
    'YYYYMMDD': 'yyyyMMdd',
    'YYYYMMDDHHmmss': 'yyyyMMddHHmmss',
  },
  doris: {
    'YYYY-MM-DD HH:mm:ss': '%Y-%m-%d %H:%i:%s',
    'YYYY-MM-DD': '%Y-%m-%d',
    'YYYY/MM/DD HH:mm:ss': '%Y/%m/%d %H:%i:%s',
    'YYYY/MM/DD': '%Y/%m/%d',
    'MM/DD/YYYY HH:mm:ss': '%m/%d/%Y %H:%i:%s',
    'DD-MM-YYYY HH:mm:ss': '%d-%m-%Y %H:%i:%s',
    'YYYYMMDD': '%Y%m%d',
    'YYYYMMDDHHmmss': '%Y%m%d%H%i%s',
  },
  postgresql: {
    'YYYY-MM-DD HH:mm:ss': 'YYYY-MM-DD HH24:MI:SS',
    'YYYY-MM-DD': 'YYYY-MM-DD',
    'YYYY/MM/DD HH:mm:ss': 'YYYY/MM/DD HH24:MI:SS',
    'YYYY/MM/DD': 'YYYY/MM/DD',
    'MM/DD/YYYY HH:mm:ss': 'MM/DD/YYYY HH24:MI:SS',
    'DD-MM-YYYY HH:mm:ss': 'DD-MM-YYYY HH24:MI:SS',
    'YYYYMMDD': 'YYYYMMDD',
    'YYYYMMDDHHmmss': 'YYYYMMDDHH24MISS',
  },
  oracle: {
    'YYYY-MM-DD HH:mm:ss': 'YYYY-MM-DD HH24:MI:SS',
    'YYYY-MM-DD': 'YYYY-MM-DD',
    'YYYY/MM/DD HH:mm:ss': 'YYYY/MM/DD HH24:MI:SS',
    'YYYY/MM/DD': 'YYYY/MM/DD',
    'MM/DD/YYYY HH:mm:ss': 'MM/DD/YYYY HH24:MI:SS',
    'DD-MM-YYYY HH:mm:ss': 'DD-MM-YYYY HH24:MI:SS',
    'YYYYMMDD': 'YYYYMMDD',
    'YYYYMMDDHHmmss': 'YYYYMMDDHH24MISS',
  },
}

// 获取时间戳字段表达式（根据单位转换）
const getTimestampField = (field: string): string => {
  switch (timestampUnit.value) {
    case 'millisecond':
      return `${field} / 1000`
    case 'nanosecond':
      return `${field} / 1000000000`
    case 'second':
    default:
      return field
  }
}

// 生成 SQL
const generateSQL = () => {
  if (!fieldName.value.trim()) {
    generatedSQL.value = ''
    return
  }

  const field = fieldName.value.trim()
  const timestampField = getTimestampField(field)
  const format = targetDateFormat.value
  const dbFormat = formatMappings[databaseType.value]?.[format] || format

  switch (databaseType.value) {
    case 'mysql':
      generatedSQL.value = `FROM_UNIXTIME(${timestampField}, '${dbFormat}')`
      break
    case 'hive':
      generatedSQL.value = `FROM_UNIXTIME(${timestampField}, '${dbFormat}')`
      break
    case 'doris':
      generatedSQL.value = `FROM_UNIXTIME(${timestampField}, '${dbFormat}')`
      break
    case 'postgresql':
      generatedSQL.value = `TO_CHAR(TO_TIMESTAMP(${timestampField}), '${dbFormat}')`
      break
    case 'oracle':
      generatedSQL.value = `TO_CHAR(TO_DATE('1970-01-01','YYYY-MM-DD') + ${timestampField} / 86400, '${dbFormat}')`
      break
    default:
      generatedSQL.value = ''
  }

  // 自动复制
  if (generatedSQL.value) {
    copyText(generatedSQL.value)
    ElMessage.success('已生成并复制到剪贴板')
  }
}

// 点击复制
const handleCopy = () => {
  if (!generatedSQL.value) return
  copyText(generatedSQL.value)
  ElMessage.success('已复制到剪贴板')
}

// 清空
const clear = () => {
  fieldName.value = ''
  generatedSQL.value = ''
  ElMessage.success('已清空')
}

// 监听变化自动生成
watch([fieldName, targetDateFormat, databaseType, timestampUnit], generateSQL)
</script>

<style scoped lang="scss">
.input-with-result {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 12px;
}

.quick-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;

  .el-button {
    width: 74px;
    height: 32px;
  }
}

.result-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  max-width: 600px;
}

.sql-textarea {
  :deep(.el-textarea__inner) {
    font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
    font-size: 14px;
  }
}

.result-actions {
  display: flex;
  gap: 8px;
}

.format-tips {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  background-color: var(--el-fill-color-light);
  border-radius: 4px;
}

.tip-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.db-name {
  font-weight: 500;
  min-width: 80px;
  color: var(--el-text-color-secondary);
}

.format-example {
  font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
  font-size: 12px;
  padding: 2px 6px;
  background-color: var(--el-fill-color);
  border-radius: 3px;
  color: var(--el-color-primary);
}

.db-radio-group {
  :deep(.el-radio-button__inner) {
    padding: 8px 16px;
  }
}

.timestamp-radio-group {
  :deep(.el-radio-button__inner) {
    padding: 8px 18px;
  }
}
</style>
