import { create } from 'zustand';
import { type Service } from '@shared/schema';

interface BookingState {
  selectedService: Service | null;
  selectedDate: Date | undefined;
  selectedTime: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  isDrawerOpen: boolean;
  
  // Actions
  selectService: (service: Service) => void;
  setDate: (date: Date | undefined) => void;
  setTime: (time: string | null) => void;
  setCustomerDetails: (name: string, phone: string, email: string) => void;
  setDrawerOpen: (isOpen: boolean) => void;
  reset: () => void;
}

export const useBookingStore = create<BookingState>((set) => ({
  selectedService: null,
  selectedDate: undefined,
  selectedTime: null,
  customerName: "",
  customerPhone: "",
  customerEmail: "",
  isDrawerOpen: false,

  selectService: (service) => set({ selectedService: service, isDrawerOpen: true }),
  setDate: (date) => set({ selectedDate: date }),
  setTime: (time) => set({ selectedTime: time }),
  setCustomerDetails: (name, phone, email) => set({ customerName: name, customerPhone: phone, customerEmail: email }),
  setDrawerOpen: (isOpen) => set({ isDrawerOpen: isOpen }),
  reset: () => set({
    selectedService: null,
    selectedDate: undefined,
    selectedTime: null,
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    isDrawerOpen: false
  }),
}));
