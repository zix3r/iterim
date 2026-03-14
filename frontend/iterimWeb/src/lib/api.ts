// Tipai, atitinkantys C# DTOs
export interface Organization {
  id: number;
  name: string;
  slug: string;
}

export interface OrganizationMember {
  id: number; // Organization Member ID (orgMemberId)
  userId: number;
  email: string;
  role: string;
  status: string;
}

export interface OrganizationDetail extends Organization {
  members: OrganizationMember[];
  userRole: string;
  currentUserId: number;
}

export interface Product {
  id: number;
  name: string;
  description?: string;
  organizationId: number;
  createdAt: string;
  updatedAt: string;
  createdBy: number;
  updatedBy: number;
  createdByName: string;
  updatedByName: string;
}

export interface ProductDetail extends Product {
  organizationName: string;
  teamCount: number;
  userRole: string;
}

export interface CreateProductRequest {
  name: string;
  description?: string;
}

export interface UpdateProductRequest {
  name: string;
  description?: string;
}

// Teams
export interface TeamMember {
  id: number;
  teamId: number;
  orgMemberId: number;
  userId: number;
  userName: string;
  userEmail: string;
  role: string;
  createdAt: string;
}

export interface Team {
  id: number;
  productId: number;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: number;
  updatedBy: number;
  createdByName: string;
  updatedByName: string;
  memberCount: number;
}

export interface TeamDetail extends Omit<Team, 'memberCount'> {
  productName: string;
  productCreatedBy: number;
  currentUserId: number;
  members: TeamMember[];
}

export interface CreateTeamRequest {
  name: string;
  description?: string;
}

export interface AddTeamMemberRequest {
  orgMemberId: number;
  role?: number; // TeamMemberRole enum: 0=Admin, 1=Member
}

export interface UpdateTeamRequest {
  name: string;
  description?: string;
}

export interface UpdateTeamMemberRoleRequest {
  role: number; // TeamMemberRole enum: 0=Admin, 1=Member
}

// ── WorkItem Types ────────────────────────────────────────────

export interface WorkItem {
  id: number;
  teamId: number;
  iterationId: number | null;
  assignedTo: number | null;
  title: string;
  description: string | null;
  points: number | null;
  type: string;       // "Story" | "Task" | "Bug"
  priority: string;   // "Low" | "Medium" | "High" | "Critical"
  status: string;     // "Backlog" | "Todo" | "InProgress" | "Review" | "Done"
  createdAt: string;
  updatedAt: string;
  createdBy: number;
  updatedBy: number;
  createdByName: string;
  updatedByName: string;
  assignedMember: TeamMember | null;
}

export interface CreateWorkItemRequest {
  title: string;
  description?: string;
  type: number;       // 0=Story, 1=Task, 2=Bug
  priority?: number;  // 0=Low, 1=Medium, 2=High, 3=Critical
  points?: number;
  assignedTo?: number; // TeamMember.Id
}

export interface UpdateWorkItemRequest {
  title: string;
  description?: string;
  priority: number;
  points?: number;
  status: number;
  assignedTo?: number | null;
  iterationId?: number | null;
}

export interface WorkItemFilter {
  type?: string;
  status?: string;
  assignedTo?: number;
  iterationId?: number;
}

// ── Iteration Types ───────────────────────────────────────────

export interface Iteration {
  id: number;
  teamId: number;
  name: string | null;
  startDate: string;
  endDate: string;
  goal: string | null;
  status: string;     // "Planning" | "Active" | "Completed"
  createdAt: string;
  updatedAt: string;
  createdBy: number;
  updatedBy: number;
  createdByName: string;
  updatedByName: string;
  workItemCount: number;
  totalPoints: number;
}

export interface CreateIterationRequest {
  name?: string;
  startDate?: string;
  endDate?: string;
  goal?: string;
}

export interface UpdateIterationRequest {
  name?: string;
  startDate: string;
  endDate: string;
  goal?: string;
}

export interface CompleteIterationRequest {
  moveUnfinishedToIterationId?: number | null;
}

export interface BacklogGroup {
  iterationId: number | null;
  iterationName: string | null;
  iterationStatus: string | null;
  workItems: WorkItem[];
}

// ── Core fetch wrapper ────────────────────────────────────────────────────────
// Uses HttpOnly cookies (credentials: 'include') — no localStorage, no Bearer token.
// Automatically attempts one token refresh on 401 before giving up.

