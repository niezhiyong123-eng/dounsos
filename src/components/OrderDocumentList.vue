<template><view class="order-list-page">
  <view class="order-status-tabs"><view :class="['status-tab',{active:tab==='DRAFT'}]" @tap="switchTab('DRAFT')">暂存</view><view :class="['status-tab',{active:tab==='SUBMITTED'}]" @tap="switchTab('SUBMITTED')">已提交</view></view>
  <view class="order-search-row"><view class="search-box"><LineIcon name="search"/><input v-model="search" maxlength="100" placeholder="输入商品名称、条码或单号查询" confirm-type="search" @confirm="load"/></view><button :class="['filter-button',{applied:rangeIndex!==2||templateId}]" aria-label="筛选订货单" @tap="openFilter"><view class="funnel"><view/></view><view v-if="rangeIndex!==2||templateId" class="filter-dot"/></button></view>
  <view v-if="rangeIndex!==2||templateId" class="filter-summary">{{dateRanges[rangeIndex]}} · {{templateName}}</view>
  <view v-if="loading" class="empty">正在查询…</view><view v-if="error" class="error" @tap="load">{{error}} · 点击重试</view>
  <view class="order-cards"><view v-for="doc in visible" :key="doc.id" class="card order-document" @tap="go(`/pages/detail/index?kind=orders&id=${doc.id}`)"><view class="between"><text class="doc-no">{{doc.id}}</text><text class="tag">{{doc.status==='DRAFT'?'暂存':'已提交'}}</text></view><view class="muted">{{dateText(doc.createdAt)}}</view><view v-if="doc.templateName" class="template-meta">{{doc.templateName}}</view><view class="divider"/><view class="row"><ProductMark :product="doc.lines[0]"/><view class="grow"><view class="product-name">{{doc.lines[0]?.name}}{{doc.lines.length>1?' 等':''}}</view><text class="muted">共 {{doc.lines.length}} 种商品</text></view><text class="price">¥{{money(total(doc))}}</text></view><view v-if="doc.arrivalDate" class="muted arrival-meta">到货日期 {{doc.arrivalDate}}</view></view></view>
  <view v-if="!loading&&!error&&!docs.length" class="order-empty"><view class="empty-mark"><LineIcon name="order"/></view><view>暂无数据</view><view class="hint">{{dateRanges[rangeIndex]}}内暂无{{tab==='DRAFT'?'暂存':'已提交'}}订货单</view></view>
  <button v-if="docs.length>limit" class="secondary more" @tap="limit+=10">加载更多</button>
  <button class="new-order-fab" aria-label="新建订货单" @tap="go('/pages/create/index')">＋</button>
  <view v-if="panel" class="filter-overlay" @tap="panel=false"><view class="filter-panel" @tap.stop>
    <view class="filter-title">筛选订货单</view>
    <picker :range="dateRanges" :value="draftRange" @change="draftRange=Number($event.detail.value)"><view class="filter-row"><text>日期范围</text><view>{{dateRanges[draftRange]}} <text class="chevron">›</text></view></view></picker>
    <picker :range="templateLabels" :value="draftTemplateIndex" :disabled="loading" @change="draftTemplate=templateOptions[Number($event.detail.value)].id"><view class="filter-row"><text>订货模板</text><view>{{draftTemplateName}} <text class="chevron">›</text></view></view></picker>
    <view class="filter-actions"><button class="secondary" @tap="resetFilter">重置</button><button class="primary" @tap="applyFilter">确定</button></view>
  </view></view>
