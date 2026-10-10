<template>
  <view class="login-page">
    <view class="brand"><view class="brand-mark">豆</view><text>豆豆店务</text><text class="brand-en">STORE OPERATIONS</text></view>
    <view class="login-hero"><text class="eyebrow">让门店日常，更有条理</text><view class="welcome">每一天，<br/>从好生意开始。</view><text class="muted">订货 · 收货 · 差异核对 · 退货协同</text><view class="hero-decoration"><view class="leaf leaf-one"/><view class="leaf leaf-two"/><view class="leaf leaf-three"/><view class="stem"/></view></view>
    <view class="card login-card"><view class="section-title">登录你的门店</view><text class="muted">使用门店账号，开始今日工作</text>
      <text class="field-label">门店账号</text><input v-model="form.account" class="input" placeholder="请输入账号" maxlength="64" :disabled="busy" />
      <text class="field-label">登录密码</text><view class="password-row"><input v-model="form.password" class="input" :password="!visible" placeholder="请输入密码" maxlength="128" :disabled="busy" @confirm="login"/><text @tap="visible = !visible">{{ visible ? '隐藏' : '显示' }}</text></view>
      <view v-if="error" class="error">{{ error }}</view><button class="primary login-button" :loading="busy" :disabled="busy" @tap="login">登录门店 →</button>
      <view v-if="isDemo" class="demo-banner">演示体验 · 无真实业务数据<br/>账号：store001　密码：Doudou123</view><text class="hint">账号异常或忘记密码，请联系门店管理员。</text>
    </view><view class="login-footer">DOUDOU RETAIL · 专注每一份门店日常</view>
  </view>
</template>
<script setup>
import { reactive, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { api, client, isDemo } from '../../services/api.js'
const form = reactive({ account: isDemo ? 'store001' : '', password: '' }), busy = ref(false), visible = ref(false), error = ref('')
onShow(() => { if (client.getSession()) uni.reLaunch({ url: '/pages/home/index' }) })
async function login() { if (busy.value) return; busy.value = true; error.value = ''; try { await api.login({ ...form }); form.password = ''; uni.reLaunch({ url: '/pages/home/index' }) } catch (e) { error.value = e.message } finally { busy.value = false } }
</script>
<style scoped>
.login-page{max-width:900rpx;padding:64rpx 42rpx 40rpx;margin:auto}.brand{display:flex;align-items:center;gap:15rpx;font-weight:700;font-size:31rpx}.brand-mark{width:59rpx;height:59rpx;display:flex;align-items:center;justify-content:center;border-radius:19rpx 19rpx 19rpx 5rpx;background:#286f55;color:#fff;font-size:34rpx}.brand-en{font-size:16rpx;letter-spacing:2rpx;margin-left:auto;color:#8b9888}.login-hero{position:relative;padding:62rpx 0 52rpx}.welcome{font-size:59rpx;font-weight:750;line-height:1.4;margin:16rpx 0 18rpx}.login-card{padding:34rpx;position:relative}.login-card .section-title{margin:0 0 8rpx}.password-row{position:relative}.password-row input{padding-right:96rpx}.password-row>text{position:absolute;right:23rpx;top:25rpx;color:#758474;font-size:24rpx}.login-button{margin-top:35rpx}.login-footer{font-size:20rpx;color:#9ca696;text-align:center;margin-top:32rpx;letter-spacing:2rpx}.hero-decoration{position:absolute;right:4rpx;bottom:50rpx;width:130rpx;height:155rpx;opacity:.8}.leaf{position:absolute;width:60rpx;height:80rpx;border-radius:0 90rpx 0 90rpx;background:#cbd8bd}.leaf-one{left:60rpx;top:0;transform:rotate(35deg)}.leaf-two{top:45rpx;left:5rpx;transform:rotate(-40deg)}.leaf-three{left:70rpx;top:70rpx;transform:rotate(60deg)}.stem{position:absolute;left:65rpx;top:40rpx;height:120rpx;width:3rpx;background:#a5b899;transform:rotate(12deg)}
</style>
