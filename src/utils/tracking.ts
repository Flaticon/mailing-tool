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
export function addTrackingPixel(htmlContent: string, trackingId: string, baseUrl: string = 'http://localhost:4321'): string {
  const trackingPixel = `<img src="${baseUrl}/api/track/${trackingId}.png" width="1" height="1" style="display:none !important; visibility:hidden !important; opacity:0 !important;" alt="" />`
  
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
  return typeof trackingId === 'string' && trackingId.length >= 10 && trackingId.length <= 50
}