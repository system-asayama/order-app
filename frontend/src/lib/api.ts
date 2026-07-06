import axios from 'axios'

export const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Redirect to login on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ---- Types ----

export type Role = 'admin' | 'user'
export type OrderStatus = 'pending' | 'approved' | 'rejected'

export interface User {
  id: number
  email: string
  name: string
  role: Role
  is_active: boolean
  created_at: string
}

export interface OrderItem {
  id: number
  name: string
  description: string | null
  default_amount: number | null
  category: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Order {
  id: number
  user_id: number
  order_item_id: number | null
  item_name: string
  amount: number
  memo: string | null
  status: OrderStatus
  created_at: string
  updated_at: string
  user_name?: string
  user_email?: string
}

// ---- Auth ----

export const login = (email: string, password: string) =>
  api.post<{ access_token: string; token_type: string }>('/auth/login', { email, password })

export const getMe = () => api.get<User>('/auth/me')

// ---- Users ----

export const listUsers = () => api.get<User[]>('/users')
export const createUser = (data: { email: string; name: string; password: string; role: Role }) =>
  api.post<User>('/users', data)
export const updateUser = (id: number, data: Partial<{ name: string; role: Role; is_active: boolean }>) =>
  api.patch<User>(`/users/${id}`, data)

// ---- Order Items ----

export const listOrderItems = (activeOnly = true) =>
  api.get<OrderItem[]>('/order-items', { params: { active_only: activeOnly } })
export const createOrderItem = (data: { name: string; description?: string; default_amount?: number; category?: string }) =>
  api.post<OrderItem>('/order-items', data)
export const updateOrderItem = (id: number, data: Partial<OrderItem>) =>
  api.patch<OrderItem>(`/order-items/${id}`, data)
export const deleteOrderItem = (id: number) => api.delete(`/order-items/${id}`)

// ---- Orders ----

export const createOrder = (data: { order_item_id?: number; item_name: string; amount: number; memo?: string }) =>
  api.post<Order>('/orders', data)
export const myOrders = () => api.get<Order[]>('/orders/my')
export const allOrders = () => api.get<Order[]>('/orders')
export const updateOrderStatus = (id: number, status: OrderStatus) =>
  api.patch<Order>(`/orders/${id}/status`, { status })
