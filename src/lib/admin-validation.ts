export type FieldErrors = Record<string, string>

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export function normalizePkPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('92') && digits.length === 12) return digits
  if (digits.startsWith('0') && digits.length === 11) return `92${digits.slice(1)}`
  if (digits.length === 10 && digits.startsWith('3')) return `92${digits}`
  return digits
}

function isValidPkPhone(raw: string): boolean {
  return /^923\d{9}$/.test(normalizePkPhone(raw))
}

export function validateCreateShop(input: {
  shopName: string
  ownerName: string
  ownerPhone: string
  email: string
  password: string
  trialDays: string
}): FieldErrors {
  const errors: FieldErrors = {}
  const shopName = input.shopName.trim()
  const ownerName = input.ownerName.trim()
  const email = input.email.trim().toLowerCase()
  const phone = input.ownerPhone.trim()
  const trial = Number(input.trialDays)

  if (!shopName) errors.shopName = 'required'
  else if (shopName.length < 2) errors.shopName = 'min2'
  else if (shopName.length > 80) errors.shopName = 'max80'

  if (!ownerName) errors.ownerName = 'required'
  else if (ownerName.length < 2) errors.ownerName = 'min2'

  if (phone && !isValidPkPhone(phone)) {
    errors.ownerPhone = 'phone'
  }

  if (!email) errors.email = 'required'
  else if (!EMAIL_RE.test(email)) errors.email = 'email'

  if (!input.password) errors.password = 'required'
  else if (input.password.length < 6) errors.password = 'passwordMin'
  else if (input.password.length > 72) errors.password = 'passwordMax'

  if (!Number.isInteger(trial) || trial < 1 || trial > 365) {
    errors.trialDays = 'trialDays'
  }

  return errors
}

export function validatePayment(input: {
  amount: string
  daysAdded: string
}): FieldErrors {
  const errors: FieldErrors = {}
  const amount = Number(input.amount)
  const days = Number(input.daysAdded)

  if (!input.amount.trim() || !Number.isFinite(amount)) errors.amount = 'required'
  else if (amount <= 0) errors.amount = 'amountPositive'
  else if (amount > 10_000_000) errors.amount = 'amountMax'

  if (!input.daysAdded.trim() || !Number.isFinite(days)) {
    errors.daysAdded = 'required'
  } else if (!Number.isInteger(days) || days < 1 || days > 3650) {
    errors.daysAdded = 'daysRange'
  }

  return errors
}

export function validateUnlockDate(isoDate: string): FieldErrors {
  const errors: FieldErrors = {}
  if (!isoDate) {
    errors.unlockDate = 'required'
    return errors
  }
  const ms = Date.parse(`${isoDate}T23:59:59.999Z`)
  if (!Number.isFinite(ms)) {
    errors.unlockDate = 'invalidDate'
    return errors
  }
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)
  if (ms < today.getTime()) errors.unlockDate = 'datePast'
  return errors
}
