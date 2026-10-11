<template>
  <view class="page">
    <view class="title">业务单据</view>
    <view class="muted intro">选择要办理的业务</view>
    <view class="module-list">
      <view v-for="item in modules" :key="item.kind" class="module-card" @tap="go(`/pages/documents/index?kind=${item.kind}`)">
        <view :class="['module-icon', item.color]">{{ item.icon }}</view>
        <view class="grow"><view class="module-name">{{ kinds[item.kind] }}</view><text class="muted">{{ item.description }}</text></view>
        <text class="module-arrow">›</text>
      </view>
    </view>
    <BottomNav active="orders"/>
  </view>
</template>
<script setup>
import { onLoad, onShow } from '@dcloudio/uni-app'
import { guard, go, kinds } from '../../services/api.js'
import BottomNav from '../../components/BottomNav.vue'
const modules = [
  { kind: 'orders', description: '订货记录与审核进度', icon: '＋', color: 'mint' },
  { kind: 'receipts', description: '配送收货与明细确认', icon: '↓', color: 'blue' },
  { kind: 'differences', description: '收货差异与核对记录', icon: '≠', color: 'sand' },
  { kind: 'returns', description: '退货申请与处理进度', icon: '↗', color: 'rose' }
]
onShow(guard)
onLoad(options => { if (kinds[options.kind] && guard()) uni.redirectTo({ url: `/pages/documents/index?kind=${options.kind}` }) })
</script>
<style scoped>
.intro{margin-top:12rpx}.module-list{margin-top:32rpx;background:white;border:1rpx solid #e7ede3;border-radius:22rpx;padding:0 26rpx}.module-card{display:flex;align-items:center;gap:24rpx;padding:32rpx 0;border-bottom:1rpx solid #edf0e9}.module-card:last-child{border-bottom:0}.module-icon{width:76rpx;height:76rpx;border-radius:18rpx;display:flex;align-items:center;justify-content:center;font-size:38rpx;flex-shrink:0}.module-name{font-size:31rpx;font-weight:650;margin-bottom:6rpx}.module-arrow{font-size:42rpx;color:#9eae9c}.module-card .muted{font-size:23rpx}
</style>
