import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertTriangle, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  message: string;
  subMessage?: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, subMessage?: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, subMessage?: string, type: ToastType = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, subMessage, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-4 right-4 z-50 space-y-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="w-96 bg-black/90 backdrop-blur-md border border-white/10 rounded-lg shadow-2xl p-4 flex items-start gap-3 relative group animate-in slide-in-from-right-5 fade-in duration-300"
          >
            <div className="mt-1">
                {toast.type === 'success' && <CheckCircle className="w-5 h-5 text-white fill-green-500" />}
                {toast.type === 'error' && <AlertTriangle className="w-5 h-5 text-red-500" />}
                {toast.type === 'info' && <Info className="w-5 h-5 text-blue-500" />}
            </div>
            <div className="flex-1">
                <h4 className="text-white font-semibold text-sm">{toast.message}</h4>
                {toast.subMessage && <p className="text-gray-400 text-xs mt-1">{toast.subMessage}</p>}
            </div>
            <button 
                onClick={() => removeToast(toast.id)} 
                className="text-gray-500 hover:text-white transition-colors"
            >
                <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
