import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import StatsCard from '../components/StatsCard';
import { fetchTickets, fetchTicketStats, createTicket, fetchProjects, fetchDevelopers } from '../services/api';
import {
  Layers,
  AlertCircle,
  Clock,
  CheckCircle2,
  Inbox,
  PlusCircle,
  Send,
  Upload,
  ChevronDown,
  Image as ImageIcon,
  FileText
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const STATUS_OPTIONS = [
  { value: 'ENCOURS', label: 'En cours', colorClass: 'status-vert' },
  { value: 'ACCEPTE', label: 'Accepté', colorClass: 'status-jaune' },
  { value: 'RETOUR_INFO', label: 'Retour d\'info', colorClass: 'status-orange' },
  { value: 'COMPLETE', label: 'Complété', colorClass: 'status-gris' }
];

const LEVEL_OPTIONS = [
  { value: 'DOC', label: 'Doc', colorClass: 'level-gris' },
  { value: 'NORMAL', label: 'Normal', colorClass: 'level-vert' },
  { value: 'IMPORTANT', label: 'Important', colorClass: 'level-orange' },
  { value: 'URGENT', label: 'Urgent', colorClass: 'level-rouge' }
];

const TABS = [
  { key: 'consultation', label: 'Consultation' },
  { key: 'statistiques', label: 'Statistiques' },
  { key: 'creer-ticket', label: 'Créer Ticket' },
];

export default function ReporterDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('consultation');
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Reference data
  const [projects, setProjects] = useState([]);
  const [developers, setDevelopers] = useState([]);

  // Form state
  const [title, setTitle] = useState('');
  const [level, setLevel] = useState('NORMAL');
  const [projectId, setProjectId] = useState('');
  const [assignedToId, setAssignedToId] = useState('');
  const [status, setStatus] = useState('ENCOURS');
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState([]);
  
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  useEffect(() => {
    loadData();
    loadReferenceData();
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

  async function loadReferenceData() {
    try {
      const [projData, devData] = await Promise.all([
        fetchProjects(),
        fetchDevelopers()
      ]);
      setProjects(projData);
      setDevelopers(devData);
      if (projData.length > 0) setProjectId(projData[0].id);
    } catch (err) {
      console.error('Erreur chargement projets/devs:', err);
    }
  }

  const handleAttachmentChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(prev => [...prev, ...selectedFiles]);
  };

  async function handleCreateTicket(e) {
    e.preventDefault();
    setSubmitError('');
    setSubmitSuccess('');
    setSubmitting(true);

    try {
      const ticketData = {
        title,
        description,
        level,
        status,
        projectId: Number(projectId),
        assignedToId: assignedToId ? Number(assignedToId) : null
      };

      await createTicket(ticketData, files);
      
      setSubmitSuccess('Ticket créé avec succès !');
      setTitle('');
      setDescription('');
      setLevel('NORMAL');
      setStatus('ENCOURS');
      setAssignedToId('');
      setFiles([]);
      if (projects.length > 0) setProjectId(projects[0].id);
      
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
      ENCOURS: 'En cours',
      ACCEPTE: 'Accepté',
      RETOUR_INFO: 'Retour Info',
      TRAITE: 'Traité',
      COMPLETE: 'Complété',
      RESOLU: 'Résolu',
    };
    return labels[status] || status;
  }

  const totalTickets = stats
    ? Object.values(stats).reduce((a, b) => a + b, 0)
    : 0;

  return (
    <div className="app-layout">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} tabs={TABS} />

      <main className="main-content">
        <TopBar />

        <div className="main-inner">
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
                  {/* Summary stats above table */}
                  {stats && (
                    <div className="stats-grid">
                      <StatsCard label="Total" value={totalTickets} icon={<Layers />} variant="total" />
                      <StatsCard label="En cours" value={stats.ENCOURS || 0} icon={<AlertCircle />} variant="nouveau" />
                      <StatsCard label="Traité" value={stats.TRAITE || 0} icon={<Clock />} variant="en-cours" />
                      <StatsCard label="Complété" value={stats.COMPLETE || 0} icon={<CheckCircle2 />} variant="resolu" />
                    </div>
                  )}

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
                              <th>Projet</th>
                              <th>Niveau</th>
                              <th>Statut</th>
                              <th>Assigné à</th>
                              <th>Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {tickets.map((ticket) => (
                              <tr key={ticket.id}>
                                <td style={{ color: 'var(--text-muted)', fontWeight: 500 }}>
                                  #{ticket.id}
                                </td>
                                <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                                  {ticket.title}
                                </td>
                                <td>{ticket.projectName || '—'}</td>
                                <td>
                                  <span className={`badge-level level-${ticket.level?.toLowerCase()}`}>
                                    {ticket.level}
                                  </span>
                                </td>
                                <td>
                                  <span className={`status-badge ${getStatusClass(ticket.status)}`}>
                                    <span className="status-dot"></span>
                                    {getStatusLabel(ticket.status)}
                                  </span>
                                </td>
                                <td>{ticket.assignedToName || '—'}</td>
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
                      label="En cours"
                      value={stats.ENCOURS || 0}
                      icon={<AlertCircle />}
                      variant="nouveau"
                    />
                    <StatsCard
                      label="Traité"
                      value={stats.TRAITE || 0}
                      icon={<Clock />}
                      variant="en-cours"
                    />
                    <StatsCard
                      label="Complété"
                      value={stats.COMPLETE || 0}
                      icon={<CheckCircle2 />}
                      variant="resolu"
                    />
                  </div>
                </div>
              )}

              {/* ===== CRÉER TICKET ===== */}
              {activeTab === 'creer-ticket' && (
                <div className="tab-content" key="creer-ticket">
                  <div className="create-ticket-layout-left">
                    <form onSubmit={handleCreateTicket} className="complex-form create-ticket-split-form">
                      <div className="create-ticket-card">
                        <h2>
                          <PlusCircle size={22} />
                          Nouveau Ticket
                        </h2>

                        {submitSuccess && (
                          <div className="success-message" id="ticket-success">
                            <CheckCircle2 size={15} />
                            {submitSuccess}
                          </div>
                        )}

                        {submitError && (
                          <div className="login-error" id="ticket-error">
                            <AlertCircle size={15} />
                            {submitError}
                          </div>
                        )}

                        <div className="form-row">
                          <div className="form-group">
                            <label htmlFor="ticket-title">Titre</label>
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
                            <label>Niveau</label>
                            <div className="level-chips-container">
                              {LEVEL_OPTIONS.map(opt => (
                                <button
                                  key={opt.value}
                                  type="button"
                                  className={`level-chip ${opt.colorClass} ${level === opt.value ? 'active' : ''}`}
                                  onClick={() => setLevel(opt.value)}
                                >
                                  <span className="level-dot"></span>
                                  {opt.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="form-row">
                          <div className="form-group">
                            <label htmlFor="ticket-project">Projet</label>
                            <select 
                              id="ticket-project"
                              value={projectId}
                              onChange={(e) => setProjectId(e.target.value)}
                              required
                            >
                              {projects.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                              ))}
                            </select>
                          </div>

                          <div className="form-group">
                            <label htmlFor="ticket-assigned">Assigné à</label>
                            <select 
                              id="ticket-assigned"
                              value={assignedToId}
                              onChange={(e) => setAssignedToId(e.target.value)}
                            >
                              <option value="">— Non assigné —</option>
                              {developers.map(d => (
                                <option key={d.id} value={d.id}>{d.fullName}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="form-row">
                          <div className="form-group">
                            <label>Statut</label>
                            <div className="custom-select-wrapper">
                              <div 
                                className={`custom-select-trigger ${STATUS_OPTIONS.find(o => o.value === status)?.colorClass}`}
                                onClick={() => setIsStatusOpen(!isStatusOpen)}
                              >
                                <div className="custom-select-trigger-content">
                                  <span className="status-dot"></span>
                                  {STATUS_OPTIONS.find(o => o.value === status)?.label}
                                </div>
                                <ChevronDown size={16} />
                              </div>
                              {isStatusOpen && (
                                <div className="custom-select-options">
                                  {STATUS_OPTIONS.map(opt => (
                                    <div 
                                      key={opt.value} 
                                      className={`custom-select-option ${opt.colorClass}`} 
                                      onClick={() => { setStatus(opt.value); setIsStatusOpen(false); }}
                                    >
                                      <span className="status-dot"></span>
                                      {opt.label}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="form-group">
                            <label>Date de création</label>
                            <input
                              type="text"
                              value={new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                              disabled
                            />
                          </div>
                        </div>
                      </div>

                      <div className="create-ticket-card">
                        <div className="form-group">
                          <label htmlFor="ticket-description">Description</label>
                          <textarea
                            id="ticket-description"
                            placeholder="Décrivez le bug en détail..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            required
                            rows={5}
                          />
                        </div>

                        <div className="form-group">
                          <label>Pièces jointes</label>
                          <div className="upload-buttons-row">
                            <button 
                              type="button" 
                              className="btn-upload-small image" 
                              onClick={() => document.getElementById('ticket-images').click()}
                            >
                              <ImageIcon size={16} /> Ajouter une image
                            </button>
                            <input
                              id="ticket-images"
                              type="file"
                              multiple
                              accept="image/*"
                              onChange={handleAttachmentChange}
                              style={{ display: 'none' }}
                            />

                            <button 
                              type="button" 
                              className="btn-upload-small file" 
                              onClick={() => document.getElementById('ticket-files').click()}
                            >
                              <FileText size={16} /> Ajouter un fichier
                            </button>
                            <input
                              id="ticket-files"
                              type="file"
                              multiple
                              accept=".txt,.log,.pdf,.docx,.zip,.csv"
                              onChange={handleAttachmentChange}
                              style={{ display: 'none' }}
                            />
                          </div>
                          
                          {files.length > 0 && (
                            <ul className="file-list">
                              {files.map((f, i) => (
                                <li key={i}>{f.name} ({(f.size / 1024).toFixed(1)} KB)</li>
                              ))}
                            </ul>
                          )}
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
                              <Send size={16} />
                              Soumettre le ticket
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
