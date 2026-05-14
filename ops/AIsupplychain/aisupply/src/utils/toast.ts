type ToastType = 'success' | 'error' | 'info';

type ToastListener = (title: string, message: string, type: ToastType) => void;

class ToastManager {
  private listeners: ToastListener[] = [];

  subscribe(listener: ToastListener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  show(title: string, message: string, type: ToastType) {
    this.listeners.forEach(listener => listener(title, message, type));
  }
}

export const toastManager = new ToastManager();

export const showToast = (title: string, message: string, type: ToastType = 'info') => {
  toastManager.show(title, message, type);
};
