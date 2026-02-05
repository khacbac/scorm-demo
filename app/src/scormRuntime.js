// Minimal SCORM 1.2 runtime shim for learning/demo purposes
// Exposes window.API with the core LMS* methods and logs calls.

const SCORM_STATUS = {
  NOT_INITIALIZED: '0',
  INITIALIZED: '1',
  TERMINATED: '2',
}

const ERROR_CODES = {
  NO_ERROR: '0',
  NOT_INITIALIZED: '301',
  ALREADY_INITIALIZED: '101',
  TERMINATE_BEFORE_INIT: '302',
  TERMINATE_AFTER_TERMINATE: '303',
  GENERAL: '101',
  INVALID_ARGUMENT: '201',
  ELEMENT_NOT_IMPLEMENTED: '401',
}

const ERROR_STRINGS = {
  [ERROR_CODES.NO_ERROR]: 'No error',
  [ERROR_CODES.NOT_INITIALIZED]: 'LMS not initialized',
  [ERROR_CODES.ALREADY_INITIALIZED]: 'LMS already initialized',
  [ERROR_CODES.TERMINATE_BEFORE_INIT]: 'Cannot terminate before initialize',
  [ERROR_CODES.TERMINATE_AFTER_TERMINATE]: 'LMS already terminated',
  [ERROR_CODES.GENERAL]: 'General exception',
  [ERROR_CODES.INVALID_ARGUMENT]: 'Invalid argument error',
  [ERROR_CODES.ELEMENT_NOT_IMPLEMENTED]: 'Element not implemented',
}

const STORAGE_KEY_PREFIX = 'scorm12_cmi_'

let state = {
  status: SCORM_STATUS.NOT_INITIALIZED,
  lastError: ERROR_CODES.NO_ERROR,
  // Very small subset of the SCORM 1.2 data model for demo
  cmi: {
    core: {
      student_id: '',
      student_name: '',
      lesson_location: '',
      lesson_status: 'not attempted',
      score: {
        raw: '',
      },
    },
    suspend_data: '',
  },
}

let logs = []

function setError(code) {
  state.lastError = code
  return code
}

function clearError() {
  state.lastError = ERROR_CODES.NO_ERROR
}

function pushLog(entry) {
  const item = {
    time: new Date().toISOString(),
    ...entry,
  }
  logs.push(item)
  // Keep log size bounded
  if (logs.length > 200) {
    logs = logs.slice(-200)
  }
}

function saveToStorage(packageId) {
  if (!packageId) return
  try {
    const key = STORAGE_KEY_PREFIX + packageId
    window.localStorage.setItem(key, JSON.stringify(state.cmi))
  } catch {
    // ignore storage errors in this demo
  }
}

function loadFromStorage(packageId) {
  if (!packageId) return
  try {
    const key = STORAGE_KEY_PREFIX + packageId
    const raw = window.localStorage.getItem(key)
    if (raw) {
      const parsed = JSON.parse(raw)
      state.cmi = {
        ...state.cmi,
        ...parsed,
      }
    }
  } catch {
    // ignore
  }
}

function resolveCmiPath(path) {
  // Minimal dot-path resolver, e.g. "cmi.core.lesson_status"
  const parts = path.split('.')
  let current = state
  for (const p of parts) {
    if (current && typeof current === 'object' && p in current) {
      current = current[p]
    } else {
      return { exists: false, value: undefined, parent: null, key: null }
    }
  }
  return { exists: true, value: current }
}

function resolveCmiParent(path) {
  const parts = path.split('.')
  const key = parts.pop()
  let current = state
  for (const p of parts) {
    if (current && typeof current === 'object' && p in current) {
      current = current[p]
    } else {
      return { parent: null, key: null }
    }
  }
  return { parent: current, key }
}

