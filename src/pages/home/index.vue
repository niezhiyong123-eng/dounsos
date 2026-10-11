<template><view class="surface-page">
  <BrandHeader><view class="store-summary"><view class="user-name">{{user.name}}</view><view class="between"><text class="store-name" @tap="go('/pages/profile/index')">{{user.storeName}} ›</text><text class="refresh-link" @tap="load">刷新数据 ↓</text></view></view></BrandHeader>
  <view class="surface-body">
    <view class="notice-bar"><LineIcon name="info"/><text>{{isDemo?'演示环境 · 门店业务流程体验':'门店工作台 · 今日业务及时处理'}}</text></view>
    <view class="surface-panel"><view class="panel-heading">常用应用</view><view class="feature-grid">
      <view class="module-card entry" @tap="go('/pages/create/index')"><LineIcon name="order"/><text class="module-label">门店订货</text></view>
      <view class="module-card entry" @tap="open('receipts')"><LineIcon name="receive"/><text class="module-label">收货确认</text></view>
      <view class="module-card entry" @tap="open('differences')"><LineIcon name="difference"/><text class="module-label">差异核对</text></view>
      <view class="module-card entry" @tap="open('returns')"><LineIcon name="return"/><text class="module-label">退货申请</text></view>
    </view></view>
    <view class="surface-panel"><view class="panel-heading">常用数据</view><view class="data-grid">
      <view class="data-item" @tap="open('orders')"><text class="data-number">{{stats.orders}}</text><text>订货待审核</text></view>
      <view class="data-item" @tap="open('receipts')"><text class="data-number">{{stats.pending}}</text><text>待确认收货</text></view>
      <view class="data-item" @tap="open('differences')"><text class="data-number">{{stats.differences}}</text><text>待核对差异</text></view>
      <view class="data-item" @tap="open('returns')"><text class="data-number">{{stats.returns}}</text><text>退货处理中</text></view>
    </view></view>
    <view v-if="error" class="error" @tap="load">{{error}} · 点击重试</view>
    <view v-if="loading" class="empty">正在加载…</view>
    <view v-else class="surface-panel"><view class="between"><view class="panel-heading">待收货配送</view><text class="link" @tap="open('receipts')">查看全部 ›</text></view><view v-for="doc in pending" :key="doc.id" class="delivery-row" @tap="go(`/pages/detail/index?kind=receipts&id=${doc.id}`)"><LineIcon name="receive"/><view class="grow"><view class="delivery-name">华东配送中心</view><text class="muted">{{doc.id}} · {{doc.lines.length}}种商品</text></view><text class="chevron">›</text></view><view v-if="!error&&!pending.length" class="empty">暂无待收货配送</view></view>
  </view><BottomNav active="home"/>
</view></template>
<script setup>
import { ref, computed } from 'vue'
import { onShow, onPullDownRefresh } from '@dcloudio/uni-app'
import { api, client, guard, go, isDemo } from '../../services/api.js'
import BrandHeader from '../../components/BrandHeader.vue'
import LineIcon from '../../components/LineIcon.vue'
import BottomNav from '../../components/BottomNav.vue'
const stats=ref({pending:0,differences:0,orders:0,returns:0}),pending=ref([]),loading=ref(false),error=ref('')
const user=computed(()=>client.getSession()?.user||{})
const open=kind=>go(`/pages/documents/index?kind=${kind}`)
async function load(){if(!guard())return;loading.value=true;error.value='';try{const [s,receipts]=await Promise.all([api.get('/dashboard'),api.get('/receipts')]);stats.value=s;pending.value=receipts.filter(x=>x.status==='PENDING').slice(0,3)}catch(e){error.value=e.message}finally{loading.value=false;uni.stopPullDownRefresh()}}
onShow(load);onPullDownRefresh(load)
</script>
<style scoped>
.store-summary{position:relative;padding:12rpx 0 10rpx}.user-name{font-size:34rpx;font-weight:700;margin-bottom:6rpx}.store-name{font-size:25rpx;font-weight:600;max-width:75%}.refresh-link{font-size:23rpx;white-space:nowrap}.data-grid{display:flex}.data-item{width:25%;display:flex;flex-direction:column;align-items:center;font-size:22rpx;gap:12rpx;padding:12rpx 0 20rpx}.data-number{font-size:46rpx;line-height:1.2;color:#0ca46c;font-weight:600}.delivery-row{display:flex;align-items:center;gap:18rpx;padding:22rpx 0;border-top:1rpx solid #f1f2f0;color:#606a63}.delivery-name{font-size:27rpx;color:#4b5350;margin-bottom:5rpx}.delivery-row .muted{font-size:21rpx}.between .panel-heading{margin-bottom:18rpx}.notice-bar .line-icon{transform:scale(.7);width:34rpx;height:34rpx}
</style>
