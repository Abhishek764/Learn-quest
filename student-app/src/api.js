import axios from 'axios'

const API = axios.create({ baseURL: 'http://localhost:3000' })

let tokenGetter = null

export function setAuthTokenGetter(fn) {
  tokenGetter = fn
}

API.interceptors.request.use(async cfg => {
  if (tokenGetter) {
    try {
      const token = await tokenGetter()
      if (token) cfg.headers.Authorization = `Bearer ${token}`
    } catch {
      // ignore — request will go unauthenticated and fail with 401
    }
  }
  return cfg
})

API.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      const path = window.location.pathname
      if (!path.startsWith('/login') && !path.startsWith('/register')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)

export default API
