import { db } from './schema'
import { enqueueSync } from './sync'
import {
  DEFAULT_RECEIPT_CONFIG,
  SETTINGS_ID,
  type BusinessType,
  type Category,
  type Product,
  type ProductUnit,
  type ReceiptConfig,
  type Settings,
} from './types'

function nowIso(): string {
  return new Date().toISOString()
}

function createId(): string {
  return crypto.randomUUID()
}

function receiptDefaultsFor(businessType: BusinessType): ReceiptConfig {
  if (businessType === 'food') {
    return {
      ...DEFAULT_RECEIPT_CONFIG,
      showToken: true,
      showOrderType: true,
      autoPrintKot: true,
      showSku: false,
    }
  }

  if (businessType === 'bakery') {
    return {
      ...DEFAULT_RECEIPT_CONFIG,
      showToken: true,
      showOrderType: false,
      autoPrintKot: false,
      showSku: false,
    }
  }

  return {
    ...DEFAULT_RECEIPT_CONFIG,
    showToken: false,
    showOrderType: false,
    autoPrintKot: false,
    showSku: true,
    showTax: false,
  }
}

export function buildDefaultSettings(
  overrides: Partial<Settings> = {},
): Settings {
  const timestamp = nowIso()
  const businessType = overrides.businessType ?? 'food'

  const base: Settings = {
    id: SETTINGS_ID,
    shopName: '',
    address: '',
    phone: '',
    logoBase64: null,
    businessType,
    printerWidth: 80,
    receiptConfig: receiptDefaultsFor(businessType),
    ownerPin: '1234',
    language: 'en',
    ownerWhatsApp: '',
    currency: 'PKR',
    openingCashDefault: 0,
    onboardingComplete: false,
    lastTokenDate: null,
    lastTokenNumber: 0,
    lastBackupAt: null,
    minStockAlert: 5,
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  return {
    ...base,
    ...overrides,
    id: SETTINGS_ID,
    businessType: overrides.businessType ?? base.businessType,
    receiptConfig:
      overrides.receiptConfig ??
      receiptDefaultsFor(overrides.businessType ?? base.businessType),
  }
}

export async function ensureDefaultSettings(): Promise<Settings> {
  const existing = await db.settings.get(SETTINGS_ID)
  if (existing) {
    if (
      existing.minStockAlert === undefined ||
      existing.minStockAlert === null ||
      existing.lastBackupAt === undefined
    ) {
      const patched: Settings = {
        ...existing,
        minStockAlert: existing.minStockAlert ?? 5,
        lastBackupAt: existing.lastBackupAt ?? null,
      }
      await db.settings.put(patched)
      return patched
    }
    return existing
  }

  const settings = buildDefaultSettings()
  await db.transaction('rw', db.settings, db.syncQueue, async () => {
    await db.settings.put(settings)
    await enqueueSync('settings', settings.id, 'CREATE', settings)
  })
  return settings
}

interface SeedProductInput {
  name: string
  price: number
  costPrice: number
  sku: string
  stock: number | null
  trackStock: boolean
  unit: ProductUnit
  allowFractional: boolean
  weightPresets?: number[]
  color: string
  variants?: Product['variants']
}

interface SeedCategoryInput {
  name: string
  color: string
  products: SeedProductInput[]
}

function getDemoCatalog(businessType: BusinessType): SeedCategoryInput[] {
  if (businessType === 'food') {
    return [
      {
        name: 'Mains',
        color: '#b45309',
        products: [
          {
            name: 'Chicken Biryani',
            price: 350,
            costPrice: 180,
            sku: 'FOOD-BIR-FULL',
            stock: null,
            trackStock: false,
            unit: 'plate',
            allowFractional: false,
            color: '#d97706',
            variants: [
              {
                id: createId(),
                name: 'Full',
                price: 350,
                costPrice: 180,
              },
              {
                id: createId(),
                name: 'Half',
                price: 220,
                costPrice: 110,
              },
            ],
          },
          {
            name: 'Sada Biryani',
            price: 200,
            costPrice: 90,
            sku: 'FOOD-BIR-SADA',
            stock: null,
            trackStock: false,
            unit: 'plate',
            allowFractional: false,
            color: '#ca8a04',
            variants: [
              {
                id: createId(),
                name: 'Full',
                price: 200,
                costPrice: 90,
              },
              {
                id: createId(),
                name: 'Half',
                price: 120,
                costPrice: 55,
              },
            ],
          },
          {
            name: 'Chicken Karahi',
            price: 1200,
            costPrice: 700,
            sku: 'FOOD-KAR-FULL',
            stock: null,
            trackStock: false,
            unit: 'portion',
            allowFractional: false,
            color: '#dc2626',
            variants: [
              {
                id: createId(),
                name: 'Full',
                price: 1200,
                costPrice: 700,
              },
              {
                id: createId(),
                name: 'Half',
                price: 650,
                costPrice: 380,
              },
            ],
          },
        ],
      },
      {
        name: 'Sides',
        color: '#15803d',
        products: [
          {
            name: 'Raita',
            price: 50,
            costPrice: 20,
            sku: 'FOOD-SIDE-RAITA',
            stock: null,
            trackStock: false,
            unit: 'pcs',
            allowFractional: false,
            color: '#16a34a',
          },
          {
            name: 'Salad',
            price: 40,
            costPrice: 15,
            sku: 'FOOD-SIDE-SALAD',
            stock: null,
            trackStock: false,
            unit: 'pcs',
            allowFractional: false,
            color: '#22c55e',
          },
          {
            name: 'Naan',
            price: 30,
            costPrice: 10,
            sku: 'FOOD-SIDE-NAAN',
            stock: null,
            trackStock: false,
            unit: 'pcs',
            allowFractional: false,
            color: '#eab308',
          },
        ],
      },
      {
        name: 'Drinks',
        color: '#1d4ed8',
        products: [
          {
            name: 'Cold Drink',
            price: 80,
            costPrice: 50,
            sku: 'FOOD-DRINK-CD',
            stock: null,
            trackStock: false,
            unit: 'pcs',
            allowFractional: false,
            color: '#2563eb',
          },
          {
            name: 'Mineral Water',
            price: 50,
            costPrice: 30,
            sku: 'FOOD-DRINK-WATER',
            stock: null,
            trackStock: false,
            unit: 'pcs',
            allowFractional: false,
            color: '#0ea5e9',
          },
          {
            name: 'Lassi',
            price: 100,
            costPrice: 40,
            sku: 'FOOD-DRINK-LASSI',
            stock: null,
            trackStock: false,
            unit: 'pcs',
            allowFractional: false,
            color: '#f59e0b',
          },
        ],
      },
    ]
  }

  if (businessType === 'retail') {
    return [
      {
        name: 'Grocery',
        color: '#0f766e',
        products: [
          {
            name: 'Atta 1kg',
            price: 180,
            costPrice: 150,
            sku: 'RET-ATTA-1KG',
            stock: 50,
            trackStock: true,
            unit: 'pcs',
            allowFractional: false,
            color: '#0d9488',
          },
          {
            name: 'Sugar',
            price: 180,
            costPrice: 150,
            sku: 'RET-SUGAR-KG',
            stock: 40,
            trackStock: true,
            unit: 'kg',
            allowFractional: true,
            color: '#14b8a6',
          },
          {
            name: 'Cooking Oil 1L',
            price: 520,
            costPrice: 470,
            sku: 'RET-OIL-1L',
            stock: 30,
            trackStock: true,
            unit: 'pcs',
            allowFractional: false,
            color: '#f59e0b',
          },
          {
            name: 'Tea 200g',
            price: 350,
            costPrice: 280,
            sku: 'RET-TEA-200',
            stock: 25,
            trackStock: true,
            unit: 'pcs',
            allowFractional: false,
            color: '#92400e',
          },
        ],
      },
      {
        name: 'Household',
        color: '#7c3aed',
        products: [
          {
            name: 'Soap',
            price: 120,
            costPrice: 90,
            sku: 'RET-SOAP-01',
            stock: 60,
            trackStock: true,
            unit: 'pcs',
            allowFractional: false,
            color: '#8b5cf6',
          },
          {
            name: 'Dish Wash',
            price: 250,
            costPrice: 180,
            sku: 'RET-DISH-01',
            stock: 20,
            trackStock: true,
            unit: 'pcs',
            allowFractional: false,
            color: '#a855f7',
          },
          {
            name: 'Tissue Roll',
            price: 90,
            costPrice: 60,
            sku: 'RET-TISSUE-01',
            stock: 35,
            trackStock: true,
            unit: 'pcs',
            allowFractional: false,
            color: '#c084fc',
          },
        ],
      },
    ]
  }

  return [
    {
      name: 'Sweets',
      color: '#be123c',
      products: [
        {
          name: 'Gulab Jamun',
          price: 1200,
          costPrice: 700,
          sku: 'BAK-GJ-KG',
          stock: 8,
          trackStock: true,
          unit: 'kg',
          allowFractional: true,
          weightPresets: [0.25, 0.5, 1],
          color: '#e11d48',
        },
        {
          name: 'Barfi',
          price: 1600,
          costPrice: 950,
          sku: 'BAK-BARFI-KG',
          stock: 5,
          trackStock: true,
          unit: 'kg',
          allowFractional: true,
          weightPresets: [0.25, 0.5, 1],
          color: '#f43f5e',
        },
        {
          name: 'Laddu',
          price: 1100,
          costPrice: 650,
          sku: 'BAK-LADDU-KG',
          stock: 6,
          trackStock: true,
          unit: 'kg',
          allowFractional: true,
          weightPresets: [0.25, 0.5, 1],
          color: '#fb7185',
        },
      ],
    },
    {
      name: 'Baked',
      color: '#a16207',
      products: [
        {
          name: 'Cake Slice',
          price: 150,
          costPrice: 70,
          sku: 'BAK-CAKE-SLICE',
          stock: 20,
          trackStock: true,
          unit: 'pcs',
          allowFractional: false,
          color: '#ca8a04',
        },
        {
          name: 'Bread Loaf',
          price: 120,
          costPrice: 70,
          sku: 'BAK-BREAD-01',
          stock: 15,
          trackStock: true,
          unit: 'pcs',
          allowFractional: false,
          color: '#d97706',
        },
        {
          name: 'Samosa',
          price: 40,
          costPrice: 18,
          sku: 'BAK-SAMOSA-01',
          stock: 50,
          trackStock: true,
          unit: 'pcs',
          allowFractional: false,
          color: '#ea580c',
        },
      ],
    },
  ]
}

export async function loadSampleDemoData(
  businessType: BusinessType,
  options: { replaceExisting?: boolean } = {},
): Promise<{ categories: number; products: number }> {
  const replaceExisting = options.replaceExisting ?? true
  const timestamp = nowIso()
  const catalog = getDemoCatalog(businessType)

  const categories: Category[] = []
  const products: Product[] = []

  catalog.forEach((categoryInput, index) => {
    const categoryId = createId()
    categories.push({
      id: categoryId,
      name: categoryInput.name,
      color: categoryInput.color,
      sortOrder: index + 1,
      createdAt: timestamp,
      updatedAt: timestamp,
    })

    for (const productInput of categoryInput.products) {
      products.push({
        id: createId(),
        categoryId,
        name: productInput.name,
        price: productInput.price,
        costPrice: productInput.costPrice,
        sku: productInput.sku,
        stock: productInput.stock,
        trackStock: productInput.trackStock,
        unit: productInput.unit,
        allowFractional: productInput.allowFractional,
        weightPresets: productInput.weightPresets ?? [],
        imageBase64: null,
        color: productInput.color,
        variants: productInput.variants ?? [],
        isActive: true,
        createdAt: timestamp,
        updatedAt: timestamp,
      })
    }
  })

  await db.transaction(
    'rw',
    db.settings,
    db.categories,
    db.products,
    db.syncQueue,
    async () => {
      if (replaceExisting) {
        await db.categories.clear()
        await db.products.clear()
      }

      const existingSettings = await db.settings.get(SETTINGS_ID)
      const nextSettings = buildDefaultSettings({
        ...existingSettings,
        businessType,
        receiptConfig: receiptDefaultsFor(businessType),
        shopName:
          existingSettings?.shopName ||
          (businessType === 'food'
            ? 'Al-Rehman Biryani'
            : businessType === 'retail'
              ? 'Madina General Store'
              : 'Sheerin Bakery'),
        address:
          existingSettings?.address || 'Main Bazaar, Lahore',
        phone: existingSettings?.phone || '0300-1234567',
        onboardingComplete: existingSettings?.onboardingComplete ?? false,
        language: existingSettings?.language ?? 'en',
        ownerPin: existingSettings?.ownerPin ?? '1234',
        ownerWhatsApp: existingSettings?.ownerWhatsApp ?? '',
        updatedAt: timestamp,
        createdAt: existingSettings?.createdAt ?? timestamp,
      })

      await db.settings.put(nextSettings)
      await enqueueSync(
        'settings',
        nextSettings.id,
        existingSettings ? 'UPDATE' : 'CREATE',
        nextSettings,
      )

      for (const category of categories) {
        await db.categories.add(category)
        await enqueueSync('categories', category.id, 'CREATE', category)
      }

      for (const product of products) {
        await db.products.add(product)
        await enqueueSync('products', product.id, 'CREATE', product)
      }
    },
  )

  return { categories: categories.length, products: products.length }
}

export async function resetDemoCatalog(): Promise<void> {
  await db.transaction('rw', db.categories, db.products, async () => {
    await db.categories.clear()
    await db.products.clear()
  })
}
