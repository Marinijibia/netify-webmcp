import { create } from 'zustand';

interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

interface UIState {
  toast: ToastMessage | null;
  showToast: (type: ToastMessage['type'], message: string) => void;
  clearToast: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  toast: null,
  showToast: (type, message) => {
    set({ toast: { id: Date.now().toString(), type, message } });
  },
  clearToast: () => set({ toast: null }),
}));
