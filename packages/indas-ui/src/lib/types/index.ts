export interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'manager' | 'employee'
  department?: string
  createdAt: Date
  updatedAt: Date
}

export interface Product {
  id: string
  name: string
  sku: string
  price: number
  quantity: number
  category: string
  supplier?: string
  createdAt: Date
  updatedAt: Date
}

export interface SalesOrder {
  id: string
  orderNumber: string
  customerId: string
  items: OrderItem[]
  total: number
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
  createdAt: Date
  updatedAt: Date
}

export interface OrderItem {
  id: string
  productId: string
  quantity: number
  price: number
  total: number
}

export interface Customer {
  id: string
  name: string
  email: string
  phone: string
  address: string
  createdAt: Date
  updatedAt: Date
}

export interface Employee {
  id: string
  name: string
  email: string
  phone: string
  position: string
  department: string
  salary: number
  hireDate: Date
  createdAt: Date
  updatedAt: Date
}