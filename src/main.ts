import {createApp} from 'vue'
import {useDark} from '@vueuse/core'

import AppVue from './App.vue'
import router from './router'

import 'uno.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import 'element-plus/es/components/message/style/css'
import 'element-plus/theme-chalk/el-message-box.css'
import 'element-plus/theme-chalk/el-overlay.css'
import 'element-plus/theme-chalk/el-dialog.css'

import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import {isUtoolsEnv, saveDb} from './utils/index'

if (isUtoolsEnv()) {
  utools.onPluginEnter(({code, type, payload}) => {
    if (!!payload) {
      saveDb("enter_cache:" + code, payload)
    }
    if (code === 'format') {
      // 所有指令的列表，方便选择未添加到utools快捷启动的命令
      router.push({name: '/commands/format-sql'})
      return
    }

    if (code === 'sharding') {
      router.push({name: '/commands/sharding'})
      return
    }

    if (code === 'col2row') {
      router.push({name: '/commands/col2row'})
      return
    }

    if (code === 'json2sql') {
      router.push({name: '/commands/json2sql'})
      return
    }

    if (code === 'parse-sql') {
      // 所有指令的列表，方便选择未添加到utools快捷启动的命令
      router.push({name: '/commands/parse-sql'})
      return
    }

    if (code === 'excel2sql') {
      router.push({name: '/commands/excel2sql'})
      return
    }
  })

  utools.onMainPush?.(
      // callback 当主窗口推送消息时触发回调函数
      ({code}) => {
        if (code === 'sharding') {

        }
        return []
      },
      // selectCallback 选择回调函数，用于处理选择操作
      ({code, option}) => {
        if (code === 'sharding') {
        }
      },
  )
} else {
  router.push({name: '/commands/parse-sql'})
}


const app = createApp(AppVue)
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}
app.use(router)
app.mount('#app')

useDark({})
