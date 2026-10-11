<template><view class="page">
  <view v-if="loading" class="empty">单据加载中…</view><view v-if="error" class="error" @tap="load">{{error}} · 点击重试</view>
  <template v-if="doc"><view class="between"><view><text class="eyebrow">DOCUMENT DETAILS</text><view class="title">{{returnMode?'申请退货':kinds[kind]+'详情'}}</view></view><text class="tag">{{labels[doc.status]}}</text></view>
    <view v-if="isDemo" class="demo-banner">演示单据 · 操作不会写入真实库存或 CMP5</view>
    <view class="card"><view class="meta-row"><text class="muted">单据编号</text><text>{{doc.id}}</text></view><view v-if="doc.templateName" class="meta-row"><text class="muted">订货模板</text><text>{{doc.templateName}}</text></view><view v-if="doc.sourceId" class="meta-row"><text class="muted">来源单号</text><text>{{doc.sourceId}}</text></view><view class="meta-row"><text class="muted">创建时间</text><text>{{dateText(doc.createdAt)}}</text></view><view class="meta-row"><text class="muted">门店</text><text>豆豆便利 · 万象城店</text></view><view v-if="doc.remark" class="meta-row"><text class="muted">备注</text><text>{{doc.remark}}</text></view></view>
    <view class="between"><view class="section-title">{{returnMode?'选择退货商品':'商品明细'}}</view><text class="muted">{{doc.lines.length}} 种商品</text></view>
    <view v-for="(line,index) in doc.lines" :key="line.sku" class="card"><view class="row"><ProductMark :product="line"/><view class="grow"><view class="product-name">{{line.name}}</view><text class="muted">{{line.spec}} · {{line.sku}}</text><view class="price">¥{{money(line.price)}} / {{line.unit}}</view></view><text class="qty-label">× {{line.quantity}}</text></view>
      <view v-if="kind==='receipts'&&doc.status==='PENDING'" class="receive-fields"><view><text class="field-label">合格数量（{{line.unit}}）</text><input v-model="inputs[index].received" type="number" class="input" maxlength="5" :disabled="busy"/></view><view><text class="field-label">破损数量（{{line.unit}}）</text><input v-model="inputs[index].damaged" type="number" class="input" maxlength="5" :disabled="busy"/></view></view>
      <view v-if="kind==='receipts'&&doc.status==='PENDING'" class="hint" style="margin-top:15rpx">发货 {{line.quantity}} · 短收 {{shortage(index)}} · 破损不计合格入库</view>
      <view v-if="kind==='receipts'&&doc.status==='RECEIVED'" class="hint" style="margin-top:18rpx">合格 {{line.received}} · 破损 {{line.damaged||0}} · 可退 {{line.returnable}} {{line.unit}}</view>
      <view v-if="returnMode"><text class="field-label">本次退货数量（{{line.unit}}）</text><input v-model="inputs[index].quantity" type="number" class="input" maxlength="5" :disabled="busy"/></view>
      <view v-if="kind==='differences'" class="difference-line">短收 {{line.shortage||0}} {{line.unit}}　/　破损 {{line.damaged||0}} {{line.unit}}</view>
    </view>
    <view class="card"><view class="between"><text class="muted">{{kind==='differences'?'来源明细金额（非索赔金额）':'单据参考金额'}}</text><text class="price">¥{{money(total)}}</text></view></view>
    <view v-if="needsRemark" class="card"><text class="field-label">{{remarkLabel}}</text><textarea v-model="remark" class="textarea" maxlength="200" :disabled="busy" :placeholder="remarkPlaceholder"/><text class="hint">{{remark.length}} / 200</text></view>
    <view v-if="doc.resolution||doc.shipping" class="card"><text class="field-label">处理记录</text><text>{{doc.resolution||doc.shipping}}</text></view>
    <view class="section-title">操作记录</view><view class="card"><view v-for="(entry,index) in doc.history" :key="index" class="history"><text>{{entry.text}}</text><text class="muted">{{dateText(entry.at)}}</text></view></view>
    <view v-if="isDemo&&!returnMode&&((['orders','returns'].includes(kind)&&doc.status==='SUBMITTED')||(kind==='returns'&&doc.status==='SHIPPED'))" class="demo-panel"><view class="product-name">演示流程控制</view><text class="hint">用于体验后续步骤；正式模式不显示，真实审批由 CMP5 完成。</text><view class="row" style="margin-top:20rpx"><button v-if="doc.status==='SUBMITTED'" class="secondary small" :disabled="busy" @tap="act('demo-approve','模拟 CMP 审核通过？订货单将生成待收货配送单。')">模拟审核通过</button><button v-if="kind==='returns'&&doc.status==='SUBMITTED'" class="secondary small" :disabled="busy" @tap="act('demo-reject','模拟 CMP 驳回退货申请？')">模拟驳回</button><button v-if="doc.status==='SHIPPED'" class="secondary small" :disabled="busy" @tap="act('demo-complete','模拟配送中心确认收到退货？')">模拟退货接收</button></view></view>
    <view class="action-bar" v-if="hasActions"><view class="row">
      <button v-if="['orders','returns'].includes(kind)&&['DRAFT','SUBMITTED'].includes(doc.status)" class="secondary" :disabled="busy" @tap="act('cancel','确认取消此单据？取消后不可恢复。')">取消单据</button>
      <button v-if="['orders','returns'].includes(kind)&&doc.status==='DRAFT'" class="primary" :loading="busy" :disabled="busy" @tap="act('submit','核对商品和数量后，提交审核？')">提交审核</button>
      <button v-if="kind==='receipts'&&doc.status==='PENDING'" class="primary" :loading="busy" :disabled="busy" @tap="receive">确认收货</button>
      <button v-if="kind==='receipts'&&doc.status==='RECEIVED'&&!returnMode" class="primary" :disabled="busy" @tap="returnMode=true">申请退货</button>
      <button v-if="returnMode" class="secondary" :disabled="busy" @tap="returnMode=false">取消填写</button><button v-if="returnMode" class="primary" :loading="busy" :disabled="busy" @tap="createReturn">保存退货申请</button>
      <button v-if="kind==='differences'&&doc.status==='OPEN'" class="primary" :disabled="busy" @tap="resolve">确认核对</button>
      <button v-if="kind==='returns'&&doc.status==='APPROVED'" class="primary" :disabled="busy" @tap="ship">确认退货出库</button>
    </view></view>
  </template>
