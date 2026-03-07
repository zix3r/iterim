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

// API funkcijos (čia prielaida, kad turite bazinį fetcherį ar axios su pridėtu JWT tokenu)
const API_URL = 'http://localhost:5229/api'; // Pakeiskite pagal poreikį

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  const response = await fetch(`${API_URL}${url}`, { 
    ...options, 
    headers,
    credentials: 'include' // Send cookies with the request
  });
  if (!response.ok) throw new Error('API Error');
  return response.json();
}

export const getOrganizations = (): Promise<Organization[]> => 
  fetchWithAuth('/organizations');

export const getOrganizationById = (id: number): Promise<OrganizationDetail> => 
  fetchWithAuth(`/organizations/${id}`);

export const createOrganization = (name: string): Promise<Organization> => 
  fetchWithAuth('/organizations', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });

// Products API
export const getProductsByOrganization = (orgId: number): Promise<Product[]> => 
  fetchWithAuth(`/organizations/${orgId}/products`);

export const getProductById = (productId: number): Promise<ProductDetail> => 
  fetchWithAuth(`/products/${productId}`);

export const createProduct = (orgId: number, data: CreateProductRequest): Promise<Product> => 
  fetchWithAuth(`/organizations/${orgId}/products`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const updateProduct = (productId: number, data: UpdateProductRequest): Promise<Product> => 
  fetchWithAuth(`/products/${productId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

export const deleteProduct = (productId: number): Promise<void> => 
  fetchWithAuth(`/products/${productId}`, {
    method: 'DELETE',
  });