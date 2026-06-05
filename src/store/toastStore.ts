import {create} from 'zustand';

type ToastColor = 'success' | 'error' | 'info';

interface ToastStore {
  message: string;
  visible: boolean;
  color: ToastColor;
  showToast: (message: string, color?: ToastColor) => void;
  hideToast: () => void;
}

let toastTimer: ReturnType<typeof setTimeout> | null = null;

export const useToastStore = create<ToastStore>((set) => ({
  message: '',
  visible: false,
  color: 'info',

  showToast: (message: string, color: ToastColor = 'info') => {
    if (toastTimer) {
      clearTimeout(toastTimer);
    }
    set({message, visible: true, color});
    toastTimer = setTimeout(() => {
      set({visible: false});
      toastTimer = null;
    }, 3000);
  },

  hideToast: () => {
    if (toastTimer) {
      clearTimeout(toastTimer);
      toastTimer = null;
    }
    set({visible: false});
  },
}));
