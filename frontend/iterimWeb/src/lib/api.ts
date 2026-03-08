// Tipai, atitinkantys C# DTOs
export interface Organization {
  id: number;
  name: string;
  slug: string;
}

export interface OrganizationMember {
  userId: number;
  email: string;
  role: string;
  status: string;
}

export interface OrganizationDetail extends Organization {
  members: OrganizationMember[];
  userRole: string;
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

// ── API helpers ───────────────────────────────────────────────────────────────

export const getOrganizations = (): Promise<Organization[]> =>
  fetchWithAuth('/organizations').then((r) => r.json());

export const getOrganizationById = (id: number): Promise<OrganizationDetail> =>
  fetchWithAuth(`/organizations/${id}`).then((r) => r.json());

export const createOrganization = (name: string): Promise<Organization> =>
  fetchWithAuth('/organizations', {
    method: 'POST',
    body: JSON.stringify({ name }),
  }).then((r) => r.json());

// Products API
export const getProductsByOrganization = (orgId: number): Promise<Product[]> => 
  fetchWithAuth(`/organizations/${orgId}/products`).then((r) => r.json());

export const getProductById = (productId: number): Promise<ProductDetail> => 
  fetchWithAuth(`/products/${productId}`).then((r) => r.json());

export const createProduct = (orgId: number, data: CreateProductRequest): Promise<Product> => 
  fetchWithAuth(`/organizations/${orgId}/products`, {
    method: 'POST',
    body: JSON.stringify(data),
  }).then((r) => r.json());

export const updateProduct = (productId: number, data: UpdateProductRequest): Promise<Product> => 
  fetchWithAuth(`/products/${productId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }).then((r) => r.json());

export const deleteProduct = (productId: number): Promise<void> => 
  fetchWithAuth(`/products/${productId}`, {
    method: 'DELETE',
  }).then((r) => r.json());
