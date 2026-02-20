import { Order, Prisma } from '@prisma/client'
import { prisma } from '../db/prisma'
import { CreateOrderInput, IOrderRepository } from './IOrderRepository'

export class PrismaOrderRepository implements IOrderRepository {
  async create(input: CreateOrderInput): Promise<Order> {
    try {
      return await prisma.order.create({
        data: {
          orderId: input.orderId,
          customer: input.customer,
          total: input.total,
          status: 'PENDING',
        },
      })
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002' &&
        Array.isArray(error.meta?.target) &&
        (error.meta.target as string[]).includes('orderId')
      ) {
        const existing = await prisma.order.findUnique({ where: { orderId: input.orderId } })
        if (existing) return existing
      }
      throw error
    }
  }

  findByOrderId(orderId: string): Promise<Order | null> {
    return prisma.order.findUnique({ where: { orderId } })
  }

  findPending(limit: number, maxAttempts: number): Promise<Order[]> {
    return prisma.order.findMany({
      where: {
        status: 'PENDING',
        lockedAt: null,
        attempts: { lt: maxAttempts },
      },
      orderBy: { createdAt: 'asc' },
      take: limit,
    })
  }

  async lockById(id: string): Promise<boolean> {
    const locked = await prisma.order.updateMany({
      where: { id, lockedAt: null, status: 'PENDING' },
      data: { lockedAt: new Date() },
    })
    return locked.count > 0
  }

  markProcessed(id: string): Promise<Order> {
    return prisma.order.update({
      where: { id },
      data: {
        status: 'PROCESSED',
        lockedAt: null,
        lastError: null,
      },
    })
  }

  markFailed(id: string, message: string): Promise<Order> {
    return prisma.order.update({
      where: { id },
      data: {
        attempts: { increment: 1 },
        lastError: message,
        lockedAt: null,
      },
    })
  }
}
