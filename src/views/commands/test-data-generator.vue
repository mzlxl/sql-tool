<template>
  <h2 class="m-y-20px">批量测试数据生成</h2>

  <el-row :gutter="20">
    <el-col :span="12">
      <div class="section-title">
        表结构定义
        <el-button size="small" link type="primary" style="margin-left: 10px" @click="loadExample">加载示例</el-button>
      </div>
      <el-input
        v-model="tableSchema"
        type="textarea"
        :autosize="{ minRows: 12, maxRows: 20 }"
        placeholder="输入建表语句或字段定义，例如：&#10;CREATE TABLE `user_info` (&#10;  `id` BIGINT NOT NULL AUTO_INCREMENT,&#10;  `user_name` VARCHAR(50),&#10;  `age` INT,&#10;  `email` VARCHAR(100),&#10;  `create_time` DATETIME,&#10;  PRIMARY KEY (`id`)&#10;);&#10;&#10;或直接输入字段列表：&#10;id, name, age, email, phone, create_time"
      />
    </el-col>
    <el-col :span="12">
      <div class="section-title">生成配置</div>
      <el-form :model="config" label-width="100px" size="small">
        <el-form-item label="表名">
          <el-input v-model="config.tableName" placeholder="自动识别或手动输入" />
        </el-form-item>
        <el-form-item label="生成条数">
          <el-input-number v-model="config.count" :min="1" :max="10000" />
        </el-form-item>
        <el-form-item label="SQL类型">
          <el-select v-model="config.sqlType" style="width: 100%">
            <el-option label="INSERT" value="INSERT" />
            <el-option label="UPDATE" value="UPDATE" />
          </el-select>
        </el-form-item>
        <el-form-item label="数据库类型">
          <el-select v-model="config.dbType" style="width: 100%">
            <el-option label="MySQL" value="mysql" />
            <el-option label="PostgreSQL" value="postgresql" />
            <el-option label="Oracle" value="oracle" />
<!--            <el-option label="Hive" value="hive" />-->
          </el-select>
        </el-form-item>
        <el-form-item v-if="config.sqlType === 'INSERT'" label="批量插入">
          <el-switch v-model="config.batchInsert" />
          <span class="hint">（多条VALUES合并）</span>
        </el-form-item>
        <el-form-item label="时间戳格式">
          <el-select v-model="config.timestampFormat" style="width: 100%">
            <el-option label="日期时间字符串" value="datetime" />
            <el-option label="毫秒时间戳" value="ms" />
            <el-option label="秒时间戳" value="s" />
          </el-select>
        </el-form-item>
      </el-form>

      <div class="field-config">
        <div class="section-title">字段数据类型配置</div>
        <el-table :data="fieldConfigs" size="small" max-height="200">
          <el-table-column prop="name" label="字段名" width="120" />
          <el-table-column label="数据类型" width="140">
            <template #default="{ row }">
              <el-select v-model="row.dataType" size="small">
                <el-option label="自增ID" value="id" />
                <el-option label="姓名" value="name" />
                <el-option label="手机号" value="phone" />
                <el-option label="邮箱" value="email" />
                <el-option label="整数" value="int" />
                <el-option label="小数" value="float" />
                <el-option label="日期时间" value="datetime" />
                <el-option label="日期" value="date" />
                <el-option label="UUID" value="uuid" />
                <el-option label="IP地址" value="ip" />
                <el-option label="地址" value="address" />
                <el-option label="公司名" value="company" />
                <el-option label="随机字符串" value="string" />
                <el-option label="固定值" value="fixed" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="参数/固定值">
            <template #default="{ row }">
              <el-input v-model="row.param" size="small" placeholder="可选参数" />
            </template>
          </el-table-column>
        </el-table>
      </div>

      <el-row class="m-t-20px">
        <el-button type="primary" @click="parseSchema">解析表结构</el-button>
        <el-button type="success" @click="generateData">生成数据</el-button>
        <el-button @click="clear">清空</el-button>
      </el-row>
    </el-col>
  </el-row>

  <el-row class="m-t-20px">
    <el-col :span="24">
      <div class="section-title">生成结果</div>
      <el-input
        v-model="result"
        type="textarea"
        :autosize="{ minRows: 10, maxRows: 20 }"
        placeholder="生成的SQL将显示在这里..."
      />
      <el-button type="primary" class="m-t-10px" @click="copyResult">复制SQL</el-button>
    </el-col>
  </el-row>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { copyText } from '../../utils'

const tableSchema = ref('')
const result = ref('')

