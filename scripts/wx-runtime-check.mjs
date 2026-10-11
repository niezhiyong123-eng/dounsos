import vm from 'node:vm'
import fs from 'node:fs'
import path from 'node:path'
const root=path.resolve(process.env.WX_CHECK_ROOT||'dist/build/mp-weixin'),cache=new Map(),registrations=[]
function patchData(target,patch){for(const [key,value] of Object.entries(patch)){const parts=key.replace(/\[(\d+)\]/g,'.$1').split('.');let cursor=target;for(let i=0;i<parts.length-1;i++){const part=parts[i];cursor[part]??=/^\d+$/.test(parts[i+1])?[]:{};cursor=cursor[part]}cursor[parts.at(-1)]=value}}
let app
const context=vm.createContext({console,setTimeout,clearTimeout,setInterval,clearInterval,Promise,Date,Math,JSON,Map,Set,WeakMap,WeakSet,Reflect,Proxy,Symbol,Array,Object,Number,String,Boolean,Error,RegExp,parseInt,parseFloat,isNaN,encodeURIComponent,decodeURIComponent})
const store=new Map()
context.wx={getSystemInfoSync:()=>({platform:'devtools',language:'zh_CN',windowWidth:390,windowHeight:844}),getAppBaseInfo:()=>({language:'zh_CN',theme:'light'}),getDeviceInfo:()=>({platform:'devtools'}),getWindowInfo:()=>({windowWidth:390,windowHeight:844}),getStorageSync:k=>store.get(k)||'',setStorageSync:(k,v)=>store.set(k,v),removeStorageSync:k=>store.delete(k),canIUse:()=>false,nextTick:fn=>Promise.resolve().then(fn),reLaunch:()=>{},navigateTo:()=>{}}
context.global=context;context.getApp=()=>app;context.getCurrentPages=()=>[];context.App=config=>{app=config;return config};context.Page=config=>registrations.push(config);context.Component=config=>{registrations.push(config);return config}
function load(file){const filename=path.resolve(file);if(cache.has(filename))return cache.get(filename).exports;const module={exports:{}};cache.set(filename,module);const fn=vm.runInContext(`(function(require,module,exports){${fs.readFileSync(filename,'utf8')}\n})`,context,{filename});fn(p=>load(path.resolve(path.dirname(filename),p)),module,module.exports);return module.exports}
load(path.join(root,'app.js'));app.onLaunch?.({})
load(path.join(root,'pages/orders/index.js'))
const config=registrations.at(-1),instance={route:'pages/orders/index',properties:{},data:{},triggerEvent(){},selectAllComponents:()=>[],setData(data,callback){patchData(this.data,data);callback?.()}}
Object.assign(instance,config.methods)
config.lifetimes.created?.call(instance)
config.lifetimes.attached.call(instance)
config.methods.onLoad.call(instance,{})
config.lifetimes.ready.call(instance)
await new Promise(r=>setTimeout(r,30))
const template=fs.readFileSync(path.join(root,'pages/orders/index.wxml'),'utf8')
for(const name of ['订货单','收货单','差异单','退货申请单'])if(!template.includes(name))throw new Error(`Missing fixed module: ${name}`)
if(Object.keys(instance.data).length===0)throw new Error('WeChat page did not initialize its render data')
console.log('Compiled WeChat page initialized successfully; four module labels are present in WXML. This harness does not replace a real device test.')
import assert from 'node:assert/strict'

// Check the exact data referenced by compiled WXML, rather than only mounting a page.
await load(path.join(root,'services/api.js')).api.login({account:'store001',password:'Doudou123'})
load(path.join(root,'pages/order-products/index.js'))
const productConfig=registrations.at(-1),productInstance={route:'pages/order-products/index',properties:{},data:{},triggerEvent(){},selectAllComponents:()=>[],setData(data,callback){patchData(this.data,data);callback?.()}}
Object.assign(productInstance,productConfig.methods)
productConfig.lifetimes.created?.call(productInstance)
productConfig.lifetimes.attached.call(productInstance)
productConfig.methods.onLoad.call(productInstance,{templateId:'TPL-DAILY'})
productConfig.lifetimes.ready.call(productInstance)
await new Promise(r=>setTimeout(r,80))
const productWxml=fs.readFileSync(path.join(root,'pages/order-products/index.wxml'),'utf8')
const bound=(pattern)=>{const match=productWxml.match(pattern);assert.ok(match,`Missing WXML binding: ${pattern}`);return productInstance.data[match[1]]}
assert.match(bound(/class="arrival-value[^>]*>\{\{(\w+)\}\}/),/^\d{4}-\d{2}-\d{2}$/,'Arrival date WXML must refer to date data')
assert.equal(bound(/placeholder="搜索商品名称 \/ 编码" value="\{\{(\w+)\}\}/),'','Search must not show false')
assert.equal(bound(/<view wx:if="\{\{(\w+)\}\}" class="error/),'','Products must not be rendered as errors')
const items=bound(/<view wx:for="\{\{(\w+)\}\}" wx:for-item="p"/)
assert.equal(items.length,6)
const quantityKey=productWxml.match(/bindblur="\{\{p\.\w+\}\}" value="\{\{p\.(\w+)\}\}"/)[1]
for(const item of items)assert.equal(item[quantityKey],'0')
const saveMethod=bound(/loading="\{\{\w+\}\}" disabled="\{\{\w+\}\}" bindtap="\{\{(\w+)\}\}"/)
assert.equal(typeof productInstance[saveMethod],'function','Save handler must be callable')
console.log('Compiled order product page: date, search, error, six zero quantities and save handler match WXML. No real WeChat device rendering was performed.')
