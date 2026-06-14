import { create } from 'zustand';
import contractorsData from '../../../shared/mock/contractors-oman.json';
import suppliersData from '../../../shared/mock/suppliers-oman.json';
import scenariosData from '../../../shared/mock/demo-scenarios.json';
import jobsData from '../../../shared/mock/jobs-lifecycle.json';
import type { Contractor, Supplier, RFQ, Job, QuoteMessage, Category, Subcategory } from '../../../shared/types/demo';

interface DemoDataState {
  currentUserId: string;
  contractors: Contractor[];
  suppliers: Supplier[];
  rfqs: RFQ[];
  jobs: Job[];

  getSuppliersByCategory: (category: Category) => Supplier[];
  getSuppliersBySubcategory: (subcategory: Subcategory) => Supplier[];
  getSupplierById: (id: string) => Supplier | undefined;
  getRFQById: (id: string) => RFQ | undefined;
  getMyRFQs: () => RFQ[];
  getMyJobs: () => Job[];
  getActiveJobs: () => Job[];
  getCompletedJobs: () => Job[];

  createRFQ: (rfq: Omit<RFQ, 'id' | 'createdAt' | 'updatedAt' | 'quotes'>) => RFQ;
  addQuoteToRFQ: (rfqId: string, quote: Omit<QuoteMessage, 'id' | 'timestamp'>) => void;
  updateRFQStatus: (rfqId: string, status: RFQ['status']) => void;
  acceptQuote: (rfqId: string, quoteId: string) => Job | null;
  rejectQuote: (rfqId: string, quoteId: string) => void;

  updateJobProgress: (jobId: string, progress: number) => void;
  completeJobMilestone: (jobId: string, milestoneIndex: number) => void;
  completeJob: (jobId: string) => void;
  cancelJob: (jobId: string) => void;
}

function loadInitialRFQs(): RFQ[] {
  const rfqs: RFQ[] = [];

  (scenariosData.scenarios as any[]).forEach((scenario: any) => {
    rfqs.push({
      ...scenario.rfq,
      quotes: scenario.quoteThread || [],
    });
  });

  if (scenariosData.completedDemoStory) {
    rfqs.push({
      ...(scenariosData.completedDemoStory as any).rfq,
      quotes: [],
    });
  }

  return rfqs;
}

