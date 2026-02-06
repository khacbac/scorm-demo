export type ScormStatus = '0' | '1' | '2'

export type ScormLogEntry = {
  time: string
  method: string
  args: unknown[]
  result?: unknown
}

export type ScormCmi = {
  core: {
    student_id: string
    student_name: string
    lesson_location: string
    lesson_status: string
    score: {
      raw: string
    }
  }
  suspend_data: string
}

export type ScormState = {
  packageId?: string
  status: ScormStatus
  lastError: string
  cmi: ScormCmi
  logs: ScormLogEntry[]
}

const DEFAULT_CMI: ScormCmi = {
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
}

export function buildScormRuntimeScript(options: {
  packageId: string
  initialCmi?: Partial<ScormCmi>
}) {
  const initialCmiJson = JSON.stringify(options.initialCmi ?? {})
  const defaultCmiJson = JSON.stringify(DEFAULT_CMI)
  const packageIdJson = JSON.stringify(options.packageId)

  return `(() => {
    if (window.__SCORM_RUNTIME_INSTALLED__) return true;
    window.__SCORM_RUNTIME_INSTALLED__ = true;

    const SCORM_STATUS = {
      NOT_INITIALIZED: '0',
      INITIALIZED: '1',
      TERMINATED: '2',
    };

    const ERROR_CODES = {
      NO_ERROR: '0',
      NOT_INITIALIZED: '301',
      ALREADY_INITIALIZED: '101',
      TERMINATE_BEFORE_INIT: '302',
      TERMINATE_AFTER_TERMINATE: '303',
      GENERAL: '101',
      INVALID_ARGUMENT: '201',
      ELEMENT_NOT_IMPLEMENTED: '401',
    };

    const ERROR_STRINGS = {
      [ERROR_CODES.NO_ERROR]: 'No error',
      [ERROR_CODES.NOT_INITIALIZED]: 'LMS not initialized',
      [ERROR_CODES.ALREADY_INITIALIZED]: 'LMS already initialized',
      [ERROR_CODES.TERMINATE_BEFORE_INIT]: 'Cannot terminate before initialize',
      [ERROR_CODES.TERMINATE_AFTER_TERMINATE]: 'LMS already terminated',
      [ERROR_CODES.GENERAL]: 'General exception',
      [ERROR_CODES.INVALID_ARGUMENT]: 'Invalid argument error',
      [ERROR_CODES.ELEMENT_NOT_IMPLEMENTED]: 'Element not implemented',
    };

    const DEFAULT_CMI = ${defaultCmiJson};
    const INITIAL_CMI = ${initialCmiJson};
    const PACKAGE_ID = ${packageIdJson};

    const deepMerge = (base, patch) => {
      if (!patch || typeof patch !== 'object') return base;
      const output = Array.isArray(base) ? [...base] : { ...base };
      for (const key of Object.keys(patch)) {
        const value = patch[key];
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          output[key] = deepMerge(output[key] || {}, value);
        } else {
          output[key] = value;
        }
      }
      return output;
    };

    let state = {
      status: SCORM_STATUS.NOT_INITIALIZED,
      lastError: ERROR_CODES.NO_ERROR,
      cmi: deepMerge(JSON.parse(JSON.stringify(DEFAULT_CMI)), INITIAL_CMI),
    };

    let logs = [];

    const setError = (code) => {
      state.lastError = code;
      return code;
    };

    const clearError = () => {
      state.lastError = ERROR_CODES.NO_ERROR;
    };

    const postState = () => {
      try {
        if (!window.ReactNativeWebView || !window.ReactNativeWebView.postMessage) return;
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'SCORM_STATE',
          payload: {
            packageId: PACKAGE_ID,
            status: state.status,
            lastError: state.lastError,
            cmi: state.cmi,
            logs,
          },
        }));
      } catch (err) {
        // ignore
      }
    };

    const pushLog = (entry) => {
      logs.push({
        time: new Date().toISOString(),
        ...entry,
      });
      if (logs.length > 200) logs = logs.slice(-200);
      postState();
    };

    const resolveCmiPath = (path) => {
      const parts = path.split('.');
      let current = state;
      for (const p of parts) {
        if (current && typeof current === 'object' && p in current) {
          current = current[p];
        } else {
          return { exists: false, value: undefined, parent: null, key: null };
        }
      }
      return { exists: true, value: current };
    };

    const resolveCmiParent = (path) => {
      const parts = path.split('.');
      const key = parts.pop();
      let current = state;
      for (const p of parts) {
        if (current && typeof current === 'object' && p in current) {
          current = current[p];
        } else {
          return { parent: null, key: null };
        }
      }
      return { parent: current, key };
    };

    const api = {
      LMSInitialize: (param) => {
        let result = 'true';
        if (state.status === SCORM_STATUS.INITIALIZED) {
          setError(ERROR_CODES.ALREADY_INITIALIZED);
          result = 'false';
        } else if (param !== '' && param != null) {
          setError(ERROR_CODES.INVALID_ARGUMENT);
          result = 'false';
        } else {
          clearError();
          state.status = SCORM_STATUS.INITIALIZED;
        }
        pushLog({ method: 'LMSInitialize', args: [param], result });
        return result;
      },

      LMSFinish: (param) => {
        let result = 'true';
        if (state.status === SCORM_STATUS.NOT_INITIALIZED) {
          setError(ERROR_CODES.TERMINATE_BEFORE_INIT);
          result = 'false';
        } else if (state.status === SCORM_STATUS.TERMINATED) {
          setError(ERROR_CODES.TERMINATE_AFTER_TERMINATE);
          result = 'false';
        } else if (param !== '' && param != null) {
          setError(ERROR_CODES.INVALID_ARGUMENT);
          result = 'false';
        } else {
          clearError();
          state.status = SCORM_STATUS.TERMINATED;
        }
        pushLog({ method: 'LMSFinish', args: [param], result });
        return result;
      },

      LMSGetValue: (element) => {
        let result = '';
        if (state.status !== SCORM_STATUS.INITIALIZED) {
          setError(ERROR_CODES.NOT_INITIALIZED);
        } else if (typeof element !== 'string' || !element.startsWith('cmi.')) {
          setError(ERROR_CODES.INVALID_ARGUMENT);
        } else {
          const resolved = resolveCmiPath(element);
          if (!resolved.exists) {
            setError(ERROR_CODES.ELEMENT_NOT_IMPLEMENTED);
          } else {
            clearError();
            result = String(resolved.value ?? '');
          }
        }
        pushLog({ method: 'LMSGetValue', args: [element], result });
        return result;
      },

      LMSSetValue: (element, value) => {
        let result = 'true';
        if (state.status !== SCORM_STATUS.INITIALIZED) {
          setError(ERROR_CODES.NOT_INITIALIZED);
          result = 'false';
        } else if (typeof element !== 'string' || !element.startsWith('cmi.')) {
          setError(ERROR_CODES.INVALID_ARGUMENT);
          result = 'false';
        } else {
          const resolved = resolveCmiParent(element);
          if (!resolved.parent || !(resolved.key in resolved.parent)) {
            setError(ERROR_CODES.ELEMENT_NOT_IMPLEMENTED);
            result = 'false';
          } else {
            resolved.parent[resolved.key] = value;
            clearError();
          }
        }
        pushLog({ method: 'LMSSetValue', args: [element, value], result });
        return result;
      },

      LMSCommit: (param) => {
        let result = 'true';
        if (state.status !== SCORM_STATUS.INITIALIZED) {
          setError(ERROR_CODES.NOT_INITIALIZED);
          result = 'false';
        } else if (param !== '' && param != null) {
          setError(ERROR_CODES.INVALID_ARGUMENT);
          result = 'false';
        } else {
          clearError();
        }
        pushLog({ method: 'LMSCommit', args: [param], result });
        return result;
      },

      LMSGetLastError: () => {
        const result = state.lastError;
        pushLog({ method: 'LMSGetLastError', args: [], result });
        return result;
      },

      LMSGetErrorString: (code) => {
        const result = ERROR_STRINGS[code] || 'Unknown error';
        pushLog({ method: 'LMSGetErrorString', args: [code], result });
        return result;
      },

      LMSGetDiagnostic: (code) => {
        let result = String(code || state.lastError);
        if (!code || code === '0') {
          result = state.lastError;
        }
        pushLog({ method: 'LMSGetDiagnostic', args: [code], result });
        return result;
      },

      __getState: () => ({
        ...state,
        logs: [...logs],
      }),
    };

    window.API = api;
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
      };
    }

    window.__SCORM_RESET__ = () => {
      state = {
        status: SCORM_STATUS.NOT_INITIALIZED,
        lastError: ERROR_CODES.NO_ERROR,
        cmi: JSON.parse(JSON.stringify(DEFAULT_CMI)),
      };
      logs = [];
      postState();
    };

    window.__SCORM_GET_STATE__ = () => {
      postState();
    };

    postState();
    return true;
  })();`
}
