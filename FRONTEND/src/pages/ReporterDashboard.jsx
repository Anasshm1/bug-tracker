import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import StatsCard from '../components/StatsCard';
import { fetchTickets, fetchTicketStats, createTicket } from '../services/api';
import {
  Layers,
  AlertCircle,
  Clock,
  CheckCircle2,
  Inbox,
  PlusCircle,
  Send,
} from 'lucide-react';

const TABS = [
  { key: 'consultation', label: 'Consultation' },
  { key: 'statistiques', label: 'Statistiques' },
  { key: 'creer-ticket', label: 'Créer Ticket' },
];

export default function ReporterDashboard() {
  const [activeTab, setActiveTab] = useState('consultation');
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [ticketData, statsData] = await Promise.all([
        fetchTickets(),
        fetchTicketStats(),
      ]);
      setTickets(ticketData);
      setStats(statsData);
    } catch (err) {
      console.error('Erreur chargement données:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateTicket(e) {
    e.preventDefault();
    setSubmitError('');
    setSubmitSuccess('');
    setSubmitting(true);

    try {
      await createTicket(title, description);
      setSubmitSuccess('Ticket créé avec succès !');
      setTitle('');
      setDescription('');
      // Recharger les données pour mettre à jour la liste et les stats
      await loadData();
    } catch (err) {
      setSubmitError(err.message || 'Erreur lors de la création');
    } finally {
      setSubmitting(false);
    }
  }

  function formatDate(dateStr) {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function getStatusClass(status) {
    if (!status) return '';
    return status.toLowerCase().replace(' ', '_');
  }

  function getStatusLabel(status) {
    const labels = {
      NOUVEAU: 'Nouveau',
      EN_COURS: 'En cours',
      RESOLU: 'Résolu',
    };
    return labels[status] || status;
  }

  const totalTickets = stats
    ? (stats.NOUVEAU || 0) + (stats.EN_COURS || 0) + (stats.RESOLU || 0)
    : 0;

  return (
    <div className="app-layout">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} tabs={TABS} />

      <main className="main-content">
        <div className="page-header">
          <h1>Dashboard Reporter</h1>
          <p>Gérez vos tickets et suivez les statistiques</p>
        </div>

        {loading ? (
          <div className="loading-container">
            <span className="spinner"></span>
            <span>Chargement des données...</span>
          </div>
        ) : (
          <>
            {/* ===== CONSULTATION ===== */}
            {activeTab === 'consultation' && (
              <div className="tab-content" key="consultation">
                <div className="table-container">
                  <div className="table-header">
                    <h2>Tous les tickets</h2>
                  </div>
                  {tickets.length === 0 ? (
                    <div className="empty-state">
                      <Inbox />
                      <p>Aucun ticket pour le moment</p>
                    </div>
                  ) : (
                    <div className="table-wrapper">
                      <table>
                        <thead>
                          <tr>
                            <th>ID</th>
                            <th>Titre</th>
                            <th>Statut</th>
                            <th>Reporter</th>
                            <th>Date de création</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tickets.map((ticket) => (
                            <tr key={ticket.id}>
                              <td style={{ color: 'var(--text-muted)' }}>
                                #{ticket.id}
                              </td>
                              <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                                {ticket.title}
                              </td>
                              <td>
                                <span className={`status-badge ${getStatusClass(ticket.status)}`}>
                                  <span className="status-dot"></span>
                                  {getStatusLabel(ticket.status)}
                                </span>
                              </td>
                              <td>{ticket.reporterName}</td>
                              <td>{formatDate(ticket.createdAt)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ===== STATISTIQUES ===== */}
            {activeTab === 'statistiques' && stats && (
              <div className="tab-content" key="statistiques">
                <div className="stats-grid">
                  <StatsCard
                    label="Total Tickets"
                    value={totalTickets}
                    icon={<Layers />}
                    variant="total"
                  />
                  <StatsCard
                    label="Nouveau"
                    value={stats.NOUVEAU || 0}
                    icon={<AlertCircle />}
                    variant="nouveau"
                  />
                  <StatsCard
                    label="En cours"
                    value={stats.EN_COURS || 0}
                    icon={<Clock />}
                    variant="en-cours"
                  />
                  <StatsCard
                    label="Résolu"
                    value={stats.RESOLU || 0}
                    icon={<CheckCircle2 />}
                    variant="resolu"
                  />
                </div>
              </div>
            )}

            {/* ===== CRÉER TICKET ===== */}
            {activeTab === 'creer-ticket' && (
              <div className="tab-content" key="creer-ticket">
                <div className="create-ticket-form">
                  <h2>
                    <PlusCircle size={22} />
                    Nouveau Ticket
                  </h2>

                  {submitSuccess && (
                    <div className="success-message" id="ticket-success">
                      <CheckCircle2 size={16} />
                      {submitSuccess}
                    </div>
                  )}

                  {submitError && (
                    <div className="login-error" id="ticket-error">
                      <AlertCircle size={16} />
                      {submitError}
                    </div>
                  )}

                  <form onSubmit={handleCreateTicket}>
                    <div className="form-group">
                      <label htmlFor="ticket-title">Titre du ticket</label>
                      <input
                        id="ticket-title"
                        type="text"
                        placeholder="Ex: Erreur lors de la connexion..."
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="ticket-description">Description</label>
                      <textarea
                        id="ticket-description"
                        placeholder="Décrivez le bug en détail : étapes de reproduction, comportement attendu, etc."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="btn-submit-ticket"
                      disabled={submitting}
                      id="btn-create-ticket"
                    >
                      {submitting ? (
                        <span className="spinner"></span>
                      ) : (
                        <>
                          <Send size={18} />
                          Soumettre le ticket
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
