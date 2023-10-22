# sql-tool
这是一款 开源、免费 的插件，目的是帮助开发和测试人员在开发阶段进行SQL的加工、处理、生成。

## 功能列表
- 分库分表工具：快捷生成分库分表路由SQL，并支持历史记录显示和应用
- 列转行工具：列转行&行转列，快速生成SQL查询条件
- SQL日志解析：通用SQL参数拼接，以及mybatis sql日志解析、 shardingsphere sql日志解析
- JSON转SQL：JSON和SQL互转的工具
- 漂亮SQL工具：SQL格式化工具
- 关于插件：插件说明

## 支持平台
- utools：请将.upx后缀的安装包拖入到utools安装插件使用
- chrome：在谷歌浏览器方案chrome://extensions/  选择dist文件夹安装插件

## 如何部署

```shell
$ npm i
$ npm build
$ npm run dev # 运行测试环境
```

将 `dist/plugin.json` 拖动到 Utools 开发者工具，即可进行调试和打包

