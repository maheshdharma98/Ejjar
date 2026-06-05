import {JobStatus, RFQStatus} from '../types';

export const maskPhone = (_phone: string): string => '●●●● ●●●●';

export const maskSupplierName = (id: string): string =>
  'Supplier #' + id.slice(-4).toUpperCase();

export const maskLocation = (city: string, km: number): string =>
  `Central ${city} (~${km} km)`;

export const isConfirmed = (status: RFQStatus | JobStatus): boolean =>
  status === 'confirmed' || status === 'completed';
