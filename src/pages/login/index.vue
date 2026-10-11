<template><view class="login-surface"><BrandHeader subtitle="让门店日常，更有条理"/><view class="login-body"><view class="login-card"><view class="login-title">登录门店</view><text class="muted">欢迎使用豆豆店务</text>
  <text class="field-label">门店账号</text><input v-model="form.account" class="input" placeholder="请输入账号" maxlength="64" :disabled="busy"/>
  <text class="field-label">登录密码</text><view class="password-row"><input v-model="form.password" class="input" :password="!visible" placeholder="请输入密码" maxlength="128" :disabled="busy" @confirm="login"/><text @tap="visible=!visible">{{visible?'隐藏':'显示'}}</text></view>
  <view v-if="error" class="error">{{error}}</view><button class="primary login-button" :loading="busy" :disabled="busy" @tap="login">登录门店</button>
  <view v-if="isDemo" class="demo-banner"><view>演示体验 · 无真实业务数据</view><view>账号：store001　密码：Doudou123</view></view><text class="hint">账号异常或忘记密码，请联系门店管理员。</text>
</view><view class="login-footer">订货 · 收货 · 差异核对 · 退货申请</view></view></view></template>
<script setup>
import { reactive,ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { api,client,isDemo } from '../../services/api.js'
import BrandHeader from '../../components/BrandHeader.vue'
const form=reactive({account:isDemo?'store001':'',password:''}),busy=ref(false),visible=ref(false),error=ref('')
onShow(()=>{if(client.getSession())uni.reLaunch({url:'/pages/home/index'})})
async function login(){if(busy.value)return;busy.value=true;error.value='';try{await api.login({...form});form.password='';uni.reLaunch({url:'/pages/home/index'})}catch(e){error.value=e.message}finally{busy.value=false}}
</script>
<style scoped>
.login-surface{min-height:100vh;max-width:1000rpx;margin:0 auto}.login-body{padding:0 30rpx 60rpx}.login-card{padding:34rpx;background:white;border-radius:10rpx}.login-title{font-size:37rpx;font-weight:650;margin-bottom:8rpx}.password-row{position:relative}.password-row input{padding-right:96rpx}.password-row>text{position:absolute;right:23rpx;top:25rpx;color:#0b9e68;font-size:24rpx}.login-button{margin-top:36rpx}.login-footer{font-size:23rpx;text-align:center;color:#a3aaa6;margin-top:38rpx}.demo-banner{font-size:23rpx;line-height:1.8}.input{height:94rpx}
</style>
