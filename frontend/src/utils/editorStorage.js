/**
 * Utility for isolating and caching user code progress per User ID, Problem ID, and Language.
 * Prevents code from leaking between different coding challenges or between different users.
 */

const STORAGE_PREFIX = 'code_solution';

/**
 * Generate a strictly namespaced key: code_solution_{userId}_{problemId}_{language}
 */
export const getScopedStorageKey = (userId, problemId, language = 'javascript') => {
  const uid = userId ? String(userId) : 'guest';
  const pid = problemId ? String(problemId) : 'unknown';
  const lang = language ? String(language).toLowerCase() : 'javascript';
  return `${STORAGE_PREFIX}_${uid}_${pid}_${lang}`;
};

/**
 * Retrieve saved code progress for a specific problem and language
 */
export const getScopedCode = (userId, problemId, language) => {
  if (!problemId) return null;
  try {
    const key = getScopedStorageKey(userId, problemId, language);
    return localStorage.getItem(key);
  } catch (err) {
    console.warn('[editorStorage] Failed to read from localStorage:', err);
    return null;
  }
};

/**
 * Save in-progress code for a specific problem and language
 */
export const setScopedCode = (userId, problemId, language, code) => {
  if (!problemId || code === undefined || code === null) return;
  try {
    const key = getScopedStorageKey(userId, problemId, language);
    localStorage.setItem(key, code);
  } catch (err) {
    console.warn('[editorStorage] Failed to write to localStorage:', err);
  }
};

/**
 * Clear cached code for a specific problem and language (e.g. on Reset to Boilerplate)
 */
export const removeScopedCode = (userId, problemId, language) => {
  if (!problemId) return;
  try {
    const key = getScopedStorageKey(userId, problemId, language);
    localStorage.removeItem(key);
  } catch (err) {
    console.warn('[editorStorage] Failed to remove from localStorage:', err);
  }
};

/**
 * Clean up legacy or malformed storage keys that could cause cross-problem pollution
 */
export const cleanupLegacyEditorStorage = () => {
  try {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (
        key &&
        (key.startsWith('current_code') ||
          key.startsWith('editor_code') ||
          key.includes('_undefined_') ||
          key.includes('_null_'))
      ) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch (err) {
    // Ignore storage access errors
  }
};
