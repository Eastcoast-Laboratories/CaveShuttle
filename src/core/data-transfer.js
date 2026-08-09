// Export / import all localStorage data as a Base64 string.
// Inspired by the Lalumo export/import implementation.

const EXPORT_FORMAT_VERSION = '1.0';

/**
 * Export all localStorage data as a Base64-encoded JSON string.
 * @returns {string} Base64-encoded export string
 */
export function exportAllData() {
  const localStorageData = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    localStorageData[key] = localStorage.getItem(key);
  }

  const exportData = {
    version: EXPORT_FORMAT_VERSION,
    timestamp: new Date().toISOString(),
    device: navigator.userAgent,
    localStorageData,
  };

  const jsonString = JSON.stringify(exportData);
  const encoded = btoa(jsonString);

  if (!encoded || encoded.length === 0) {
    console.error('[DATA_TRANSFER] Export failed: encoded string is empty');
    return null;
  }

  console.log('[DATA_TRANSFER] Exported', Object.keys(localStorageData).length, 'localStorage keys');
  return encoded;
}

/**
 * Import all localStorage data from a Base64-encoded JSON string.
 * Overwrites existing localStorage entries with the imported values.
 * @param {string} encodedString - Base64-encoded export string
 * @returns {{ success: boolean, restoredCount: number, error?: string }}
 */
export function importAllData(encodedString) {
  if (!encodedString || !encodedString.trim()) {
    return { success: false, restoredCount: 0, error: 'No import data provided' };
  }

  const cleaned = encodedString.trim();

  let decodedData;
  try {
    decodedData = atob(cleaned);
  } catch (e) {
    console.error('[DATA_TRANSFER] Base64 decoding failed:', e.message);
    return { success: false, restoredCount: 0, error: 'Invalid import data format (not valid Base64)' };
  }

  let parsedData;
  try {
    parsedData = JSON.parse(decodedData);
  } catch (e) {
    console.error('[DATA_TRANSFER] JSON parsing failed:', e.message);
    return { success: false, restoredCount: 0, error: 'This is not a valid export code' };
  }

  if (!parsedData.version || !parsedData.localStorageData) {
    return { success: false, restoredCount: 0, error: 'Unsupported import format' };
  }

  const localStorageData = parsedData.localStorageData;
  let restoredCount = 0;

  for (const key in localStorageData) {
    localStorage.setItem(key, localStorageData[key]);
    restoredCount++;
  }

  console.log('[DATA_TRANSFER] Imported', restoredCount, 'localStorage keys');
  return { success: true, restoredCount };
}
