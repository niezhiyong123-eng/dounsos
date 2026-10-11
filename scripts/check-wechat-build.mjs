import {readFileSync,writeFileSync,readdirSync,existsSync} from 'node:fs'
import {resolve,relative,join} from 'node:path'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
const root=resolve('dist/build/mp-weixin'),manifest=join(root,'build-integrity.json')
function list(dir){return readdirSync(dir,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?list(join(dir,entry.name)):[join(dir,entry.name)])}
const files=list(root).filter(file=>file!==manifest&&!file.endsWith('project.private.config.json'))
for(const file of files.filter(file=>file.endsWith('.wxml'))){const wxml=readFileSync(file,'utf8'),jsFile=file.replace(/\.wxml$/,'.js');const scopes=[...new Set(wxml.match(/data-v-[a-f0-9]+/g)||[])];if(scopes.length){assert.ok(existsSync(jsFile),`缺少对应JS：${file}`);const js=readFileSync(jsFile,'utf8');for(const scope of scopes)assert.ok(js.includes(scope),`JS/WXML版本不一致：${relative(root,file)} (${scope})`)}}
const hashes=Object.fromEntries(files.sort().map(file=>[relative(root,file).replaceAll('\\','/'),createHash('sha256').update(readFileSync(file,'utf8').replace(/\r\n/g,'\n')).digest('hex')]))
if(process.argv.includes('--record'))writeFileSync(manifest,JSON.stringify({format:1,normalization:'UTF-8 text with LF newlines',files:hashes},null,2)+'\n')
else{assert.ok(existsSync(manifest),'缺少构建清单，请运行 npm run build:mp-weixin');assert.deepEqual(hashes,JSON.parse(readFileSync(manifest,'utf8')).files,'构建文件不完整或版本混用，请重新构建/完整替换输出目录')}
console.log(`微信构建文件检查通过：${files.length} 个文件，JS/WXML作用域与构建哈希匹配。`)
