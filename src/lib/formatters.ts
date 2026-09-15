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
