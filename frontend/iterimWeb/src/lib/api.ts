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
  description: string;
  timestamp: string;
  actorName: string;
  type: string;
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


