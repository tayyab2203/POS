import { writeAuditLog } from './audit'
import { db } from './schema'
import { enqueueSync } from './sync'
import type { Category, Product, ProductVariant } from './types'

function nowIso() {
  return new Date().toISOString()
}

function createId() {
  return crypto.randomUUID()
}

export async function listCategories(): Promise<Category[]> {
  return db.categories.orderBy('sortOrder').toArray()
}

export async function createCategory(input: {
  name: string
  color: string
}): Promise<Category> {
  const count = await db.categories.count()
  const category: Category = {
    id: createId(),
    name: input.name.trim(),
    color: input.color,
    sortOrder: count + 1,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }

  await db.transaction('rw', db.categories, db.syncQueue, async () => {
    await db.categories.add(category)
    await enqueueSync('categories', category.id, 'CREATE', category)
  })

  return category
}

export async function updateCategory(
  id: string,
  patch: Partial<Pick<Category, 'name' | 'color' | 'sortOrder'>>,
): Promise<Category> {
  const existing = await db.categories.get(id)
  if (!existing) throw new Error('Category not found')

  const next: Category = {
    ...existing,
    ...patch,
    name: patch.name?.trim() ?? existing.name,
    updatedAt: nowIso(),
  }

  await db.transaction('rw', db.categories, db.syncQueue, async () => {
    await db.categories.put(next)
    await enqueueSync('categories', next.id, 'UPDATE', next)
  })

  return next
}

export async function deleteCategory(id: string): Promise<void> {
  const productCount = await db.products.where('categoryId').equals(id).count()
  if (productCount > 0) {
    throw new Error('Category has products. Move or delete them first.')
  }

  await db.transaction('rw', db.categories, db.syncQueue, async () => {
    await db.categories.delete(id)
    await enqueueSync('categories', id, 'DELETE', { id })
  })
}

export interface ProductInput {
  categoryId: string
  name: string
  price: number
  costPrice: number
  sku: string
  stock: number | null
  trackStock: boolean
  unit: Product['unit']
  allowFractional: boolean
  weightPresets: number[]
  imageBase64: string | null
  color: string
  variants: ProductVariant[]
  isActive: boolean
}

export async function listProducts(): Promise<Product[]> {
  return db.products.orderBy('name').toArray()
}

export async function listActiveProducts(): Promise<Product[]> {
  return db.products.filter((p) => p.isActive).sortBy('name')
}

export async function createProduct(input: ProductInput): Promise<Product> {
  const product: Product = {
    id: createId(),
    ...input,
    name: input.name.trim(),
    sku: input.sku.trim(),
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }

  await db.transaction('rw', db.products, db.syncQueue, async () => {
    await db.products.add(product)
    await enqueueSync('products', product.id, 'CREATE', product)
  })

  return product
}

export async function updateProduct(
  id: string,
  input: Partial<ProductInput>,
): Promise<Product> {
  const existing = await db.products.get(id)
  if (!existing) throw new Error('Product not found')

  const next: Product = {
    ...existing,
    ...input,
    name: input.name?.trim() ?? existing.name,
    sku: input.sku?.trim() ?? existing.sku,
    updatedAt: nowIso(),
  }

  const priceChanged =
    (input.price !== undefined && input.price !== existing.price) ||
    (input.costPrice !== undefined && input.costPrice !== existing.costPrice)

  await db.transaction(
    'rw',
    db.products,
    db.syncQueue,
    db.auditLogs,
    async () => {
      await db.products.put(next)
      await enqueueSync('products', next.id, 'UPDATE', next)
      if (priceChanged) {
        await writeAuditLog({
          action: 'PRICE_CHANGED',
          details: `${existing.name}: price ${existing.price}→${next.price}, cost ${existing.costPrice}→${next.costPrice}`,
          performedBy: 'owner',
        })
      }
    },
  )

  return next
}

export async function stockInProduct(input: {
  productId: string
  quantity: number
  costPrice?: number | null
}): Promise<Product> {
  const qty = Math.max(0, input.quantity)
  if (qty <= 0) throw new Error('Quantity must be greater than 0')

  const existing = await db.products.get(input.productId)
  if (!existing) throw new Error('Product not found')

  const currentStock = existing.stock ?? 0
  const next: Product = {
    ...existing,
    trackStock: true,
    stock: currentStock + qty,
    costPrice:
      input.costPrice !== undefined && input.costPrice !== null
        ? input.costPrice
        : existing.costPrice,
    updatedAt: nowIso(),
  }

  await db.transaction(
    'rw',
    db.products,
    db.syncQueue,
    db.auditLogs,
    async () => {
      await db.products.put(next)
      await enqueueSync('products', next.id, 'UPDATE', next)
      await writeAuditLog({
        action: 'STOCK_IN',
        details: `${existing.name}: +${qty} (stock ${currentStock}→${next.stock})`,
        performedBy: 'owner',
      })
    },
  )

  return next
}

export async function deleteProduct(id: string): Promise<void> {
  await db.transaction('rw', db.products, db.syncQueue, async () => {
    await db.products.delete(id)
    await enqueueSync('products', id, 'DELETE', { id })
  })
}

export async function findProductBySku(sku: string): Promise<Product | undefined> {
  const normalized = sku.trim().toLowerCase()
  if (!normalized) return undefined
  const all = await db.products.toArray()
  return all.find((product) => product.sku.trim().toLowerCase() === normalized)
}
