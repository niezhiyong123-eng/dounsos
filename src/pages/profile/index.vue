<template><view class="surface-page"><BrandHeader/><view class="surface-body">
  <view class="identity-card"><view class="identity-avatar"><LineIcon name="user"/></view><view class="grow"><view class="identity-name">{{user.name}}</view><view class="identity-meta">{{user.role}}</view><view class="identity-meta">账号 {{user.account}}</view></view></view>
  <view class="section-title">门店信息</view>
  <view class="setting-row" @tap="showStore"><LineIcon name="store"/><text>当前门店</text><text class="setting-value">{{user.storeName}}</text><text class="chevron">›</text></view>
  <view class="section-title">应用设置</view>
  <view class="setting-row" @tap="showUsage"><LineIcon name="order"/><text>使用说明</text><text class="chevron" style="margin-left:auto">›</text></view>
  <view class="setting-row" @tap="showVersion"><LineIcon name="info"/><text>当前版本</text><text class="setting-value">V 0.1.0</text><text class="chevron">›</text></view>
  <view class="setting-row"><LineIcon name="apps"/><text>运行环境</text><text class="setting-value">{{isDemo?'演示环境':'CMP5 接入环境'}}</text></view>
  <button class="primary logout-button" :loading="busy" :disabled="busy" @tap="logout">退出登录</button>
</view><BottomNav active="profile"/></view></template>
<script setup>
import { computed,ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { client,api,guard,confirm,isDemo,storage } from '../../services/api.js'
import BrandHeader from '../../components/BrandHeader.vue'
import LineIcon from '../../components/LineIcon.vue'
import BottomNav from '../../components/BottomNav.vue'
const user=computed(()=>client.getSession()?.user||{}),busy=ref(false)
onShow(()=>guard())
const modal=(title,content)=>uni.showModal({title,content,showCancel:false,confirmColor:'#0eab70'})
const showStore=()=>modal('当前门店',`${user.value.storeName}\n门店编码：${user.value.storeId}\n当前账号已关联此门店。`)
const showUsage=()=>modal('使用说明','从首页新建订货，提交后查看审核进度；收货时录入合格及破损数量，有差异时填写原因；已收货单可申请退货，审批通过后办理出库。')
const showVersion=()=>modal('版本信息','豆豆店务 V0.1.0\n'+(isDemo?'界面体验版，使用本机演示数据，尚未接入CMP5。':'CMP5接入环境'))
async function logout(){if(busy.value)return;busy.value=true;try{if(!await confirm('确认退出登录？本地会话和未提交的订货输入将清除。'))return;storage.remove(`order-draft:${user.value.storeId}`);let message='';try{await api.logout()}catch(e){message='已清除本地登录状态，但服务端退出未确认。'}uni.reLaunch({url:'/pages/login/index'});if(message)modal('退出提示',message)}finally{busy.value=false}}
</script>
<style scoped>
.identity-card{display:flex;align-items:center;gap:27rpx;background:white;border-radius:8rpx;padding:32rpx}.identity-avatar{width:95rpx;height:95rpx;background:#e5f6ea;color:#389d6e;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0}.identity-avatar .line-icon{transform:scale(1.1)}.identity-name{font-size:35rpx;font-weight:650;margin-bottom:6rpx}.identity-meta{color:#a0a6a2;font-size:25rpx;margin-top:4rpx}.logout-button{margin-top:68rpx;font-size:31rpx;padding:25rpx}.setting-row>text:nth-child(2){font-size:28rpx;white-space:nowrap}.setting-value{max-width:52%}
</style>
