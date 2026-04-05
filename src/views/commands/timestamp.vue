<template>
  <h2 class="m-y-20px">日期转换工具</h2>

  <el-form label-position="left" label-width="110px">
    <!-- 基础设置 -->
    <div class="flex flex-wrap gap-x-8">
      <el-form-item label="时间戳单位">
        <el-radio-group v-model="timestampUnit" class="timestamp-radio-group">
          <el-radio-button value="nanosecond">纳秒</el-radio-button>
          <el-radio-button value="millisecond">毫秒</el-radio-button>
          <el-radio-button value="second">秒</el-radio-button>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="时区" class="w-310px">
        <el-select placeholder="请选择时区" filterable v-model="timezone">
          <el-option v-for="tz in timezones" :key="tz.value" :value="tz.value" :label="tz.label" />
        </el-select>
      </el-form-item>
    </div>

    <!-- 当前时间 -->
    <el-divider content-position="left">当前时间</el-divider>
    <div class="flex gap-8 mb-20px flex-wrap">
      <div class="flex items-center gap-2">
        <span class="text-gray-500 text-sm">时间戳：</span>
        <span class="result-text" @click="handleCopy(currentTimestamp)" title="点击复制">{{ currentTimestamp }}</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-gray-500 text-sm">日期：</span>
        <span class="result-text" @click="handleCopy(currentDateTime)" title="点击复制">{{ currentDateTime }}</span>
      </div>
    </div>

    <!-- 日期 → 时间戳 -->
    <el-divider content-position="left">日期 → 时间戳</el-divider>
    <el-form-item label="选择日期">
      <div class="input-with-result">
        <el-date-picker
          v-model="dateInput"
          type="datetime"
          placeholder="请选择日期时间"
          format="YYYY-MM-DD HH:mm:ss"
          value-format="YYYY-MM-DD HH:mm:ss"
          :default-time="defaultTime"
        />
        <span v-if="dateToTimestampResult" class="result-text" @click="handleCopy(dateToTimestampResult)" title="点击复制">
          {{ dateToTimestampResult }}
        </span>
      </div>
    </el-form-item>

    <!-- 时间戳 → 日期 -->
    <el-divider content-position="left">时间戳 → 日期</el-divider>
    <el-form-item label="输入时间戳">
      <div class="input-with-result">
        <el-input
          v-model="timestampInput"
          type="number"
          placeholder="请输入时间戳"
          clearable
          class="w-300px"
        />
        <span v-if="timestampToDateResult" class="result-text" @click="handleCopy(timestampToDateResult)" title="点击复制">
          {{ timestampToDateResult }}
        </span>
      </div>
    </el-form-item>

    <!-- 日期格式转换 -->
    <el-divider content-position="left">日期格式转换</el-divider>
    <div class="flex gap-4 items-start flex-wrap">
      <el-form-item label="目标格式" class="w-360px">
        <el-select placeholder="请选择目标日期格式" filterable v-model="targetDateFormat" allow-create>
          <el-option label="YYYY-MM-DD HH:mm:ss" value="YYYY-MM-DD HH:mm:ss" />
          <el-option label="YYYY-MM-DD" value="YYYY-MM-DD" />
          <el-option label="YYYY/MM/DD HH:mm:ss" value="YYYY/MM/DD HH:mm:ss" />
          <el-option label="YYYY年MM月DD日 HH:mm:ss" value="YYYY年MM月DD日 HH:mm:ss" />
          <el-option label="MM/DD/YYYY HH:mm:ss" value="MM/DD/YYYY HH:mm:ss" />
          <el-option label="DD-MM-YYYY HH:mm:ss" value="DD-MM-YYYY HH:mm:ss" />
        </el-select>
      </el-form-item>
    </div>
    <el-form-item label="输入日期">
      <div class="input-with-result">
        <el-input v-model="formatSourceInput" placeholder="请输入日期" class="w-300px" />
        <span v-if="formatConversionResult" class="result-text" @click="handleCopy(formatConversionResult)" title="点击复制">
          {{ formatConversionResult }}
        </span>
      </div>
    </el-form-item>
  </el-form>

  <div class="m-y-20px flex justify-end">
    <el-button @click="clear">清 空</el-button>
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { copyText } from '../../utils'
import { useRoute } from 'vue-router'