const API_URL = 'http://localhost:5229/api';

let isRefreshing = false;
let refreshQueue: Array<(ok: boolean) => void> = [];

export async function fetchWithAuth(
  url: string,
  options: RequestInit = {},
  retry = true,
): Promise<Response> {
  const res = await fetch(`${API_URL}${url}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (res.status === 401 && retry) {
    if (!isRefreshing) {
      isRefreshing = true;
      try {
        const r = await fetch(`${API_URL}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
        });
        const ok = r.ok;
        refreshQueue.forEach((cb) => cb(ok));
        refreshQueue = [];
        isRefreshing = false;
        if (!ok) return res;
      } catch {
        refreshQueue.forEach((cb) => cb(false));
        refreshQueue = [];
        isRefreshing = false;
        return res;
      }
    } else {
      await new Promise<boolean>((resolve) => refreshQueue.push(resolve));
    }
    return fetchWithAuth(url, options, false);
  }

  return res;
}
// Helper to extract error message from API response
async function getErrorMessage(response: Response): Promise<string> {
  const text = await response.text();
  try {
    const json = JSON.parse(text);
    return json.message || text;
  } catch {
    return text;
  }
}
// ── API helpers ───────────────────────────────────────────────────────────────

export const getOrganizations = (): Promise<Organization[]> =>
  fetchWithAuth('/organizations').then(async (r) => {
    if (!r.ok) throw new Error(await getErrorMessage(r));
    return r.json();
  });

export const getOrganizationById = (id: number): Promise<OrganizationDetail> =>
  fetchWithAuth(`/organizations/${id}`).then(async (r) => {
    if (!r.ok) throw new Error(await getErrorMessage(r));
    return r.json();
  });

export const createOrganization = (name: string): Promise<Organization> =>
  fetchWithAuth('/organizations', {
    method: 'POST',
    body: JSON.stringify({ name }),
  }).then(async (r) => {
    if (!r.ok) throw new Error(await getErrorMessage(r));
    return r.json();
  });

export const addOrganizationMember = (
  orgId: number,
  email: string,
  role: string = 'Member'
): Promise<OrganizationMember> =>
  fetchWithAuth(`/organizations/${orgId}/members`, {
    method: 'POST',
    body: JSON.stringify({ email, role }),
  }).then(async (r) => {
    if (!r.ok) throw new Error(await getErrorMessage(r));
    return r.json();
  });

export interface Invitation {
  organizationId: number;
  organizationName: string;
  organizationSlug: string;
  role: string;
  invitedAt: string;
}

export const getPendingInvitations = (): Promise<Invitation[]> =>
  fetchWithAuth('/organizations/invitations').then(async (r) => {
    if (!r.ok) throw new Error(await getErrorMessage(r));
    return r.json();
  });

export const declineInvitation = (orgId: number): Promise<void> =>
  fetchWithAuth(`/organizations/${orgId}/decline`, {
    method: 'POST',
  }).then(async (r) => {
    if (!r.ok) throw new Error(await getErrorMessage(r));
  });

export const removeOrganizationMember = (orgId: number, memberId: number): Promise<void> =>
  fetchWithAuth(`/organizations/${orgId}/members/${memberId}`, {
    method: 'DELETE',
  }).then(async (r) => {
    if (!r.ok) throw new Error(await getErrorMessage(r));
  });

export const acceptInvitation = (orgId: number): Promise<OrganizationMember> =>
  fetchWithAuth(`/organizations/${orgId}/accept`, {
    method: 'POST',
  }).then(async (r) => {
    if (!r.ok) throw new Error(await getErrorMessage(r));
    return r.json();
  });

// Products API
export const getProductsByOrganization = (orgId: number): Promise<Product[]> => 
  fetchWithAuth(`/organizations/${orgId}/products`).then(async (r) => {
    if (!r.ok) throw new Error(await getErrorMessage(r));
    return r.json();
  });

export const getProductById = (productId: number): Promise<ProductDetail> => 
  fetchWithAuth(`/products/${productId}`).then(async (r) => {
    if (!r.ok) throw new Error(await getErrorMessage(r));
    return r.json();
  });

export const createProduct = (orgId: number, data: CreateProductRequest): Promise<Product> => 
  fetchWithAuth(`/organizations/${orgId}/products`, {
    method: 'POST',
    body: JSON.stringify(data),
  }).then(async (r) => {
    if (!r.ok) throw new Error(await getErrorMessage(r));
    return r.json();
  });

