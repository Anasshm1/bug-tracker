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
 * POST /api/tickets
 */
export async function createTicket(title, description) {
  const res = await fetch(`${API_BASE}/tickets`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ title, description }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || 'Erreur lors de la création du ticket');
  }

  return res.json();
}
