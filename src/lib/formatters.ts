export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export const formatDate = (dateInput: string | Date) => {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

export const formatShortDate = (dateInput: string | Date) => {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

/**
 * Converte Date ou string ISO para string YYYY-MM-DD no horário LOCAL do navegador.
 * Evita o deslocamento de fuso (ex: UTC-3) causado por date.toISOString().split('T')[0].
 */
export const toLocalDateString = (dateInput?: Date | string | null): string => {
  if (!dateInput) return ''
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
  if (isNaN(d.getTime())) return ''
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Converte string YYYY-MM-DD (ou ISO) em Date no horário local (meio-dia local)
 * evitando que 00:00:00 seja interpretado como UTC e volte 1 dia no fuso brasileiro.
 */
export const parseLocalDate = (dateStr?: string | null): Date | undefined => {
  if (!dateStr) return undefined
  const clean = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr.slice(0, 10)
  const parts = clean.split('-')
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10)
    const m = parseInt(parts[1], 10) - 1
    const d = parseInt(parts[2], 10)
    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
      return new Date(y, m, d, 12, 0, 0)
    }
  }
  const fallback = new Date(dateStr)
  return isNaN(fallback.getTime()) ? undefined : fallback
}
