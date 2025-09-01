// src/utils/tracking.ts
/**
 * Genera un tracking ID único para emails
 */
export function generateTrackingId(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 15)
  return `${timestamp}${random}`.substring(0, 20)
}

/**
 * Construye email HTML con pixel de tracking
 */
export function addTrackingPixel(
  htmlContent: string, 
  trackingId: string, 
  baseUrl: string = ''
): string {
  // Usar URL relativa para que funcione en cualquier entorno
  const trackingPixel = `<img src="/api/track/${trackingId}.png" width="1" height="1" style="display:none !important; visibility:hidden !important; opacity:0 !important;" alt="" />`
  
  // Intentar insertar antes del cierre del body
  if (htmlContent.includes('</body>')) {
    return htmlContent.replace('</body>', `${trackingPixel}</body>`)
  }
  
  // Si no hay body, agregar al final
  return htmlContent + trackingPixel
}

/**
 * Valida si un tracking ID es válido
 */
export function isValidTrackingId(trackingId: string): boolean {
  return typeof trackingId === 'string' && 
         trackingId.length >= 10 && 
         trackingId.length <= 50 &&
         /^[a-zA-Z0-9]+$/.test(trackingId)
}

/**
 * Genera múltiples tracking IDs únicos
 */
export function generateBulkTrackingIds(count: number): string[] {
  const ids: string[] = []
  for (let i = 0; i < count; i++) {
    ids.push(generateTrackingId())
    // Pequeño delay para garantizar IDs únicos
    if (i % 100 === 0 && i > 0) {
      // Solo delay cada 100 IDs para performance
    }
  }
  return ids
}

/**
 * Extrae tracking ID de una URL de pixel
 */
export function extractTrackingIdFromPixelUrl(pixelUrl: string): string | null {
  const match = pixelUrl.match(/\/api\/track\/([^.]+)\.png/)
  return match ? match[1] : null
}

/**
 * Construye URL completa de pixel de tracking
 */
export function buildTrackingPixelUrl(trackingId: string, baseUrl: string = ''): string {
  const base = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '')
  return `${base}/api/track/${trackingId}.png`
}

/**
 * Valida formato de email para tracking
 */
export function isValidEmailForTracking(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Genera ID de campaña para agrupar emails
 */
export function generateCampaignId(name?: string): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 8)
  const prefix = name ? name.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 8) : 'campaign'
  return `${prefix}_${timestamp}${random}`
}