export const updateProduct = (productId: number, data: UpdateProductRequest): Promise<Product> => 
  fetchWithAuth(`/products/${productId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }).then(async (r) => {
    if (!r.ok) throw new Error(await getErrorMessage(r));
    return r.json();
  });

export const deleteProduct = (productId: number): Promise<void> => 
  fetchWithAuth(`/products/${productId}`, {
    method: 'DELETE',
  }).then(async (r) => {
    if (!r.ok) throw new Error(await getErrorMessage(r));
    return r.json();
  });

// Teams API
export const getTeamsByProduct = (productId: number): Promise<Team[]> => 
  fetchWithAuth(`/products/${productId}/teams`).then(async (r) => {
    if (!r.ok) throw new Error(await getErrorMessage(r));
    return r.json();
  });

export const getTeamById = (teamId: number): Promise<TeamDetail> => 
  fetchWithAuth(`/teams/${teamId}`).then(async (r) => {
    if (!r.ok) throw new Error(await getErrorMessage(r));
    return r.json();
  });

export const createTeam = (productId: number, data: CreateTeamRequest): Promise<Team> => 
  fetchWithAuth(`/products/${productId}/teams`, {
    method: 'POST',
    body: JSON.stringify(data),
  }).then(async (r) => {
    if (!r.ok) throw new Error(await getErrorMessage(r));
    return r.json();
  });

export const updateTeam = (teamId: number, data: UpdateTeamRequest): Promise<Team> => 
  fetchWithAuth(`/teams/${teamId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }).then(async (r) => {
    if (!r.ok) throw new Error(await getErrorMessage(r));
    return r.json();
  });

export const addTeamMember = (teamId: number, data: AddTeamMemberRequest): Promise<TeamMember> => 
  fetchWithAuth(`/teams/${teamId}/members`, {
    method: 'POST',
    body: JSON.stringify(data),
  }).then(async (r) => {
    if (!r.ok) throw new Error(await getErrorMessage(r));
    return r.json();
  });

export const updateTeamMemberRole = (teamId: number, userId: number, data: UpdateTeamMemberRoleRequest): Promise<TeamMember> => 
  fetchWithAuth(`/teams/${teamId}/members/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }).then(async (r) => {
    if (!r.ok) throw new Error(await getErrorMessage(r));
    return r.json();
  });

export const removeTeamMember = (teamId: number, userId: number): Promise<void> => 
  fetchWithAuth(`/teams/${teamId}/members/${userId}`, {
    method: 'DELETE',
  }).then(async (r) => {
    if (!r.ok) throw new Error(await getErrorMessage(r));
    return r.json();
  });

export const deleteTeam = (teamId: number): Promise<void> => 
  fetchWithAuth(`/teams/${teamId}`, {
    method: 'DELETE',
  }).then(async (r) => {
    if (!r.ok) throw new Error(await getErrorMessage(r));
    return r.json();
  });

// Dashboard API
// Dashboard Types
export interface DashboardSprint {
  id: number;
  name: string;
  endDate: string;
  daysLeft: number;
  progress: number;
  totalPoints: number;
  completedPoints: number;
}

export interface DashboardTeam {
  id: number;
  name: string;
  activeSprint?: DashboardSprint;
}

export interface DashboardProduct {
  id: number;
  name: string;
  teams: DashboardTeam[];
}

export interface DashboardOrganization {
  id: number;
  name: string;
  slug: string;
  memberCount: number;
  products: DashboardProduct[];
}

export interface DashboardWorkItem {
  id: number;
  title: string;
  type: number;
  typeName: string;
  status: number;
  statusName: string;
  priority: number;
  priorityName: string;
  points: number | null;
  organizationId: number;
  organizationName: string;
  productId: number;
  productName: string;
  teamId: number;
  teamName: string;
}

export interface DashboardActivity {
  id: number;
  workItemTitle: string;
  workItemType: string;
  workItemId: number;
  description: string;
  timestamp: string;
  actorName: string;
  type: string;
  organizationId: number;
  productId: number;
  teamId: number;
}

export interface DashboardData {
  organizations: DashboardOrganization[];
  myWork: DashboardWorkItem[];
  recentActivity: DashboardActivity[];
}

export const getDashboard = (): Promise<DashboardData> => 
  fetchWithAuth('/dashboard').then(async (r) => {
    if (!r.ok) throw new Error(await getErrorMessage(r));
    return r.json();
  });

// ── WorkItem API ──────────────────────────────────────────────

export const getWorkItemsByTeam = (teamId: number, filters?: WorkItemFilter): Promise<WorkItem[]> => {
  const params = new URLSearchParams();
  if (filters?.type) params.set('type', filters.type);
  if (filters?.status) params.set('status', filters.status);
  if (filters?.assignedTo) params.set('assignedTo', filters.assignedTo.toString());
  if (filters?.iterationId !== undefined) params.set('iterationId', filters.iterationId.toString());
  const qs = params.toString();
  return fetchWithAuth(`/teams/${teamId}/workitems${qs ? `?${qs}` : ''}`).then(async (r) => {
    if (!r.ok) throw new Error(await getErrorMessage(r));
    return r.json();
  });
};

export const getWorkItemsGrouped = (teamId: number): Promise<BacklogGroup[]> =>
  fetchWithAuth(`/teams/${teamId}/workitems/grouped`).then(async (r) => {
    if (!r.ok) throw new Error(await getErrorMessage(r));
    return r.json();
  });

export const getWorkItemById = (id: number): Promise<WorkItem> =>
  fetchWithAuth(`/workitems/${id}`).then(async (r) => {
    if (!r.ok) throw new Error(await getErrorMessage(r));
    return r.json();
  });

export const createWorkItem = (teamId: number, data: CreateWorkItemRequest): Promise<WorkItem> =>
  fetchWithAuth(`/teams/${teamId}/workitems`, {
    method: 'POST',
    body: JSON.stringify(data),
  }).then(async (r) => {
    if (!r.ok) throw new Error(await getErrorMessage(r));
    return r.json();
  });

export const updateWorkItem = (id: number, data: UpdateWorkItemRequest): Promise<WorkItem> =>
  fetchWithAuth(`/workitems/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }).then(async (r) => {
    if (!r.ok) throw new Error(await getErrorMessage(r));
    return r.json();
  });

