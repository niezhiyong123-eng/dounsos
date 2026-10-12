<template><view class="page"><view class="between"><view class="title">{{ kinds[kind] }}</view><button v-if="kind === 'orders'" class="primary small" @tap="go('/pages/create/index')">＋ 新建订货</button></view>
  <view class="list-tools"><input v-model="search" class="input grow" placeholder="搜索单号 / 商品"/><picker :range="filterLabels" :value="filterIndex" @change="selectStatus"><view class="status-picker">{{ filterLabels[filterIndex] }}⌄</view></picker></view>
  <picker class="date-query" :range="dateRanges" :value="rangeIndex" @change="selectRange"><view class="date-query-row"><text>查询日期</text><view>{{dateRanges[rangeIndex]}} <text class="chevron">⌄</text></view></view></picker>
  <view v-if="kind === 'returns'" class="demo-banner">新建退货：进入“已收货”单据，从来源明细申请退货。</view>
  <view v-if="error" class="error" @tap="load">{{ error }} · 点击重试</view><view v-if="loading" class="empty">正在查询…</view>
  <view v-for="doc in visible" :key="doc.id" class="card" @tap="go(`/pages/detail/index?kind=${kind}&id=${doc.id}`)"><view class="between"><text class="doc-no">{{ doc.id }}</text><text :class="['tag',{pending:['PENDING','OPEN','SUBMITTED'].includes(doc.status),closed:['CANCELLED','REJECTED'].includes(doc.status)}]">{{ documentLabel(kind,doc.status) }}</text></view><view class="muted" style="margin-top:10rpx">{{ dateText(doc.createdAt) }}</view><view class="divider"/><view class="row"><ProductMark :product="doc.lines[0]"/><view class="grow"><view class="product-name">{{ doc.lines[0]?.name }}{{ doc.lines.length > 1 ? ' 等' : '' }}</view><text class="muted">共 {{ doc.lines.length }} 种商品</text></view><text class="price">¥{{ money(total(doc)) }}</text></view><view class="between" style="margin-top:20rpx"><text class="muted">{{ doc.remark || '门店日常业务' }}</text><text class="link">查看 →</text></view></view>
  <view v-if="!loading && !error && !filtered.length" class="card empty"><text class="empty-symbol">▤</text>暂无符合条件的单据<view class="hint">调整筛选条件，或从工作台开始新的业务。</view></view><button v-if="filtered.length > limit" class="secondary" @tap="limit += 10">加载更多</button>
</view></template>
<script setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { onLoad, onShow, onPullDownRefresh } from '@dcloudio/uni-app'
import { api, guard, go, kinds, dateText } from '../../services/api.js'
import { labels, money, documentLabel } from '../../core/validation.js'
import ProductMark from '../../components/ProductMark.vue'
import {dateRanges,orderDateRange} from '../../core/order-list.js'
const rangeIndex=ref(2)
const kind=ref('orders'), docs=ref([]), loading=ref(false), error=ref(''), search=ref(''), status=ref('ALL'), limit=ref(10)
let loadId = 0
const filters=computed(()=>({orders:['ALL','DRAFT','SUBMITTED'],receipts:['ALL','PENDING','RECEIVED'],differences:['ALL','OPEN','RESOLVED'],returns:['ALL','DRAFT','SUBMITTED','APPROVED','SHIPPED','COMPLETED','REJECTED','CANCELLED']}[kind.value]))
const filterLabels=computed(()=>filters.value.map(s=>s==='ALL'?'全部状态':documentLabel(kind.value,s))),filterIndex=computed(()=>filters.value.indexOf(status.value))
function selectStatus(event){status.value=filters.value[Number(event.detail.value)];limit.value=10;load()}
const filtered=computed(()=>docs.value),visible=computed(()=>filtered.value.slice(0,limit.value))
const total=doc=>doc.lines.reduce((sum,x)=>sum+x.price*x.quantity,0)
async function load(){clearTimeout(timer);if(!guard())return;const ticket=++loadId;loading.value=true;error.value='';docs.value=[];limit.value=10;try{const result=await api.get(`/${kind.value}`,{status:status.value,...orderDateRange(rangeIndex.value),search:search.value.trim()});if(ticket===loadId)docs.value=result}catch(e){if(ticket===loadId)error.value=e.message}finally{if(ticket===loadId)loading.value=false;uni.stopPullDownRefresh()}}
let timer
watch(search,()=>{++loadId;docs.value=[];loading.value=true;clearTimeout(timer);timer=setTimeout(load,300)})
onBeforeUnmount(()=>{++loadId;clearTimeout(timer)})
function selectRange(event){rangeIndex.value=Number(event.detail.value);load()}
onLoad(options=>{if(kinds[options.kind])kind.value=options.kind;uni.setNavigationBarTitle({title:kinds[kind.value]})});onShow(load);onPullDownRefresh(load)
</script>
<style scoped>.list-tools{display:flex;align-items:center;gap:16rpx;margin:28rpx 0}.list-tools .input{min-width:0}.status-picker{padding:24rpx 18rpx;border:1rpx solid #dfe7df;background:white;border-radius:14rpx;font-size:25rpx;color:#52725b;white-space:nowrap}.date-query{display:block;margin:-8rpx 0 24rpx}.date-query-row{display:flex;align-items:center;justify-content:space-between;padding:20rpx 24rpx;background:white;border-radius:9rpx;min-height:48px;font-size:28rpx;font-weight:600;color:#526b5c}.date-query-row .chevron{margin-left:18rpx;color:#0eab70}.doc-no{font-size:25rpx;font-weight:650;word-break:break-all}</style>
