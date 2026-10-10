<template><view :class="['product-mark', product.color || 'mint']"><image v-if="url && !failed" :src="url" mode="aspectFit" @error="failed = true" /><text v-else>{{ product.mark || '货' }}</text></view></template>
<script setup>
import { computed, ref } from 'vue'
const props = defineProps({ product: { type: Object, required: true } })
const failed = ref(false)
// Fixed bitmap assets use OSS exclusively; CSS/text placeholders work offline.
const root = (import.meta.env.VITE_OSS_BASE_URL || '').replace(/\/$/, '')
const url = computed(() => /^https:\/\//.test(root) ? `${root}/miniapp/v1/products/${encodeURIComponent(props.product.sku)}.png` : '')
</script>
