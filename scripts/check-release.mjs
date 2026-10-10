import { readFileSync, existsSync } from 'node:fs'
const read = path => JSON.parse(readFileSync(path, 'utf8'))
const env = Object.fromEntries((existsSync('.env.local') ? readFileSync('.env.local', 'utf8') : '').split(/\r?\n/).filter(x => x && !x.startsWith('#')).map(x => { const i=x.indexOf('=');return [x.slice(0,i).trim(),x.slice(i+1).trim()] }))
const failures=[]
if(env.VITE_API_MODE!=='remote')failures.push('当前仍为演示模式；正式业务不得发布演示版本。')
if(!/^https:\/\//.test(env.VITE_API_BASE_URL||''))failures.push('缺少真实 HTTPS API 地址。')
if(!/^https:\/\//.test(env.VITE_OSS_BASE_URL||''))failures.push('缺少真实 HTTPS OSS 图片域名。')
const appid=read('project.config.json').appid
if(!/^wx[a-f0-9]{16}$/.test(appid))failures.push('尚未配置真实微信 AppID。')
if(read('src/manifest.json')['mp-weixin'].appid!==appid)failures.push('工程与 manifest AppID 不一致。')
if(failures.length){console.error(failures.join('\n'));process.exit(1)}
console.log('静态配置检查通过。仍须完成 CMP5 联调、权限、库存一致性、真机和隐私合规验收；本命令不代表批准上线。')
