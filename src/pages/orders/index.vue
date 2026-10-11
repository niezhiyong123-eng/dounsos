<template><view class="surface-page"><BrandHeader/><view class="surface-body">
  <view class="module-search"><LineIcon name="search"/><input v-model="search" placeholder="请输入模块名称查询" placeholder-style="color:#a5aaa8"/></view>
  <view class="surface-panel"><view class="panel-heading">业务单据</view><view class="feature-grid">
    <view :style="matches('订货单') ? '' : 'display:none'" class="module-card" @tap="open('orders')"><LineIcon name="order"/><text class="module-label">订货单</text></view>
    <view :style="matches('收货单') ? '' : 'display:none'" class="module-card" @tap="open('receipts')"><LineIcon name="receive"/><text class="module-label">收货单</text></view>
    <view :style="matches('差异单') ? '' : 'display:none'" class="module-card" @tap="open('differences')"><LineIcon name="difference"/><text class="module-label">差异单</text></view>
    <view :style="matches('退货申请单') ? '' : 'display:none'" class="module-card" @tap="open('returns')"><LineIcon name="return"/><text class="module-label">退货申请单</text></view>
  </view><view v-if="!hasMatches" class="empty">没有找到相关模块</view></view>
  <view class="surface-subtitle">点击对应模块，查询或办理门店业务</view>
</view><BottomNav active="orders"/></view></template>
<script setup>
import { ref,computed } from 'vue'
import { onLoad,onShow } from '@dcloudio/uni-app'
import { guard,go,kinds } from '../../services/api.js'
import BrandHeader from '../../components/BrandHeader.vue'
import LineIcon from '../../components/LineIcon.vue'
import BottomNav from '../../components/BottomNav.vue'
const search=ref('')
const matches=label=>label.includes(search.value.trim())
const hasMatches=computed(()=>Object.values(kinds).some(matches))
const open=kind=>go(`/pages/documents/index?kind=${kind}`)
onShow(()=>guard())
onLoad((options={})=>{if(kinds[options.kind]&&guard())uni.redirectTo({url:`/pages/documents/index?kind=${options.kind}`})})
</script>
<style scoped>
.module-search{background:#fff;border-radius:8rpx;display:flex;align-items:center;gap:20rpx;padding:18rpx 24rpx;margin:0 0 22rpx}.module-search input{flex:1;min-width:0;height:50rpx;font-size:29rpx}.module-search .line-icon{color:#535d57;transform:scale(.75)}.module-label{font-size:24rpx}.surface-panel{padding-left:18rpx;padding-right:18rpx}.panel-heading{padding-left:6rpx}
</style>
