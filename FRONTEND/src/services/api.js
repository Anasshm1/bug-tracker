const API_BASE = 'http://localhost:8080/api';

/**
 * Helper pour les requêtes authentifiées.
 */
function authHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/**
 * POST /api/auth/login
 */
export async function loginUser(email, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || 'Email ou mot de passe incorrect');
  }

  return res.json();
}

/**
 * GET /api/tickets
 */
export async function fetchTickets() {
  const res = await fetch(`${API_BASE}/tickets`, {
    headers: authHeaders(),
  });

  if (!res.ok) {
    throw new Error('Erreur lors du chargement des tickets');
  }

  return res.json();
}

/**
 * GET /api/tickets/stats
 */
export async function fetchTicketStats() {
  const res = await fetch(`${API_BASE}/tickets/stats`, {
    headers: authHeaders(),
  });

  if (!res.ok) {
    throw new Error('Erreur lors du chargement des statistiques');
  }

  return res.json();
}

/**
 * GET /api/projects
 */
export async function fetchProjects() {
  const res = await fetch(`${API_BASE}/projects`, {
    headers: authHeaders(),
  });

  if (!res.ok) {
    throw new Error('Erreur lors du chargement des projets');
  }

  return res.json();
}

/**
 * GET /api/auth/users (We will assume this endpoint exists or will create it if needed, or simply let the user type the name? Actually the user said "assigné a (relation direct avec base de données)". I will add an endpoint in AuthController to get developers or just users).
 * Let's assume we fetch all users or developers. Wait, I should add an endpoint for developers. For now I'll create `fetchDevelopers`.
 */
export async function fetchDevelopers() {
  const res = await fetch(`${API_BASE}/auth/developers`, {
    headers: authHeaders(),
  });

  if (!res.ok) {
    throw new Error('Erreur lors du chargement des développeurs');
  }

  return res.json();
}

/**
 * POST /api/tickets
 */
export async function createTicket(ticketData, files) {
  const formData = new FormData();
  
  // Create a Blob from the JSON string for the "ticket" part
  const ticketBlob = new Blob([JSON.stringify(ticketData)], { type: 'application/json' });
  formData.append('ticket', ticketBlob);
  
  if (files && files.length > 0) {
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }
  }

  const token = localStorage.getItem('token');
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  // Let the browser set the Content-Type to multipart/form-data with boundary

  const res = await fetch(`${API_BASE}/tickets`, {
    method: 'POST',
    headers: headers,
    body: formData,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || 'Erreur lors de la création du ticket');
  }

  return res.json();
}
