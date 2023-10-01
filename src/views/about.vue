<template>
  <h2 class="m-y-20px">关于插件</h2>
  <p>这是一款 <strong>开源</strong>、<strong>免费</strong> 的插件，目的是帮助开发和测试人员在开发阶段进行SQL的加工、处理、生成。</p>
  <p>如果这个插件帮到了您，请在 Github 点一个 Star，这将是作者持续维护的动力。</p>
  <p>Github地址<span class="link ml-2" @click="openGithub">待更新</span></p>
  <p>如果有问题，可以通过插件评论区、Issues等渠道进行反馈。</p>
</template>

<script setup lang="ts">
import {openUrl} from '../utils'

const openGithub = () => openUrl('https://github.com/mzlxl/sql-tool')
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
