<template>
  <h2 class="m-y-20px">文本差异对比</h2>

  <el-row :gutter="20">
    <el-col :span="12">
      <div class="section-title">
        <span>原始文本</span>
        <el-button type="primary" link size="small" @click="loadExample">加载示例</el-button>
      </div>
      <el-input
        v-model="originalSql"
        type="textarea"
        :autosize="{ minRows: 15, maxRows: 20 }"
        placeholder="粘贴原始文本..."
      />
    </el-col>
    <el-col :span="12">
      <div class="section-title">
        <span>对比文本</span>
        <el-button type="primary" link size="small" @click="swapSql">交换内容</el-button>
      </div>
      <el-input
        v-model="compareSql"
        type="textarea"
        :autosize="{ minRows: 15, maxRows: 20 }"
        placeholder="粘贴对比文本..."
      />
    </el-col>
  </el-row>

  <el-row class="m-t-15px" justify="center" align="middle">
    <el-button type="primary" @click="compare">对比差异</el-button>
    <el-button @click="clear">清空</el-button>
    <el-divider direction="vertical" />
    <el-checkbox v-model="ignoreWhitespace">忽略空白</el-checkbox>
    <el-checkbox v-model="ignoreCase" class="m-l-10px">忽略大小写</el-checkbox>
    <el-divider direction="vertical" />
    <span class="view-label">视图模式：</span>
    <el-radio-group v-model="viewMode" size="small">
      <el-radio-button label="unified">合并视图</el-radio-button>
      <el-radio-button label="split">并排视图</el-radio-button>
    </el-radio-group>
  </el-row>

  <el-row class="m-t-20px">
    <el-col :span="24">
      <div class="section-title">
        <span>对比结果</span>
        <div v-if="diffResult.length > 0" class="result-actions">
          <el-tag type="success" size="small">+{{ stats.added }}</el-tag>
          <el-tag type="danger" size="small" class="m-l-5px">-{{ stats.removed }}</el-tag>
          <el-tag type="info" size="small" class="m-l-5px">={{ stats.unchanged }}</el-tag>
          <el-button type="primary" link size="small" class="m-l-15px" @click="copyDiffResult">复制结果</el-button>
        </div>
      </div>

      <!-- 合并视图 -->
      <div v-if="viewMode === 'unified'" class="diff-container" v-show="diffResult.length > 0">
        <div class="diff-line" v-for="(line, index) in diffResult" :key="index" :class="line.type">
          <span class="line-num old-num">{{ line.oldNum || '' }}</span>
          <span class="line-num new-num">{{ line.newNum || '' }}</span>
          <span class="line-type">{{ getLineTypeSymbol(line.type) }}</span>
          <span class="line-content" v-html="highlightLine(line)"></span>
        </div>
      </div>

      <!-- 并排视图 -->
      <div v-else class="diff-split-container" v-show="diffResult.length > 0">
        <div class="diff-split-panel">
          <div class="panel-header">原始文本</div>
          <div class="diff-split-content">
            <div class="diff-line" v-for="(line, index) in leftPanelLines" :key="'left-' + index" :class="line.type">
              <span class="line-num">{{ line.oldNum || '' }}</span>
              <span class="line-type">{{ getLineTypeSymbol(line.type === 'added' ? 'unchanged' : line.type) }}</span>
              <span class="line-content" v-html="highlightLine(line)"></span>
            </div>
          </div>
        </div>
        <div class="diff-split-panel">
          <div class="panel-header">对比文本</div>
          <div class="diff-split-content">
            <div class="diff-line" v-for="(line, index) in rightPanelLines" :key="'right-' + index" :class="line.type">
              <span class="line-num">{{ line.newNum || '' }}</span>
              <span class="line-type">{{ getLineTypeSymbol(line.type === 'removed' ? 'unchanged' : line.type) }}</span>
              <span class="line-content" v-html="highlightLine(line)"></span>
            </div>
          </div>
        </div>
      </div>

      <el-empty v-if="diffResult.length === 0" description="点击「对比差异」查看结果" />
    </el-col>
  </el-row>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { copyText } from '../../utils'