const config = ref({
  tableName: '',
  count: 10,
  sqlType: 'INSERT',
  dbType: 'mysql',
  batchInsert: true,
  timestampFormat: 'datetime'
})

interface FieldConfig {
  name: string
  dataType: string
  param: string
}

const fieldConfigs = ref<FieldConfig[]>([])

// 自增ID计数器（每次生成时重置）
let idCounter = 0

// 根据数据库类型返回标识符引号
const getQuote = (): string => {
  const dbType = config.value.dbType
  if (dbType === 'mysql' || dbType === 'hive') return '`'
  if (dbType === 'postgresql' || dbType === 'oracle') return '"'
  return ''
}

// 引用标识符
const quoteIdent = (name: string): string => {
  const q = getQuote()
  return q ? `${q}${name}${q}` : name
}

// 用括号计数法提取 CREATE TABLE 表体，避免贪婪匹配误伤内层括号
const extractTableBody = (schema: string): { tableName: string; body: string } | null => {
  const headerMatch = schema.match(/CREATE\s+TABLE\s+[`"']?(\w+)[`"']?\s*\(/i)
  if (!headerMatch) return null
  const tableName = headerMatch[1]
  const startIdx = (headerMatch.index ?? 0) + headerMatch[0].length - 1
  let depth = 0
  let endIdx = -1
  for (let i = startIdx; i < schema.length; i++) {
    if (schema[i] === '(') depth++
    else if (schema[i] === ')') {
      depth--
      if (depth === 0) { endIdx = i; break }
    }
  }
  if (endIdx === -1) return null
  return { tableName, body: schema.substring(startIdx + 1, endIdx) }
}

// 根据字段名 + SQL列定义推断数据类型
const inferDataType = (fieldName: string, colDef = ''): string => {
  const name = fieldName.toLowerCase()
  const def = colDef.toUpperCase()

  // AUTO_INCREMENT 一定是自增ID
  if (def.includes('AUTO_INCREMENT')) return 'id'

  // 字段名判断 id（优先级高于列类型）
  if (name === 'id' || name.endsWith('_id')) return 'id'

  // 按列类型判断
  if (/\bDATETIME\b|\bTIMESTAMP\b/.test(def)) return 'datetime'
  if (/\bDATE\b/.test(def)) return 'date'
  if (/\bDECIMAL\b|\bFLOAT\b|\bDOUBLE\b|\bNUMERIC\b/.test(def)) return 'float'
  if (/\bINT\b|\bBIGINT\b|\bSMALLINT\b|\bTINYINT\b|\bINTEGER\b/.test(def)) return 'int'

  // 按字段名判断
  if (name.includes('name') || name.includes('姓名')) return 'name'
  if (name.includes('phone') || name.includes('mobile') || name.includes('电话') || name.includes('手机')) return 'phone'
  if (name.includes('email') || name.includes('邮箱')) return 'email'
  if (name.includes('uuid')) return 'uuid'
  if (name === 'ip' || name.startsWith('ip_') || name.endsWith('_ip')) return 'ip'
  if (name.includes('address') || name.includes('addr') || name.includes('地址')) return 'address'
  if (name.includes('company') || name.includes('公司')) return 'company'
  if (name.includes('time') || name.includes('date') || name.includes('时间') || name.includes('日期')) return 'datetime'
  if (name.includes('age') || name.includes('年龄') || name.includes('count') || name.includes('status') || name.includes('num')) return 'int'
  if (name.includes('price') || name.includes('amount') || name.includes('salary') || name.includes('金额')) return 'float'
  return 'string'
}

// 加载示例建表语句
const loadExample = () => {
  tableSchema.value = `CREATE TABLE \`user_info\` (
  \`id\` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  \`user_name\` VARCHAR(50) NOT NULL COMMENT '用户名',
  \`real_name\` VARCHAR(20) COMMENT '真实姓名',
  \`age\` INT COMMENT '年龄',
  \`phone\` VARCHAR(20) COMMENT '手机号',
  \`email\` VARCHAR(100) COMMENT '邮箱',
  \`ip_address\` VARCHAR(50) COMMENT 'IP地址',
  \`home_address\` VARCHAR(200) COMMENT '家庭住址',
  \`company_name\` VARCHAR(100) COMMENT '公司名称',
  \`salary\` DECIMAL(10,2) COMMENT '薪资',
  \`create_time\` DATETIME COMMENT '创建时间',
  \`birth_date\` DATE COMMENT '出生日期',
  \`user_uuid\` VARCHAR(36) COMMENT 'UUID',
  \`status\` INT COMMENT '状态',
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户信息表';`
  parseSchema()
}

// 解析建表语句或字段列表
const parseSchema = () => {
  const schema = tableSchema.value.trim()
  if (!schema) {
    return ElMessage.warning('请输入表结构定义')
  }

  let fields: Array<{ name: string; colDef: string }> = []
  let tableName = ''

  const tableBody = extractTableBody(schema)
  if (tableBody) {
    tableName = tableBody.tableName
    const skipKeywords = new Set(['PRIMARY', 'KEY', 'INDEX', 'UNIQUE', 'FOREIGN', 'REFERENCES', 'CONSTRAINT', 'CHECK'])
    const lines = tableBody.body.split('\n').map(l => l.trim()).filter(l => l)
    fields = lines
      .map(line => {
        // 支持反引号/双引号包裹的字段名
        const match = line.match(/^[`"']?(\w+)[`"']?\s+(.*)/)
        if (!match) return null
        const name = match[1]
        const colDef = match[2]
        if (skipKeywords.has(name.toUpperCase())) return null
        return { name, colDef }
      })
      .filter((f): f is { name: string; colDef: string } => f !== null)
  } else {
    // 逗号/换行分隔的字段列表
    const names = schema.split(/[,\n]/).map(f => f.trim()).filter(f => f && !f.includes(' '))
    if (names.length === 0) {
      return ElMessage.warning('无法解析表结构，请检查格式')
    }
    fields = names.map(name => ({ name, colDef: '' }))
  }

  // 有表名时才覆盖，避免用户手动填写的表名被清空
  if (tableName) {
    config.value.tableName = tableName
  } else if (!config.value.tableName) {
    config.value.tableName = 'my_table'
  }

  fieldConfigs.value = fields.map(({ name, colDef }) => ({
    name,
    dataType: inferDataType(name, colDef),
    param: ''
  }))

  ElMessage.success(`解析成功，共 ${fields.length} 个字段`)
}

// 生成模拟数据
const generateMockValue = (field: FieldConfig): string => {
  const { dataType, param } = field

  switch (dataType) {
    case 'id': {
      return String(++idCounter)
    }
    case 'name': {
      const surnames = ['张', '李', '王', '刘', '陈', '杨', '赵', '黄', '周', '吴']
      const nameChars = ['伟', '芳', '娜', '敏', '静', '丽', '强', '磊', '军', '洋', '勇', '艳', '杰', '涛', '明']
      const twoChars = Math.random() > 0.5
      return `'${surnames[Math.floor(Math.random() * surnames.length)]}${nameChars[Math.floor(Math.random() * nameChars.length)]}${twoChars ? nameChars[Math.floor(Math.random() * nameChars.length)] : ''}'`
    }
    case 'phone': {
      const prefixes = ['138', '139', '150', '151', '152', '158', '159', '186', '187', '188']
      return `'${prefixes[Math.floor(Math.random() * prefixes.length)]}${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}'`
    }
    case 'email': {
      const domains = ['qq.com', '163.com', 'gmail.com', 'outlook.com', '126.com']
      const chars = 'abcdefghijklmnopqrstuvwxyz'
      let email = ''
      for (let i = 0; i < 8; i++) email += chars[Math.floor(Math.random() * chars.length)]
      return `'${email}@${domains[Math.floor(Math.random() * domains.length)]}'`
    }
    case 'int': {
      const parts = param ? param.split('-') : []
      const min = parts.length >= 1 && parts[0] !== '' ? parseInt(parts[0]) : 0
      const max = parts.length >= 2 && parts[1] !== '' ? parseInt(parts[1]) : 100
      return String(Math.floor(Math.random() * (max - min + 1)) + min)
    }
    case 'float': {
      const parts = param ? param.split('-') : []
      const minF = parts.length >= 1 && parts[0] !== '' ? parseFloat(parts[0]) : 0
      const maxF = parts.length >= 2 && parts[1] !== '' ? parseFloat(parts[1]) : 1000
      return (Math.random() * (maxF - minF) + minF).toFixed(2)
    }
    case 'datetime': {
      const now = Date.now()
      const randomTime = now - Math.floor(Math.random() * 365 * 24 * 60 * 60 * 1000)
      if (config.value.timestampFormat === 'ms') return String(randomTime)
      if (config.value.timestampFormat === 's') return String(Math.floor(randomTime / 1000))
      const date = new Date(randomTime)
      return `'${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}'`
    }
    case 'date': {
      const randomD = Date.now() - Math.floor(Math.random() * 365 * 24 * 60 * 60 * 1000)
      const dateD = new Date(randomD)
      return `'${dateD.getFullYear()}-${String(dateD.getMonth() + 1).padStart(2, '0')}-${String(dateD.getDate()).padStart(2, '0')}'`
    }
    case 'uuid': {
      const uuid = crypto.randomUUID
        ? crypto.randomUUID()
        : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
            const r = Math.random() * 16 | 0
            return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
          })
      return `'${uuid}'`
    }
    case 'ip': {
      return `'${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}'`
    }
    case 'address': {
      const provinces = ['北京市', '上海市', '广东省', '江苏省', '浙江省', '四川省', '湖北省']
      const cities = ['朝阳区', '海淀区', '浦东新区', '天河区', '南山区', '武侯区']
      return `'${provinces[Math.floor(Math.random() * provinces.length)]}${cities[Math.floor(Math.random() * cities.length)]}某某路${Math.floor(Math.random() * 1000) + 1}号'`
    }
    case 'company': {
      const companyTypes = ['科技', '网络', '信息', '数据', '软件', '互联网']
      const companySuffixes = ['有限公司', '股份有限公司', '集团']
      const cities = ['北京', '上海', '深圳', '广州', '杭州']
      return `'${cities[Math.floor(Math.random() * cities.length)]}${companyTypes[Math.floor(Math.random() * companyTypes.length)]}${companySuffixes[Math.floor(Math.random() * companySuffixes.length)]}'`
    }
    case 'string': {
      const len = param ? parseInt(param) || 10 : 10
      const strChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
      let str = ''
      for (let i = 0; i < len; i++) str += strChars[Math.floor(Math.random() * strChars.length)]
      return `'${str}'`
    }
    case 'fixed': {
      return param !== undefined && param !== '' ? `'${param}'` : `'固定值'`
    }
    default:
      return `'${dataType}'`
  }
}

// 生成数据
const generateData = () => {
  if (fieldConfigs.value.length === 0) {
    return ElMessage.warning('请先解析表结构')
  }
  if (!config.value.tableName) {
    return ElMessage.warning('请输入表名')
  }

  // 每次生成前重置自增ID计数器
  idCounter = 0

  const { tableName, count, sqlType, batchInsert } = config.value
  const quotedTable = quoteIdent(tableName)
  const fields = fieldConfigs.value.map(f => quoteIdent(f.name))

  const sqls: string[] = []

  if (sqlType === 'INSERT') {
    if (batchInsert) {
      const valuesList: string[] = []
      for (let i = 0; i < count; i++) {
        const values = fieldConfigs.value.map(f => generateMockValue(f))
        valuesList.push(`(${values.join(', ')})`)
      }
      sqls.push(`INSERT INTO ${quotedTable} (${fields.join(', ')})\nVALUES\n${valuesList.join(',\n')};`)
    } else {
      for (let i = 0; i < count; i++) {
        const values = fieldConfigs.value.map(f => generateMockValue(f))
        sqls.push(`INSERT INTO ${quotedTable} (${fields.join(', ')}) VALUES (${values.join(', ')});`)
      }
    }
  } else if (sqlType === 'UPDATE') {
    if (fieldConfigs.value.length < 2) {
      return ElMessage.warning('UPDATE 模式至少需要 2 个字段（第一个字段作为 WHERE 条件）')
    }
    for (let i = 0; i < count; i++) {
      // 先生成 WHERE 条件值，再生成 SET 子句，避免 id 计数器偏移
      const whereValue = generateMockValue(fieldConfigs.value[0])
      const setClause = fieldConfigs.value.slice(1).map(f => `${quoteIdent(f.name)} = ${generateMockValue(f)}`).join(', ')
      sqls.push(`UPDATE ${quotedTable} SET ${setClause} WHERE ${quoteIdent(fieldConfigs.value[0].name)} = ${whereValue};`)
    }
  }

  result.value = sqls.join('\n\n')
  copyText(result.value)
  ElMessage.success(`成功生成 ${count} 条 ${sqlType} 语句，已复制到剪贴板`)
}

const clear = () => {
  tableSchema.value = ''
  result.value = ''
  fieldConfigs.value = []
  config.value.tableName = ''
}

const copyResult = () => {
  if (!result.value) {
    return ElMessage.warning('没有可复制的内容')
  }
  copyText(result.value)
  ElMessage.success('SQL 已复制到剪贴板')
}
</script>

<style scoped lang="scss">
.section-title {
  font-weight: bold;
  margin-bottom: 10px;
  color: #303133;
  display: flex;
  align-items: center;
}

.field-config {
  margin-top: 15px;
}

.hint {
  font-size: 12px;
  color: #909399;
  margin-left: 10px;
}

.m-t-10px {
  margin-top: 10px;
}

.m-t-20px {
  margin-top: 20px;
}
</style>
