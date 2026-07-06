import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import UserDashboard from './pages/UserDashboard'
import OrderForm from './pages/OrderForm'
import OrderHistory from './pages/OrderHistory'
import AdminDashboard from './pages/AdminDashboard'
import AdminUsers from './pages/AdminUsers'
import AdminOrderItems from './pages/AdminOrderItems'
import AdminOrders from './pages/AdminOrders'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* User routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute><UserDashboard /></ProtectedRoute>
      } />
      <Route path="/orders/new" element={
        <ProtectedRoute><OrderForm /></ProtectedRoute>
      } />
      <Route path="/orders" element={
        <ProtectedRoute><OrderHistory /></ProtectedRoute>
      } />

      {/* Admin routes */}
      <Route path="/admin" element={
        <ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>
      } />
      <Route path="/admin/users" element={
        <ProtectedRoute requiredRole="admin"><AdminUsers /></ProtectedRoute>
      } />
      <Route path="/admin/order-items" element={
        <ProtectedRoute requiredRole="admin"><AdminOrderItems /></ProtectedRoute>
      } />
      <Route path="/admin/orders" element={
        <ProtectedRoute requiredRole="admin"><AdminOrders /></ProtectedRoute>
      } />

      {/* Default */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
