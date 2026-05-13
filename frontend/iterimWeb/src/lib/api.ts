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
// Surask, kur aprašyti Absence tipai ir pridėk šį:
export interface AbsenceFilters {
  memberName?: string;
  from?: string;
  to?: string;
  type?: string;
}
export type AbsenceReason = 'Sick' | 'Vacation' | 'Late' | 'Absent' | 'Other';

export interface MemberAbsence {
  id: number;
  orgMemberId: number;
  memberName: string;
  fromDate: string;
  toDate: string;
  reason: string;
  reasonDetails?: string | null;
}

export interface CreateMemberAbsenceRequest {
  orgMemberId: number;
  fromDate: string;
  toDate: string;
  reason: AbsenceReason;
  otherReason?: string;
}

export interface UpdateMemberAbsenceRequest {
  orgMemberId: number;
  fromDate: string;
  toDate: string;
  reason: AbsenceReason;
  otherReason?: string;
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

// ── Tag Types ─────────────────────────────────────────────────

export interface Tag {
  id: number;
  organizationId: number;
  name: string;
  color: string;
  createdAt: string;
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
  tags: Tag[];
  weeklyHours: number;
  scheduleType: string;
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
  position: number;
  createdAt: string;
  updatedAt: string;
  createdBy: number;
  updatedBy: number;
  createdByName: string;
  updatedByName: string;
  assignedMember: TeamMember | null;
  tags: Tag[];
  blockerCount: number;
  blocksCount: number;
  commentCount: number;
  teamName?: string;
}

// ── Dependency Types ──────────────────────────────────────────

export interface WorkItemDependency {
  dependencyId: number;
  workItemId: number;
  title: string;
  status: string;
  type: string;
  description: string | null;
  points: number | null;
  teamId: number;
  teamName: string;
  productId: number;
  productName: string;
  orgId: number;
  assignedMember: TeamMember | null;
  tags: Tag[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkItemDependencies {
  blocks: WorkItemDependency[];
  blockedBy: WorkItemDependency[];
}

export class BlockedByDependenciesError extends Error {
  blockers: WorkItemDependency[];
  constructor(message: string, blockers: WorkItemDependency[]) {
    super(message);
    this.name = 'BlockedByDependenciesError';
    this.blockers = blockers;
  }
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
  type?: number;
  assignedTo?: number | null;
  iterationId?: number | null;
}

export interface TransferWorkItemRequest {
  targetTeamId: number;
}

export interface ImportWorkItemRequest {
  title: string;
  description?: string;
  type: number;       // 0=Story, 1=Task, 2=Bug
  priority: number;   // 0=Low, 1=Medium, 2=High, 3=Critical
  status: number;     // 0=Backlog, 1=Todo, 2=InProgress, 3=Review, 4=Done
  points?: number;
  assignedTo?: number | null;
  iterationId?: number | null;
}

export interface BulkImportWorkItemsRequest {
  items: ImportWorkItemRequest[];
}

export interface BulkImportResult {
  importedCount: number;
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

// ── Current User Profile Types ───────────────────────────────

export type UserTheme = 'light' | 'dark';

export interface CurrentUserProfile {
  name: string;
  email: string;
  avatarUrl: string | null;
  theme: UserTheme;
  createdAt: string;
}

export interface UpdateProfileRequest {
  name: string;
  email: string;
  theme?: UserTheme;
  /** UI language code ("lt" | "en") used for localizing email-change confirmation emails. */
  language?: string;
}

export interface UpdateThemeRequest {
  theme: UserTheme;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

export interface UpdateAvatarRequest {
  avatarUrl: string;
}

// ── Core fetch wrapper ────────────────────────────────────────────────────────
// Uses HttpOnly cookies (credentials: 'include') — no localStorage, no Bearer token.
// Automatically attempts one token refresh on 401 before giving up.

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5229/api';


let isRefreshing = false;
let refreshQueue: Array<(ok: boolean) => void> = [];

// Patogus žodynas, verčiantis HTTP kodus į žmogui suprantamą anglų kalbą
const HTTP_ERROR_MESSAGES: Record<number, string> = {
  400: "Bad request. Please check your input and try again.",
  403: "You do not have permission to perform this action.",
  404: "The requested resource was not found.",
  409: "Conflict detected. This action cannot be completed in the current state.",
  500: "An unexpected server error occurred. Please try again later.",
};

export async function fetchWithAuth(
  url: string,
  options: RequestInit = {},
  retry = true,
): Promise<Response> {
  try {
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
  } catch {
    // Čia sugauname NETWORK ERRORS (kai serveris nepasiekiamas arba nėra interneto)
    throw new Error("Failed to connect to the server. Please check your internet connection.");
  }
}

// Helper to extract error message from API response
async function getErrorMessage(response: Response): Promise<string> {
  const status = response.status;
  let backendMessage = "";

  try {
    const text = await response.text();
    const json = JSON.parse(text);

    // Supports both { errors: ["..."] } and ModelState { errors: { field: ["..."] } }
    if (Array.isArray(json.errors) && json.errors.length > 0) {
      return String(json.errors[0]);
    }

    if (json.errors && typeof json.errors === 'object') {
      const firstErrorKey = Object.keys(json.errors)[0];
      const firstError = json.errors[firstErrorKey];
      if (Array.isArray(firstError) && firstError.length > 0) {
        return String(firstError[0]);
      }
      if (typeof firstError === 'string' && firstError.length > 0) {
        return firstError;
      }
    }

    backendMessage = json.message || json.title || text;
  } catch {
    // Ignoruojame, jei ne JSON
  }

  // Jei gavome 500 klaidą, slepiame techninį tekstą nuo vartotojo
  if (status === 500) {
    return HTTP_ERROR_MESSAGES[500];
  }

  // Grąžiname backend'o žinutę arba mūsų paruoštą universalų tekstą
  return backendMessage || HTTP_ERROR_MESSAGES[status] || "An unexpected error occurred.";
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
    const result = await r.json();
    teamDataEventTarget.dispatchEvent(new Event('tree-data-changed'));
    return result;
  });

export const deleteOrganization = (orgId: number): Promise<void> =>
  fetchWithAuth(`/organizations/${orgId}`, {
    method: 'DELETE',
  }).then(async (r) => {
    if (!r.ok) throw new Error(await getErrorMessage(r));
    teamDataEventTarget.dispatchEvent(new Event('tree-data-changed'));
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
    teamDataEventTarget.dispatchEvent(new Event('tree-data-changed'));
  });

export const removeOrganizationMember = (orgId: number, memberId: number): Promise<void> =>
  fetchWithAuth(`/organizations/${orgId}/members/${memberId}`, {
    method: 'DELETE',
  }).then(async (r) => {
    if (!r.ok) throw new Error(await getErrorMessage(r));
  });

export const updateOrganizationMemberRole = (
  orgId: number,
  memberId: number,
  role: string
): Promise<OrganizationMember> =>
  fetchWithAuth(`/organizations/${orgId}/members/${memberId}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  }).then(async (r) => {
    if (!r.ok) throw new Error(await getErrorMessage(r));
    return r.json();
  });

export const getOrganizationAbsences = (
  orgId: number,
  filters: AbsenceFilters = {} // Naudojame naują filtrų objektą
): Promise<MemberAbsence[]> => {
  const params = new URLSearchParams();
  if (filters.memberName) params.set('memberName', filters.memberName);
  if (filters.from) params.set('from', filters.from);
  if (filters.to) params.set('to', filters.to);
  if (filters.type && filters.type !== 'all') params.set('type', filters.type);

  const qs = params.toString();
  return fetchWithAuth(`/organizations/${orgId}/absences${qs ? `?${qs}` : ''}`).then(async (r) => {
    if (!r.ok) throw new Error(await getErrorMessage(r));
    return r.json();
  });
};

export const createOrganizationAbsence = (
  orgId: number,
  data: CreateMemberAbsenceRequest
): Promise<MemberAbsence> =>
  fetchWithAuth(`/organizations/${orgId}/absences`, {
    method: 'POST',
    body: JSON.stringify(data),
  }).then(async (r) => {
    if (!r.ok) throw new Error(await getErrorMessage(r));
    return r.json();
  });

export const updateAbsence = (
  absenceId: number,
  data: UpdateMemberAbsenceRequest
): Promise<MemberAbsence> =>
  fetchWithAuth(`/absences/${absenceId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }).then(async (r) => {
    if (!r.ok) throw new Error(await getErrorMessage(r));
    return r.json();
  });

export const deleteAbsence = (absenceId: number): Promise<void> =>
  fetchWithAuth(`/absences/${absenceId}`, {
    method: 'DELETE',
  }).then(async (r) => {
    if (!r.ok) throw new Error(await getErrorMessage(r));
  });

export const acceptInvitation = (orgId: number): Promise<OrganizationMember> =>
  fetchWithAuth(`/organizations/${orgId}/accept`, {
    method: 'POST',
  }).then(async (r) => {
    if (!r.ok) throw new Error(await getErrorMessage(r));
    const result = await r.json();
    teamDataEventTarget.dispatchEvent(new Event('tree-data-changed'));
    return result;
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
    const result = await r.json();
    teamDataEventTarget.dispatchEvent(new Event('tree-data-changed'));
    return result;
  });

export const updateProduct = (productId: number, data: UpdateProductRequest): Promise<Product> =>
  fetchWithAuth(`/products/${productId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }).then(async (r) => {
    if (!r.ok) throw new Error(await getErrorMessage(r));
    const result = await r.json();
    teamDataEventTarget.dispatchEvent(new Event('tree-data-changed'));
    return result;
  });

export const deleteProduct = (productId: number): Promise<void> =>
  fetchWithAuth(`/products/${productId}`, {
    method: 'DELETE',
  }).then(async (r) => {
    if (!r.ok) throw new Error(await getErrorMessage(r));
    teamDataEventTarget.dispatchEvent(new Event('tree-data-changed'));
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
    const result = await r.json();
    teamDataEventTarget.dispatchEvent(new Event('tree-data-changed'));
    return result;
  });

export const updateTeam = (teamId: number, data: UpdateTeamRequest): Promise<Team> =>
  fetchWithAuth(`/teams/${teamId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }).then(async (r) => {
    if (!r.ok) throw new Error(await getErrorMessage(r));
    const result = await r.json();
    teamDataEventTarget.dispatchEvent(new Event('tree-data-changed'));
    return result;
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
    teamDataEventTarget.dispatchEvent(new Event('tree-data-changed'));
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
  byStatus: Record<string, number>;
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

export const teamDataEventTarget = new EventTarget();

export const createWorkItem = (teamId: number, data: CreateWorkItemRequest): Promise<WorkItem> =>
  fetchWithAuth(`/teams/${teamId}/workitems`, {
    method: 'POST',
    body: JSON.stringify(data),
  }).then(async (r) => {
    if (!r.ok) throw new Error(await getErrorMessage(r));
    const result = await r.json();
    teamDataEventTarget.dispatchEvent(new Event('team-data-changed'));
    return result;
  });

export const updateWorkItem = (id: number, data: UpdateWorkItemRequest): Promise<WorkItem> =>
  fetchWithAuth(`/workitems/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }).then(async (r) => {
    if (!r.ok) {
      if (r.status === 400) {
        let json: Record<string, unknown> | null = null;
        try { json = await r.json(); } catch { /* ignore parse error */ }
        if (json && Array.isArray(json.blockers) && (json.blockers as unknown[]).length > 0) {
          throw new BlockedByDependenciesError(
            (json.message as string) ?? 'Blocked by unfinished dependencies',
            json.blockers as WorkItemDependency[]
          );
        }
        throw new Error((json?.message as string) || 'Bad request');
      }
      throw new Error(await getErrorMessage(r));
    }
    const result = await r.json();
    teamDataEventTarget.dispatchEvent(new Event('team-data-changed'));
    return result;
  });

export const transferWorkItem = (id: number, data: TransferWorkItemRequest): Promise<WorkItem> =>
  fetchWithAuth(`/workitems/${id}/transfer`, {
    method: 'PATCH',
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
    teamDataEventTarget.dispatchEvent(new Event('team-data-changed'));
  });

export const reorderWorkItems = (teamId: number, items: { id: number; position: number }[]): Promise<void> =>
  fetchWithAuth(`/teams/${teamId}/workitems/reorder`, {
    method: 'PATCH',
    body: JSON.stringify({ items }),
  }).then(async (r) => {
    if (!r.ok) throw new Error('Failed to reorder');
    teamDataEventTarget.dispatchEvent(new Event('team-data-changed'));
  });

export const bulkImportWorkItems = (teamId: number, data: BulkImportWorkItemsRequest): Promise<BulkImportResult> =>
  fetchWithAuth(`/teams/${teamId}/workitems/bulk`, {
    method: 'POST',
    body: JSON.stringify(data),
  }).then(async (r) => {
    if (!r.ok) throw new Error(await getErrorMessage(r));
    return r.json();
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
    const result = await r.json();
    teamDataEventTarget.dispatchEvent(new Event('team-data-changed'));
    return result;
  });

export const updateIteration = (id: number, data: UpdateIterationRequest): Promise<Iteration> =>
  fetchWithAuth(`/iterations/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }).then(async (r) => {
    if (!r.ok) throw new Error(await getErrorMessage(r));
    const result = await r.json();
    teamDataEventTarget.dispatchEvent(new Event('team-data-changed'));
    return result;
  });

export const startIteration = (id: number): Promise<Iteration> =>
  fetchWithAuth(`/iterations/${id}/start`, {
    method: 'PATCH',
  }).then(async (r) => {
    if (!r.ok) throw new Error(await getErrorMessage(r));
    const result = await r.json();
    teamDataEventTarget.dispatchEvent(new Event('team-data-changed'));
    return result;
  });

export const completeIteration = (id: number, data?: CompleteIterationRequest): Promise<Iteration> =>
  fetchWithAuth(`/iterations/${id}/complete`, {
    method: 'PATCH',
    body: JSON.stringify(data ?? {}),
  }).then(async (r) => {
    if (!r.ok) throw new Error(await getErrorMessage(r));
    const result = await r.json();
    teamDataEventTarget.dispatchEvent(new Event('team-data-changed'));
    return result;
  });

export const deleteIteration = (id: number): Promise<void> =>
  fetchWithAuth(`/iterations/${id}`, {
    method: 'DELETE',
  }).then(async (r) => {
    if (!r.ok) throw new Error(await getErrorMessage(r));
    teamDataEventTarget.dispatchEvent(new Event('team-data-changed'));
  });

// ── Board (Kanban) Types ───────────────────────────────────────────

export interface BoardAssignedMember {
  id: number;
  fullName: string;
  avatarUrl?: string | null;
}

export interface BoardBlocker {
  dependencyId: number;
  workItemId: number;
  title: string;
  status: string;
  teamId: number;
  teamName: string;
  productId: number;
  productName: string;
  orgId: number;
}

export interface BoardWorkItem {
  id: number;
  title: string;
  type: string;
  points: number | null;
  assignedMember: BoardAssignedMember | null;
  tags: Tag[];
  blockers: BoardBlocker[];
  commentCount: number;
}

export interface BoardColumn {
  status: string;
  totalPoints: number;
  workItems: BoardWorkItem[];
}

export interface BoardData {
  iteration: Iteration;
  columns: BoardColumn[];
}

// ── Board API ─────────────────────────────────────────────

export const getActiveBoard = (teamId: number): Promise<BoardData | null> =>
  fetchWithAuth(`/teams/${teamId}/boards/active`).then(async (r) => {
    if (r.status === 404) return null; // Jei nėra aktyvaus sprinto, grąžiname null
    if (!r.ok) throw new Error(await getErrorMessage(r));
    return r.json();
  });


// ── Metrics Types ─────────────────────────────────────────────

export interface SprintVelocityItem {
  iterationId: number;
  name: string | null;
  startDate: string;
  endDate: string;
  plannedPoints: number;
  completedPoints: number;
  /** "Active" or "Completed" — used to visually distinguish in-progress sprints. */
  status: string;
}

export interface VelocityData {
  sprints: SprintVelocityItem[];
  averageVelocity: number;
}

export interface BurndownPoint {
  date: string;
  remainingPoints: number;
  idealPoints: number;
}

export interface SprintMetrics {
  iterationId: number;
  name: string | null;
  startDate: string;
  endDate: string;
  status: string;
  totalPoints: number;
  completedPoints: number;
  remainingPoints: number;
  percentComplete: number;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
  burndown: BurndownPoint[];
}

export interface MemberCapacityItem {
  memberId: number;
  userId: number;
  name: string;
  email: string;
  avatarUrl?: string | null;
  workDays: number;
  absenceDays: number;
  availableDays: number;
  totalWorkHours: number; // PRIDĖTA
  availableHours: number; // PRIDĖTA
}

export interface CapacityData {
  fromDate: string;
  toDate: string;
  totalWorkDays: number;
  absenceDays: number;
  availableDays: number;
  availableHours: number;
  totalWorkHours: number; // PRIDĖTA
  byMember: MemberCapacityItem[];
}

// ── Metrics API ───────────────────────────────────────────────

export const getVelocity = (teamId: number, sprints = 5, beforeIterationId?: number | null): Promise<VelocityData> => {
  const params = new URLSearchParams({ sprints: String(sprints) });
  if (beforeIterationId != null) params.set('beforeIterationId', String(beforeIterationId));
  return fetchWithAuth(`/teams/${teamId}/metrics/velocity?${params}`).then(async (r) => {
    if (!r.ok) throw new Error(await getErrorMessage(r));
    return r.json();
  });
};

export const getSprintMetrics = (iterationId: number): Promise<SprintMetrics> =>
  fetchWithAuth(`/iterations/${iterationId}/metrics`).then(async (r) => {
    if (!r.ok) throw new Error(await getErrorMessage(r));
    return r.json();
  });

export const getCapacity = (
  teamId: number,
  fromDate: string,
  toDate: string,
): Promise<CapacityData> =>
  fetchWithAuth(
    `/teams/${teamId}/metrics/capacity?from=${encodeURIComponent(fromDate)}&to=${encodeURIComponent(toDate)}`,
  ).then(async (r) => {
    if (!r.ok) throw new Error(await getErrorMessage(r));
    return r.json();
  });

// ── Pinned Teams API ──────────────────────────────────────────

export interface PinnedTeam {
  teamId: number;
  teamName: string;
  orgId: number;
  productId: number;
  path: string;
}

export const getPinnedTeams = (): Promise<PinnedTeam[]> =>
  fetchWithAuth('/users/me/pinned-teams').then(async (r) => {
    if (!r.ok) throw new Error(await getErrorMessage(r));
    return r.json();
  });

export const pinTeam = (teamId: number): Promise<void> =>
  fetchWithAuth(`/users/me/pinned-teams/${teamId}`, { method: 'POST' }).then(async (r) => {
    if (!r.ok) throw new Error(await getErrorMessage(r));
  });

export const unpinTeam = (teamId: number): Promise<void> =>
  fetchWithAuth(`/users/me/pinned-teams/${teamId}`, { method: 'DELETE' }).then(async (r) => {
    if (!r.ok) throw new Error(await getErrorMessage(r));
  });

// ── Current User Profile API ─────────────────────────────────

export const getMyProfile = (): Promise<CurrentUserProfile> =>
  fetchWithAuth('/users/me').then(async (r) => {
    if (!r.ok) throw new Error(await getErrorMessage(r));
    return r.json();
  });

export const updateMyProfile = (data: UpdateProfileRequest): Promise<CurrentUserProfile> =>
  fetchWithAuth('/users/me', {
    method: 'PUT',
    body: JSON.stringify(data),
  }).then(async (r) => {
    if (!r.ok) throw new Error(await getErrorMessage(r));
    return r.json();
  });

export const changeMyPassword = (data: ChangePasswordRequest): Promise<void> =>
  fetchWithAuth('/users/me/password', {
    method: 'PUT',
    body: JSON.stringify(data),
  }).then(async (r) => {
    if (!r.ok) throw new Error(await getErrorMessage(r));
  });

export const updateMyAvatar = (data: UpdateAvatarRequest): Promise<CurrentUserProfile> =>
  fetchWithAuth('/users/me/avatar', {
    method: 'PUT',
    body: JSON.stringify(data),
  }).then(async (r) => {
    if (!r.ok) throw new Error(await getErrorMessage(r));
    return r.json();
  });

export const updateMyTheme = (data: UpdateThemeRequest): Promise<CurrentUserProfile> =>
  fetchWithAuth('/users/me/theme', {
    method: 'PUT',
    body: JSON.stringify(data),
  }).then(async (r) => {
    if (!r.ok) throw new Error(await getErrorMessage(r));
    return r.json();
  });

// ── Admin API ────────────────────────────────────────────────

export interface AdminUserListItem {
  id: number;
  email: string;
  name: string;
  role: string;
  isBlocked: boolean;
  isEmailConfirmed: boolean;
  createdAt: string;
  updatedAt: string;
  organizationCount: number;
}

export interface AdminUserListResponse {
  users: AdminUserListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface AdminUserOrg {
  organizationId: number;
  organizationName: string;
  role: string;
  status: string;
  joinedAt: string | null;
  teams: AdminUserTeam[];
}

export interface AdminUserTeam {
  teamId: number;
  teamName: string;
  role: string;
  assignedWorkItems: number;
}

export interface AdminUserDetail {
  id: number;
  email: string;
  name: string;
  avatarUrl: string | null;
  role: string;
  isBlocked: boolean;
  isEmailConfirmed: boolean;
  createdAt: string;
  updatedAt: string;
  organizations: AdminUserOrg[];
}

export const adminGetUsers = (params?: {
  search?: string;
  status?: string;
  organizationId?: number;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: string;
}): Promise<AdminUserListResponse> => {
  const qs = new URLSearchParams();
  if (params?.search) qs.set('search', params.search);
  if (params?.status) qs.set('status', params.status);
  if (params?.organizationId) qs.set('organizationId', params.organizationId.toString());
  if (params?.page) qs.set('page', params.page.toString());
  if (params?.pageSize) qs.set('pageSize', params.pageSize.toString());
  if (params?.sortBy) qs.set('sortBy', params.sortBy);
  if (params?.sortOrder) qs.set('sortOrder', params.sortOrder);
  const query = qs.toString();
  return fetchWithAuth(`/admin/users${query ? `?${query}` : ''}`).then(async (r) => {
    if (!r.ok) throw new Error(await getErrorMessage(r));
    return r.json();
  });
};

export const adminGetUser = (userId: number): Promise<AdminUserDetail> =>
  fetchWithAuth(`/admin/users/${userId}`).then(async (r) => {
    if (!r.ok) throw new Error(await getErrorMessage(r));
    return r.json();
  });

export const adminBlockUser = (userId: number): Promise<void> =>
  fetchWithAuth(`/admin/users/${userId}/block`, { method: 'PATCH' }).then(async (r) => {
    if (!r.ok) throw new Error(await getErrorMessage(r));
  });

export const adminUnblockUser = (userId: number): Promise<void> =>
  fetchWithAuth(`/admin/users/${userId}/unblock`, { method: 'PATCH' }).then(async (r) => {
    if (!r.ok) throw new Error(await getErrorMessage(r));
  });

export const adminDeleteUser = (userId: number): Promise<void> =>
  fetchWithAuth(`/admin/users/${userId}`, { method: 'DELETE' }).then(async (r) => {
    if (!r.ok) throw new Error(await getErrorMessage(r));
  });

export const adminResetPassword = (userId: number): Promise<void> =>
  fetchWithAuth(`/admin/users/${userId}/reset-password`, { method: 'POST' }).then(async (r) => {
    if (!r.ok) throw new Error(await getErrorMessage(r));
  });

export interface AdminOrgOption {
  id: number;
  name: string;
}

export const adminGetOrganizations = (): Promise<AdminOrgOption[]> =>
  fetchWithAuth('/admin/organizations').then(async (r) => {
    if (!r.ok) throw new Error(await getErrorMessage(r));
    return r.json();
  });

// ── Admin System API ─────────────────────────────────

export interface AdminStats {
  users: { total: number; newThisWeek: number; newThisMonth: number; blocked: number; unconfirmed: number };
  organizations: { total: number };
  products: { total: number };
  teams: { total: number };
  workItems: { total: number; byStatus: { status: string; count: number }[] };
  iterations: { total: number; active: number; completed: number };
}

export interface HealthCheck {
  name: string;
  status: string;
  duration: string;
  description: string | null;
  data: Record<string, unknown>;
}

export interface HealthReport {
  status: string;
  totalDuration: string;
  timestamp: string;
  checks: HealthCheck[];
}

export const adminGetStats = (): Promise<AdminStats> =>
  fetchWithAuth('/admin/stats').then(async (r) => {
    if (!r.ok) throw new Error(await getErrorMessage(r));
    return r.json();
  });

export const getHealthDetail = (): Promise<HealthReport> => {
  const baseUrl = API_URL.replace(/\/api\/?$/, '');
  return fetch(`${baseUrl}/health/detail`, { credentials: 'include' }).then(async (r) => {
    if (!r.ok) throw new Error('Failed to fetch health data');
    return r.json();
  });
};

// ── Tags API ──────────────────────────────────────────────────

export const getOrgTags = (orgId: number): Promise<Tag[]> =>
  fetchWithAuth(`/organizations/${orgId}/tags`).then(async (r) => {
    if (!r.ok) throw new Error(await getErrorMessage(r));
    return r.json();
  });

export const createOrgTag = (orgId: number, data: { name: string; color: string }): Promise<Tag> =>
  fetchWithAuth(`/organizations/${orgId}/tags`, {
    method: 'POST',
    body: JSON.stringify(data),
  }).then(async (r) => {
    if (!r.ok) throw new Error(await getErrorMessage(r));
    return r.json();
  });

export const deleteOrgTag = (orgId: number, tagId: number): Promise<void> =>
  fetchWithAuth(`/organizations/${orgId}/tags/${tagId}`, {
    method: 'DELETE',
  }).then(async (r) => {
    if (!r.ok) throw new Error(await getErrorMessage(r));
  });

export const assignWorkItemTags = (workItemId: number, tagIds: number[]): Promise<Tag[]> =>
  fetchWithAuth(`/workitems/${workItemId}/tags`, {
    method: 'PUT',
    body: JSON.stringify({ tagIds }),
  }).then(async (r) => {
    if (!r.ok) throw new Error(await getErrorMessage(r));
    return r.json();
  });

export const assignTeamMemberTags = (teamId: number, memberId: number, tagIds: number[]): Promise<Tag[]> =>
  fetchWithAuth(`/teams/${teamId}/members/${memberId}/tags`, {
    method: 'PUT',
    body: JSON.stringify({ tagIds }),
  }).then(async (r) => {
    if (!r.ok) throw new Error(await getErrorMessage(r));
    return r.json();
  });

// ── WorkItem Dependencies API ─────────────────────────────────

export const getWorkItemDependencies = (workItemId: number): Promise<WorkItemDependencies> =>
  fetchWithAuth(`/workitems/${workItemId}/dependencies`).then(async (r) => {
    if (!r.ok) throw new Error(await getErrorMessage(r));
    return r.json();
  });

export const addWorkItemDependency = (workItemId: number, blockedByWorkItemId: number): Promise<WorkItemDependency> =>
  fetchWithAuth(`/workitems/${workItemId}/dependencies`, {
    method: 'POST',
    body: JSON.stringify({ blockedByWorkItemId }),
  }).then(async (r) => {
    if (!r.ok) throw new Error(await getErrorMessage(r));
    return r.json();
  });

export const removeWorkItemDependency = (workItemId: number, dependencyId: number): Promise<void> =>
  fetchWithAuth(`/workitems/${workItemId}/dependencies/${dependencyId}`, {
    method: 'DELETE',
  }).then(async (r) => {
    if (!r.ok) throw new Error(await getErrorMessage(r));
  });

export const searchWorkItems = (q: string): Promise<WorkItem[]> =>
  fetchWithAuth(`/workitems/search?q=${encodeURIComponent(q)}`).then(async (r) => {
    if (!r.ok) throw new Error(await getErrorMessage(r));
    return r.json();
  });
  // ── Admin API ──────────────────────────────────────────

export interface AdminOrganizationListDto {
  id: number;
  name: string;
  slug: string;
  memberCount: number;
  productCount: number;
  teamCount: number;
  createdAt: string;
  lastActivityAt: string | null;
}

export interface AdminOrgMemberDto {
  id: number;
  userId: number;
  email: string;
  role: string;
  status: string;
}

export interface AdminOrgTeamDto {
  id: number;
  name: string;
}

export interface AdminOrgProductDto {
  id: number;
  name: string;
  teamCount: number;
  teams: AdminOrgTeamDto[];
}

export interface AdminOrganizationDetailDto {
  id: number;
  name: string;
  slug: string;
  createdAt: string;
  members: AdminOrgMemberDto[];
  products: AdminOrgProductDto[];
}

export const getAdminOrganizations = (): Promise<AdminOrganizationListDto[]> =>
  fetchWithAuth('/admin/organizations/manage').then(async r => { // PRIDĖTA /manage
    if (!r.ok) throw new Error(await getErrorMessage(r));
    return r.json();
  });

export const getAdminOrganizationDetails = (orgId: number): Promise<AdminOrganizationDetailDto> =>
  fetchWithAuth(`/admin/organizations/manage/${orgId}/details`).then(async r => { // PRIDĖTA /manage
    if (!r.ok) throw new Error(await getErrorMessage(r));
    return r.json();
  });

export const deleteAdminOrganization = (orgId: number): Promise<void> =>
  fetchWithAuth(`/admin/organizations/manage/${orgId}`, { method: 'DELETE' }).then(async r => { // PRIDĖTA /manage
    if (!r.ok) throw new Error(await getErrorMessage(r));
  });
  export interface UpdateTeamMemberScheduleDto {
  scheduleType: 'FullTime' | 'PartTime' | 'Custom';
  weeklyHours: number;
}
export const updateTeamMemberSchedule = (teamId: number, memberId: number, data: UpdateTeamMemberScheduleDto): Promise<void> =>
  fetchWithAuth(`/teams/${teamId}/members/${memberId}/schedule`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }).then(async r => {
    if (!r.ok) throw new Error(await getErrorMessage(r));
  });

// ── ATPA (Automatinis Task'ų Priskyrimo Algoritmas) Types ─────
//
// Tipai 1:1 atitinka backend DTO (iterimApi/DTOs/Atpa/*.cs). Endpoint:
// GET /api/atpa/suggestions?iterationId=X (kontroleris taip pat priima
// POST /api/teams/:teamId/iterations/:iterationId/suggest-assignments).

/** Backend grąžina "warning" arba "info". */
export type AtpaWarningSeverity = 'warning' | 'info';

/** Žinomi įspėjimų kodai iš `AtpaService.cs`. */
export type AtpaWarningCode =
  | 'NO_TEAM_MEMBERS'
  | 'NO_TAG_MATCH'
  | 'SP_EXCEEDS_CAPACITY'
  | 'ALL_MEMBERS_OVERLOADED'
  | 'MEMBER_OVERLOADED'
  | (string & {}); // future-proof — leidžia naujus kodus be type'o lūžio

export interface AtpaWarning {
  severity: AtpaWarningSeverity;
  /** Stable code — naudojamas kaip i18n raktas. */
  code: AtpaWarningCode;
  /** Tekstinis fallback (anglų k.) — naudojamas, jei FE neturi vertimo. */
  message: string;
  /** Interpolation parametrai šablonams (pvz. `{ title: "X", sp: "5" }`). */
  messageParams?: Record<string, string>;
  /** Susietas work item.id arba member.id, priklausomai nuo kodo. */
  relatedEntityId: number | null;
}

export interface AtpaCapacityMember {
  memberId: number;
  memberName: string;
  avatarUrl: string | null;
  /** "FullTime" | "PartTime" | "Custom". */
  scheduleType: 'FullTime' | 'PartTime' | 'Custom' | string;
  weeklyHours: number;
  baseCapacityHours: number;
  absenceHours: number;
  alreadyAssignedHours: number;
  /** Likusi laisva capacity dabar (live algoritmui dirbant — atimama). */
  availableCapacityHours: number;
  velocityAvgPoints: number;
  /** Eksplicitiškai priskirtos žymės (Team settings). */
  tags: string[];
  /**
   * Iš nario darbų istorijos numanomos žymės — tos, kurias jis ne kartą
   * užbaigė per paskutinius sprintus, bet jam dar nepriskirtos eksplicitiškai.
   * Disjoint su `tags`. UI renderina kitokiu stiliumi.
   */
  inferredTags: string[];
}

export interface AtpaSuggestion {
  workItemId: number;
  workItemTitle: string;
  /** "Story" | "Task" | "Bug". */
  workItemType: string;
  workItemPoints: number;
  workItemTags: string[];

  suggestedMemberId: number;
  memberName: string;
  memberAvatarUrl: string | null;
  /** Eksplicitiškos nario žymės. */
  memberTags: string[];
  /** Numanomos žymės iš istorijos — disjoint su `memberTags`. */
  memberInferredTags: string[];
  /** Eksplicitiškai sutampančios žymės — pilna spalva paryškinamos UI. */
  matchingTags: string[];
  /**
   * Sutampa per istoriją (inferred). Disjoint su `matchingTags`. UI
   * paprastai renderina švelniau (dashed border / mažesnis kontrastas).
   */
  matchingInferredTags: string[];

  /** 0–100 confidence (procentai). */
  confidence: number;
  /** Tekstinis fallback (anglų k.) — naudojamas, jei FE neturi vertimo. */
  reason: string;
  /**
   * Reason kaip stable code'ų masyvas (pvz. `["REASON_TAG_FULL_MATCH",
   * "REASON_CAPACITY_HIGH"]`). Frontend juos verčia per i18n ir sujungia.
   */
  reasonCodes?: string[];
  /** Optional interpolation parametrai reason kodams. */
  reasonParams?: Record<string, string>;
}

export interface AtpaUnassignedItem {
  workItemId: number;
  workItemTitle: string;
  workItemPoints: number;
  workItemTags: string[];
  /** Tekstinis fallback (anglų k.) — naudojamas, jei FE neturi vertimo. */
  reason: string;
  /** Stable code — i18n raktas (pvz. `UNASSIGNED_OVERSIZED`). */
  reasonCode?: string;
  reasonParams?: Record<string, string>;
}

export interface AtpaSuggestionsResponse {
  iterationId: number;
  teamId: number;
  suggestions: AtpaSuggestion[];
  warnings: AtpaWarning[];
  unassigned: AtpaUnassignedItem[];
  memberCapacities: AtpaCapacityMember[];
}

// ── ATPA API ──────────────────────────────────────────────────

export const getAtpaSuggestions = (iterationId: number): Promise<AtpaSuggestionsResponse> =>
  fetchWithAuth(`/atpa/suggestions?iterationId=${iterationId}`).then(async (r) => {
    if (!r.ok) throw new Error(await getErrorMessage(r));
    return r.json();
  });

/** Priskiria narį work item'ui (PATCH `/workitems/:id` su {assignedTo}). */
export const patchWorkItemAssignee = (
  workItemId: number,
  assignedTo: number | null,
): Promise<WorkItem> =>
  fetchWithAuth(`/workitems/${workItemId}`, {
    method: 'PATCH',
    body: JSON.stringify({ assignedTo }),
  }).then(async (r) => {
    if (!r.ok) throw new Error(await getErrorMessage(r));
    const result = await r.json();
    teamDataEventTarget.dispatchEvent(new Event('team-data-changed'));
    return result;
  });

export interface ApplyAtpaResult {
  applied: { workItemId: number }[];
  failed: { workItemId: number; error: string }[];
}

/**
 * Iš eilės pritaiko siūlymus, batch'ina PATCH'us.
 * Grąžina, kurie pavyko ir kurie nepavyko — UI tada gali rodyti toast su failed sąrašu.
 */
export const applyAtpaSuggestions = async (
  picks: { workItemId: number; assignedTo: number }[],
): Promise<ApplyAtpaResult> => {
  const settled = await Promise.allSettled(
    picks.map((p) => patchWorkItemAssignee(p.workItemId, p.assignedTo)),
  );
  const applied: ApplyAtpaResult['applied'] = [];
  const failed: ApplyAtpaResult['failed'] = [];
  settled.forEach((res, i) => {
    const wid = picks[i].workItemId;
    if (res.status === 'fulfilled') applied.push({ workItemId: wid });
    else failed.push({ workItemId: wid, error: (res.reason as Error)?.message ?? 'Unknown error' });
  });
  return { applied, failed };
};

// ── Notifications ────────────────────────────────────────────

export type NotificationTypeName =
  | 'WorkItemAssigned'
  | 'BlockerResolved'
  | 'AddedToTeam'
  | 'AddedToOrganization'
  | 'PasswordReset';

export interface NotificationItem {
  id: number;
  type: NotificationTypeName;
  /** Translation key — looked up via translations.ts. */
  titleKey: string;
  /** Translation key for the message body. */
  messageKey: string;
  /** Placeholder values for the title/message templates. */
  messageParams?: Record<string, string> | null;
  /** Pre-rendered English fallback title. */
  title: string;
  /** Pre-rendered English fallback message body. */
  message: string;
  isRead: boolean;
  relatedUrl?: string | null;
  createdAt: string;
}

export interface NotificationListResponse {
  items: NotificationItem[];
  totalCount: number;
  unreadCount: number;
  page: number;
  pageSize: number;
}

export interface UnreadCountResponse {
  count: number;
}

export const getNotifications = (page = 1, pageSize = 20): Promise<NotificationListResponse> =>
  fetchWithAuth(`/notifications?page=${page}&pageSize=${pageSize}`).then(async (r) => {
    if (!r.ok) throw new Error(await getErrorMessage(r));
    return r.json();
  });

export const getNotificationUnreadCount = (): Promise<UnreadCountResponse> =>
  fetchWithAuth('/notifications/unread-count').then(async (r) => {
    if (!r.ok) throw new Error(await getErrorMessage(r));
    return r.json();
  });

export const markNotificationAsRead = (id: number): Promise<void> =>
  fetchWithAuth(`/notifications/${id}/read`, { method: 'PATCH' }).then(async (r) => {
    if (!r.ok) throw new Error(await getErrorMessage(r));
  });

export const markAllNotificationsAsRead = (): Promise<void> =>
  fetchWithAuth('/notifications/read-all', { method: 'POST' }).then(async (r) => {
    if (!r.ok) throw new Error(await getErrorMessage(r));
  });

// ── Notification preferences ─────────────────────────────────

export interface NotificationPreferences {
  notificationsEnabled: boolean;
  notifyOnWorkItemAssigned: boolean;
  notifyOnBlockerResolved: boolean;
  notifyOnAddedToTeam: boolean;
  notifyOnAddedToOrganization: boolean;
}

export const getNotificationPreferences = (): Promise<NotificationPreferences> =>
  fetchWithAuth('/users/me/notification-preferences').then(async (r) => {
    if (!r.ok) throw new Error(await getErrorMessage(r));
    return r.json();
  });

export const updateNotificationPreferences = (
  prefs: NotificationPreferences,
): Promise<void> =>
  fetchWithAuth('/users/me/notification-preferences', {
    method: 'PUT',
    body: JSON.stringify(prefs),
  }).then(async (r) => {
    if (!r.ok) throw new Error(await getErrorMessage(r));
  });
  // ── Quarter Planning Types ──────────────────────────────────────────

export interface IterationSummaryDto {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  status: string; // "Planning", "Active", "Completed"
  totalSP: number;
  doneSP: number;
  inProgressSP: number;
  todoSP: number;
}

export interface FeatureSpanDto {
  workItemId: number;
  workItemTitle: string;
  type: string;
  startIterationId: number;
  endIterationId: number;
  totalSP: number;
  completionPercent: number;
}

export interface IterationCapacityDto {
  iterationId: number;
  totalWorkDays: number;
  totalAbsenceDays: number;
  netCapacityDays: number;
}

export interface QuarterPlan {
  iterations: IterationSummaryDto[];
  featureSummaries: FeatureSpanDto[];
  capacityPerIteration: IterationCapacityDto[];
}

// Naujas API endpointas
export const getQuarterPlan = (
  teamId: number,
  start: string,
  end: string
): Promise<QuarterPlan> =>
  fetchWithAuth(`/teams/${teamId}/quarter-plan?start=${start}&end=${end}`).then(async (r) => {
    if (!r.ok) throw new Error(await getErrorMessage(r));
    return r.json();
  });

// ── Comment Types ─────────────────────────────────────────────

export interface WorkItemComment {
  id: number;
  workItemId: number;
  authorId: number;
  authorUserId: number;
  authorName: string;
  authorAvatarUrl: string | null;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommentRequest {
  content: string;
}

export interface UpdateCommentRequest {
  content: string;
}

// ── Comment API ───────────────────────────────────────────────

export const getWorkItemComments = (workItemId: number): Promise<WorkItemComment[]> =>
  fetchWithAuth(`/workitems/${workItemId}/comments`).then(async (r) => {
    if (!r.ok) throw new Error(await getErrorMessage(r));
    return r.json();
  });

export const createWorkItemComment = (workItemId: number, data: CreateCommentRequest): Promise<WorkItemComment> =>
  fetchWithAuth(`/workitems/${workItemId}/comments`, {
    method: 'POST',
    body: JSON.stringify(data),
  }).then(async (r) => {
    if (!r.ok) throw new Error(await getErrorMessage(r));
    return r.json();
  });

export const updateWorkItemComment = (workItemId: number, commentId: number, data: UpdateCommentRequest): Promise<WorkItemComment> =>
  fetchWithAuth(`/workitems/${workItemId}/comments/${commentId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }).then(async (r) => {
    if (!r.ok) throw new Error(await getErrorMessage(r));
    return r.json();
  });

export const deleteWorkItemComment = (workItemId: number, commentId: number): Promise<void> =>
  fetchWithAuth(`/workitems/${workItemId}/comments/${commentId}`, {
    method: 'DELETE',
  }).then(async (r) => {
    if (!r.ok) throw new Error(await getErrorMessage(r));
  });

// ── Retrospective Types ───────────────────────────────────────

/** Matches backend `RetroColumn` enum (string-serialized). */
export type RetroColumnName = 'WentWell' | 'DidntGoWell' | 'ActionItem';

export interface RetroItem {
  id: number;
  iterationId: number;
  userId: number;
  authorName: string;
  authorAvatarUrl: string | null;
  column: RetroColumnName;
  content: string;
  voteCount: number;
  /** True if the requesting user has voted for this card. */
  hasVoted: boolean;
  /** True if the requesting user authored this card (controls Edit/Delete UI). */
  isOwn: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RetroBoard {
  iterationId: number;
  teamId: number;
  iterationName: string | null;
  iterationStatus: string;       // "Planning" | "Active" | "Completed"
  /** True when the iteration is Completed — FE must hide controls. */
  isReadOnly: boolean;
  items: RetroItem[];
}

export interface CreateRetroItemRequest {
  column: RetroColumnName;
  content: string;
}

export interface UpdateRetroItemRequest {
  content: string;
}

// ── Retrospective API ─────────────────────────────────────────

export const getRetroBoard = (teamId: number, iterationId: number): Promise<RetroBoard> =>
  fetchWithAuth(`/teams/${teamId}/iterations/${iterationId}/retro`).then(async (r) => {
    if (!r.ok) throw new Error(await getErrorMessage(r));
    return r.json();
  });

export const createRetroItem = (
  teamId: number,
  iterationId: number,
  data: CreateRetroItemRequest,
): Promise<RetroItem> =>
  fetchWithAuth(`/teams/${teamId}/iterations/${iterationId}/retro`, {
    method: 'POST',
    body: JSON.stringify(data),
  }).then(async (r) => {
    if (!r.ok) throw new Error(await getErrorMessage(r));
    return r.json();
  });

export const updateRetroItem = (
  teamId: number,
  iterationId: number,
  itemId: number,
  data: UpdateRetroItemRequest,
): Promise<RetroItem> =>
  fetchWithAuth(`/teams/${teamId}/iterations/${iterationId}/retro/${itemId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }).then(async (r) => {
    if (!r.ok) throw new Error(await getErrorMessage(r));
    return r.json();
  });

export const deleteRetroItem = (
  teamId: number,
  iterationId: number,
  itemId: number,
): Promise<void> =>
  fetchWithAuth(`/teams/${teamId}/iterations/${iterationId}/retro/${itemId}`, {
    method: 'DELETE',
  }).then(async (r) => {
    if (!r.ok) throw new Error(await getErrorMessage(r));
  });

/** Toggles the caller's vote — returns the updated card (one vote/user/card). */
export const toggleRetroVote = (
  teamId: number,
  iterationId: number,
  itemId: number,
): Promise<RetroItem> =>
  fetchWithAuth(`/teams/${teamId}/iterations/${iterationId}/retro/${itemId}/vote`, {
    method: 'POST',
  }).then(async (r) => {
    if (!r.ok) throw new Error(await getErrorMessage(r));
    return r.json();
  });