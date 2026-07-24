"use client";

import { useEffect, useState, useCallback } from "react";
import { CheckCircle, XCircle, AlertTriangle, XIcon } from "lucide-react";

interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant: "success" | "error" | "warning";
}

type AddToastFn = (toast: Omit<ToastItem, "id">) => void;

let addToastGlobal: AddToastFn | null = null;

export function toast(toast: Omit<ToastItem, "id">) {
  if (addToastGlobal) {
    addToastGlobal(toast);
  }
}

export function Toaster() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((toast: Omit<ToastItem, "id">) => {
    const id = Math.random().toString(36).slice(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    addToastGlobal = addToast;
    return () => {
      addToastGlobal = null;
    };
  }, [addToast]);

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <ToastNotification key={t.id} toast={t} onRemove={removeToast} />
      ))}
    </div>
  );
}

function ToastNotification({
  toast: t,
  onRemove,
}: {
  toast: ToastItem;
  onRemove: (id: string) => void;
}) {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(t.id), 4000);
    return () => clearTimeout(timer);
  }, [t.id, onRemove]);

  const variants = {
    success: {
      style: "border-l-green-500 bg-green-50 text-green-800",
      icon: <CheckCircle className="h-5 w-5 text-green-500" />,
    },
    error: {
      style: "border-l-red-500 bg-red-50 text-red-800",
      icon: <XCircle className="h-5 w-5 text-red-500" />,
    },
    warning: {
      style: "border-l-amber-500 bg-amber-50 text-amber-800",
      icon: <AlertTriangle className="h-5 w-5 text-amber-500" />,
    },
  };

  const v = variants[t.variant];

  return (
    <div
      className={`pointer-events-auto flex w-80 items-start gap-3 rounded-lg border-l-4 p-4 shadow-lg ${v.style}`}
    >
      {v.icon}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{t.title}</p>
        {t.description && (
          <p className="mt-0.5 text-xs opacity-80">{t.description}</p>
        )}
      </div>
      <button
        onClick={() => onRemove(t.id)}
        className="shrink-0 rounded p-0.5 hover:bg-black/10"
      >
        <XIcon className="h-4 w-4" />
      </button>
    </div>
  );
}
