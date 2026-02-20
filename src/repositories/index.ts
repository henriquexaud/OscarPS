export type { IOrderRepository, CreateOrderInput } from './IOrderRepository'
export { PrismaOrderRepository } from './PrismaOrderRepository'

import { PrismaOrderRepository } from './PrismaOrderRepository'

export const orderRepository = new PrismaOrderRepository()
