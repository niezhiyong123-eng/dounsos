<template><view class="bottom-nav"><view :class="['nav-item',{active:active==='home'}]" @tap="open('/pages/home/index')"><LineIcon name="home"/><text>首页</text></view><view :class="['nav-item',{active:active==='orders'}]" @tap="open('/pages/orders/index')"><LineIcon name="apps"/><text>业务单据</text></view><view :class="['nav-item',{active:active==='profile'}]" @tap="open('/pages/profile/index')"><LineIcon name="user"/><text>我的</text></view></view></template>
<script setup>
defineProps({ active: String })
import LineIcon from './LineIcon.vue'
function open(url) { uni.reLaunch({ url }) }
</script>
