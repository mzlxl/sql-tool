const fs = require('fs');

// 读取 manifest.json 文件内容
const manifest = fs.readFileSync('manifest.json', 'utf8');

// 将 manifest.json 文件内容复制到 dist 目录中
fs.writeFileSync('dist/manifest.json', manifest);
