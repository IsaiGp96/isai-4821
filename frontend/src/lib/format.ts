// Formatos de presentación en un solo lugar: todo el sitio muestra montos y fechas igual.

const currencyFormat = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })
const dateTimeFormat = new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short' })

export function formatCurrency(amount: number): string {
  return currencyFormat.format(amount)
}

export function formatDateTime(iso: string): string {
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? iso : dateTimeFormat.format(date)
}

// En pantalla solo se muestran los últimos 4 dígitos, aunque el historial guarde el número completo.
export function maskCardNumber(cardNumber: string): string {
  return `•••• ${cardNumber.slice(-4)}`
}
