// Mock data for demo mode (Vercel without database)
import { Task, Client, Deal, User } from "@/stores/crm-store";

export const mockUsers: User[] = [
  {
    id: "user-admin",
    email: "admin@crm.com",
    name: "Admin User",
    role: "ADMIN",
    avatar: null,
    isActive: true,
    lastLoginAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "user-manager-1",
    email: "manager1@crm.com",
    name: "Sarah Johnson",
    role: "MANAGER",
    avatar: null,
    isActive: true,
    lastLoginAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "user-manager-2",
    email: "manager2@crm.com",
    name: "Mike Wilson",
    role: "MANAGER",
    avatar: null,
    isActive: true,
    lastLoginAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const mockClients: Client[] = [
  {
    id: "client-1",
    name: "John Smith",
    email: "john@techcorp.com",
    phone: "+1 555-0101",
    company: "TechCorp Inc.",
    position: "CTO",
    address: "123 Tech Street, San Francisco, CA",
    notes: "Met at Tech Conference 2024",
    source: "Conference",
    status: "active",
    ownerId: "user-admin",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "client-2",
    name: "Emily Johnson",
    email: "emily@startup.io",
    phone: "+1 555-0102",
    company: "StartupIO",
    position: "CEO",
    address: "456 Innovation Ave, Austin, TX",
    notes: "Referred by existing client",
    source: "Referral",
    status: "active",
    ownerId: "user-manager-1",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "client-3",
    name: "Michael Brown",
    email: "michael@enterprise.com",
    phone: "+1 555-0103",
    company: "Enterprise Solutions",
    position: "VP of Sales",
    address: "789 Business Blvd, New York, NY",
    notes: "Cold outreach via LinkedIn",
    source: "LinkedIn",
    status: "active",
    ownerId: "user-manager-2",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "client-4",
    name: "Lisa Wang",
    email: "lisa@digital.co",
    phone: "+1 555-0104",
    company: "Digital Co",
    position: "Product Manager",
    address: "321 Digital Drive, Seattle, WA",
    notes: "Website inquiry",
    source: "Website",
    status: "active",
    ownerId: "user-admin",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const mockDeals: Deal[] = [
  {
    id: "deal-1",
    title: "Enterprise License Deal",
    description: "Annual enterprise license for 500 users",
    value: 150000,
    stage: "PROPOSAL",
    probability: 60,
    expectedClose: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    clientId: "client-1",
    ownerId: "user-admin",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "deal-2",
    title: "Startup Package",
    description: "Growth plan for early-stage startup",
    value: 25000,
    stage: "NEGOTIATION",
    probability: 80,
    expectedClose: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    clientId: "client-2",
    ownerId: "user-manager-1",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "deal-3",
    title: "Consulting Services",
    description: "6-month consulting engagement",
    value: 75000,
    stage: "PROSPECT",
    probability: 30,
    expectedClose: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    clientId: "client-3",
    ownerId: "user-manager-2",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "deal-4",
    title: "Training Program",
    description: "Team training for new platform",
    value: 15000,
    stage: "CLOSED_WON",
    probability: 100,
    expectedClose: null,
    clientId: "client-4",
    ownerId: "user-admin",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const today = new Date();
today.setHours(0, 0, 0, 0);

const yesterday = new Date(today);
yesterday.setDate(yesterday.getDate() - 1);

const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);

const nextWeek = new Date(today);
nextWeek.setDate(nextWeek.getDate() + 7);

export const mockTasks: Task[] = [
  {
    id: "task-1",
    title: "Follow up with TechCorp",
    description: "Send proposal revision and schedule demo",
    status: "IN_PROGRESS",
    priority: "HIGH",
    dueDate: today.toISOString(),
    completedAt: null,
    clientId: "client-1",
    dealId: "deal-1",
    ownerId: "user-admin",
    parentId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "task-2",
    title: "Contract review with Legal",
    description: "Review contract terms before sending to client",
    status: "TODO",
    priority: "URGENT",
    dueDate: yesterday.toISOString(),
    completedAt: null,
    clientId: "client-2",
    dealId: "deal-2",
    ownerId: "user-manager-1",
    parentId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "task-3",
    title: "Prepare demo presentation",
    description: "Create customized demo for Enterprise Solutions",
    status: "IN_REVIEW",
    priority: "MEDIUM",
    dueDate: tomorrow.toISOString(),
    completedAt: null,
    clientId: "client-3",
    dealId: null,
    ownerId: "user-manager-2",
    parentId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "task-4",
    title: "Update CRM documentation",
    description: "Add new features to user guide",
    status: "TODO",
    priority: "LOW",
    dueDate: nextWeek.toISOString(),
    completedAt: null,
    clientId: null,
    dealId: null,
    ownerId: "user-admin",
    parentId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "task-5",
    title: "Client onboarding call",
    description: "Initial onboarding call with Digital Co",
    status: "DONE",
    priority: "HIGH",
    dueDate: yesterday.toISOString(),
    completedAt: yesterday.toISOString(),
    clientId: "client-4",
    dealId: null,
    ownerId: "user-manager-1",
    parentId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Helper to add owner/client relations
export function enrichTasks(tasks: Task[], clients: Client[], users: User[]): Task[] {
  return tasks.map(task => ({
    ...task,
    owner: users.find(u => u.id === task.ownerId),
    client: clients.find(c => c.id === task.clientId),
  }));
}

export function enrichDeals(deals: Deal[], clients: Client[], users: User[]): Deal[] {
  return deals.map(deal => ({
    ...deal,
    owner: users.find(u => u.id === deal.ownerId),
    client: clients.find(c => c.id === deal.clientId),
  }));
}

export function enrichClients(clients: Client[], users: User[]): Client[] {
  return clients.map(client => ({
    ...client,
    owner: users.find(u => u.id === client.ownerId),
  }));
}
