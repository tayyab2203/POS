import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

type ShopPlan = 'basic' | 'pro'
type BusinessType = 'food' | 'retail' | 'bakery'

interface FeatureFlags {
  enableKhata: boolean
  enableWhatsAppReport: boolean
  enableAuditLog: boolean
  enableSplitPayment: boolean
  enableInventory: boolean
}

interface CreateShopOwnerBody {
  shopName: string
  ownerName: string
  ownerPhone: string
  businessType: BusinessType
  plan: ShopPlan
  trialDays?: number
  email: string
  password: string
  featureFlags?: Partial<FeatureFlags>
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function defaultFlags(plan: ShopPlan): FeatureFlags {
  if (plan === 'pro') {
    return {
      enableKhata: true,
      enableWhatsAppReport: true,
      enableAuditLog: true,
      enableSplitPayment: true,
      enableInventory: true,
    }
  }
  return {
    enableKhata: true,
    enableWhatsAppReport: true,
    enableAuditLog: false,
    enableSplitPayment: false,
    enableInventory: true,
  }
}

function randomSecret(bytes = 24): string {
  const arr = new Uint8Array(bytes)
  crypto.getRandomValues(arr)
  return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return jsonResponse({ error: 'Server misconfigured' }, 500)
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return jsonResponse({ error: 'Missing Authorization header' }, 401)
  }

  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  })

  const {
    data: { user },
    error: userError,
  } = await callerClient.auth.getUser()

  if (userError || !user) {
    return jsonResponse({ error: 'Invalid or expired session' }, 401)
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError || !profile || profile.role !== 'super_admin') {
    return jsonResponse({ error: 'Forbidden: super_admin required' }, 403)
  }

  let body: CreateShopOwnerBody
  try {
    body = (await req.json()) as CreateShopOwnerBody
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400)
  }

  const shopName = (body.shopName ?? '').trim()
  const ownerName = (body.ownerName ?? '').trim()
  const ownerPhone = (body.ownerPhone ?? '').trim()
  const email = (body.email ?? '').trim().toLowerCase()
  const password = body.password ?? ''
  const businessType = body.businessType
  const plan = body.plan
  const trialDays = Math.max(1, Number(body.trialDays ?? 14) || 14)

  if (!shopName || !ownerName || !email || !password) {
    return jsonResponse(
      { error: 'shopName, ownerName, email, and password are required' },
      400,
    )
  }
  if (!['food', 'retail', 'bakery'].includes(businessType)) {
    return jsonResponse({ error: 'Invalid businessType' }, 400)
  }
  if (!['basic', 'pro'].includes(plan)) {
    return jsonResponse({ error: 'Invalid plan' }, 400)
  }
  if (password.length < 6) {
    return jsonResponse({ error: 'Password must be at least 6 characters' }, 400)
  }

  const expiresAt = new Date()
  expiresAt.setUTCDate(expiresAt.getUTCDate() + trialDays)
  const expiresAtIso = expiresAt.toISOString()

  const featureFlags = {
    ...defaultFlags(plan),
    ...(body.featureFlags ?? {}),
  }

  const offlineSecret = randomSecret(24)
  let shopId: string | null = null
  let userId: string | null = null

  try {
    const { data: shop, error: shopError } = await admin
      .from('shops')
      .insert({
        name: shopName,
        owner_name: ownerName,
        owner_phone: ownerPhone,
        business_type: businessType,
        plan,
        status: 'trial',
        expires_at: expiresAtIso,
        grace_days: 7,
        feature_flags: featureFlags,
        offline_secret: offlineSecret,
        owner_whatsapp: ownerPhone,
      })
      .select('id')
      .single()

    if (shopError || !shop) {
      throw new Error(shopError?.message ?? 'Failed to create shop')
    }
    shopId = shop.id as string

    const { data: created, error: createUserError } =
      await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: ownerName,
          shop_id: shopId,
          role: 'shop_owner',
        },
      })

    if (createUserError || !created.user) {
      throw new Error(createUserError?.message ?? 'Failed to create auth user')
    }
    userId = created.user.id

    const { error: profileInsertError } = await admin.from('profiles').insert({
      id: userId,
      shop_id: shopId,
      role: 'shop_owner',
      full_name: ownerName,
      phone: ownerPhone,
    })

    if (profileInsertError) {
      throw new Error(profileInsertError.message)
    }

    return jsonResponse({
      shopId,
      userId,
      email,
      expiresAt: expiresAtIso,
    })
  } catch (err) {
    // Best-effort cleanup so partial onboarding does not leave orphans
    if (userId) {
      try {
        await admin.auth.admin.deleteUser(userId)
      } catch {
        /* ignore */
      }
    }
    if (shopId) {
      try {
        await admin.from('shops').delete().eq('id', shopId)
      } catch {
        /* ignore */
      }
    }

    const message = err instanceof Error ? err.message : 'Create shop failed'
    return jsonResponse({ error: message }, 500)
  }
})
