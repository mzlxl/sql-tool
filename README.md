# sql-tool
这是一款 开源、免费 的插件，目的是帮助开发和测试人员在开发阶段进行SQL的加工、处理、生成。

## 功能
- 漂亮SQL工具:SQL格式化工具
- 分库分表工具：快捷生成分库分表路由SQL，并支持历史记录显示和应用
- 列转行工具：列转行&行转列，快速生成SQL查询条件
- SQL日志解析：支持 shardingsphere sql日志解析

## 如何部署

```shell
$ npm i
$ npm build
$ npm run dev # 运行测试环境
```

将 `dist/plugin.json` 拖动到 Utools 开发者工具，即可进行调试和打包

