import { BusinessError } from './validation.js'
// transport is injected so refresh races and logout behavior can be tested without a device.
export function createClient({ transport, storage, onExpired = () => {}, now = Date.now }) {
  let session = storage.get('session') || null
  let revision = 0
  let refreshFlight = null
  const persist = next => { session = next; next ? storage.set('session', next) : storage.remove('session') }
  const expire = () => { revision++; persist(null); onExpired() }
  async function refresh() {
    if (refreshFlight?.revision === revision) return refreshFlight.promise
    if (!session?.refreshToken) { expire(); throw new BusinessError('登录已过期，请重新登录', 401) }
    const expected = revision
    const token = session.refreshToken
    const flight = { revision: expected, promise: null }
    flight.promise = (async () => {
      try {
        const next = await transport({ path: '/auth/refresh', method: 'POST', data: { refreshToken: token } })
        if (revision !== expected) throw new BusinessError('会话已变化，请重新操作', 401)
        persist(next)
        return next
      } catch (e) {
        if (revision === expected && (e.status === 401 || e.status === 403)) expire()
        throw e
      } finally { if (refreshFlight === flight) refreshFlight = null }
    })()
    refreshFlight = flight
    return flight.promise
  }
  async function request(path, options = {}) {
    if (!session) throw new BusinessError('请先登录', 401)
    const expected = revision
    if (session.expiresAt <= now() + 30000) await refresh()
    if (expected !== revision || !session) throw new BusinessError('会话已变化，请重新操作', 401)
    const sentToken = session.accessToken
    const send = () => transport({ path, method: options.method || 'GET', data: options.data, headers: { Authorization: `Bearer ${session.accessToken}`, 'X-Store-Id': session.user.storeId, ...(options.key ? { 'Idempotency-Key': options.key } : {}) } })
    try {
      let value
      try { value = await send() } catch (e) {
        if (e.status !== 401 || revision !== expected) throw e
        if (session?.accessToken === sentToken) await refresh()
        if (expected !== revision || !session) throw new BusinessError('会话已变化，请重新操作', 401)
        try { value = await send() } catch (retryError) { if (retryError.status === 401 && revision === expected) expire(); throw retryError }
      }
      if (revision !== expected) throw new BusinessError('会话已变化，结果已丢弃', 401)
      return value
    } catch (e) { throw e }
  }
  return {
    getSession: () => session,
    async login(data) {
      const expected = ++revision
      persist(null)
      const next = await transport({ path: '/auth/login', method: 'POST', data })
      if (expected !== revision) throw new BusinessError('登录已取消', 401)
      persist(next); return next
    },
    request,
    async logout() {
      const old = session
      revision++; persist(null)
      if (old) await transport({ path: '/auth/logout', method: 'POST', data: { refreshToken: old.refreshToken }, headers: { Authorization: `Bearer ${old.accessToken}` } })
    }
  }
}
