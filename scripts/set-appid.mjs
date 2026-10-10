import { readFileSync, writeFileSync } from 'node:fs'
const appid = process.argv[2]
if (!/^wx[a-f0-9]{16}$/.test(appid || '')) { console.error('用法：node scripts/set-appid.mjs wx开头的真实AppID（共18位）'); process.exit(1) }
for (const [path, nested] of [['project.config.json', false], ['src/manifest.json', true]]) {
  const json = JSON.parse(readFileSync(path, 'utf8'))
  if (nested) json['mp-weixin'].appid = appid; else json.appid = appid
  writeFileSync(path, JSON.stringify(json, null, 2) + '\n')
}
console.log('AppID已配置。请执行 npm run build:mp-weixin 重新构建，再导入微信开发者工具。')
