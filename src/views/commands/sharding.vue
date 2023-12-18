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
  </el-form>
  <div class="m-y-20px flex items-center justify-end">
    <el-popconfirm width="220" title="确认清空历史，清空后将无法恢复和应用历史记录?" @confirm="clearHistory">
      <template #reference>
        <el-button>清空历史</el-button>
      </template>
    </el-popconfirm>
    <el-button type="primary" @click.native.stop="generateResult">生 成</el-button>
    <el-button type="primary" @click="formatSql">美化SQL</el-button>
    <el-button @click="copyResult">复制结果</el-button>
  </div>
  <div style="margin-top: -42px">
    <h4 class="m-y-20px;">历史记录（保留库表名去重后最近{{ historyLength }}条）</h4>
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

const historyLength = 10

const shardingStrategies = ref([{code: 'default', name: '将分片值直接运算'}, {
  code: 'hashcode',
  name: '将分片值取散列运算'
}])
const shardingNums = ref([4, 8, 16, 32, 64, 128, 256, 512])
const symbol = ref('')
const isCollapse = ref('')
const historyList: Ref<ShardingObject[]> = ref([])

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
  let shardingValue: bigint = BigInt(shardingObj.value.value);
  if (shardingObj.value.strategy == 'hashcode') {
    shardingValue = BigInt(hashCode(shardingObj.value.value));
  }
  let value = shardingObj.value.strategy === 'default' ? shardingObj.value.value.trim() :`'${escapeQuotMarks(shardingObj.value.value)}'`
  let tableIndex: number = Number(shardingValue % BigInt(shardingObj.value.tableNum * shardingObj.value.dbNum));
  let dbIndex: number = Math.floor(tableIndex / shardingObj.value.tableNum);
  shardingObj.value.result = 'SELECT * FROM ' + (shardingObj.value.dbName.trim() ? symbol.value : '') +
      shardingObj.value.dbName.trim() + (shardingObj.value.dbName.trim() ? '_' + dbIndex + symbol.value + '.' : '') +
      symbol.value + shardingObj.value.tableName.trim() + '_' + tableIndex + symbol.value + ' WHERE ' + symbol.value +
      shardingObj.value.key.trim() + symbol.value + ' = ' + value + ';';
  ElMessage.success('生成成功')
  assemblehistory()
  copyResult()
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

const formatSql = () => {
  if (!shardingObj.value.result || shardingObj.value.result.trim() == '') {
    ElMessage.info(`请先生成SQL`)
    return
  }

  try {
    shardingObj.value.result = format(shardingObj.value.result, {language: 'mysql'})
  } catch (e) {
    shardingObj.value.result = ''
    return ElMessage.error('请输入正确的SQL')
  }
  copyResult()
}

const strategyChange = () => {
  strategyDesc.value = shardingObj.value.strategy == 'hashcode' ? "先将shardingValue取java中的hash值：tableIndex = hash(shardingValue)%(tableNum*dbNum); dbIndex = tableIndex/tableNum" :
      "tableIndex = shardingValue%(tableNum*dbNum); dbIndex = tableIndex/tableNum"
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