function createApiForPackage(packageId) {
  loadFromStorage(packageId)

  return {
    LMSInitialize: (param) => {
      pushLog({ method: 'LMSInitialize', args: [param] })
      if (state.status === SCORM_STATUS.INITIALIZED) {
        setError(ERROR_CODES.ALREADY_INITIALIZED)
        return 'false'
      }
      if (param !== '' && param != null) {
        setError(ERROR_CODES.INVALID_ARGUMENT)
        return 'false'
      }
      clearError()
      state.status = SCORM_STATUS.INITIALIZED
      return 'true'
    },

    LMSFinish: (param) => {
      pushLog({ method: 'LMSFinish', args: [param] })
      if (state.status === SCORM_STATUS.NOT_INITIALIZED) {
        setError(ERROR_CODES.TERMINATE_BEFORE_INIT)
        return 'false'
      }
      if (state.status === SCORM_STATUS.TERMINATED) {
        setError(ERROR_CODES.TERMINATE_AFTER_TERMINATE)
        return 'false'
      }
      if (param !== '' && param != null) {
        setError(ERROR_CODES.INVALID_ARGUMENT)
        return 'false'
      }
      saveToStorage(packageId)
      clearError()
      state.status = SCORM_STATUS.TERMINATED
      return 'true'
    },

    LMSGetValue: (element) => {
      pushLog({ method: 'LMSGetValue', args: [element] })
      if (state.status !== SCORM_STATUS.INITIALIZED) {
        setError(ERROR_CODES.NOT_INITIALIZED)
        return ''
      }
      if (typeof element !== 'string' || !element.startsWith('cmi.')) {
        setError(ERROR_CODES.INVALID_ARGUMENT)
        return ''
      }
      const { exists, value } = resolveCmiPath(element)
      if (!exists) {
        setError(ERROR_CODES.ELEMENT_NOT_IMPLEMENTED)
        return ''
      }
      clearError()
      return String(value ?? '')
    },

    LMSSetValue: (element, value) => {
      pushLog({ method: 'LMSSetValue', args: [element, value] })
      if (state.status !== SCORM_STATUS.INITIALIZED) {
        setError(ERROR_CODES.NOT_INITIALIZED)
        return 'false'
      }
      if (typeof element !== 'string' || !element.startsWith('cmi.')) {
        setError(ERROR_CODES.INVALID_ARGUMENT)
        return 'false'
      }
      const { parent, key } = resolveCmiParent(element)
      if (!parent || !(key in parent)) {
        setError(ERROR_CODES.ELEMENT_NOT_IMPLEMENTED)
        return 'false'
      }
      // Basic type handling – everything stays as string in this demo
      parent[key] = value
      clearError()
      return 'true'
    },

    LMSCommit: (param) => {
      pushLog({ method: 'LMSCommit', args: [param] })
      if (state.status !== SCORM_STATUS.INITIALIZED) {
        setError(ERROR_CODES.NOT_INITIALIZED)
        return 'false'
      }
      if (param !== '' && param != null) {
        setError(ERROR_CODES.INVALID_ARGUMENT)
        return 'false'
      }
      saveToStorage(packageId)
      clearError()
      return 'true'
    },

    LMSGetLastError: () => {
      pushLog({ method: 'LMSGetLastError', args: [] })
      return state.lastError
    },

    LMSGetErrorString: (code) => {
      pushLog({ method: 'LMSGetErrorString', args: [code] })
      const str = ERROR_STRINGS[code] || 'Unknown error'
      return str
    },

    LMSGetDiagnostic: (code) => {
      pushLog({ method: 'LMSGetDiagnostic', args: [code] })
      // For this demo, just echo the code or lastError
      if (!code || code === '0') {
        return state.lastError
      }
      return String(code)
    },

    // Non-standard helper to inspect runtime from React UI
    __getState: () => ({
      ...state,
      logs: [...logs],
    }),
    __reset: () => {
      state = {
        ...state,
        status: SCORM_STATUS.NOT_INITIALIZED,
        cmi: {
          core: {
            student_id: '',
            student_name: '',
            lesson_location: '',
            lesson_status: 'not attempted',
            score: {
              raw: '',
            },
          },
          suspend_data: '',
        },
      }
      logs = []
      clearError()
    },
  }
}

export function attachScormApiToWindow(packageId = 'Quiz18092025') {
  if (typeof window === 'undefined') return
  const api = createApiForPackage(packageId)
  // SCORM 1.2 API handle
  window.API = api
  // Optional: stub for SCORM 2004
  if (!window.API_1484_11) {
    window.API_1484_11 = {
      Initialize: () => 'false',
      Terminate: () => 'false',
      GetValue: () => '',
      SetValue: () => 'false',
      Commit: () => 'false',
      GetLastError: () => '101',
      GetErrorString: () => 'SCORM 2004 not implemented in this demo',
      GetDiagnostic: () => 'SCORM 2004 not implemented in this demo',
    }
  }
  return api
}

export function getScormApi() {
  if (typeof window === 'undefined') return null
  return window.API || null
}

