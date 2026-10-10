<template><view class="bottom-nav"><view v-for="item in items" :key="item.name" :class="['nav-item', { active: active === item.name }]" @tap="open(item)"><text class="nav-icon">{{ item.icon }}</text><text>{{ item.title }}</text><view v-if="active === item.name" class="nav-dot" /></view></view></template>
<script setup>
defineProps({ active: String })
const items = [{ name: 'home', title: '工作台', icon: '▦', url: '/pages/home/index' }, { name: 'orders', title: '业务单据', icon: '▤', url: '/pages/orders/index' }, { name: 'profile', title: '我的', icon: '◉', url: '/pages/profile/index' }]
function open(item) { uni.reLaunch({ url: item.url }) }
</script>
