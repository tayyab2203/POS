/**
 * Offline unlock codes: POS-YYYYMMDD-XXXXXX
 * Signature = first 6 chars of HMAC-SHA256(shopId|expiryYmd|offlineSecret) uppercase hex.
 */

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

async function hmacSha256(
  secret: string,
  message: string,
): Promise<ArrayBuffer> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  return crypto.subtle.sign('HMAC', key, enc.encode(message))
}

export async function hmacSha256Hex(
  secret: string,
  message: string,
): Promise<string> {
  return toHex(await hmacSha256(secret, message))
}

export function unlockMessage(shopId: string, expiryYmd: string): string {
  return `${shopId}|${expiryYmd}`
}

/** Generate code for Super Admin sharing (Phase 8D will call this). */
export async function generateUnlockCode(
  shopId: string,
  expiryYmd: string,
  offlineSecret: string,
): Promise<string> {
  const ymd = expiryYmd.replaceAll('-', '').slice(0, 8)
  const sig = (
    await hmacSha256Hex(offlineSecret, unlockMessage(shopId, ymd))
  )
    .slice(0, 6)
    .toUpperCase()
  return `POS-${ymd}-${sig}`
}

export interface UnlockVerifyResult {
  ok: boolean
  expiresAtIso: string | null
  expiryYmd: string | null
  error?: string
}

const CODE_RE = /^POS-(\d{8})-([A-F0-9]{6})$/i

export async function verifyUnlockCode(
  code: string,
  shopId: string,
  offlineSecret: string,
): Promise<UnlockVerifyResult> {
  const normalized = code.trim().toUpperCase()
  const match = CODE_RE.exec(normalized)
  if (!match) {
    return {
      ok: false,
      expiresAtIso: null,
      expiryYmd: null,
      error: 'Invalid code format',
    }
  }
  const ymd = match[1]
  const sig = match[2]
  const expected = (
    await hmacSha256Hex(offlineSecret, unlockMessage(shopId, ymd))
  )
    .slice(0, 6)
    .toUpperCase()

  if (sig !== expected) {
    return {
      ok: false,
      expiresAtIso: null,
      expiryYmd: null,
      error: 'Invalid unlock code',
    }
  }

  const year = Number(ymd.slice(0, 4))
  const month = Number(ymd.slice(4, 6))
  const day = Number(ymd.slice(6, 8))
  // End of that calendar day UTC
  const expiresAtIso = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999)).toISOString()

  return {
    ok: true,
    expiresAtIso,
    expiryYmd: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
  }
}

/** Checksum for license snapshot integrity (shopId + offline_secret). */
export async function licenseChecksum(input: {
  shopId: string
  offlineSecret: string
  expiresAt: string
  status: string
  graceDays: number
  plan: string
  lastKnownTime: number
  featureFlagsJson: string
}): Promise<string> {
  const message = [
    input.shopId,
    input.expiresAt,
    input.status,
    String(input.graceDays),
    input.plan,
    String(input.lastKnownTime),
    input.featureFlagsJson,
  ].join('|')
  return hmacSha256Hex(input.offlineSecret, message)
}
