import { assert, loginInput, linesInput, quantity, note, BusinessError, arrivalDateInput, localDate } from './validation.js'
const copy = value => JSON.parse(JSON.stringify(value))
export const DEMO_ACCOUNT = 'store001'
export const DEMO_PASSWORD = 'Doudou123'
const demoTemplates = () => [
  {id:'TPL-DAILY',name:'日常补货模板',description:'门店常用商品，适合日常综合补货',storeIds:['S001'],skus:['DD1001','DD1002','DD1003','DD1004','DD1005','DD1006']},
  {id:'TPL-DRINK',name:'乳品饮料模板',description:'牛奶、酸奶及饮用水专项订货',storeIds:['S001'],skus:['DD1001','DD1002','DD1003']},
  {id:'TPL-SNACK',name:'烘焙零食模板',description:'面包与零食集中补货',storeIds:['S001'],skus:['DD1004','DD1005']}
]
export function initialState() {
  const products = [
    { sku: 'DD1001', name: '每日鲜牛奶', spec: '250ml × 12盒', unit: '箱', price: 4800, stock: 18, category: '乳品饮料', min: 1, step: 1, color: 'mint', mark: '奶' },
    { sku: 'DD1002', name: '原味酸奶', spec: '100g × 16杯', unit: '箱', price: 3680, stock: 12, category: '乳品饮料', min: 1, step: 1, color: 'blue', mark: '酸' },
    { sku: 'DD1003', name: '天然饮用水', spec: '550ml × 24瓶', unit: '箱', price: 2400, stock: 32, category: '乳品饮料', min: 2, step: 2, color: 'blue', mark: '水' },
    { sku: 'DD1004', name: '全麦吐司', spec: '400g / 袋', unit: '袋', price: 890, stock: 8, category: '烘焙零食', min: 5, step: 5, color: 'sand', mark: '麦' },
    { sku: 'DD1005', name: '海盐苏打饼干', spec: '200g / 盒', unit: '盒', price: 650, stock: 24, category: '烘焙零食', min: 1, step: 1, color: 'sand', mark: '饼' },
    { sku: 'DD1006', name: '柔韧抽纸', spec: '3层100抽 × 6包', unit: '提', price: 1290, stock: 16, category: '日用百货', min: 1, step: 1, color: 'rose', mark: '纸' }
  ]
  const line = (i, n, received) => ({ ...products[i], quantity: n, ...(received !== undefined ? { received, damaged: 0 } : {}) })
  const stamp = new Date().toISOString()
  return { seq: 100, sessions: {}, failures: 0, lockedUntil: 0, idempotency: {}, products, orderTemplates:demoTemplates(),
    orders: [{ id: 'DH20261008001', status: 'SUBMITTED', storeId: 'S001', version: 1, createdAt: stamp, remark: '日常补货', lines: [line(0, 4), line(2, 6)], history: [{ text: '门店提交订货', at: stamp }] }],
    receipts: [
      { id: 'SH20261009001', sourceId: 'DH20261007001', status: 'PENDING', storeId: 'S001', version: 1, createdAt: stamp, remark: '华东配送中心 · 常温配送', lines: [line(0, 5), line(2, 8), line(4, 12)], history: [{ text: '配送中心已发货', at: stamp }] },
      { id: 'SH20261008002', sourceId: 'DH20261006002', status: 'RECEIVED', storeId: 'S001', version: 2, createdAt: stamp, remark: '已完成收货，可申请退货', lines: [line(1, 6, 6), line(3, 20, 20), line(5, 10, 10)], history: [{ text: '门店已确认收货', at: stamp }] }
    ], differences: [], returns: [] }
}
// Local simulation only. Real mode never calls this module's transport.
export function createMockTransport(storage, now = Date.now) {
  let db = storage.get('demo-db-v1') || initialState()
  // Preserve documents when upgrading previously saved demo data.
  if (!db.orderTemplates) db.orderTemplates=demoTemplates()
  const save = () => storage.set('demo-db-v1', copy(db))
  const id = prefix => `${prefix}${now()}${++db.seq}`
  function issue() {
    const accessToken = id('demo-access-'), refreshToken = id('demo-refresh-')
    const result = { accessToken, refreshToken, expiresAt: now() + 15 * 60000, user: { id: 'U001', name: '豆豆店长', storeId: 'S001', storeName: '豆豆便利 · 万象城店', account: DEMO_ACCOUNT, role: '门店店长' } }
    db.sessions[refreshToken] = { ...result, refreshExpiresAt: now() + 7 * 86400000 }
    save(); return copy(result)
  }
  function authorized(headers) {
    const token = headers.Authorization?.replace('Bearer ', '')
    const session = Object.values(db.sessions).find(x => x.accessToken === token)
    assert(session && session.expiresAt > now(), '登录已过期', 401)
    assert(headers['X-Store-Id'] === session.user.storeId, '无权访问此门店', 403)
    return session
  }
  function event(doc, text) { doc.version++; doc.history.push({ text, at: new Date(now()).toISOString() }) }
  function docBy(kind, docId) { const doc = db[kind]?.find(x => x.id === docId && x.storeId === 'S001'); assert(doc, '单据不存在', 404); return doc }
  function createDoc(prefix, lines, remark, extra = {}) { return { id: id(prefix), storeId: 'S001', version: 1, status: 'DRAFT', createdAt: new Date(now()).toISOString(), remark, lines, history: [{ text: '创建草稿', at: new Date(now()).toISOString() }], ...extra } }
  function available(source, sku, except) {
    const original = source.lines.find(x => x.sku === sku)
    const reserved = db.returns.filter(x => x.sourceId === source.id && x.id !== except && !['CANCELLED', 'REJECTED', 'DRAFT'].includes(x.status)).flatMap(x => x.lines).filter(x => x.sku === sku).reduce((sum, x) => sum + x.quantity, 0)
    return (original?.received || 0) - reserved
  }
  function execute(path, method, data) {
    const [, kind, docId, action] = path.split('/')
    const templateBy = templateId => {const template=db.orderTemplates.find(x=>x.id===templateId);assert(template,'订货模板不存在',404);assert(template.storeIds.includes('S001'),'当前门店不可使用此模板',403);return template}
    if (method === 'GET') {
      if(kind==='order-templates') {
        const summary=t=>({id:t.id,name:t.name,description:t.description,productCount:db.products.filter(p=>t.skus.includes(p.sku)).length})
        if(!docId)return db.orderTemplates.filter(t=>t.storeIds.includes('S001')).map(summary)
        const template=templateBy(docId)
        if(action==='products')return db.products.filter(p=>template.skus.includes(p.sku))
        assert(!action,'接口不存在',404);return summary(template)
      }
      if (kind === 'products') return db.products
      if (kind === 'dashboard') return { pending: db.receipts.filter(x => x.status === 'PENDING').length, differences: db.differences.filter(x => x.status === 'OPEN').length, orders: db.orders.filter(x => x.status === 'SUBMITTED').length, returns: db.returns.filter(x => !['COMPLETED', 'CANCELLED', 'REJECTED'].includes(x.status)).length }
      assert(['orders', 'receipts', 'differences', 'returns'].includes(kind), '接口不存在', 404)
      if (!docId) return [...db[kind]].reverse()
      const doc = copy(docBy(kind, docId))
      if (kind === 'receipts' && doc.status === 'RECEIVED') doc.lines.forEach(x => { x.returnable = available(doc, x.sku) })
      return doc
    }
    assert(method === 'POST', '不支持的请求方法', 405)
    if (!docId && kind === 'orders') {
      assert(typeof data.templateId==='string'&&data.templateId,'请选择订货模板')
      const template=templateBy(data.templateId)
      const arrivalDate=data.arrivalDate===undefined?'':arrivalDateInput(data.arrivalDate,localDate(new Date(now())))
      linesInput(data.lines); note(data.remark || '')
      const lines = data.lines.map(x => {
        const p = db.products.find(p => p.sku === x.sku); assert(p, '商品不存在')
        assert(template.skus.includes(p.sku),'商品不属于所选订货模板')
        assert(x.quantity >= p.min && x.quantity % p.step === 0, `${p.name}须按${p.step}${p.unit}订购，至少${p.min}${p.unit}`)
        return { ...p, quantity: x.quantity }
      })
      const doc = createDoc('DH', lines, data.remark || '',{templateId:template.id,templateName:template.name,arrivalDate}); db.orders.push(doc); return doc
    }
    if (!docId && kind === 'returns') {
      linesInput(data.lines); note(data.remark, true)
      const source = docBy('receipts', data.sourceId); assert(source.status === 'RECEIVED', '仅已收货单可申请退货')
      const lines = data.lines.map(x => {
        const original = source.lines.find(y => y.sku === x.sku); assert(original, '商品不属于来源单')
        assert(x.quantity <= available(source, x.sku), `${original.name}超出可退数量`)
        return { ...original, quantity: x.quantity }
      })
      const doc = createDoc('TH', lines, data.remark, { sourceId: source.id }); db.returns.push(doc); return doc
    }
    assert(['orders', 'receipts', 'differences', 'returns'].includes(kind), '接口不存在', 404)
    const doc = docBy(kind, docId)
    assert(data.version === doc.version, '单据已更新，请重新加载后操作', 409)
    if (action === 'cancel' && ['orders', 'returns'].includes(kind)) {
      assert(['DRAFT', 'SUBMITTED'].includes(doc.status), '当前状态不可取消', 409); doc.status = 'CANCELLED'; event(doc, '门店取消单据'); return doc
    }
    if (action === 'submit' && ['orders', 'returns'].includes(kind)) {
      assert(doc.status === 'DRAFT', '仅草稿可提交', 409)
      if (kind === 'returns') { const source = docBy('receipts', doc.sourceId); doc.lines.forEach(x => assert(x.quantity <= available(source, x.sku, doc.id), `${x.name}可退数量不足`)) }
      doc.status = 'SUBMITTED'; event(doc, '门店提交，等待CMP审核'); return doc
    }
    if (kind === 'receipts' && action === 'receive') {
      assert(doc.status === 'PENDING', '该单已收货，不可重复确认', 409)
      assert(Array.isArray(data.lines) && data.lines.length === doc.lines.length && new Set(data.lines.map(x => x.sku)).size === doc.lines.length, '请核对全部商品')
      const updated = doc.lines.map(original => {
        const x = data.lines.find(x => x.sku === original.sku); assert(x, '收货商品不匹配')
        const received = quantity(x.received, '合格数量', true), damaged = quantity(x.damaged, '破损数量', true)
        assert(received + damaged <= original.quantity, `${original.name}实收超过发货数量；请联系配送中心处理超收`)
        return { ...original, received, damaged, shortage: original.quantity - received - damaged }
      })
      const differences = updated.filter(x => x.damaged || x.shortage)
      if (differences.length) note(data.remark, true)
      doc.lines = updated; doc.status = 'RECEIVED'; event(doc, '确认收货，合格数量入账')
      if (differences.length) db.differences.push(createDoc('CY', differences, data.remark, { status: 'OPEN', sourceId: doc.id }))
      return doc
    }
    if (kind === 'differences' && action === 'resolve') {
      assert(doc.status === 'OPEN', '差异已核对', 409); note(data.remark, true)
      doc.status = 'RESOLVED'; doc.resolution = data.remark; event(doc, `门店记录核对意见：${data.remark}（演示，不调整库存）`); return doc
    }
    if (kind === 'returns' && action === 'ship') {
      assert(doc.status === 'APPROVED', '审批通过后才可退货出库', 409); note(data.remark, true)
      doc.status = 'SHIPPED'; doc.shipping = data.remark; event(doc, `退货出库：${data.remark}`); return doc
    }
    if (action === 'demo-approve' && ['orders', 'returns'].includes(kind)) {
      assert(doc.status === 'SUBMITTED', '当前单据不在待审核状态', 409)
      doc.status = 'APPROVED'; event(doc, '【演示】CMP审核通过')
      if (kind === 'orders') db.receipts.push(createDoc('SH', copy(doc.lines), '【演示】配送中心已发货', { status: 'PENDING', sourceId: doc.id }))
      return doc
    }
    if (action === 'demo-reject' && kind === 'returns') {
      assert(doc.status === 'SUBMITTED', '当前状态不可驳回', 409); doc.status = 'REJECTED'; event(doc, '【演示】CMP驳回：请核实退货原因后重新申请'); return doc
    }
    if (action === 'demo-complete' && kind === 'returns') {
      assert(doc.status === 'SHIPPED', '请先退货出库', 409); doc.status = 'COMPLETED'; event(doc, '【演示】配送中心确认退货接收'); return doc
    }
    throw new BusinessError('不支持的操作', 404)
  }
  return async ({ path, method = 'GET', data = {}, headers = {} }) => {
    if (path === '/auth/login') {
      loginInput(data); assert(now() >= db.lockedUntil, '尝试次数过多，请15分钟后重试', 429)
      if (data.account !== DEMO_ACCOUNT || data.password !== DEMO_PASSWORD) { db.failures++; if (db.failures >= 5) { db.lockedUntil = now() + 15 * 60000; db.failures = 0 } save(); throw new BusinessError('账号或密码错误', 401) }
      db.failures = 0; return issue()
    }
    if (path === '/auth/refresh') { const old = db.sessions[data.refreshToken]; assert(old && old.refreshExpiresAt > now(), '登录已失效，请重新登录', 401); delete db.sessions[data.refreshToken]; return issue() }
    if (path === '/auth/logout') { delete db.sessions[data.refreshToken]; save(); return { success: true } }
    authorized(headers)
    if (method === 'GET') return copy(execute(path, method, data))
    const key = headers['Idempotency-Key']; assert(typeof key === 'string' && key.length >= 8, '缺少幂等流水号')
    const fingerprint = JSON.stringify({ path, data })
    if (db.idempotency[key]) { assert(db.idempotency[key].fingerprint === fingerprint, '幂等流水号与请求不匹配', 409); return copy(db.idempotency[key].result) }
    const snapshot = copy(db)
    try { const result = copy(execute(path, method, data)); db.idempotency[key] = { fingerprint, result }; save(); return result } catch (e) { db = snapshot; throw e }
  }
}
