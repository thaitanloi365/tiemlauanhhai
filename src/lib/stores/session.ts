import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { StateStorage } from 'zustand/middleware';

const SESSION_KEY = 'tiemlauanhhai_session_id';

type SessionState = {
  sessionId: string;
  setSessionId: (sessionId: string) => void;
  ensureSession: () => string;
  clear: () => void;
};

function generateSessionId() {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      sessionId: '',
      setSessionId: (sessionId) => set({ sessionId }),
      ensureSession: () => {
        const current = get().sessionId;
        if (current) return current;

        const next = generateSessionId();
        set({ sessionId: next });
        return next;
      },
      clear: () => set({ sessionId: '' }),
    }),
    {
      name: SESSION_KEY,
      storage: createJSONStorage(() => {
        if (typeof window !== 'undefined') return localStorage;

        const noopStorage: StateStorage = {
          getItem: () => null,
          setItem: () => undefined,
          removeItem: () => undefined,
        };
        return noopStorage;
      }),
      partialize: (state) => ({ sessionId: state.sessionId }),
    },
  ),
);

export const sessionStore = {
  getCurrent: () => useSessionStore.getState().ensureSession(),
  set: (sessionId: string) =>
    useSessionStore.getState().setSessionId(sessionId),
  clear: () => useSessionStore.getState().clear(),
};
