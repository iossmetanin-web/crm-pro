import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// Types
export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  position: string | null;
  address: string | null;
  notes: string | null;
  source: string | null;
  status: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  owner?: User;
}

export interface Deal {
  id: string;
  title: string;
  description: string | null;
  value: number;
  stage: string;
  probability: number;
  expectedClose: string | null;
  clientId: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  client?: Client;
  owner?: User;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  dueDate: string | null;
  completedAt: string | null;
  clientId: string | null;
  dealId: string | null;
  ownerId: string;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
  client?: Client;
  deal?: Deal;
  owner?: User;
  subtasks?: Task[];
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "MANAGER";
  avatar: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TaskLog {
  id: string;
  taskId: string;
  userId: string;
  action: string;
  details: string | null;
  createdAt: string;
  user?: User;
}

// App State
interface AppState {
  // UI State
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  
  // Current selection
  selectedClientId: string | null;
  selectedDealId: string | null;
  selectedTaskId: string | null;
  setSelectedClient: (id: string | null) => void;
  setSelectedDeal: (id: string | null) => void;
  setSelectedTask: (id: string | null) => void;
  
  // Filters
  taskFilter: {
    status: string | null;
    priority: string | null;
    assignee: string | null;
  };
  dealFilter: {
    stage: string | null;
    minValue: number | null;
    maxValue: number | null;
  };
  setTaskFilter: (filter: Partial<AppState["taskFilter"]>) => void;
  setDealFilter: (filter: Partial<AppState["dealFilter"]>) => void;
  
  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // UI State
      sidebarOpen: true,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      
      // Selections
      selectedClientId: null,
      selectedDealId: null,
      selectedTaskId: null,
      setSelectedClient: (id) => set({ selectedClientId: id }),
      setSelectedDeal: (id) => set({ selectedDealId: id }),
      setSelectedTask: (id) => set({ selectedTaskId: id }),
      
      // Filters
      taskFilter: {
        status: null,
        priority: null,
        assignee: null,
      },
      dealFilter: {
        stage: null,
        minValue: null,
        maxValue: null,
      },
      setTaskFilter: (filter) =>
        set((state) => ({
          taskFilter: { ...state.taskFilter, ...filter },
        })),
      setDealFilter: (filter) =>
        set((state) => ({
          dealFilter: { ...state.dealFilter, ...filter },
        })),
      
      // Search
      searchQuery: "",
      setSearchQuery: (query) => set({ searchQuery: query }),
    }),
    {
      name: "crm-app-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        sidebarOpen: state.sidebarOpen,
        taskFilter: state.taskFilter,
        dealFilter: state.dealFilter,
      }),
    }
  )
);
