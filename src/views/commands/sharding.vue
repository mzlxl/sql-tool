<!--选择指令批量生成数据-->
<template>
  <h2 class="m-y-20px">分库分表工具</h2>
  <el-form label-position="left" label-width="70px">
    <el-row>
      <el-col :span="6">
        <el-form-item label="库名" class="w-250px">
          <el-input placeholder="请输入库名" v-model="shardingObj.dbName" clearable
                    maxlength="40"></el-input>
        </el-form-item>
      </el-col>
      <el-col :span="6"></el-col>
      <el-col :span="6">
        <el-form-item label="分库" class="w-200px">
          <el-select placeholder="请选择分库数" filterable v-model="shardingObj.dbNum">
            <el-option v-for="item in shardingNums" :key="item" :value="item"></el-option>
          </el-select>
        </el-form-item>
      </el-col>
    </el-row>
    <el-row>
      <el-col :span="6">
        <el-form-item label="表名" class="w-250px">
          <el-input placeholder="请输入表名" v-model="shardingObj.tableName" clearable
                    maxlength="30"></el-input>
        </el-form-item>
      </el-col>
      <el-col :span="6"></el-col>
      <el-col :span="6">
        <el-form-item label="分表" class="w-200px">
          <el-select placeholder="请选择分表数" filterable v-model="shardingObj.tableNum">
            <el-option v-for="item in shardingNums" :key="item" :value="item"></el-option>
          </el-select>
        </el-form-item>
      </el-col>
    </el-row>
    <el-row>
      <el-col :span="6">
        <el-form-item label="分片键" class="w-250px">
          <el-input placeholder="请输入分片键" v-model="shardingObj.key" clearable maxlength="30"></el-input>
        </el-form-item>
      </el-col>
      <el-col :span="6"></el-col>
      <el-col :span="6">
        <el-form-item label="分片值" class="w-200px">
          <el-input placeholder="请输入分片值" v-model="shardingObj.value" clearable maxlength="256"></el-input>
        </el-form-item>
      </el-col>
    </el-row>
    <el-row>
      <el-col :span="6">
        <el-form-item label="分片策略" class="w-250px">
          <el-select placeholder="请选择分片策略" filterable v-model="shardingObj.strategy" class="w-220px"
                     collapse-tags @change="strategyChange">
            <el-option v-for="item in shardingStrategies" :key="item.code" :value="item.code"
                       :label="item.name"></el-option>
          </el-select>
          <span slot="label" style="position: relative;top:-30px;left:190px;z-index:9999">
        <el-tooltip class="item" effect="dark" :content="strategyDesc"
                    placement="top" style="position: fixed">
          <el-icon><Warning/> </el-icon>
        </el-tooltip>
      </span>
        </el-form-item>
      </el-col>
      <el-col :span="6"></el-col>
      <el-col :span="6">
      </el-col>
    </el-row>
    <el-form-item label="生成结果">
      <el-input type="textarea" v-model="shardingObj.result" disabled
                placeholder="通过分库分表路由算法快捷生成SQL，生成后可复制使用"
                :autosize="{ minRows: 4, maxRows: 20 }"></el-input>
    </el-form-item>
    <el-form-item label="常用库表">
      <el-button v-for="item in dbTableHistory" @click.stop.prevent="useDbTableNum(item)">
        {{ item.db }}库{{ item.table }}表
      </el-button>
    </el-form-item>
  </el-form>
  <div class="m-y-20px flex items-center justify-end">
    <el-button type="primary" @click.native.stop="generateResult">生 成</el-button>
    <el-button type="primary" @click="formatSql">美化SQL</el-button>
    <el-button @click="copyResult">复制结果</el-button>
  </div>
  <div>
    <div class="m-y-20px flex items-center justify-between">
      <h4 class="m-y-0 text-lg font-semibold" style="">历史记录({{ historyLength }}条)</h4>
      <div class="flex items-center space-x-4 justify-end">
        <el-input placeholder="模糊搜索库名信息" v-model="searchValue" clearable style="width: 200px;"></el-input>
        <el-button type="primary" @click.native.stop="doSearch(false)">搜索</el-button>
        <el-button @click.native.stop="doSearch(true)">取消搜索</el-button>
        <el-popconfirm width="220" title="确认清空历史，清空后将无法恢复和应用历史记录?" @confirm="clearHistory">
          <template #reference>
            <el-button>清空历史</el-button>
          </template>
        </el-popconfirm>
      </div>
    </div>
    <el-collapse accordion v-model="isCollapse">
      <el-collapse-item v-for="(item, index ) in historyList" :key="index" style="position:relative;" :name="index+''">
        <template #title>
          <span style="font-size: 16px;margin-right: 150px;font-weight: 500;" class="ellipsis">
            库表：{{ item?.dbName }}{{ item?.dbName ? '.' : '' }}{{ item?.tableName }}</span>
          <el-button @click.stop.prevent="removeHistory(index)" round size="small"
                     style="right: 100px;position: absolute">
            移除
          </el-button>
          <el-button type="primary" @click.stop.prevent="useHistory(item)" round size="small"
                     style="right: 45px;position: absolute">
            应用
          </el-button>
          <!--          <el-icon class="header-icon">-->
          <!--            <info-filled/>-->
          <!--          </el-icon>-->
        </template>
        <el-form label-position="left" label-width="70px">
          <el-row>
            <el-col :span="6">
              <el-form-item label="库名" class="w-250px">
                <el-input placeholder="请输入库名" v-model="item.dbName" clearable disabled
                          maxlength="40"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="6"></el-col>
            <el-col :span="6">
              <el-form-item label="分库" class="w-200px">
                <el-select placeholder="请选择分库数" filterable v-model="item.dbNum" disabled>
                  <el-option v-for="item in shardingNums" :key="item" :value="item"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row>
            <el-col :span="6">
              <el-form-item label="表名" class="w-250px">
                <el-input placeholder="请输入表名" v-model="item.tableName" clearable disabled
                          maxlength="30"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="6"></el-col>
            <el-col :span="6">
              <el-form-item label="分表" class="w-200px">
                <el-select placeholder="请选择分表数" filterable v-model="item.tableNum" disabled>
                  <el-option v-for="item in shardingNums" :key="item" :value="item"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row>
            <el-col :span="6">
              <el-form-item label="分片键" class="w-250px">
                <el-input placeholder="请输入分片键" v-model="item.key" clearable maxlength="30" disabled></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="6"></el-col>
            <el-col :span="6">
              <el-form-item label="分片值" class="w-200px">
                <el-input placeholder="请输入分片值" v-model="item.value" clearable maxlength="64" disabled></el-input>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row>
            <el-col :span="6">
              <el-form-item label="分片策略" class="w-250px">
                <el-select placeholder="请选择分片策略" filterable v-model="item.strategy" class="w-220px"
                           disabled collapse-tags>
                  <el-option v-for="item in shardingStrategies" :key="item.code" :value="item.code"
                             :label="item.name"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6"></el-col>
            <el-col :span="6">
            </el-col>
          </el-row>
          <el-form-item label="生成结果">
            <el-input type="textarea" v-model="item.result" disabled
                      :autosize="{ minRows: 4, maxRows: 6 }"></el-input>
          </el-form-item>
        </el-form>
      </el-collapse-item>
    </el-collapse>
  </div>