export const useDemoData = create<DemoDataState>((set, get) => ({
  currentUserId: 'C001',
  contractors: contractorsData as Contractor[],
  suppliers: suppliersData as Supplier[],
  rfqs: loadInitialRFQs(),
  jobs: jobsData as Job[],

  getSuppliersByCategory: (category) =>
    get().suppliers.filter(s => s.category === category),

  getSuppliersBySubcategory: (subcategory) =>
    get().suppliers.filter(s => s.subcategories.includes(subcategory)),

  getSupplierById: (id) =>
    get().suppliers.find(s => s.id === id),

  getRFQById: (id) =>
    get().rfqs.find(r => r.id === id),

  getMyRFQs: () =>
    get().rfqs.filter(r => r.contractorId === get().currentUserId),

  getMyJobs: () =>
    get().jobs.filter(j => j.contractorId === get().currentUserId),

  getActiveJobs: () =>
    get().jobs.filter(
      j =>
        j.contractorId === get().currentUserId &&
        (j.status === 'pending_start' || j.status === 'in_progress'),
    ),

  getCompletedJobs: () =>
    get().jobs.filter(
      j => j.contractorId === get().currentUserId && j.status === 'completed',
    ),

  createRFQ: (rfqInput) => {
    const newRFQ: RFQ = {
      ...rfqInput,
      id: 'RFQ_' + Date.now(),
      quotes: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    set(state => ({ rfqs: [...state.rfqs, newRFQ] }));
    return newRFQ;
  },

  addQuoteToRFQ: (rfqId, quoteInput) => {
    const newQuote: QuoteMessage = {
      ...quoteInput,
      id: 'Q_' + Date.now(),
      timestamp: new Date().toISOString(),
    };
    set(state => ({
      rfqs: state.rfqs.map(r => {
        if (r.id !== rfqId) return r;
        const newStatus: RFQ['status'] =
          quoteInput.fromRole === 'contractor' ? 'negotiating' :
          r.status === 'broadcasted' || r.status === 'draft' ? 'receiving_quotes' :
          r.status;
        return {
          ...r,
          quotes: [...r.quotes, newQuote],
          status: newStatus,
          updatedAt: new Date().toISOString(),
        };
      }),
    }));
  },

  updateRFQStatus: (rfqId, status) => {
    set(state => ({
      rfqs: state.rfqs.map(r =>
        r.id === rfqId ? { ...r, status, updatedAt: new Date().toISOString() } : r,
      ),
    }));
  },

  acceptQuote: (rfqId, quoteId) => {
    const rfq = get().getRFQById(rfqId);
    if (!rfq) return null;
    const quote = rfq.quotes.find(q => q.id === quoteId);
    if (!quote) return null;

    set(state => ({
      rfqs: state.rfqs.map(r =>
        r.id === rfqId
          ? {
              ...r,
              status: 'accepted' as const,
              acceptedSupplierId: quote.fromId,
              finalAmount: quote.amount,
              updatedAt: new Date().toISOString(),
            }
          : r,
      ),
    }));

    const supplier = get().getSupplierById(quote.fromId);
    if (!supplier) return null;

    const newJob: Job = {
      id: 'JOB_' + Date.now(),
      rfqId: rfq.id,
      contractorId: rfq.contractorId,
      supplierId: quote.fromId,
      category: rfq.category,
      subcategory: rfq.subcategory,
      title: rfq.title,
      titleAr: rfq.titleAr,
      amount: quote.amount,
      currency: 'OMR',
      status: 'pending_start',
      startDate: rfq.startDate,
      progress: 0,
      milestones: [
        { name: 'Job confirmed', nameAr: 'تم تأكيد العمل', completed: true, date: new Date().toISOString() },
        { name: 'Work started', nameAr: 'بدأ العمل', completed: false },
        { name: 'In progress', nameAr: 'قيد التنفيذ', completed: false },
        { name: 'Completed', nameAr: 'مكتمل', completed: false },
      ],
      city: rfq.city,
      cityAr: rfq.cityAr,
    };

    set(state => ({ jobs: [...state.jobs, newJob] }));
    return newJob;
  },

  rejectQuote: (rfqId, quoteId) => {
    set(state => ({
      rfqs: state.rfqs.map(r =>
        r.id === rfqId
          ? {
              ...r,
              quotes: r.quotes.map(q =>
                q.id === quoteId ? { ...q, status: 'rejected' as const } : q,
              ),
            }
          : r,
      ),
    }));
  },

  updateJobProgress: (jobId, progress) => {
    set(state => ({
      jobs: state.jobs.map(j => (j.id === jobId ? { ...j, progress } : j)),
    }));
  },

  completeJobMilestone: (jobId, milestoneIndex) => {
    set(state => ({
      jobs: state.jobs.map(j => {
        if (j.id !== jobId) return j;
        const newMilestones = [...j.milestones];
        newMilestones[milestoneIndex] = {
          ...newMilestones[milestoneIndex],
          completed: true,
          date: new Date().toISOString(),
        };
        const completedCount = newMilestones.filter(m => m.completed).length;
        const progress = Math.round((completedCount / newMilestones.length) * 100);
        return {
          ...j,
          milestones: newMilestones,
          progress,
          status: progress === 100 ? ('completed' as const) : ('in_progress' as const),
        };
      }),
    }));
  },

  completeJob: (jobId) => {
    set(state => ({
      jobs: state.jobs.map(j =>
        j.id === jobId
          ? {
              ...j,
              status: 'completed' as const,
              progress: 100,
              completionDate: new Date().toISOString(),
              milestones: j.milestones.map(m => ({
                ...m,
                completed: true,
                date: m.date || new Date().toISOString(),
              })),
            }
          : j,
      ),
    }));
  },

  cancelJob: (jobId) => {
    set(state => ({
      jobs: state.jobs.map(j =>
        j.id === jobId ? { ...j, status: 'cancelled' as const } : j,
      ),
    }));
  },
}));
