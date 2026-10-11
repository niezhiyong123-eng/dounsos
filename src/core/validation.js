export class BusinessError extends Error {
  constructor(message, status = 422, code = 'VALIDATION_ERROR') { super(message); this.status = status; this.code = code }
}
export function assert(ok, message, status = 422, code) { if (!ok) throw new BusinessError(message, status, code) }
export function quantity(value, name = '数量', allowZero = false) {
  const n = Number(value)
  assert(value !== '' && value !== null && Number.isSafeInteger(n) && n >= (allowZero ? 0 : 1) && n <= 99999, `${name}必须为${allowZero ? '0～' : '1～'}99999的整数`)
  return n
}
export function loginInput(input) {
  assert(typeof input.account === 'string' && /^[A-Za-z0-9_.@-]{3,64}$/.test(input.account), '账号须为3～64位字母、数字或 . _ @ -')
  assert(typeof input.password === 'string' && input.password.length >= 8 && input.password.length <= 128, '密码长度须为8～128位')
  return input
}
export function note(value, required = false) {
  assert(typeof value === 'string' && value.length <= 200 && (!required || value.trim().length >= 2), required ? '请填写2～200字的说明' : '说明最多200字')
  return value.trim()
}
export function linesInput(lines) {
  assert(Array.isArray(lines) && lines.length > 0 && lines.length <= 100, '请选择1～100种商品')
  assert(new Set(lines.map(x => x.sku)).size === lines.length, '商品不可重复')
  lines.forEach(x => { assert(typeof x.sku === 'string' && x.sku.length > 0, '商品编码不能为空'); quantity(x.quantity) })
  return lines
}
export function localDate(value = new Date()) {
  const pad = n => String(n).padStart(2, '0')
  return `${value.getFullYear()}-${pad(value.getMonth()+1)}-${pad(value.getDate())}`
}
export function arrivalDateInput(value, today = localDate()) {
  assert(typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value), '到货日期格式须为 YYYY-MM-DD')
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month-1, day)
  assert(localDate(date) === value && value >= today, '到货日期不能早于今天，且须为有效日期')
  return value
}
export const money = cents => (Number(cents || 0) / 100).toFixed(2)
export const labels = { DRAFT: '草稿', SUBMITTED: '待审核', APPROVED: '已审核', CANCELLED: '已取消', PENDING: '待收货', RECEIVED: '已收货', OPEN: '待核对', RESOLVED: '已核对', REJECTED: '已驳回', SHIPPED: '退货在途', COMPLETED: '已完成' }