</template>

<script setup lang="ts">
import {ElMessage} from 'element-plus'
import {copyText, escapeQuotMarks} from '../../utils'
import {queryDb} from '../../utils'
import {saveDb} from '../../utils'
import cloneDeep from 'lodash/cloneDeep';
import {Ref} from "vue";
import {format} from "sql-formatter";

interface ShardingObject {
  dbNum: number;
  tableNum: number;
  dbName: string;
  tableName: string;
  key: string;
  strategy: string;
  value: string;
  result: string;
}

const shardingObj: Ref<ShardingObject> = ref({
  dbNum: 4,
  tableNum: 16,
  dbName: '',
  tableName: '',
  key: 'user_id',
  strategy: 'default',
  value: '',
  result: ''
});

const strategyDesc = ref('tableIndex = shardingValue%(tableNum*dbNum); dbIndex = tableIndex/tableNum')

const historyLength = 50
const searchValue = ref('')

const shardingStrategies = ref([{code: 'default', name: '将分片值直接运算'},
  {code: 'hashcode', name: '将分片值取散列运算'},
  {code: 'MurmurHash', name: '将分片值取MurmurHash'},
])
const shardingNums = ref([4, 8, 16, 32, 64, 128, 256, 512])
const symbol = ref('')
const isCollapse = ref('')
const historyList: Ref<ShardingObject[]> = ref([])
const dbTableHistory: Ref<{ db: number, table: number }[]> = ref([])

