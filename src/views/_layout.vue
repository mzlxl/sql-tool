<template>
  <div class="layout-container" :style="{ width: containerWidth, height: containerHeight }">
    <el-menu :default-active="$route.name" router>
      <el-menu-item index="/commands/sharding">分库分表工具</el-menu-item>
      <el-menu-item index="/commands/col2row">列转行工具</el-menu-item>
      <el-menu-item index="/commands/parse-sql">SQL日志解析</el-menu-item>
      <el-menu-item index="/commands/format-sql">漂亮SQL工具</el-menu-item>
      <el-menu-item index="/about">关于插件</el-menu-item>
    </el-menu>
    <div class="view">
      <router-view/>
    </div>
  </div>
</template>

<script setup lang="ts">
import {isUtoolsEnv} from "../utils";

const router = useRouter()
const containerWidth = ref('100vw')
const containerHeight = ref('100vh')
if (isUtoolsEnv()) {
  containerWidth.value = '100vw'
  containerHeight.value = '100vh'
} else {
  containerWidth.value = '750px'
  containerHeight.value = '600px'
}

if (onMounted) {
  onMounted(() => {
    router.replace('/commands/sharding')
  })
}
</script>

<style lang="scss" scoped>
.layout-container {
  display: flex;
  align-content: flex-start;
  overflow: hidden;

  .view {
    flex: 1;
    padding: 0 20px;
    height: 100vh;
    overflow-y: scroll;
  }

}
</style>
