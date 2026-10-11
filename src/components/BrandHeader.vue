<template><view class="brand-header" :style="{paddingTop: top + 'px'}"><view class="brand-cloud cloud-one"/><view class="brand-cloud cloud-two"/><view class="brand-copy"><text class="brand-english">DOUDOU</text><text class="brand-chinese">豆豆店务</text></view><view v-if="subtitle" class="brand-subtitle">{{subtitle}}</view><slot/></view></template>
<script setup>
import { ref } from 'vue'
defineProps({ subtitle: String })
const top = ref(62)
try { const info = uni.getSystemInfoSync(); top.value = (info.statusBarHeight || 20) + 44 } catch {}
</script>
<style scoped>
.brand-header{position:relative;overflow:hidden;background:linear-gradient(180deg,#90df9d 0%,#c3eccb 57%,#f4f5f5 100%);padding:0 30rpx 32rpx;min-height:320rpx}.brand-copy{position:relative;display:flex;flex-direction:column;z-index:1;line-height:1.05;padding:12rpx 0 18rpx}.brand-english{font-size:64rpx;letter-spacing:2rpx;font-weight:800;color:#f0fff2}.brand-chinese{font-size:55rpx;letter-spacing:7rpx;font-weight:650;color:#edfff0;margin-top:9rpx}.brand-subtitle{position:relative;font-size:25rpx;color:#548564;padding-top:10rpx}.brand-cloud{position:absolute;background:#88d99a;opacity:.18;width:390rpx;height:170rpx;border-radius:140rpx;right:-5rpx;top:120rpx;transform:rotate(-23deg)}.cloud-two{width:250rpx;height:90rpx;right:80rpx;top:220rpx;transform:rotate(8deg)}
</style>