if (onMounted) {
  onMounted(() => {
    initHistory()
  })
}

const generateResult = () => {
  shardingObj.value.result = '';
  if (shardingObj.value.tableName.trim() == ''
      || shardingObj.value.key.trim() == '' || shardingObj.value.value.trim() == '') {
    ElMessage.info(`请填写完整的分库分表规则`)
    return
  }
  if (shardingObj.value.strategy == 'default' && !isNumber(shardingObj.value.value)) {
    ElMessage.info(`使用将分片值直接运算时，分片键必须是数字类型`)
    return
  }
  isCollapse.value = ''
  let shardingValue: bigint;
  if (shardingObj.value.strategy == 'MurmurHash') {
    console.log(shardingObj.value.value)
    shardingValue = BigInt(murmurHash64(shardingObj.value.value));
    console.log(shardingValue)
  } else if (shardingObj.value.strategy == 'hashcode') {
    shardingValue = BigInt(hashCode(shardingObj.value.value));
  } else {
    shardingValue = BigInt(shardingObj.value.value);
  }
  let value = shardingObj.value.strategy === 'default' ? shardingObj.value.value.trim() : `'${escapeQuotMarks(shardingObj.value.value)}'`
  let tableIndex: number = Number(shardingValue % BigInt(shardingObj.value.tableNum * shardingObj.value.dbNum));
  let dbIndex: number = Math.floor(tableIndex / shardingObj.value.tableNum);
  shardingObj.value.result = 'SELECT * FROM ' + (shardingObj.value.dbName.trim() ? symbol.value : '') +
      shardingObj.value.dbName.trim() + (shardingObj.value.dbName.trim() ? '_' + dbIndex + symbol.value + '.' : '') +
      symbol.value + shardingObj.value.tableName.trim() + '_' + tableIndex + symbol.value + ' WHERE ' + symbol.value +
      shardingObj.value.key.trim() + symbol.value + ' = ' + value + ';';
  ElMessage.success('生成成功')
  assemblehistory()
  copyResult()

  groupDbAndTableNum()
}
const groupDbAndTableNum = () => {
  const count: Record<string, number> = {};
  historyList.value.forEach((item) => {
    const key = `${item.dbNum}-${item.tableNum}`;
    count[key] = (count[key] || 0) + 1;
  });

  // 创建一个数组来存储所有组合及其计数
  const sortedElements = Object.entries(count).map(([key, value]) => {
    const [db, table] = key.split('-').map(Number);
    return {db, table, count: value};
  });

  // 对数组进行排序
  sortedElements.sort((a, b) => b.count - a.count);
  dbTableHistory.value = sortedElements.slice(0, 6)
}

const assemblehistory = () => {
  distinctHistoryByShardingObj()
  historyList.value.unshift(cloneDeep(shardingObj.value) as ShardingObject);
  removeHistoryByLimitLength();
  saveDb('historyList', JSON.stringify(historyList.value));
}

const removeHistoryByLimitLength = () => {
  let pop = historyList.value.length - historyLength
  for (let i = 0; i < pop; i++) {
    historyList.value.pop()
  }
}

const distinctHistoryByShardingObj = () => {
  let index = indexOfHistory()
  if (typeof index === 'number') {
    historyList.value.splice(index, 1)
  }
}

const indexOfHistory = () => {
  // 通过当前的sharding对象查找历史已存在数据的索引，obj.dbName 和 obj.tableName 做唯一键过滤
  for (let i = 0; i < historyList.value.length; i++) {
    if (shardingObj.value?.dbName == historyList.value[i]?.dbName
        && shardingObj.value?.tableName == historyList.value[i]?.tableName) {
      return i
    }
  }
}

const initHistory = () => {
  let cacheData = queryDb('historyList')
  historyList.value = cacheData ? JSON.parse(cacheData) : [];

  groupDbAndTableNum()
}