const originalSql = ref('')
const compareSql = ref('')
const ignoreWhitespace = ref(true)
const ignoreCase = ref(false)
const viewMode = ref<'unified' | 'split'>('split')

interface DiffLine {
  oldNum?: number
  newNum?: number
  type: 'added' | 'removed' | 'unchanged'
  content: string
  oldContent?: string
  newContent?: string
}

const diffResult = ref<DiffLine[]>([])
const leftPanelLines = ref<DiffLine[]>([])
const rightPanelLines = ref<DiffLine[]>([])
const stats = ref({
  added: 0,
  removed: 0,
  unchanged: 0
})

// 加载示例
const loadExample = () => {
  originalSql.value = `SELECT 
  u.id,
  u.name,
  u.email,
  o.order_id,
  o.total_amount
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE u.status = 1
  AND o.create_time > '2024-01-01'
ORDER BY u.id DESC
LIMIT 100;`

  compareSql.value = `SELECT 
  u.id,
  u.name,
  u.email,
  u.phone,
  o.order_id,
  o.total_amount,
  o.status AS order_status
FROM users u
INNER JOIN orders o ON u.id = o.user_id
WHERE u.status = 1
  AND o.create_time > '2024-01-01'
  AND o.status = 'paid'
ORDER BY u.id ASC
LIMIT 200;`
}

// 交换SQL
const swapSql = () => {
  const temp = originalSql.value
  originalSql.value = compareSql.value
  compareSql.value = temp
  // 如果已经有对比结果，重新对比
  if (diffResult.value.length > 0) {
    compare()
  }
}

// 预处理SQL
const preprocessSql = (sql: string): string[] => {
  let processed = sql
  
  if (ignoreCase.value) {
    processed = processed.toLowerCase()
  }
  
  if (ignoreWhitespace.value) {
    processed = processed.split('\n').map(line => line.trim()).join('\n')
  }
  
  return processed.split('\n')
}

// 使用LCS算法进行差异对比
const lcs = (arr1: string[], arr2: string[]): number[][] => {
  const m = arr1.length
  const n = arr2.length
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0))

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (arr1[i - 1] === arr2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])
      }
    }
  }

  return dp
}

// 回溯生成diff结果
const backtrack = (dp: number[][], arr1: string[], arr2: string[]): DiffLine[] => {
  const result: DiffLine[] = []
  let i = arr1.length
  let j = arr2.length
  let oldLineNum = 0
  let newLineNum = 0

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && arr1[i - 1] === arr2[j - 1]) {
      oldLineNum++
      newLineNum++
      result.unshift({
        oldNum: oldLineNum,
        newNum: newLineNum,
        type: 'unchanged',
        content: arr1[i - 1]
      })
      i--
      j--
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      newLineNum++
      result.unshift({
        newNum: newLineNum,
        type: 'added',
        content: arr2[j - 1]
      })
      j--
    } else if (i > 0) {
      oldLineNum++
      result.unshift({
        oldNum: oldLineNum,
        type: 'removed',
        content: arr1[i - 1]
      })
      i--
    }
  }

  return result
}

// 生成并排视图数据
const generateSplitView = (diff: DiffLine[]) => {
  const left: DiffLine[] = []
  const right: DiffLine[] = []

  for (const line of diff) {
    if (line.type === 'unchanged') {
      left.push({ ...line, type: 'unchanged' })
      right.push({ ...line, type: 'unchanged' })
    } else if (line.type === 'removed') {
      left.push({ ...line, type: 'removed' })
    } else if (line.type === 'added') {
      right.push({ ...line, type: 'added' })
    }
  }

  // 对齐左右面板行数
  const maxLen = Math.max(left.length, right.length)
  while (left.length < maxLen) {
    left.push({ type: 'unchanged', content: '' })
  }
  while (right.length < maxLen) {
    right.push({ type: 'unchanged', content: '' })
  }

  leftPanelLines.value = left
  rightPanelLines.value = right
}

