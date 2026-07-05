import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import StatsCard from '../components/StatsCard';
import { fetchTickets, fetchTicketStats } from '../services/api';
import {
  Layers,
  AlertCircle,
  Clock,
  CheckCircle2,
  Inbox,
} from 'lucide-react';

const TABS = [
  { key: 'consultation', label: 'Consultation' },
  { key: 'statistiques', label: 'Statistiques' },
];

export default function DevDashboard() {
  const [activeTab, setActiveTab] = useState('consultation');
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

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
          <h1>Dashboard Développeur</h1>
          <p>Consultez les tickets et suivez les statistiques</p>
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
          </>
        )}
      </main>
    </div>
  );
}
