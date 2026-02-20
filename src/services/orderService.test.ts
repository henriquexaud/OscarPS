import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Prisma } from '@prisma/client'
import { IOrderRepository } from '../repositories/IOrderRepository'

process.env.DATABASE_URL ||= 'postgresql://postgres:postgres@localhost:5432/ordersdb?schema=public'
process.env.NODE_ENV = 'test'

type OrderShape = {
  id: string
  orderId: string
  customer: string
  total: Prisma.Decimal
  status: 'PENDING' | 'PROCESSED'
  attempts: number
  lockedAt: Date | null
  lastError: string | null
  createdAt: Date
}

import { createOrder } from './orderService'

const buildOrder = (overrides?: Partial<OrderShape>): OrderShape => ({
  id: 'uuid-1',
  orderId: 'ORD-1',
  customer: 'Alice',
  total: new Prisma.Decimal(199.99),
  status: 'PENDING',
  attempts: 0,
  lockedAt: null,
  lastError: null,
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  ...overrides,
})

const makeRepo = (overrides?: Partial<IOrderRepository>): IOrderRepository => ({
  create: vi.fn(),
  findByOrderId: vi.fn(),
  findPending: vi.fn(),
  lockById: vi.fn(),
  markProcessed: vi.fn(),
  markFailed: vi.fn(),
  ...overrides,
})

describe('createOrder', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates a new order when there is no duplicate', async () => {
    const expected = buildOrder({ orderId: 'ORD-NEW' })
    const repo = makeRepo({ create: vi.fn().mockResolvedValue(expected) })

    const result = await createOrder({ orderId: 'ORD-NEW', customer: 'Alice', total: 199.99 }, repo)

    expect(repo.create).toHaveBeenCalledWith({ orderId: 'ORD-NEW', customer: 'Alice', total: 199.99 })
    expect(result).toBe(expected)
  })

  it('retorna a ordem existente quando o repositório a resolve (ex.: duplicata tratada internamente)', async () => {
    const existing = buildOrder({ orderId: 'ORD-EXISTING' })
    const repo = makeRepo({ create: vi.fn().mockResolvedValue(existing) })

    const result = await createOrder({ orderId: 'ORD-EXISTING', customer: 'Bob', total: 50 }, repo)

    expect(result).toBe(existing)
  })

  it('rethrows unknown errors from the repository', async () => {
    const unexpected = new Error('boom')
    const repo = makeRepo({ create: vi.fn().mockRejectedValue(unexpected) })

    await expect(
      createOrder({ orderId: 'ORD-ERR', customer: 'Eve', total: 10 }, repo),
    ).rejects.toBe(unexpected)
  })
})

