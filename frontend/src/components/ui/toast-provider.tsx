"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type ToastTone = "success" | "error" | "info" | "warning";

type ToastItem = {
  id: number;
  title: string;
  description: string;
  tone: ToastTone;
};

type ToastContextValue = {
  showToast: (toast: Omit<ToastItem, "id">) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const showToast = useCallback((toast: Omit<ToastItem, "id">) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setItems((current) => [...current, { ...toast, id }]);
    window.setTimeout(() => {
      setItems((current) => current.filter((item) => item.id !== id));
    }, 4200);
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[60] flex w-full max-w-sm flex-col gap-3">
        {items.map((item) => (
          <ToastCard item={item} key={item.id} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}

function ToastCard({ item }: { item: ToastItem }) {
  const toneClass =
    item.tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : item.tone === "error"
        ? "border-rose-200 bg-rose-50 text-rose-900"
        : item.tone === "warning"
          ? "border-amber-200 bg-amber-50 text-amber-900"
          : "border-[var(--color-border)] bg-white text-[var(--color-ink)]";

  return (
    <div
      className={`pointer-events-auto rounded-2xl border p-4 shadow-[var(--shadow-card)] ${toneClass}`}
      role="status"
    >
      <p className="text-sm font-semibold">{item.title}</p>
      <p className="mt-1 text-sm leading-6">{item.description}</p>
    </div>
  );
}
