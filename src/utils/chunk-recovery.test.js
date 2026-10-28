import { describe, expect, it, vi } from 'vitest'
import { clearDynamicImportRecovery, isDynamicImportFailure, reloadAfterDynamicImportFailure } from './chunk-recovery.js'

function createStorage() {
  const values = new Map()
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  }
}

describe('recuperación de módulos dinámicos', () => {
  it('reconoce el error emitido por el navegador', () => {
    expect(isDynamicImportFailure(new TypeError('Failed to fetch dynamically imported module: /assets/event.js'))).toBe(true)
    expect(isDynamicImportFailure(new Error('Sin autorización'))).toBe(false)
  })

  it('recarga una sola vez por ruta y permite limpiar el marcador', () => {
    const storage = createStorage()
    const location = { pathname: '/admin/eventos/1', search: '', reload: vi.fn() }
    const error = new TypeError('Failed to fetch dynamically imported module: /assets/event.js')
    expect(reloadAfterDynamicImportFailure(error, storage, location)).toBe(true)
    expect(location.reload).toHaveBeenCalledOnce()
    expect(reloadAfterDynamicImportFailure(error, storage, location)).toBe(false)
    clearDynamicImportRecovery(storage)
    expect(reloadAfterDynamicImportFailure(error, storage, location)).toBe(true)
  })
})
