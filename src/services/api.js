import { createClient } from '../core/client.js'
import { createMockTransport } from '../core/mock.js'
import { BusinessError, loginInput } from '../core/validation.js'
export const isDemo = (import.meta.env.VITE_API_MODE || 'mock') === 'mock'
export const storage = { get: key => uni.getStorageSync(`doudou:${key}`), set: (key, value) => uni.setStorageSync(`doudou:${key}`, value), remove: key => uni.removeStorageSync(`doudou:${key}`) }
const base = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
function remote({ path, method, data, headers }) {
  if (!/^https:\/\//.test(base)) return Promise.reject(new BusinessError('尚未配置HTTPS测试接口地址'))
  return new Promise((resolve, reject) => uni.request({ url: `${base}${path}`, method, data, header: { 'Content-Type': 'application/json', ...headers }, timeout: 15000,
    success(res) { const body = res.data; if (res.statusCode >= 200 && res.statusCode < 300 && body?.code === 'OK') resolve(body.data); else reject(new BusinessError(`${body?.message || '服务暂不可用'}${body?.traceId ? `（${body.traceId}）` : ''}`, res.statusCode, body?.code)) },
    fail() { reject(new BusinessError('网络连接失败，请检查网络。提交超时请先查询单据结果。', 0, 'NETWORK_ERROR')) }
  }))
}
export const client = createClient({ transport: isDemo ? createMockTransport(storage) : remote, storage, onExpired: () => uni.reLaunch({ url: '/pages/login/index' }) })
export const api = {
  login: input => client.login(loginInput(input)),
  get: path => client.request(path),
  post: (path, data, key) => client.request(path, { method: 'POST', data, key }),
  logout: () => client.logout()
}
export function newKey() { return `wx-${Date.now()}-${Math.random().toString(36).slice(2, 12)}` }
export function guard() { if (!client.getSession()) { uni.reLaunch({ url: '/pages/login/index' }); return false } return true }
export function report(error) { uni.showModal({ title: '操作提示', content: error?.message || '操作失败，请稍后重试', showCancel: false }) }
export function confirm(content, title = '确认操作') { return new Promise(resolve => uni.showModal({ title, content, confirmColor: '#23765c', success: res => resolve(res.confirm), fail: () => resolve(false) })) }
export const go = url => uni.navigateTo({ url })
export const kinds = { orders: '订货单', receipts: '收货单', differences: '差异单', returns: '退货申请单' }
export const dateText = value => {
  if (!value) return ''
  const d = new Date(value), pad = n => String(n).padStart(2, '0')
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}