// 时区列表
const timezones = ref([
  { label: 'UTC+08:00 | 北京', value: 'Asia/Shanghai' },
  { label: 'UTC+09:00 | 东京', value: 'Asia/Tokyo' },
  { label: 'UTC+09:00 | 首尔', value: 'Asia/Seoul' },
  { label: 'UTC+05:30 | 孟买', value: 'Asia/Kolkata' },
  { label: 'UTC+00:00 | 伦敦', value: 'Europe/London' },
  { label: 'UTC+01:00 | 巴黎', value: 'Europe/Paris' },
  { label: 'UTC+01:00 | 柏林', value: 'Europe/Berlin' },
  { label: 'UTC-05:00 | 纽约', value: 'America/New_York' },
  { label: 'UTC-06:00 | 芝加哥', value: 'America/Chicago' },
  { label: 'UTC-07:00 | 丹佛', value: 'America/Denver' },
  { label: 'UTC-08:00 | 洛杉矶', value: 'America/Los_Angeles' },
  { label: 'UTC-03:00 | 圣保罗', value: 'America/Sao_Paulo' },
  { label: 'UTC+10:00 | 悉尼', value: 'Australia/Sydney' },
])

// 表单数据
const timestampUnit = ref('millisecond')
const timezone = ref('Asia/Shanghai')
const dateInput = ref('')
const timestampInput = ref('')
const dateToTimestampResult = ref('')
const timestampToDateResult = ref('')
const targetDateFormat = ref('YYYY/MM/DD HH:mm:ss')
const formatSourceInput = ref('')
const formatConversionResult = ref('')
const currentTimestamp = ref('')
const currentDateTime = ref('')

// 默认时间
const defaultTime = new Date(2000, 1, 1, 12, 0, 0)

// 结果日期显示格式
const resultDateFormat = 'YYYY-MM-DD HH:mm:ss'

// 定时器
let timer: number | null = null

const route = useRoute()

onMounted(() => {
  const payload = route.query?.payload
  if (payload) {
    const value = typeof payload === 'string' ? payload : JSON.stringify(payload)
    if (/^\d+$/.test(value)) {
      timestampInput.value = value
    }
  }
  updateCurrentTime()
  timer = window.setInterval(updateCurrentTime, 1000)
})

onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
  }
})

// 更新当前时间
const updateCurrentTime = () => {
  const now = new Date()
  currentTimestamp.value = getTimestampByUnit(now, timestampUnit.value).toString()
  currentDateTime.value = formatDateByTimezone(now, timezone.value, resultDateFormat)
}

// 根据单位获取时间戳
const getTimestampByUnit = (date: Date, unit: string): number => {
  const ms = date.getTime()
  switch (unit) {
    case 'second':
      return Math.floor(ms / 1000)
    case 'nanosecond':
      return ms * 1000000
    case 'millisecond':
    default:
      return ms
  }
}

// 根据时区格式化日期
const formatDateByTimezone = (date: Date, tz: string, format: string): string => {
  try {
    const formatter = new Intl.DateTimeFormat('zh-CN', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
    const parts = formatter.formatToParts(date)
    const partMap: Record<string, string> = {}
    parts.forEach(part => { partMap[part.type] = part.value })

    return format
      .replace('YYYY', partMap['year'] ?? '')
      .replace('MM', partMap['month'] ?? '')
      .replace('DD', partMap['day'] ?? '')
      .replace('HH', partMap['hour'] ?? '')
      .replace('mm', partMap['minute'] ?? '')
      .replace('ss', partMap['second'] ?? '')
  } catch {
    return date.toLocaleString('zh-CN', { timeZone: tz })
  }
}

// 日期 → 时间戳（自动）
const convertDateToTimestamp = () => {
  if (!dateInput.value) {
    dateToTimestampResult.value = ''
    return
  }
  const date = new Date(dateInput.value)
  if (isNaN(date.getTime())) {
    dateToTimestampResult.value = ''
    return
  }
  dateToTimestampResult.value = getTimestampByUnit(date, timestampUnit.value).toString()
  copyText(dateToTimestampResult.value)
  ElMessage.success('已复制到剪贴板')
}

// 时间戳 → 日期（自动）
const convertTimestampToDate = () => {
  if (!timestampInput.value) {
    timestampToDateResult.value = ''
    return
  }
  const timestamp = parseInt(timestampInput.value)
  if (isNaN(timestamp)) {
    timestampToDateResult.value = ''
    return
  }
  let ms: number
  switch (timestampUnit.value) {
    case 'second':
      ms = timestamp * 1000
      break
    case 'nanosecond':
      ms = timestamp / 1000000
      break
    default:
      ms = timestamp
  }
  const date = new Date(ms)
  if (isNaN(date.getTime())) {
    timestampToDateResult.value = ''
    return
  }
  timestampToDateResult.value = formatDateByTimezone(date, timezone.value, resultDateFormat)
  copyText(timestampToDateResult.value)
  ElMessage.success('已复制到剪贴板')
}

// 自动检测日期格式
const detectDateFormat = (dateStr: string): string | null => {
  const patterns = [
    { regex: /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/, format: 'YYYY-MM-DD HH:mm:ss' },
    { regex: /^\d{4}-\d{2}-\d{2}$/, format: 'YYYY-MM-DD' },
    { regex: /^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2}$/, format: 'YYYY/MM/DD HH:mm:ss' },
    { regex: /^\d{4}\/\d{2}\/\d{2}$/, format: 'YYYY/MM/DD' },
    { regex: /^\d{4}年\d{2}月\d{2}日 \d{2}:\d{2}:\d{2}$/, format: 'YYYY年MM月DD日 HH:mm:ss' },
    { regex: /^\d{4}年\d{2}月\d{2}日$/, format: 'YYYY年MM月DD日' },
    { regex: /^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}$/, format: 'MM/DD/YYYY HH:mm:ss' },
    { regex: /^\d{2}\/\d{2}\/\d{4}$/, format: 'MM/DD/YYYY' },
    { regex: /^\d{2}-\d{2}-\d{4} \d{2}:\d{2}:\d{2}$/, format: 'DD-MM-YYYY HH:mm:ss' },
    { regex: /^\d{2}-\d{2}-\d{4}$/, format: 'DD-MM-YYYY' },
    { regex: /^\d{4}\.\d{2}\.\d{2} \d{2}:\d{2}:\d{2}$/, format: 'YYYY.MM.DD HH:mm:ss' },
    { regex: /^\d{4}\.\d{2}\.\d{2}$/, format: 'YYYY.MM.DD' },
  ]

  for (const pattern of patterns) {
    if (pattern.regex.test(dateStr.trim())) {
      return pattern.format
    }
  }
  return null
}

