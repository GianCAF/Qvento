const RECOVERY_KEY = 'qvento:bundle-recovery'
const DYNAMIC_IMPORT_ERROR = /failed to fetch dynamically imported module|error loading dynamically imported module|importing a module script failed/i

export function isDynamicImportFailure(cause) {
  return DYNAMIC_IMPORT_ERROR.test(String(cause?.message ?? cause ?? ''))
}

export function reloadAfterDynamicImportFailure(cause, storage = window.sessionStorage, location = window.location) {
  if (!isDynamicImportFailure(cause)) return false
  const marker = `${location.pathname}${location.search}`
  if (storage.getItem(RECOVERY_KEY) === marker) return false
  storage.setItem(RECOVERY_KEY, marker)
  location.reload()
  return true
}

export function clearDynamicImportRecovery(storage = window.sessionStorage) {
  storage.removeItem(RECOVERY_KEY)
}
