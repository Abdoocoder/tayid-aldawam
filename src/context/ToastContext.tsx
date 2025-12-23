"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { Toast, ToastType } from "@/components/ui/toast";

interface ToastMessage {
    id: string;
    title: string;
    description?: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (title: string, description?: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    const showToast = useCallback((title: string, description?: string, type: ToastType = "success") => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { id, title, description, type }]);

        // Auto-remove after 3 seconds
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 3000);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed bottom-4 left-4 z-[9999] flex flex-col gap-2 w-full max-w-sm pointer-events-none">
                {toasts.map((toast) => (
                    <Toast
                        key={toast.id}
                        title={toast.title}
                        description={toast.description}
                        type={toast.type}
                        onClose={() => removeToast(toast.id)}
                    />
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return context;
}