</view></template>
<script setup>
import {ref,computed,watch,onMounted,onBeforeUnmount} from 'vue'
import {api,guard,go,dateText} from '../services/api.js'
import {money} from '../core/validation.js'
import {dateRanges,orderDateRange} from '../core/order-list.js'
import LineIcon from './LineIcon.vue'
import ProductMark from './ProductMark.vue'
const tab=ref('DRAFT'),docs=ref([]),templates=ref([]),loading=ref(false),error=ref(''),search=ref(''),limit=ref(10),rangeIndex=ref(2),templateId=ref(''),panel=ref(false),draftRange=ref(2),draftTemplate=ref('')
let ticket=0,timer
const templateOptions=computed(()=>[{id:'',name:'无筛选条件'},...templates.value]),templateLabels=computed(()=>templateOptions.value.map(t=>t.name))
const templateName=computed(()=>templateOptions.value.find(t=>t.id===templateId.value)?.name||'无筛选条件')
const draftTemplateIndex=computed(()=>Math.max(0,templateOptions.value.findIndex(t=>t.id===draftTemplate.value)))
const draftTemplateName=computed(()=>templateOptions.value[draftTemplateIndex.value].name)
const visible=computed(()=>docs.value.slice(0,limit.value)),total=doc=>doc.lines.reduce((sum,p)=>sum+p.price*p.quantity,0)
async function load(){clearTimeout(timer);if(!guard())return;const current=++ticket;loading.value=true;error.value='';docs.value=[];limit.value=10;try{const query={tab:tab.value,...orderDateRange(rangeIndex.value),search:search.value.trim(),...(templateId.value?{templateId:templateId.value}:{})};const [orders,options]=await Promise.all([api.get('/orders',query),api.get('/order-templates')]);if(current===ticket){docs.value=orders;templates.value=options}}catch(e){if(current===ticket)error.value=e.message}finally{if(current===ticket)loading.value=false;uni.stopPullDownRefresh()}}
function switchTab(value){if(value===tab.value)return;tab.value=value;load()}
function openFilter(){draftRange.value=rangeIndex.value;draftTemplate.value=templateId.value;panel.value=true}
function resetFilter(){draftRange.value=2;draftTemplate.value=''}
function applyFilter(){rangeIndex.value=draftRange.value;templateId.value=draftTemplate.value;panel.value=false;load()}
watch(search,()=>{++ticket;loading.value=true;docs.value=[];clearTimeout(timer);timer=setTimeout(load,300)})
onMounted(load)
onBeforeUnmount(()=>{++ticket;clearTimeout(timer)})
defineExpose({load})
</script>
<style scoped>
.order-list-page{min-height:100vh;padding-bottom:180rpx;background:#f4f5f5}.order-status-tabs{display:flex;background:white;border-bottom:1rpx solid #ecf0ed}.status-tab{width:50%;padding:25rpx 10rpx;text-align:center;font-size:32rpx;font-weight:700;color:#a4aaa6;border-bottom:5rpx solid transparent}.status-tab.active{color:#0eab70;border-bottom-color:#0eab70}.order-search-row{display:flex;gap:12rpx;padding:22rpx 18rpx}.search-box{display:flex;align-items:center;gap:12rpx;flex:1;min-width:0;background:white;border-radius:8rpx;padding:0 20rpx;height:86rpx}.search-box .line-icon{transform:scale(.65);width:36rpx;flex-shrink:0}.search-box input{flex:1;min-width:0;width:0;font-size:27rpx}.filter-button{position:relative;width:86rpx;height:86rpx;min-height:44px;padding:0;background:white;display:flex;align-items:center;justify-content:center;flex-shrink:0}.funnel{width:0;height:0;border-left:16rpx solid transparent;border-right:16rpx solid transparent;border-top:24rpx solid #68766e;position:relative}.funnel view{position:absolute;width:6rpx;height:16rpx;background:#68766e;left:-3rpx;top:-3rpx}.applied .funnel{border-top-color:#0eab70}.applied .funnel view{background:#0eab70}.filter-dot{position:absolute;width:10rpx;height:10rpx;background:#0eab70;border-radius:50%;right:12rpx;top:12rpx}.filter-summary{padding:0 22rpx 18rpx;color:#6d8b78;font-size:24rpx}.order-cards{padding:0 18rpx}.doc-no{font-size:26rpx;font-weight:650;word-break:break-all}.template-meta{font-size:25rpx;color:#788d7e;margin-top:10rpx}.arrival-meta{margin-top:18rpx}.order-empty{text-align:center;padding:150rpx 24rpx 60rpx;color:#a2aaa5;font-size:29rpx}.empty-mark{width:150rpx;height:150rpx;background:#eaf0ec;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 35rpx;color:#b3c5b9}.empty-mark .line-icon{transform:scale(1.6)}.order-empty .hint{margin-top:10rpx}.new-order-fab{position:fixed;right:24rpx;bottom:calc(120rpx + env(safe-area-inset-bottom));width:104rpx;height:104rpx;border-radius:50%;background:#0eab70;color:white;font-size:76rpx;font-weight:400;line-height:95rpx;padding:0;z-index:10;box-shadow:0 6rpx 16rpx #0eab7020}.more{margin:20rpx}.filter-overlay{position:fixed;inset:0;background:#0006;z-index:50}.filter-panel{padding:28rpx 24rpx 30rpx;background:white;border-radius:0 0 24rpx 24rpx}.filter-title{font-size:29rpx;font-weight:700;margin-bottom:20rpx}.filter-row{display:flex;align-items:center;justify-content:space-between;gap:18rpx;background:#f4f5f5;padding:23rpx 24rpx;border-radius:9rpx;margin-bottom:18rpx;min-height:52px;font-size:29rpx;font-weight:600}.filter-row>view{text-align:right;min-width:0;overflow-wrap:anywhere}.filter-row .chevron{margin-left:20rpx}.filter-actions{display:flex;gap:65rpx;padding:22rpx 40rpx 0}.filter-actions button{flex:1;padding:20rpx 10rpx;font-size:29rpx}.filter-actions .secondary{background:#f7f8f7;border:1rpx solid #aeb8b2;color:#86978d}
</style>
