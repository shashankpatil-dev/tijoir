"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

type ToastTone = "success" | "error" | "info" | "warning";

type ToastContextValue = {
  showToast: (toast: { title: string; description: string; tone: ToastTone }) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const showToast = useCallback((item: { title: string; description: string; tone: ToastTone }) => {
    const method =
      item.tone === "success"
        ? toast.success
        : item.tone === "error"
          ? toast.error
          : item.tone === "warning"
            ? toast.warning
            : toast;

    method(item.title, {
      description: item.description,
      duration: 4200,
    });
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toaster closeButton position="top-right" richColors />
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
