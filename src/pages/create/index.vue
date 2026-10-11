<template><view class="page">
  <view class="title">新建订货单</view><view class="muted intro">选择订货模板后添加商品</view>
  <view class="card store-card"><LineIcon name="store"/><view><text class="field-label">当前门店</text><view class="store-name">{{user.storeName}}</view><text class="muted">门店编码 {{user.storeId}}</text></view></view>
  <view class="section-title">选择订货模板</view>
  <view v-if="loading" class="empty">模板加载中…</view><view v-if="error" class="error" @tap="load">{{error}} · 点击重试</view>
  <view v-for="item in templates" :key="item.id" :class="['card','template-card',{selected:chosen===item.id}]" @tap="chosen=item.id">
    <view class="between"><view class="grow"><view class="template-name">{{item.name}}</view><view class="muted description">{{item.description}}</view><text class="hint">{{item.productCount}} 种可订商品</text></view><view class="radio">{{chosen===item.id?'✓':''}}</view></view>
  </view>
  <view v-if="!loading&&!error&&!templates.length" class="empty">当前门店暂无可用模板，请联系业务管理员配置</view>
  <view class="action-bar"><button class="primary" :disabled="!chosen||loading||!!error" @tap="next">下一步 · 选择订货商品</button></view>
</view></template>
<script setup>
import {ref,computed} from 'vue'
import {onShow} from '@dcloudio/uni-app'
import {api,client,guard,go} from '../../services/api.js'
import LineIcon from '../../components/LineIcon.vue'
const user=computed(()=>client.getSession()?.user||{}),templates=ref([]),chosen=ref(''),loading=ref(false),error=ref('')
async function load(){if(!guard())return;loading.value=true;error.value='';try{templates.value=await api.get('/order-templates');if(!templates.value.some(x=>x.id===chosen.value))chosen.value=''}catch(e){templates.value=[];chosen.value='';error.value=e.message}finally{loading.value=false}}
onShow(load)
function next(){if(!chosen.value||loading.value||error.value)return;go(`/pages/order-products/index?templateId=${encodeURIComponent(chosen.value)}`)}
</script>
<style scoped>
.intro{margin:10rpx 0 28rpx}.store-card{display:flex;align-items:center;gap:26rpx}.store-card .field-label{margin:0 0 8rpx}.store-name{font-size:30rpx;font-weight:600;margin-bottom:7rpx}.template-card{border:2rpx solid transparent}.template-card.selected{border-color:#0eab70;background:#f4fcf7}.template-name{font-size:30rpx;font-weight:600}.description{margin:8rpx 0}.radio{width:40rpx;height:40rpx;border:2rpx solid #cdd8d0;border-radius:50%;text-align:center;line-height:36rpx;flex-shrink:0;color:white}.selected .radio{background:#0eab70;border-color:#0eab70}
</style>
