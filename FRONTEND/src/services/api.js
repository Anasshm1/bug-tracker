export const API_BASE = 'http://localhost:8080/api';

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
 * GET /api/auth/reporters
 */
export async function fetchReporters() {
  const res = await fetch(`${API_BASE}/auth/reporters`, {
    headers: authHeaders(),
  });

  if (!res.ok) {
    throw new Error('Erreur lors du chargement des reporters');
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

/**
 * GET /api/tickets/search — Recherche de tickets avec filtres
 */
export async function searchTickets({ title, projectId, assignedToId, reporterId, dateDebut, dateFin }) {
  const params = new URLSearchParams();
  if (title) params.append('title', title);
  if (projectId) params.append('projectId', projectId);
  if (assignedToId) params.append('assignedToId', assignedToId);
  if (reporterId) params.append('reporterId', reporterId);
  if (dateDebut) params.append('dateDebut', dateDebut);
  if (dateFin) params.append('dateFin', dateFin);

  const queryString = params.toString();
  const url = queryString
    ? `${API_BASE}/tickets/search?${queryString}`
    : `${API_BASE}/tickets/search`;

  const res = await fetch(url, {
    headers: authHeaders(),
  });

  if (!res.ok) {
    throw new Error('Erreur lors de la recherche des tickets');
  }

  return res.json();
}

/**
 * GET /api/tickets/:id — Récupérer un ticket par ID
 */
export async function fetchTicketById(id) {
  const res = await fetch(`${API_BASE}/tickets/${id}`, {
    headers: authHeaders(),
  });

  if (!res.ok) {
    throw new Error('Erreur lors du chargement du ticket');
  }

  return res.json();
}

/**
 * GET /api/tickets/:id/comments — Récupérer les commentaires d'un ticket
 */
export async function fetchComments(ticketId) {
  const res = await fetch(`${API_BASE}/tickets/${ticketId}/comments`, {
    headers: authHeaders(),
  });

  if (!res.ok) {
    throw new Error('Erreur lors du chargement des commentaires');
  }

  return res.json();
}

/**
 * POST /api/tickets/:id/comments — Ajouter un commentaire
 */
export async function addComment(ticketId, content, files) {
  const formData = new FormData();
  formData.append('content', content);

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

  const res = await fetch(`${API_BASE}/tickets/${ticketId}/comments`, {
    method: 'POST',
    headers: headers,
    body: formData,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || 'Erreur lors de l\'ajout du commentaire');
  }

  return res.json();
}

/**
 * PATCH /api/tickets/:id/status — Mettre à jour le statut d'un ticket
 */
export async function updateTicketStatus(ticketId, status) {
  const res = await fetch(`${API_BASE}/tickets/${ticketId}/status`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({ status }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || 'Erreur lors de la mise à jour du statut');
  }

  return res.json();
}

/**
 * GET /api/stats/reporter/me
 */
export async function fetchReporterStats() {
  const res = await fetch(`${API_BASE}/stats/reporter/me`, {
    headers: authHeaders(),
  });
  if (!res.ok) {
    throw new Error('Erreur lors de la récupération des statistiques reporter');
  }
  return res.json();
}

/**
 * GET /api/stats/dev/me
 */
export async function fetchDevStats() {
  const res = await fetch(`${API_BASE}/stats/dev/me`, {
    headers: authHeaders(),
  });
  if (!res.ok) {
    throw new Error('Erreur lors de la récupération des statistiques développeur');
  }
  return res.json();
}

/**
 * GET /api/monitoring/my
 * Monitoring des tickets soumis par le reporter connecté.
 * La vue PostgreSQL calcule days_in_status et alert en temps réel (NOW()).
 */
export async function fetchMyMonitoring() {
  const res = await fetch(`${API_BASE}/monitoring/my`, {
    headers: authHeaders(),
  });
  if (!res.ok) {
    throw new Error('Erreur lors de la récupération du monitoring');
  }
  return res.json();
}
