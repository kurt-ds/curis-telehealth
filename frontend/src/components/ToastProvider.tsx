'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';

type ToastVariant = 'success' | 'error' | 'info';

interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
  isClosing?: boolean;
}

interface ToastContextValue {
  showToast: (input: Omit<ToastItem, 'id'>) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

function buildId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function variantStyles(variant: ToastVariant) {
  switch (variant) {
    case 'success':
      return 'border-emerald-200 bg-emerald-50 text-emerald-800';
    case 'error':
      return 'border-red-200 bg-red-50 text-red-700';
    case 'info':
    default:
      return 'border-slate-200 bg-white text-slate-700';
  }
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((input: Omit<ToastItem, 'id'>) => {
    const id = buildId();
    setToasts((prev) => [...prev, { ...input, id }]);
    window.setTimeout(() => {
      setToasts((prev) =>
        prev.map((toast) =>
          toast.id === id ? { ...toast, isClosing: true } : toast
        )
      );
    }, 3200);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3500);
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] flex flex-col gap-2 w-[90%] max-w-md">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`rounded-xl border px-4 py-3 shadow-sm backdrop-blur ${
              variantStyles(toast.variant)
            } ${toast.isClosing ? 'toast-exit' : 'toast-enter'}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{toast.title}</p>
                {toast.description && (
                  <p className="text-xs mt-1 opacity-80">{toast.description}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setToasts((prev) =>
                    prev.map((t) => (t.id === toast.id ? { ...t, isClosing: true } : t))
                  );
                  window.setTimeout(() => {
                    setToasts((prev) => prev.filter((t) => t.id !== toast.id));
                  }, 250);
                }}
                className="text-xs font-semibold opacity-70 hover:opacity-100"
              >
                Close
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return ctx;
}
