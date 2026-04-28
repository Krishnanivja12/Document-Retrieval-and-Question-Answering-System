import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SessionState {
  sessionId: string | null;
  createdAt: Date | null;
  setSession: (sessionId: string) => void;
  clearSession: () => void;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      sessionId: null,
      createdAt: null,
      setSession: (sessionId: string) =>
        set({
          sessionId,
          createdAt: new Date(),
        }),
      clearSession: () =>
        set({
          sessionId: null,
          createdAt: null,
        }),
    }),
    {
      name: 'session-storage',
    }
  )
);


