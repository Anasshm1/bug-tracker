import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import StatsCard from '../components/StatsCard';
import StatsDev from '../components/StatsDev';
import { fetchTickets, fetchTicketStats, fetchProjects, fetchReporters, searchTickets, fetchTicketById, fetchComments, addComment, updateTicketStatus, API_BASE } from '../services/api';
import {
  Layers,
  AlertCircle,
  Clock,
  CheckCircle2,
  Inbox,
  Search,
  RotateCcw,
  Calendar,
  ArrowLeft,
  MessageSquare,
  Paperclip,
  Image as ImageIcon,
  FileText,
  Send,
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

  // Reference data
  const [projects, setProjects] = useState([]);
  const [reporters, setReporters] = useState([]);

  // Search state
  const [searchTitle, setSearchTitle] = useState('');
  const [searchProjectId, setSearchProjectId] = useState('');
  const [searchReporterId, setSearchReporterId] = useState('');
  const [searchDateDebut, setSearchDateDebut] = useState('');
  const [searchDateFin, setSearchDateFin] = useState('');
  const [searching, setSearching] = useState(false);

  // Ticket Detail state
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentContent, setCommentContent] = useState('');
  const [commentFiles, setCommentFiles] = useState([]);
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    loadData();
    loadReferenceData();
  }, []);

  async function loadReferenceData() {
    try {
      const [projData, repData] = await Promise.all([
        fetchProjects(),
        fetchReporters()
      ]);
      setProjects(projData);
      setReporters(repData);
    } catch (err) {
      console.error('Erreur chargement projets/reporters:', err);
    }
  }

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

  async function handleSearch(e) {
    e.preventDefault();
    setSearching(true);
    try {
      const results = await searchTickets({
        title: searchTitle || undefined,
        projectId: searchProjectId || undefined,
        reporterId: searchReporterId || undefined,
        dateDebut: searchDateDebut || undefined,
        dateFin: searchDateFin || undefined,
      });
      setTickets(results);
    } catch (err) {
      console.error('Erreur recherche:', err);
    } finally {
      setSearching(false);
    }
  }

  async function handleResetSearch() {
    setSearchTitle('');
    setSearchProjectId('');
    setSearchReporterId('');
    setSearchDateDebut('');
    setSearchDateFin('');
    setSearching(true);
    try {
      const ticketData = await fetchTickets();
      setTickets(ticketData);
    } catch (err) {
      console.error('Erreur réinitialisation:', err);
    } finally {
      setSearching(false);
    }
  }

  // --- TICKET DETAIL HANDLERS ---
  const handleTicketClick = async (ticket) => {
    setLoading(true);
    try {
      const ticketData = await fetchTicketById(ticket.id);
      const commentsData = await fetchComments(ticket.id);
      setSelectedTicket(ticketData);
      setComments(commentsData);
    } catch (err) {
      console.error('Erreur chargement détails:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToList = () => {
    setSelectedTicket(null);
    setComments([]);
    setCommentContent('');
    setCommentFiles([]);
  };

  const handleCommentFileChange = (e) => {
    setCommentFiles(prev => [...prev, ...Array.from(e.target.files)]);
  };

  const removeCommentFile = (index) => {
    setCommentFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentContent.trim() && commentFiles.length === 0) return;
    setSubmittingComment(true);
    try {
      const newComment = await addComment(selectedTicket.id, commentContent, commentFiles);
      setComments(prev => [...prev, newComment]);
      setCommentContent('');
      setCommentFiles([]);
    } catch (err) {
      console.error('Erreur ajout commentaire:', err);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    let reason = '';
    if (newStatus === 'RETOUR_INFO') {
      reason = window.prompt("Veuillez saisir les informations à retourner au reporter :");
      if (reason === null || reason.trim() === '') {
        return; // Annulé par l'utilisateur
      }
    }

    try {
      const updatedTicket = await updateTicketStatus(selectedTicket.id, newStatus);
      
      // Ajouter le commentaire de retour d'info automatiquement si saisi
      if (reason) {
        const newComment = await addComment(selectedTicket.id, `**[RETOUR D'INFO]** ${reason.trim()}`);
        setComments(prev => [...prev, newComment]);
      }

      setSelectedTicket(updatedTicket);
      // Mettre à jour le ticket dans la liste du tableau
      setTickets(prev => prev.map(t => t.id === updatedTicket.id ? updatedTicket : t));
    } catch (err) {
      console.error('Erreur mise à jour statut:', err);
      alert(err.message || 'Erreur lors de la mise à jour du statut');
    }
  };

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
        <TopBar />

        <div className="main-inner">
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
                  {selectedTicket ? (
                    /* ===== TICKET DETAIL VIEW ===== */
                    <div className="ticket-detail-view">
                      <button className="btn-back" onClick={handleBackToList}>
                        <ArrowLeft size={16} /> Retour à la liste
                      </button>

                      <div className="ticket-detail-header">
                        <div className="ticket-detail-title">
                          <h2>{selectedTicket.title}</h2>
                          <div className="ticket-detail-badges">
                            <span className={`badge-level level-${selectedTicket.level?.toLowerCase()}`}>
                              {selectedTicket.level}
                            </span>
                            <span className={`status-badge ${getStatusClass(selectedTicket.status)}`}>
                              <span className="status-dot"></span>
                              {getStatusLabel(selectedTicket.status)}
                            </span>
                            {/* DEV : boutons de changement de statut */}
                            {/* DEV : boutons de changement de statut */}
                            {selectedTicket.status !== 'ACCEPTE' && selectedTicket.status !== 'TRAITE' && selectedTicket.status !== 'COMPLETE' && (
                              <button
                                className="btn-status-action btn-status-accepte"
                                onClick={() => handleStatusUpdate('ACCEPTE')}
                                style={{ backgroundColor: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid #10b981' }}
                              >
                                ✓ Accepter
                              </button>
                            )}
                            {selectedTicket.status !== 'TRAITE' && selectedTicket.status !== 'COMPLETE' && (
                              <button
                                className="btn-status-action btn-status-complete"
                                onClick={() => handleStatusUpdate('TRAITE')}
                                style={{ backgroundColor: 'rgba(139,92,246,0.1)', color: '#8b5cf6', border: '1px solid #8b5cf6' }}
                              >
                                ✓ Traité
                              </button>
                            )}
                            {selectedTicket.status !== 'RETOUR_INFO' && selectedTicket.status !== 'COMPLETE' && (
                              <button
                                className="btn-status-action btn-status-retour"
                                onClick={() => handleStatusUpdate('RETOUR_INFO')}
                              >
                                ↺ Retour d'info
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="ticket-detail-meta">
                          <span><strong>Projet:</strong> {selectedTicket.projectName}</span>
                          <span><strong>Reporter:</strong> {selectedTicket.reporterName}</span>
                          <span><strong>Date:</strong> {formatDate(selectedTicket.createdAt)}</span>
                        </div>
                      </div>

                      <div className="ticket-detail-description card-panel">
                        <h3>Description</h3>
                        <p className="description-text">{selectedTicket.description}</p>
                      </div>

                      {/* RETOURS D'INFO SEPARES */}
                      {comments.filter(c => c.content.includes("[RETOUR D'INFO]")).length > 0 && (
                        <div className="ticket-retours-section card-panel" style={{ marginBottom: '20px', borderLeft: '4px solid #f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.05)' }}>
                          <h3 style={{ color: '#d97706', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
                            <AlertCircle size={18} /> Retours d'information ({comments.filter(c => c.content.includes("[RETOUR D'INFO]")).length})
                          </h3>
                          <div className="comments-list">
                            {comments.filter(c => c.content.includes("[RETOUR D'INFO]")).map(comment => (
                              <div key={comment.id} className="comment-card" style={{ backgroundColor: '#fff' }}>
                                <div className="comment-header">
                                  <span className="comment-author">{comment.authorName}</span>
                                  <span className="comment-role badge-role">{comment.authorRole}</span>
                                  <span className="comment-date">{formatDate(comment.createdAt)}</span>
                                </div>
                                <div className="comment-body">
                                  <p style={{ fontWeight: 500 }}>{comment.content.replace(/\*\*\[RETOUR D'INFO\]\*\*\s*/, "")}</p>
                                  {comment.attachments && comment.attachments.length > 0 && (
                                    <div className="comment-attachments">
                                      {comment.attachments.map((file, i) => (
                                        <a key={i} href={API_BASE.replace('/api', '') + file.filePath} target="_blank" rel="noreferrer" className="attachment-item">
                                          {file.fileType?.includes('image') ? <ImageIcon size={14} /> : <Paperclip size={14} />}
                                          {file.fileName}
                                        </a>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="ticket-comments-section">
                        <h3><MessageSquare size={18} /> Commentaires ({comments.filter(c => !c.content.includes("[RETOUR D'INFO]")).length})</h3>

                        <div className="comments-list">
                          {comments.filter(c => !c.content.includes("[RETOUR D'INFO]")).map(comment => (
                            <div key={comment.id} className="comment-card">
                              <div className="comment-header">
                                <span className="comment-author">{comment.authorName}</span>
                                <span className="comment-role badge-role">{comment.authorRole}</span>
                                <span className="comment-date">{formatDate(comment.createdAt)}</span>
                              </div>
                              <div className="comment-body">
                                <p>{comment.content}</p>
                                {comment.attachments && comment.attachments.length > 0 && (
                                  <div className="comment-attachments">
                                    {comment.attachments.map((file, i) => (
                                      <a key={i} href={API_BASE.replace('/api', '') + file.filePath} target="_blank" rel="noreferrer" className="attachment-item">
                                        {file.fileType?.includes('image') ? <ImageIcon size={14} /> : <Paperclip size={14} />}
                                        {file.fileName}
                                      </a>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>

                        <form className="comment-form card-panel" onSubmit={handleCommentSubmit}>
                          <h4>Ajouter un commentaire</h4>
                          <textarea
                            placeholder="Écrivez votre commentaire ici..."
                            value={commentContent}
                            onChange={(e) => setCommentContent(e.target.value)}
                            rows={3}
                          ></textarea>

                          {commentFiles.length > 0 && (
                            <ul className="file-list">
                              {commentFiles.map((file, i) => (
                                <li key={i}>
                                  {file.name}
                                  <button type="button" onClick={() => removeCommentFile(i)} className="remove-file-btn">✕</button>
                                </li>
                              ))}
                            </ul>
                          )}

                          <div className="comment-actions">
                            <div className="file-uploads">
                              <label className="btn-upload">
                                <ImageIcon size={16} /> Image
                                <input type="file" multiple accept="image/*" onChange={handleCommentFileChange} hidden />
                              </label>
                              <label className="btn-upload">
                                <Paperclip size={16} /> Fichier
                                <input type="file" multiple onChange={handleCommentFileChange} hidden />
                              </label>
                            </div>
                            <button type="submit" className="btn-submit-comment" disabled={submittingComment || (!commentContent.trim() && commentFiles.length === 0)}>
                              {submittingComment ? 'Envoi...' : (<>Envoyer <Send size={16} /></>)}
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  ) : (
                    /* ===== LIST VIEW ===== */
                    <div className="consultation-layout-left">
                    <div className="consultation-restricted-width">
                      {/* Search bar — même structure que le Reporter */}
                      <div className="search-bar">
                        <div className="search-bar-header">
                          <Search size={18} />
                          <h2>Rechercher des tickets</h2>
                        </div>
                        <form onSubmit={handleSearch} className="search-form">
                          <div className="search-row">
                            <div className="search-field">
                              <label htmlFor="dev-search-title">Nom du ticket</label>
                              <input
                                id="dev-search-title"
                                type="text"
                                placeholder="Rechercher par titre..."
                                value={searchTitle}
                                onChange={(e) => setSearchTitle(e.target.value)}
                              />
                            </div>
                            <div className="search-field">
                              <label htmlFor="dev-search-project">Projet</label>
                              <select
                                id="dev-search-project"
                                value={searchProjectId}
                                onChange={(e) => setSearchProjectId(e.target.value)}
                              >
                                <option value="">— Tous les projets —</option>
                                {projects.map(p => (
                                  <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                              </select>
                            </div>
                            <div className="search-field">
                              <label htmlFor="dev-search-reporter">Reporter</label>
                              <select
                                id="dev-search-reporter"
                                value={searchReporterId}
                                onChange={(e) => setSearchReporterId(e.target.value)}
                              >
                                <option value="">— Tous les reporters —</option>
                                {reporters.map(r => (
                                  <option key={r.id} value={r.id}>{r.fullName}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <div className="search-row">
                            <div className="search-field">
                              <label htmlFor="dev-search-date-debut">
                                <Calendar size={13} />
                                Date début
                              </label>
                              <input
                                id="dev-search-date-debut"
                                type="date"
                                value={searchDateDebut}
                                onChange={(e) => setSearchDateDebut(e.target.value)}
                              />
                            </div>
                            <div className="search-field">
                              <label htmlFor="dev-search-date-fin">
                                <Calendar size={13} />
                                Date fin
                              </label>
                              <input
                                id="dev-search-date-fin"
                                type="date"
                                value={searchDateFin}
                                onChange={(e) => setSearchDateFin(e.target.value)}
                              />
                            </div>
                            <div className="search-actions">
                              <button
                                type="submit"
                                className="btn-search"
                                disabled={searching}
                                id="dev-btn-search-tickets"
                              >
                                {searching ? (
                                  <span className="spinner"></span>
                                ) : (
                                  <>
                                    <Search size={15} />
                                    Rechercher
                                  </>
                                )}
                              </button>
                              <button
                                type="button"
                                className="btn-reset"
                                onClick={handleResetSearch}
                                disabled={searching}
                                id="dev-btn-reset-search"
                                title="Réinitialiser la recherche"
                              >
                                <RotateCcw size={15} />
                              </button>
                            </div>
                          </div>
                        </form>
                      </div>

                      {/* Tickets Table */}
                      <div className="table-container">
                        <div className="table-header">
                          <h2>Tous les tickets</h2>
                          <span className="ticket-count">{tickets.length} résultat{tickets.length !== 1 ? 's' : ''}</span>
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
                            <th>Projet</th>
                            <th>Reporter</th>
                            <th>Date de création</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tickets.map((ticket) => (
                            <tr key={ticket.id} className="clickable-row" onClick={() => handleTicketClick(ticket)}>
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
                              <td>{ticket.projectName}</td>
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
                </div>
              )}
            </div>
          )}
            {/* ===== STATISTIQUES ===== */}
            {activeTab === 'statistiques' && (
              <div className="tab-content" key="statistiques">
                <StatsDev />
              </div>
            )}
          </>
        )}
        </div>
      </main>
    </div>
  );
}
