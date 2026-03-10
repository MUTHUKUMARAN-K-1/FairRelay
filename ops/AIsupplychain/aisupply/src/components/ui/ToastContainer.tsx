import { useState, useEffect } from 'react';
import { toastManager } from '../../utils/toast';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

interface Toast {
  id: number;
  title: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    return toastManager.subscribe((title, message, type) => {
      const id = Date.now();
      setToasts(prev => [...prev, { id, title, message, type }]);

      // Auto dismiss
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 5000);
    });
  }, []);

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 pointer-events-none">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-start space-x-3 p-4 rounded-lg shadow-lg border backdrop-blur-md animate-in slide-in-from-right fade-in duration-300 w-80 ${
            toast.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-200' :
            toast.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-200' :
            'bg-blue-500/10 border-blue-500/20 text-blue-200'
          }`}
        >
          <div className="flex-shrink-0 mt-0.5">
            {toast.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-500" />}
            {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-red-500" />}
            {toast.type === 'info' && <Info className="w-5 h-5 text-blue-500" />}
          </div>
          <div className="flex-1">
            <h4 className={`text-sm font-semibold mb-1 ${
               toast.type === 'success' ? 'text-emerald-400' :
               toast.type === 'error' ? 'text-red-400' :
               'text-blue-400'
            }`}>
              {toast.title}
            </h4>
            <p className="text-xs opacity-90">{toast.message}</p>
          </div>
          <button 
            onClick={() => removeToast(toast.id)}
            className="hover:bg-white/10 p-1 rounded transition-colors"
          >
            <X className="w-4 h-4 opacity-50 hover:opacity-100" />
          </button>
        </div>
      ))}
    </div>
  );
}