export const deleteWorkItem = (id: number): Promise<void> =>
  fetchWithAuth(`/workitems/${id}`, {
    method: 'DELETE',
  }).then(async (r) => {
    if (!r.ok) throw new Error(await getErrorMessage(r));
  });

// ── Iteration API ─────────────────────────────────────────────

export const getIterationsByTeam = (teamId: number): Promise<Iteration[]> =>
  fetchWithAuth(`/teams/${teamId}/iterations`).then(async (r) => {
    if (!r.ok) throw new Error(await getErrorMessage(r));
    return r.json();
  });

export const getIterationById = (id: number): Promise<Iteration> =>
  fetchWithAuth(`/iterations/${id}`).then(async (r) => {
    if (!r.ok) throw new Error(await getErrorMessage(r));
    return r.json();
  });

export const createIteration = (teamId: number, data: CreateIterationRequest): Promise<Iteration> =>
  fetchWithAuth(`/teams/${teamId}/iterations`, {
    method: 'POST',
    body: JSON.stringify(data),
  }).then(async (r) => {
    if (!r.ok) throw new Error(await getErrorMessage(r));
    return r.json();
  });

export const updateIteration = (id: number, data: UpdateIterationRequest): Promise<Iteration> =>
  fetchWithAuth(`/iterations/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }).then(async (r) => {
    if (!r.ok) throw new Error(await getErrorMessage(r));
    return r.json();
  });

export const startIteration = (id: number): Promise<Iteration> =>
  fetchWithAuth(`/iterations/${id}/start`, {
    method: 'PATCH',
  }).then(async (r) => {
    if (!r.ok) throw new Error(await getErrorMessage(r));
    return r.json();
  });

export const completeIteration = (id: number, data?: CompleteIterationRequest): Promise<Iteration> =>
  fetchWithAuth(`/iterations/${id}/complete`, {
    method: 'PATCH',
    body: JSON.stringify(data ?? {}),
  }).then(async (r) => {
    if (!r.ok) throw new Error(await getErrorMessage(r));
    return r.json();
  });

export const deleteIteration = (id: number): Promise<void> =>
  fetchWithAuth(`/iterations/${id}`, {
    method: 'DELETE',
  }).then(async (r) => {
    if (!r.ok) throw new Error(await getErrorMessage(r));
  });

