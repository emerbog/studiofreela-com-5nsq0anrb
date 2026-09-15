/**
 * Validation utilities for Studio Freela (documents, phone, email, etc.)
 */

// Valida CPF através do cálculo dos dígitos verificadores
export function isValidCPF(cpf: string): boolean {
  const clean = cpf.replace(/\D/g, '')
  if (clean.length !== 11) return false
  if (/^(\d)\1{10}$/.test(clean)) return false

  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(clean.charAt(i), 10) * (10 - i)
  }
  let rev = 11 - (sum % 11)
  if (rev === 10 || rev === 11) rev = 0
  if (rev !== parseInt(clean.charAt(9), 10)) return false

  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(clean.charAt(i), 10) * (11 - i)
  }
  rev = 11 - (sum % 11)
  if (rev === 10 || rev === 11) rev = 0
  if (rev !== parseInt(clean.charAt(10), 10)) return false

  return true
}

// Valida CNPJ através do cálculo dos dígitos verificadores
export function isValidCNPJ(cnpj: string): boolean {
  const clean = cnpj.replace(/\D/g, '')
  if (clean.length !== 14) return false
  if (/^(\d)\1{13}$/.test(clean)) return false

  let size = clean.length - 2
  let numbers = clean.substring(0, size)
  const digits = clean.substring(size)
  let sum = 0
  let pos = size - 7

  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i), 10) * pos--
    if (pos < 2) pos = 9
  }

  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  if (result !== parseInt(digits.charAt(0), 10)) return false

  size = size + 1
  numbers = clean.substring(0, size)
  sum = 0
  pos = size - 7
  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i), 10) * pos--
    if (pos < 2) pos = 9
  }

  result = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  if (result !== parseInt(digits.charAt(1), 10)) return false

  return true
}

// Valida documento que pode ser CPF ou CNPJ
export function isValidCpfCnpj(doc: string): boolean {
  if (!doc) return true // Campo opcional
  const clean = doc.replace(/\D/g, '')
  if (clean.length === 11) return isValidCPF(clean)
  if (clean.length === 14) return isValidCNPJ(clean)
  return false
}

// Valida formato de telefone brasileiro (DDD + 8 ou 9 dígitos)
export function isValidPhone(phone: string): boolean {
  if (!phone) return true
  const clean = phone.replace(/\D/g, '')
  return clean.length === 10 || clean.length === 11
}

// Valida formato de e-mail básico
export function isValidEmail(email: string): boolean {
  if (!email) return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

// Formata CPF / CNPJ enquanto digita
export function maskCpfCnpj(value: string): string {
  const clean = value.replace(/\D/g, '')
  if (clean.length <= 11) {
    return clean
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
  }
  return clean
    .substring(0, 14)
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
}

// Formata telefone brasileiro enquanto digita
export function maskPhone(value: string): string {
  const clean = value.replace(/\D/g, '').substring(0, 11)
  if (clean.length <= 10) {
    return clean.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').trim()
  }
  return clean.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').trim()
}
