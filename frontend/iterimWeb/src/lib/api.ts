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
}

// API funkcijos (čia prielaida, kad turite bazinį fetcherį ar axios su pridėtu JWT tokenu)
const API_URL = 'http://localhost:5229/api'; // Pakeiskite pagal poreikį

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem('token'); // Jūsų JWT saugojimo vieta
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };
  const response = await fetch(`${API_URL}${url}`, { ...options, headers });
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