const isNumber = (value: any) => {
  // 使用正则表达式判断是否为数字
  const regex = /^-?\d+\.?\d*$/;
  return regex.test(value);
}

const hashCode = (str: string) => {
  let hash = 0;
  if (str.length === 0) {
    return Number(hash);
  }
  for (let i = 0; i < str.length; i++) {
    let char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 将hash转换为32位有符号整数
  }
  return Math.abs(Number(hash))
}

const copyResult = () => {
  if (!shardingObj.value.result) {
    return ElMessage.info('请先生成SQL')
  }
  copyText(shardingObj.value.result)
  ElMessage.success('复制成功')
}

const clearHistory = () => {
  historyList.value = []
  saveDb('historyList', '[]')
  ElMessage.success('历史记录已清空')
}

const removeHistory = (index: number) => {
  historyList.value.splice(index, 1)
  ElMessage.success('移除成功')
}

const useHistory = (item: ShardingObject) => {
  shardingObj.value = cloneDeep(item) as ShardingObject
  assemblehistory()
  ElMessage.success('应用成功')
}

const useDbTableNum = (item: { db: number, table: number }) => {
  shardingObj.value.dbNum = item.db
  shardingObj.value.tableNum = item.table
}

const formatSql = () => {
  if (!shardingObj.value.result || shardingObj.value.result.trim() == '') {
    ElMessage.info(`请先生成SQL`)
    return
  }

  try {
    shardingObj.value.result = format(shardingObj.value.result, {language: 'plsql'})
  } catch (e) {
    shardingObj.value.result = ''
    return ElMessage.error('请输入正确的SQL')
  }
  copyResult()
}

const strategyChange = () => {
  if (shardingObj.value.strategy == 'MurmurHash') {
    strategyDesc.value = '先将shardingValue取MurmurHash值：tableIndex = MurmurHash64(shardingValue)%(tableNum*dbNum); dbIndex = tableIndex/tableNum';
    return;
  }
  strategyDesc.value = shardingObj.value.strategy == 'hashcode' ?
      "先将shardingValue取java中的hash值：tableIndex = hash(shardingValue)%(tableNum*dbNum); dbIndex = tableIndex/tableNum" :
      "tableIndex = shardingValue%(tableNum*dbNum); dbIndex = tableIndex/tableNum"
}


const doSearch = (cancel: boolean) => {
  if (cancel) {
    searchValue.value = ''
  }
  if (searchValue.value) {
    let cacheData = queryDb('historyList')
    let cacheList: ShardingObject[] = cacheData ? JSON.parse(cacheData) : [];
    historyList.value = cacheList.filter(item =>
        item.dbName.includes(searchValue.value) || item.tableName.includes(searchValue.value))
  } else {
    initHistory();
  }
}

// Hutool MurmurHash64 常量
const C1 = 0x87c37b91114253d5n;
const C2 = 0x4cf5ad432745937fn;
const R1 = 31;
const R2 = 27;
const M = 5;
const N1 = 0x52dce729;
const DEFAULT_SEED = 0;

function murmurHash64(key: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const length = data.length;

  let hash = BigInt(DEFAULT_SEED);
  const nblocks = length >> 3;

  // body
  for (let i = 0; i < nblocks; i++) {
    const i8 = i << 3;
    let k = BigInt(data[i8] & 0xff) |
        (BigInt(data[i8 + 1] & 0xff) << 8n) |
        (BigInt(data[i8 + 2] & 0xff) << 16n) |
        (BigInt(data[i8 + 3] & 0xff) << 24n) |
        (BigInt(data[i8 + 4] & 0xff) << 32n) |
        (BigInt(data[i8 + 5] & 0xff) << 40n) |
        (BigInt(data[i8 + 6] & 0xff) << 48n) |
        (BigInt(data[i8 + 7] & 0xff) << 56n);

    // mix functions
    k *= C1;
    k = rotateLeft(k, R1);
    k *= C2;
    hash ^= k;
    hash = rotateLeft(hash, R2) * BigInt(M) + BigInt(N1);
  }

  let k1 = 0n;
  const tailStart = nblocks << 3;
  switch (length - tailStart) {
    case 7:
      k1 ^= BigInt(data[tailStart + 6] & 0xff) << 48n;
    case 6:
      k1 ^= BigInt(data[tailStart + 5] & 0xff) << 40n;
    case 5:
      k1 ^= BigInt(data[tailStart + 4] & 0xff) << 32n;
    case 4:
      k1 ^= BigInt(data[tailStart + 3] & 0xff) << 24n;
    case 3:
      k1 ^= BigInt(data[tailStart + 2] & 0xff) << 16n;
    case 2:
      k1 ^= BigInt(data[tailStart + 1] & 0xff) << 8n;
    case 1:
      k1 ^= BigInt(data[tailStart] & 0xff);
      k1 = multiplyLong(k1, C1);
      k1 = rotateLeft(k1, R1);
      k1 = multiplyLong(k1, C2);
      hash = xorLong(hash, k1);
  }

  hash = xorLong(hash, BigInt(length));
  hash = fmix64(hash);
  return hash > 0 ? hash : -hash;
};


