<template><view class="page"><text class="eyebrow">REPLENISH YOUR STORE</text><view class="title">新建订货</view><text class="muted">按需补货，让货架保持好状态</text><view class="spacer"/><input v-model="search" class="input" placeholder="搜索商品名称 / 编码"/><scroll-view scroll-x><view class="tabs"><view v-for="c in categories" :key="c" :class="['tab',{active:category===c}]" @tap="category=c">{{ c }}</view></view></scroll-view>
  <view v-if="error" class="error" @tap="load">{{ error }} · 点击重试</view><view v-if="loading" class="empty">商品加载中…</view>
  <view v-for="p in filtered" :key="p.sku" class="card"><view class="row"><ProductMark :product="p"/><view class="grow"><view class="product-name">{{p.name}}</view><text class="muted">{{p.spec}}</text><view class="price">¥{{money(p.price)}}<text class="muted"> / {{p.unit}}</text></view></view></view><view class="between" style="margin-top:24rpx"><text class="hint">{{p.min}}{{p.unit}}起订 · {{p.step}}{{p.unit}}递增</text><view class="stepper"><button :disabled="busy" @tap="change(p,-1)">−</button><input v-model="counts[p.sku]" type="number" maxlength="5" :disabled="busy"/><button :disabled="busy" @tap="change(p,1)">＋</button></view></view></view>
  <view v-if="!loading&&!filtered.length" class="empty">没有找到商品</view><view class="card"><text class="field-label">订货备注（选填）</text><textarea v-model="remark" class="textarea" maxlength="200" placeholder="例如：请安排上午配送" :disabled="busy"/><text class="hint">金额为演示订货价；真实价格以 CMP5 确认为准。</text></view>
  <view class="action-bar"><view class="between"><view><text class="muted">已选 {{selected.length}} 种商品</text><view class="price">合计 ¥{{money(total)}}</view></view><button class="primary" :loading="busy" :disabled="busy||!selected.length" @tap="save">保存并核对 →</button></view></view>
</view></template>
<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { api, guard, report, newKey, storage, client } from '../../services/api.js'
import { linesInput, quantity, assert, money } from '../../core/validation.js'
import ProductMark from '../../components/ProductMark.vue'
const products=ref([]),counts=reactive({}),remark=ref(''),search=ref(''),category=ref('全部'),busy=ref(false),loading=ref(false),error=ref('')
let key=newKey(),lastPayload=''
const draftKey=()=>`order-draft:${client.getSession()?.user.storeId}`
const categories=['全部','乳品饮料','烘焙零食','日用百货']
const filtered=computed(()=>products.value.filter(p=>(category.value==='全部'||category.value===p.category)&&`${p.name}${p.sku}`.includes(search.value.trim())))
const selected=computed(()=>products.value.filter(p=>Number(counts[p.sku])>0).map(p=>({...p,quantity:Number(counts[p.sku])})))
const total=computed(()=>selected.value.reduce((s,p)=>s+p.price*p.quantity,0))
watch([counts,remark],()=>{if(client.getSession())storage.set(draftKey(),{counts:{...counts},remark:remark.value})},{deep:true})
function change(p,step){const n=Number(counts[p.sku])||0;counts[p.sku]=String(Math.max(0,n===0&&step>0?p.min:n+step*p.step))}
async function load(){if(!guard())return;loading.value=true;error.value='';try{products.value=await api.get('/products')}catch(e){error.value=e.message}finally{loading.value=false}}
onLoad(()=>{if(!guard())return;const draft=storage.get(draftKey());if(draft){Object.assign(counts,draft.counts);remark.value=draft.remark||''}load()})
async function save(){if(busy.value)return;try{for(const p of products.value){const value=counts[p.sku];if(value!==undefined&&value!==''){const n=quantity(value,'订货数量',true);if(n)assert(n>=p.min&&n%p.step===0,`${p.name}至少${p.min}${p.unit}，按${p.step}${p.unit}递增`)}}const lines=selected.value.map(p=>({sku:p.sku,quantity:p.quantity}));linesInput(lines);busy.value=true;const payload=JSON.stringify({lines,remark:remark.value});if(lastPayload!==payload){key=newKey();lastPayload=payload}const doc=await api.post('/orders',JSON.parse(payload),key);Object.keys(counts).forEach(k=>delete counts[k]);remark.value='';storage.remove(draftKey());uni.redirectTo({url:`/pages/detail/index?kind=orders&id=${doc.id}`})}catch(e){report(e)}finally{busy.value=false}}
</script>
<style scoped>.stepper{display:flex;align-items:center;background:#f3f6ef;border-radius:13rpx;overflow:hidden}.stepper button{width:65rpx;height:62rpx;padding:0;line-height:62rpx;background:transparent;color:#38764f;font-size:30rpx}.stepper input{width:80rpx;height:62rpx;text-align:center;font-size:27rpx;background:white;border:1rpx solid #edf0e9}</style>