// 对比差异
const compare = () => {
  if (!originalSql.value || !compareSql.value) {
    return ElMessage.warning('请输入原始文本和对比文本')
  }

  const lines1 = preprocessSql(originalSql.value)
  const lines2 = preprocessSql(compareSql.value)

  const dp = lcs(lines1, lines2)
  diffResult.value = backtrack(dp, lines1, lines2)

  // 生成并排视图数据
  generateSplitView(diffResult.value)

  // 统计
  stats.value = {
    added: diffResult.value.filter(l => l.type === 'added').length,
    removed: diffResult.value.filter(l => l.type === 'removed').length,
    unchanged: diffResult.value.filter(l => l.type === 'unchanged').length
  }

  ElMessage.success(`对比完成：${stats.value.added} 处新增，${stats.value.removed} 处删除`)
}

// 获取行类型符号
const getLineTypeSymbol = (type: string): string => {
  switch (type) {
    case 'added': return '+'
    case 'removed': return '-'
    default: return ' '
  }
}

// 高亮行内容（转义HTML并高亮差异字符）
const highlightLine = (line: DiffLine): string => {
  let content = escapeHtml(line.content)
  
  if (line.type === 'added') {
    return `<span class="highlight-added">${content}</span>`
  } else if (line.type === 'removed') {
    return `<span class="highlight-removed">${content}</span>`
  }
  return content
}

// 转义HTML
const escapeHtml = (str: string): string => {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

// 清空
const clear = () => {
  originalSql.value = ''
  compareSql.value = ''
  diffResult.value = []
  leftPanelLines.value = []
  rightPanelLines.value = []
  stats.value = { added: 0, removed: 0, unchanged: 0 }
}

// 复制对比结果
const copyDiffResult = () => {
  const text = diffResult.value.map(line => {
    const symbol = getLineTypeSymbol(line.type)
    return `${symbol} ${line.content}`
  }).join('\n')
  
  copyText(text)
  ElMessage.success('对比结果已复制到剪贴板')
}
</script>

<style scoped lang="scss">
.section-title {
  font-weight: bold;
  margin-bottom: 10px;
  color: #303133;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.result-actions {
  display: flex;
  align-items: center;
}

.view-label {
  font-size: 14px;
  color: #606266;
  margin-right: 10px;
}

.diff-container {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background: #fafafa;
  max-height: 450px;
  overflow-y: auto;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.6;
}

.diff-line {
  display: flex;
  padding: 1px 10px;
  
  &.added {
    background-color: #e6ffec;
    
    .line-type {
      color: #28a745;
      font-weight: bold;
    }
  }
  
  &.removed {
    background-color: #ffebe9;
    
    .line-type {
      color: #cb2431;
      font-weight: bold;
    }
  }
  
  &.unchanged {
    background-color: #ffffff;
  }

  &:hover {
    background-color: #f5f7fa;
  }
}

.line-num {
  width: 35px;
  color: #909399;
  text-align: right;
  padding-right: 8px;
  user-select: none;
  font-size: 12px;
  flex-shrink: 0;

  &.old-num {
    border-right: 1px solid #e4e7ed;
    margin-right: 5px;
  }

  &.new-num {
    margin-right: 5px;
  }
}

.line-type {
  width: 16px;
  text-align: center;
  flex-shrink: 0;
  color: #c0c4cc;
}

.line-content {
  flex: 1;
  white-space: pre;
  overflow: hidden;
  text-overflow: ellipsis;
}

.highlight-added {
  color: #22863a;
}

.highlight-removed {
  color: #cb2431;
  text-decoration: line-through;
}

// 并排视图样式
.diff-split-container {
  display: flex;
  gap: 1px;
  background: #dcdfe6;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
  max-height: 450px;
}

.diff-split-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #fff;
}

.panel-header {
  background: #f5f7fa;
  padding: 8px 12px;
  font-weight: bold;
  font-size: 13px;
  color: #606266;
  border-bottom: 1px solid #e4e7ed;
}

.diff-split-content {
  flex: 1;
  overflow-y: auto;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.6;

  .diff-line {
    padding: 1px 10px;
    display: flex;

    .line-num {
      width: 35px;
      min-width: 35px;
    }
  }
}

.m-l-5px {
  margin-left: 5px;
}

.m-l-10px {
  margin-left: 10px;
}

.m-l-15px {
  margin-left: 15px;
}

.m-t-15px {
  margin-top: 15px;
}

.m-t-20px {
  margin-top: 20px;
}
</style>
