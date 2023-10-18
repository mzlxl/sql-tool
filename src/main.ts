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
import {isUtoolsEnv} from './utils/index'

if (isUtoolsEnv()) {
  utools.onPluginEnter(({code, type, payload}) => {
    // if (code === 'setting') {
    //   router.push({ name: '/commands/' })
    //   return
    // }
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
  })

  utools.onMainPush?.(
      // callback
      ({code}) => {
        if (code === 'sharding') {

        }
        return []
      },
      // selectCallback
      ({code, option}) => {
        if (code === 'sharding') {
        }
      },
  )
} else {
  router.push({name: '/commands/sharding'})
}


const app = createApp(AppVue)
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}
app.use(router)
app.mount('#app')

useDark({})
