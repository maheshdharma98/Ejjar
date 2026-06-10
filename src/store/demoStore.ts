import { create } from 'zustand';

type DemoStep =
  | 'idle'
  | 'home'
  | 'select_category'
  | 'select_location'
  | 'tap_search'
  | 'search_results'
  | 'tap_submit_rfq'
  | 'login_phone'
  | 'login_otp'
  | 'rfq_form'
  | 'rfq_submitted'
  | 'rfq_new'
  | 'rfq_quotes_received'
  | 'rfq_accept_quote'
  | 'rfq_confirmed'
  | 'job_tracking'
  | 'job_completed'
  | 'review_screen'
  | 'review_submitted'
  | 'complete';

type DemoStore = {
  isActive: boolean;
  currentStep: DemoStep;
  startDemo: () => void;
  nextStep: () => void;
  exitDemo: () => void;
  setStep: (step: DemoStep) => void;
};

const stepOrder: DemoStep[] = [
  'home', 'select_category', 'select_location', 'tap_search',
  'search_results', 'tap_submit_rfq', 'login_phone', 'login_otp',
  'rfq_form', 'rfq_submitted', 'rfq_new', 'rfq_quotes_received',
  'rfq_accept_quote', 'rfq_confirmed', 'job_tracking', 'job_completed',
  'review_screen', 'review_submitted', 'complete',
];

export const useDemoStore = create<DemoStore>((set, get) => ({
  isActive: false,
  currentStep: 'idle',
  startDemo: () => set({ isActive: true, currentStep: 'home' }),
  nextStep: () => {
    const current = get().currentStep;
    const idx = stepOrder.indexOf(current);
    if (idx >= 0 && idx < stepOrder.length - 1) {
      set({ currentStep: stepOrder[idx + 1] });
    } else {
      set({ isActive: false, currentStep: 'idle' });
    }
  },
  exitDemo: () => set({ isActive: false, currentStep: 'idle' }),
  setStep: (step) => set({ currentStep: step }),
}));
