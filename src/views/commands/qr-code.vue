<!--选择指令批量生成数据-->
<template>
  <h2 class="m-y-20px">二维码生成器</h2>
  <el-form label-position="left" label-width="70px">
    <el-form-item>
      <el-input type="textarea" v-model="text" disabled
                placeholder="请输入文本内容"
                :autosize="{ minRows: 4, maxRows: 4 }"></el-input>
    </el-form-item>
  </el-form>
  <div class="m-y-20px flex items-center justify-end">
    <el-button type="primary" @click.native.stop="generateResult">生 成</el-button>
  </div>
</template>

<script setup lang="ts">

const text = ref('')

const generateResult = () => {
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
