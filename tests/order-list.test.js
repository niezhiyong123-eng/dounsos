import test from 'node:test'
import assert from 'node:assert/strict'
import {dateRanges,orderDateRange,filterOrderDocuments} from '../src/core/order-list.js'
import {initialState,createMockTransport} from '../src/core/mock.js'
import {createClient} from '../src/core/client.js'
const now=new Date(2026,9,12,12),stamp=(day,hour=12)=>new Date(2026,9,day,hour).toISOString()
const docs=[
 {id:'D1',status:'DRAFT',createdAt:stamp(6,0),templateId:'T1',lines:[{name:'牛奶',sku:'DD1',barcode:'690001'}]},
 {id:'D2',status:'DRAFT',createdAt:stamp(5,23),templateId:'T2',lines:[{name:'水',sku:'DD2'}]},
 {id:'S1',status:'SUBMITTED',createdAt:stamp(12,23),templateId:'T1',lines:[{name:'牛奶',sku:'DD1'}]},
 {id:'A1',status:'APPROVED',createdAt:stamp(11),templateId:'T2',lines:[{name:'纸',sku:'DD3'}]},
 {id:'C1',status:'CANCELLED',createdAt:stamp(12),templateId:'T1',lines:[{name:'水',sku:'DD2'}]}
]
test('日期范围覆盖今天、昨天、近七天、本月及三个自然月',()=>{assert.equal(dateRanges.length,5);assert.deepEqual(orderDateRange(2,now),{fromDate:'2026-10-06',toDate:'2026-10-12'});assert.deepEqual(orderDateRange(0,now),{fromDate:'2026-10-12',toDate:'2026-10-12'});assert.deepEqual(orderDateRange(1,now),{fromDate:'2026-10-11',toDate:'2026-10-11'});assert.equal(orderDateRange(3,now).fromDate,'2026-10-01');assert.equal(orderDateRange(4,new Date(2026,0,3)).fromDate,'2025-11-01')})
test('近七天日期边界按本地创建日期筛选，已审核归入已提交，取消排除',()=>{const range=orderDateRange(2,now);assert.deepEqual(filterOrderDocuments(docs,{status:'DRAFT',...range}).map(x=>x.id),['D1']);assert.deepEqual(filterOrderDocuments(docs,{status:'SUBMITTED',...range}).map(x=>x.id),['S1','A1'])})
test('日期、模板、商品名称/编码/条码组合查询',()=>{assert.deepEqual(filterOrderDocuments(docs,{status:'DRAFT',...orderDateRange(2,now),templateId:'T1',search:'690001'}).map(x=>x.id),['D1']);assert.equal(filterOrderDocuments(docs,{status:'SUBMITTED',search:'dd3'})[0].id,'A1');assert.equal(filterOrderDocuments(docs,{status:'SUBMITTED',templateId:'T1',search:'纸'}).length,0)})
test('拒绝异常日期区间和非法筛选参数',()=>{for(const query of [{fromDate:'2026-02-30'},{fromDate:'2026-10-12',toDate:'2026-10-01'},{status:'invalid'},{search:[]},{search:'x'.repeat(101)}])assert.throws(()=>filterOrderDocuments(docs,query),{status:422})})
test('GET订货API接收查询参数，兼容旧调用全量读取',async()=>{const values=new Map(),storage={get:k=>values.get(k),set:(k,v)=>values.set(k,structuredClone(v)),remove:k=>values.delete(k)};const db=initialState();db.orders=docs.map(x=>({...x,storeId:'S001'}));storage.set('demo-db-v1',db);const client=createClient({storage,transport:createMockTransport(storage)});await client.login({account:'store001',password:'Doudou123'});assert.equal((await client.request('/orders')).length,5);const result=await client.request('/orders',{data:{status:'SUBMITTED',...orderDateRange(2,now),templateId:'T2'}});assert.deepEqual(result.map(x=>x.id),['A1'])})