</view></template>
<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { api, guard, kinds, dateText, isDemo, report, confirm, newKey } from '../../services/api.js'
import { labels, money, quantity, assert, note, linesInput } from '../../core/validation.js'
import ProductMark from '../../components/ProductMark.vue'
const kind=ref('orders'),id=ref(''),doc=ref(null),inputs=ref([]),loading=ref(false),busy=ref(false),error=ref(''),remark=ref(''),returnMode=ref(false)
const pendingKeys = new Map()
const total=computed(()=>doc.value?.lines.reduce((s,x)=>s+x.quantity*x.price,0)||0)
const needsRemark=computed(()=>returnMode.value||(kind.value==='receipts'&&doc.value?.status==='PENDING')||(kind.value==='differences'&&doc.value?.status==='OPEN')||(kind.value==='returns'&&doc.value?.status==='APPROVED'))
const remarkLabel=computed(()=>returnMode.value?'退货原因（必填）':kind.value==='receipts'?'收货说明（有差异时必填）':kind.value==='differences'?'核对意见（必填）':'物流或交接信息（必填）')
const remarkPlaceholder=computed(()=>returnMode.value?'请填写退货原因，例如包装破损、临期协商退货':kind.value==='receipts'?'请说明短收或破损情况':kind.value==='differences'?'填写核对结论及与配送中心沟通情况':'填写承运商、运单号或交接人员')
const hasActions=computed(()=>doc.value&&((['orders','returns'].includes(kind.value)&&['DRAFT','SUBMITTED'].includes(doc.value.status))||kind.value==='receipts'||(kind.value==='differences'&&doc.value.status==='OPEN')||(kind.value==='returns'&&doc.value.status==='APPROVED')))
function setDoc(value){doc.value=value;inputs.value=value.lines.map(x=>({sku:x.sku,received:String(x.quantity),damaged:'0',quantity:'0'}))}
async function load(){if(!guard())return;loading.value=true;error.value='';try{setDoc(await api.get(`/${kind.value}/${id.value}`))}catch(e){error.value=e.message}finally{loading.value=false}}
onLoad(options=>{if(!kinds[options.kind]||!options.id){error.value='单据参数不正确';return}kind.value=options.kind;id.value=options.id;load()})
const shortage=index=>Math.max(0,doc.value.lines[index].quantity-(Number(inputs.value[index]?.received)||0)-(Number(inputs.value[index]?.damaged)||0))
async function post(path,payload){const fingerprint=JSON.stringify({path,payload});if(!pendingKeys.has(fingerprint))pendingKeys.set(fingerprint,newKey());const result=await api.post(path,payload,pendingKeys.get(fingerprint));pendingKeys.delete(fingerprint);return result}
async function act(action,message,extra={}){if(busy.value)return;busy.value=true;try{if(!await confirm(message))return;const result=await post(`/${kind.value}/${id.value}/${action}`,{version:doc.value.version,...extra});setDoc(result);remark.value='';uni.showToast({title:'操作成功',icon:'success'});if(kind.value==='receipts')await load()}catch(e){report(e);if(e.status===409)await load()}finally{busy.value=false}}
function receive(){try{const lines=inputs.value.map((x,index)=>{const received=quantity(x.received,'合格数量',true),damaged=quantity(x.damaged,'破损数量',true);assert(received+damaged<=doc.value.lines[index].quantity,`${doc.value.lines[index].name}不可超收`);return {sku:x.sku,received,damaged}});const hasDifference=lines.some((x,i)=>x.damaged||x.received!==doc.value.lines[i].quantity);note(remark.value,hasDifference);act('receive',hasDifference?'存在收货差异，将生成差异单。确认合格数量入账？':'确认本单全部商品已核对并收货？',{lines,remark:remark.value})}catch(e){report(e)}}
function resolve(){try{note(remark.value,true);act('resolve','确认登记核对意见？演示核对不会自动调整库存。',{remark:remark.value})}catch(e){report(e)}}
function ship(){try{note(remark.value,true);act('ship','确认退货实物已交接并出库？',{remark:remark.value})}catch(e){report(e)}}
async function createReturn(){if(busy.value)return;try{const lines=inputs.value.map((x,i)=>{const n=quantity(x.quantity,'退货数量',true);assert(n<=doc.value.lines[i].returnable,`${doc.value.lines[i].name}超出可退数量`);return {sku:x.sku,quantity:n}}).filter(x=>x.quantity>0);linesInput(lines);note(remark.value,true);busy.value=true;if(!await confirm('保存退货草稿？核对后还需提交审核。'))return;const result=await post('/returns',{sourceId:doc.value.id,lines,remark:remark.value});uni.redirectTo({url:`/pages/detail/index?kind=returns&id=${result.id}`})}catch(e){report(e)}finally{busy.value=false}}
</script>
<style scoped>.receive-fields{display:grid;grid-template-columns:1fr 1fr;gap:20rpx}.qty-label{font-size:29rpx;font-weight:650;color:#506b52}.difference-line{margin-top:22rpx;font-size:25rpx;background:#fcf3df;color:#a57f3a;padding:16rpx;border-radius:10rpx}.demo-panel{padding:24rpx;border:2rpx dashed #c7d5bd;border-radius:18rpx;margin-top:24rpx}.demo-panel .row{flex-wrap:wrap}</style>