// 日期格式转换（自动）
const convertDateFormat = () => {
  if (!formatSourceInput.value || !targetDateFormat.value) {
    formatConversionResult.value = ''
    return
  }
  const detectedFormat = detectDateFormat(formatSourceInput.value)
  if (!detectedFormat) {
    formatConversionResult.value = ''
    return
  }
  const date = parseDateByFormat(formatSourceInput.value, detectedFormat)
  if (!date || isNaN(date.getTime())) {
    formatConversionResult.value = ''
    return
  }
  formatConversionResult.value = formatDateByTimezone(date, timezone.value, targetDateFormat.value)
  copyText(formatConversionResult.value)
  ElMessage.success('已复制到剪贴板')
}

// 根据格式解析日期
const parseDateByFormat = (dateStr: string, format: string): Date | null => {
  try {
    const normalizedFormat = format.replace(/[年月日]/g, '-').replace(/[:/\s]/g, '-')
    const normalizedDate = dateStr.replace(/[年月日]/g, '-').replace(/[:/\s]/g, '-')

    const formatParts = normalizedFormat.split('-').filter(p => p)
    const dateParts = normalizedDate.split('-').filter(p => p)

    if (formatParts.length !== dateParts.length) return null

    let year = '1970', month = '01', day = '01', hour = '00', minute = '00', second = '00'

    for (let i = 0; i < formatParts.length; i++) {
      const part = formatParts[i]
      const value = dateParts[i]
      if (part.includes('YYYY')) year = value
      else if (part.includes('MM')) month = value
      else if (part.includes('DD')) day = value
      else if (part.includes('HH')) hour = value
      else if (part.includes('mm')) minute = value
      else if (part.includes('ss')) second = value
    }

    return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`)
  } catch {
    return null
  }
}

// 点击复制
const handleCopy = (text: string) => {
  if (!text) return
  copyText(text)
  ElMessage.success('已复制到剪贴板')
}

// 清空
const clear = () => {
  dateInput.value = ''
  timestampInput.value = ''
  dateToTimestampResult.value = ''
  timestampToDateResult.value = ''
  formatSourceInput.value = ''
  formatConversionResult.value = ''
  ElMessage.success('已清空')
}

// 自动转换监听
watch(dateInput, convertDateToTimestamp)
watch(timestampInput, convertTimestampToDate)
watch(formatSourceInput, convertDateFormat)

watch(targetDateFormat, convertDateFormat)
watch(timestampUnit, () => {
  convertDateToTimestamp()
  convertTimestampToDate()
  updateCurrentTime()
})
watch(timezone, () => {
  convertTimestampToDate()
  convertDateFormat()
  updateCurrentTime()
})
</script>

<style scoped lang="scss">
.input-with-result {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 12px;
}

.result-text {
  font-size: 14px;
  color: var(--el-color-primary);
  white-space: nowrap;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
  transition: background-color 0.2s;
  user-select: none;

  &:hover {
    background-color: var(--el-color-primary-light-9);
  }

  &:active {
    background-color: var(--el-color-primary-light-7);
  }
}

.timestamp-radio-group {
  :deep(.el-radio-button__inner) {
    padding: 8px 18px;
  }
}
</style>
