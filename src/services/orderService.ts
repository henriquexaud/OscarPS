import { Order } from '@prisma/client'
import { IOrderRepository, CreateOrderInput, orderRepository as defaultRepository } from '../repositories'

export type { CreateOrderInput }

export function createOrder(
  input: CreateOrderInput,
  repo: IOrderRepository = defaultRepository,
): Promise<Order> {
  return repo.create(input)
}

export function findOrderByOrderId(
  orderId: string,
  repo: IOrderRepository = defaultRepository,
): Promise<Order | null> {
  return repo.findByOrderId(orderId)
}

export function fetchPendingOrders(
  limit: number,
  maxAttempts: number,
  repo: IOrderRepository = defaultRepository,
): Promise<Order[]> {
  return repo.findPending(limit, maxAttempts)
}

export function lockOrderById(
  id: string,
  repo: IOrderRepository = defaultRepository,
): Promise<boolean> {
  return repo.lockById(id)
}

export function markOrderProcessed(
  id: string,
  repo: IOrderRepository = defaultRepository,
): Promise<Order> {
  return repo.markProcessed(id)
}

export function markOrderFailed(
  id: string,
  message: string,
  repo: IOrderRepository = defaultRepository,
): Promise<Order> {
  return repo.markFailed(id, message)
}
