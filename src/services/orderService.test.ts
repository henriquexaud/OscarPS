import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Prisma } from '@prisma/client'

process.env.DATABASE_URL ||= 'postgresql://postgres:postgres@localhost:5432/oscarps?schema=public'
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

const { orderDelegate } = vi.hoisted(() => ({
  orderDelegate: {
    create: vi.fn(),
    findUnique: vi.fn(),
  },
}))

vi.mock('../db/prisma', () => ({
  prisma: { order: orderDelegate },
}))

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

describe('createOrder', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates a new order when there is no duplicate', async () => {
    const expected = buildOrder({ orderId: 'ORD-NEW' })
    orderDelegate.create.mockResolvedValue(expected)

    const result = await createOrder({ orderId: 'ORD-NEW', customer: 'Alice', total: 199.99 })

    expect(orderDelegate.create).toHaveBeenCalledWith({
      data: { orderId: 'ORD-NEW', customer: 'Alice', total: 199.99, status: 'PENDING' },
    })
    expect(result).toBe(expected)
  })

  it('returns the existing order when unique constraint hits orderId', async () => {
    const duplicateError = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
      code: 'P2002',
      clientVersion: 'test',
      meta: { target: ['orderId'] },
    })

    const existing = buildOrder({ orderId: 'ORD-EXISTING' })

    orderDelegate.create.mockRejectedValue(duplicateError)
    orderDelegate.findUnique.mockResolvedValue(existing)

    const result = await createOrder({ orderId: 'ORD-EXISTING', customer: 'Bob', total: 50 })

    expect(result).toBe(existing)
  })

  it('rethrows unknown errors from Prisma', async () => {
    const unexpected = new Error('boom')
    orderDelegate.create.mockRejectedValue(unexpected)

    await expect(createOrder({ orderId: 'ORD-ERR', customer: 'Eve', total: 10 })).rejects.toBe(unexpected)
  })
})