function rotateLeft(value: bigint, distance: number) {
  // 确保distance在0-63范围内（Java的处理方式）
  const normalizedDistance = distance & 63;
  if (normalizedDistance === 0) {
    return value;
  }

  // 关键：先将数值转换为64位无符号表示进行移位操作
  const mask = 0xFFFFFFFFFFFFFFFFn;
  const unsignedValue = value & mask;

  // 计算左移和右移的部分
  const leftPart = (unsignedValue << BigInt(normalizedDistance)) & mask;
  const rightPart = unsignedValue >> BigInt(64 - normalizedDistance);

  // 合并结果并保持64位表示
  return leftPart | rightPart;
};

function fmix64(h: bigint) {
  // 确保输入是BigInt类型
  if (typeof h !== 'bigint') {
    throw new Error('输入必须是BigInt类型');
  }

  // h ^= (h >>> 33)
  h ^= unsignedRightShift64(h, 33);

  // h *= 0xff51afd7ed558ccdL
  h = multiplyLong(h, 0xff51afd7ed558ccdn);

  // h ^= (h >>> 33)
  h ^= unsignedRightShift64(h, 33);

  // h *= 0xc4ceb9fe1a85ec53L
  h = multiplyLong(h, 0xc4ceb9fe1a85ec53n);

  // h ^= (h >>> 33)
  h ^= unsignedRightShift64(h, 33);

  return h;
}

function unsignedRightShift64(value: bigint, shift: number) {
  if (shift === 0) return value;
  // 先转换为无符号64位表示，再进行右移
  const mask = 0xFFFFFFFFFFFFFFFFn;
  const unsignedValue = value & mask;
  return unsignedValue >> BigInt(shift);
}

function xorLong(p1: bigint, p2: bigint) {
  // 确保输入为BigInt
  if (typeof p1 !== 'bigint' || typeof p2 !== 'bigint') {
    throw new Error('输入必须是BigInt类型');
  }

  // 关键：保留64位并处理符号位
  const mask = 0xFFFFFFFFFFFFFFFFn;
  let result = (p1 ^ p2) & mask;

  // 转换为64位有符号整数（Java long的表示方式）
  const maxPositive = 0x7FFFFFFFFFFFFFFFn;
  if (result > maxPositive) {
    result -= 0x10000000000000000n;
  }

  return result;
}

function multiplyLong(a: bigint, b: bigint) {
  // 1. 确保输入是BigInt类型
  if (typeof a !== 'bigint' || typeof b !== 'bigint') {
    throw new Error('输入必须是BigInt类型');
  }

  // 2. 执行乘法（使用完整精度）
  const product = a * b;

  // 3. 模拟Java long的64位截断（关键步骤）
  // 保留低64位并转换为有符号整数
  const mask = 0xFFFFFFFFFFFFFFFFn;
  let result = product & mask;

  // 4. 处理符号位（如果是负数）
  const maxPositive = 0x7FFFFFFFFFFFFFFFn; // 2^63 - 1
  if (result > maxPositive) {
    result -= 0x10000000000000000n; // 转换为64位有符号负数
  }

  return result;
}

</script>

<style scoped>
.ellipsis {
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
