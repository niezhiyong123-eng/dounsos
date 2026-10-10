<template><view class="page"><text class="eyebrow">STORE DOCUMENTS</text><view class="between"><view class="title">业务单据</view><button v-if="kind === 'orders'" class="primary small" @tap="go('/pages/create/index')">＋ 新建订货</button></view>
  <scroll-view scroll-x><view class="tabs"><view v-for="(label,key) in kinds" :key="key" :class="['tab',{active:kind===key}]" @tap="switchKind(key)">{{ label }}</view></view></scroll-view>
  <input v-model="search" class="input" placeholder="搜索单据编号 / 商品名称"/><scroll-view scroll-x><view class="filters"><text v-for="s in filters" :key="s" :class="{chosen:status===s}" @tap="status=s">{{ s === 'ALL' ? '全部' : labels[s] }}</text></view></scroll-view>
  <view v-if="kind === 'returns'" class="demo-banner">新建退货：进入“已收货”单据，从来源明细申请退货。</view>
  <view v-if="error" class="error" @tap="load">{{ error }} · 点击重试</view><view v-if="loading" class="empty">正在查询…</view>
  <view v-for="doc in visible" :key="doc.id" class="card" @tap="go(`/pages/detail/index?kind=${kind}&id=${doc.id}`)"><view class="between"><text class="doc-no">{{ doc.id }}</text><text :class="['tag',{pending:['PENDING','OPEN','SUBMITTED'].includes(doc.status),closed:['CANCELLED','REJECTED'].includes(doc.status)}]">{{ labels[doc.status] }}</text></view><view class="muted" style="margin-top:10rpx">{{ dateText(doc.createdAt) }}</view><view class="divider"/><view class="row"><ProductMark :product="doc.lines[0]"/><view class="grow"><view class="product-name">{{ doc.lines[0]?.name }}{{ doc.lines.length > 1 ? ' 等' : '' }}</view><text class="muted">共 {{ doc.lines.length }} 种商品</text></view><text class="price">¥{{ money(total(doc)) }}</text></view><view class="between" style="margin-top:20rpx"><text class="muted">{{ doc.remark || '门店日常业务' }}</text><text class="link">查看 →</text></view></view>
  <view v-if="!loading && !error && !filtered.length" class="card empty"><text class="empty-symbol">▤</text>暂无符合条件的单据<view class="hint">调整筛选条件，或从工作台开始新的业务。</view></view><button v-if="filtered.length > limit" class="secondary" @tap="limit += 10">加载更多</button><BottomNav active="orders"/>
</view></template>
<script setup>
import { ref, computed } from 'vue'
import { onLoad, onShow, onPullDownRefresh } from '@dcloudio/uni-app'
import { api, guard, go, kinds, dateText } from '../../services/api.js'
import { labels, money } from '../../core/validation.js'
import ProductMark from '../../components/ProductMark.vue'
import BottomNav from '../../components/BottomNav.vue'
const kind=ref('orders'), docs=ref([]), loading=ref(false), error=ref(''), search=ref(''), status=ref('ALL'), limit=ref(10)
let loadId = 0
const filters=computed(()=>({orders:['ALL','DRAFT','SUBMITTED','APPROVED','CANCELLED'],receipts:['ALL','PENDING','RECEIVED'],differences:['ALL','OPEN','RESOLVED'],returns:['ALL','DRAFT','SUBMITTED','APPROVED','SHIPPED','COMPLETED','REJECTED','CANCELLED']}[kind.value]))
const filtered=computed(()=>docs.value.filter(x=>(status.value==='ALL'||x.status===status.value)&&(!search.value||`${x.id} ${x.lines.map(y=>y.name).join(' ')}`.includes(search.value.trim())))),visible=computed(()=>filtered.value.slice(0,limit.value))
const total=doc=>doc.lines.reduce((sum,x)=>sum+x.price*x.quantity,0)
function switchKind(key){kind.value=key;status.value='ALL';search.value='';limit.value=10;docs.value=[];load()}
async function load(){if(!guard())return;const ticket=++loadId;loading.value=true;error.value='';try{const result=await api.get(`/${kind.value}`);if(ticket===loadId)docs.value=result}catch(e){if(ticket===loadId)error.value=e.message}finally{if(ticket===loadId)loading.value=false;uni.stopPullDownRefresh()}}
onLoad(options=>{if(kinds[options.kind])kind.value=options.kind});onShow(load);onPullDownRefresh(load)
</script>
<style scoped>.filters{display:flex;gap:32rpx;padding:28rpx 4rpx;white-space:nowrap;font-size:25rpx;color:#8c9788}.filters .chosen{color:#2a6e52;font-weight:700}.doc-no{font-size:25rpx;font-weight:650;word-break:break-all}</style>
