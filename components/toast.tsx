"use client";

import { createContext, useCallback, useContext, useState } from "react";

type Toast = { id: number; message: string; detail?: string };

const ToastContext = createContext<(message: string, detail?: string) => void>(() => {});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((message: string, detail?: string) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev.slice(-2), { id, message, detail }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2600);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className="pointer-events-none fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="min-w-[200px] rounded-xl border border-[var(--dg-border-strong)] bg-[var(--dg-surface)] px-4 py-3 shadow-xl"
            style={{ boxShadow: "var(--dg-shadow)" }}
          >
            <p className="text-sm font-semibold text-[var(--dg-text)]">{t.message}</p>
            {t.detail ? <p className="mt-0.5 text-xs text-[var(--dg-muted)]">{t.detail}</p> : null}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
