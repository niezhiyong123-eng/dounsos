import { assert, localDate } from './validation.js'
export const dateRanges = ['今天', '昨天', '近七天', '本月', '近三月']
export function orderDateRange(index = 2, now = new Date()) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  let start = new Date(today), end = new Date(today)
  if (index === 1) { start.setDate(start.getDate()-1); end = new Date(start) }
  else if (index === 2) start.setDate(start.getDate()-6)
  else if (index === 3) start.setDate(1)
  else if (index === 4) start = new Date(today.getFullYear(), today.getMonth()-2, 1)
  else assert(index === 0, '日期范围不正确')
  return { fromDate: localDate(start), toDate: localDate(end) }
}
function validDate(value) {
  assert(typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value), '查询日期格式不正确')
  const [y,m,d] = value.split('-').map(Number)
  assert(localDate(new Date(y,m-1,d)) === value, '查询日期无效')
}
export function filterOrderDocuments(documents, query = {}, kind = 'orders') {
  const statuses={orders:['ALL','DRAFT','SUBMITTED'],receipts:['ALL','PENDING','RECEIVED'],differences:['ALL','OPEN','RESOLVED'],returns:['ALL','DRAFT','SUBMITTED','APPROVED','SHIPPED','COMPLETED','REJECTED','CANCELLED']}
  assert(!query.status||statuses[kind]?.includes(query.status),'单据状态筛选不正确')
  if(query.fromDate)validDate(query.fromDate)
  if(query.toDate)validDate(query.toDate)
  assert(!query.fromDate || !query.toDate || query.fromDate<=query.toDate, '起始日期不能晚于结束日期')
  assert(query.search===undefined || typeof query.search==='string'&&query.search.length<=100, '查询内容最多100字')
  const search = (query.search || '').trim().toLowerCase()
  return documents.filter(doc => {
    const date = localDate(new Date(doc.createdAt))
    return (!query.status||query.status==='ALL'||(kind==='orders'&&query.status==='SUBMITTED'?['SUBMITTED','APPROVED'].includes(doc.status):doc.status===query.status)) &&
      (!query.fromDate || date>=query.fromDate) && (!query.toDate || date<=query.toDate) &&
      (!query.templateId || doc.templateId===query.templateId) &&
      (!search || `${doc.id} ${doc.lines.map(p=>`${p.name} ${p.sku} ${p.barcode||''}`).join(' ')}`.toLowerCase().includes(search))
  })
}
