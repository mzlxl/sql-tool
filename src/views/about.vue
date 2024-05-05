<template>
  <h2 class="m-y-20px">关于插件</h2>
  <p>这是一款 <strong>开源</strong>、<strong>免费</strong> 的插件，目的是帮助开发和测试人员在开发阶段进行SQL的加工、处理、生成。
  </p>
  <p>如果有问题，可以通过插件评论区进行反馈。</p>
  <h2 class="m-y-20px">功能列表</h2>
  <p>SQL日志解析：帮助完成SQL参数拼接，支持mybatis shardingsphere 及普通SQL日志。</p>
  <p>分库分表工具：快捷生成分库分表路由SQL，支持历史记录和常用库表算法。</p>
  <p>列转行工具：列转行&行转列，快速生成SQL查询条件，支持智能匹配功能。</p>
  <p>JSON转SQL：JSON和SQL互转的工具，支持智能匹配功能。</p>
  <p>EXCEL转SQL：EXCEL转SQL的工具，支持基础的增删改(字段名.where表示条件列)</p>
  <p>漂亮SQL工具：SQL格式化工具，支持各种数据库类型，支持智能匹配功能。</p>
  <h2 class="m-y-20px">智能匹配</h2>
  <p>复制文本然后快捷键或超级面板唤起并进入utools组件中，实现文本自动填充生成。</p>
  <p>智能匹配及其他使用技巧：<span class="link ml-2" @click="openUtools">https://www.u.tools/</span></p>
</template>

<script setup lang="ts">
import {openUrl} from '../utils'

const openUtools = () => openUrl('https://www.u.tools/')
</script>

<style scoped lang="scss">
p {
  font-size: 16px;
  line-height: 2;
  margin-bottom: 10px;
}

.link {
  color: #3a8ee6;
  cursor: pointer;
}
</style>
