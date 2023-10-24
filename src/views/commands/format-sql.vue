<template>
  <h2 class="m-y-20px">SQL美化工具</h2>
  <el-form label-position="left" label-width="100px">
    <el-form-item label="SQL语言类型">
      <el-select placeholder="请选择SQL语言类型" filterable v-model="type" class="w-220px">
        <el-option v-for="item in types" :key="item.type" :value="item.type" :label="item.name"></el-option>
      </el-select>
    </el-form-item>
    <el-form-item label="待美化SQL">
      <el-input type="textarea" v-model="sql"
                placeholder="请输入要美化的SQL样本"
                :autosize="{ minRows: 4, maxRows: 6 }"></el-input>
    </el-form-item>
    <el-form-item label="SQL美化结果">
      <el-input type="textarea" v-model="sqlResult" disabled
                placeholder=""
                :autosize="{ minRows: 10, maxRows: 15 }"></el-input>
    </el-form-item>
  </el-form>
  <div class="m-y-20px flex items-center justify-end">
    <el-button @click="clear">清 空</el-button>
    <el-button type="primary" @click="generateResult">生 成</el-button>
    <el-button @click="copyResult">复制结果</el-button>
  </div>

  <div style="margin-left: 30px">
    <el-link type="primary" v-for="item in types" @click="clickLink(item)">{{ item.name }}</el-link>
  </div>

</template>

<script setup lang="ts">
import {ElMessage} from 'element-plus'
import {copyText, openUrl} from '../../utils'
import {format} from 'sql-formatter';

const types = ref([
  {type: 'mysql', name: 'MySQL', link: 'https://www.mysql.com/'},
  {type: 'sql', name: 'Standard SQL', link: 'https://en.wikipedia.org/wiki/SQL:2011'},
  {type: 'plsql', name: 'Oracle PL/SQL', link: 'http://www.oracle.com/technetwork/database/features/plsql/index.html'},
  {type: 'bigquery', name: 'GCP BigQuery', link: 'https://cloud.google.com/bigquery'},
  {type: 'db2', name: 'IBM DB2', link: 'https://www.ibm.com/analytics/us/en/technology/db2/'},
  {type: 'hive', name: 'Apache Hive', link: 'https://hive.apache.org/'},
  {type: 'mariadb', name: 'MariaDB', link: 'https://mariadb.com/'},
  {type: 'n1ql', name: 'Couchbase N1QL', link: 'http://www.couchbase.com/n1ql'},
  {type: 'postgresql', name: 'PostgreSQL', link: 'https://www.postgresql.org/'},
  {
    type: 'redshift',
    name: 'Amazon Redshift',
    link: 'https://docs.aws.amazon.com/redshift/latest/dg/cm_chap_SQLCommandRef.html'
  },
  {
    type: 'singlestoredb',
    name: 'SingleStoreDB',
    link: 'https://docs.singlestore.com/managed-service/en/reference.html'
  },
  {type: 'snowflake', name: 'Snowflake', link: 'https://docs.snowflake.com/en/index.html'},
  {type: 'spark', name: 'Spark', link: 'https://spark.apache.org/docs/latest/api/sql/index.html'},
  {type: 'sqlite', name: 'SQLite', link: 'https://sqlite.org/index.html'},
  {type: 'transactsql', name: 'SQL Server Transact-SQL', link: 'https://docs.microsoft.com/en-us/sql/sql-server/'},
  {type: 'trino', name: 'Trino', link: 'https://trino.io/docs/current/'}])
const type = ref('mysql')
const sql = ref('')
const sqlResult = ref('')

const generateResult = () => {
  if (!sql.value || sql.value.trim() == '') {
    ElMessage.info(`请输入要美化的SQL样本`)
    return
  }
  try {
    sqlResult.value = format(sql.value, {language: type.value})
  } catch (e) {
    sqlResult.value = ''
    return ElMessage.error('请输入正确语言类型的SQL')
  }
}

const copyResult = () => {
  if (!sqlResult.value || sqlResult.value.trim() == '') {
    return ElMessage.info('请先生成SQL')
  }
  copyText(sqlResult.value)
  ElMessage.success('复制成功')
}

const clear = () => {
  sqlResult.value = ''
  sql.value = ''
}

const clickLink = (item:any) => openUrl(item['link'])

</script>

<style scoped lang="scss">
.el-link {
  margin-right: 20px;
}
.el-link .el-icon--right.el-icon {
  vertical-align: text-bottom;
}
</style>
