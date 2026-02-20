import { Order } from '@prisma/client'
import { CreateOrderInput } from './types'

export type { CreateOrderInput }

export interface IOrderRepository {
  create(input: CreateOrderInput): Promise<Order>
  findByOrderId(orderId: string): Promise<Order | null>
  findPending(limit: number, maxAttempts: number): Promise<Order[]>
  lockById(id: string): Promise<boolean>
  markProcessed(id: string): Promise<Order>
  markFailed(id: string, message: string): Promise<Order>
}
