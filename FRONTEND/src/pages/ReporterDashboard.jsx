import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import StatsCard from '../components/StatsCard';
import StatsReporter from '../components/StatsReporter';
import { fetchTickets, fetchTicketStats, createTicket, fetchProjects, fetchDevelopers, searchTickets, fetchTicketById, fetchComments, addComment, updateTicketStatus, API_BASE } from '../services/api';
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
  FileText,
  Search,
  RotateCcw,
  Calendar,
  ArrowLeft,
  MessageSquare,
  Paperclip
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

  // Search state
  const [searchTitle, setSearchTitle] = useState('');
  const [searchProjectId, setSearchProjectId] = useState('');
  const [searchAssignedToId, setSearchAssignedToId] = useState('');
  const [searchDateDebut, setSearchDateDebut] = useState('');
  const [searchDateFin, setSearchDateFin] = useState('');
  const [searching, setSearching] = useState(false);

  // Ticket Detail state
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentContent, setCommentContent] = useState('');
  const [commentFiles, setCommentFiles] = useState([]);
  const [submittingComment, setSubmittingComment] = useState(false);

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

  async function handleSearch(e) {
    e.preventDefault();
    setSearching(true);
    try {
      const results = await searchTickets({
        title: searchTitle || undefined,
        projectId: searchProjectId || undefined,
        assignedToId: searchAssignedToId || undefined,
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
    setSearchAssignedToId('');
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

  const handleAttachmentChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(prev => [...prev, ...selectedFiles]);
  };

  const removeAttachment = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

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
    const selectedFiles = Array.from(e.target.files);
    setCommentFiles(prev => [...prev, ...selectedFiles]);
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

  // --- STATUS UPDATE HANDLER ---
  const handleStatusUpdate = async (newStatus) => {
    try {
      const updatedTicket = await updateTicketStatus(selectedTicket.id, newStatus);
      setSelectedTicket(updatedTicket);
      // Mettre à jour le ticket dans la liste du tableau
      setTickets(prev => prev.map(t => t.id === updatedTicket.id ? updatedTicket : t));
    } catch (err) {
      console.error('Erreur mise à jour statut:', err);
      alert(err.message || 'Erreur lors de la mise à jour du statut');
    }
  };

  // --- CREATE TICKET HANDLERS ---
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
                  {selectedTicket ? (
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
                            {/* REPORTER: bouton Marquer Complété */}
                            {selectedTicket.status !== 'COMPLETE' && (
                              <button
                                className="btn-status-action btn-status-complete"
                                onClick={() => handleStatusUpdate('COMPLETE')}
                              >
                                ✓ Marquer Complété
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="ticket-detail-meta">
                          <span><strong>Projet:</strong> {selectedTicket.projectName}</span>
                          <span><strong>Assigné à:</strong> {selectedTicket.assignedToName || '—'}</span>
                          <span><strong>Reporter:</strong> {selectedTicket.reporterName}</span>
                          <span><strong>Date:</strong> {formatDate(selectedTicket.createdAt)}</span>
                        </div>
                      </div>

                      <div className="ticket-detail-description card-panel">
                        <h3>Description</h3>
                        <p className="description-text">{selectedTicket.description}</p>
                        
                        {selectedTicket.attachments && selectedTicket.attachments.length > 0 && (
                          <div className="ticket-attachments">
                            <h4>Pièces jointes ({selectedTicket.attachments.length})</h4>
                            <div className="attachment-list">
                              {selectedTicket.attachments.map((file, i) => (
                                <a key={i} href={API_BASE.replace('/api', '') + file.filePath} target="_blank" rel="noreferrer" className="attachment-item">
                                  {file.fileType.includes('image') ? <ImageIcon size={16} /> : <FileText size={16} />}
                                  {file.fileName}
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
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
                              {submittingComment ? 'Envoi...' : (
                                <>Envoyer <Send size={16} /></>
                              )}
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  ) : (
                    <div className="consultation-layout-left">
                      <div className="consultation-restricted-width">
                      {/* Search bar replacing stats cards */}
                      <div className="search-bar">
                    <div className="search-bar-header">
                      <Search size={18} />
                      <h2>Rechercher des tickets</h2>
                    </div>
                    <form onSubmit={handleSearch} className="search-form">
                      <div className="search-row">
                        <div className="search-field">
                          <label htmlFor="search-title">Nom du ticket</label>
                          <input
                            id="search-title"
                            type="text"
                            placeholder="Rechercher par titre..."
                            value={searchTitle}
                            onChange={(e) => setSearchTitle(e.target.value)}
                          />
                        </div>
                        <div className="search-field">
                          <label htmlFor="search-project">Projet</label>
                          <select
                            id="search-project"
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
                          <label htmlFor="search-developer">Développeur</label>
                          <select
                            id="search-developer"
                            value={searchAssignedToId}
                            onChange={(e) => setSearchAssignedToId(e.target.value)}
                          >
                            <option value="">— Tous les développeurs —</option>
                            {developers.map(d => (
                              <option key={d.id} value={d.id}>{d.fullName}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="search-row">
                        <div className="search-field">
                          <label htmlFor="search-date-debut">
                            <Calendar size={13} />
                            Date début
                          </label>
                          <input
                            id="search-date-debut"
                            type="date"
                            value={searchDateDebut}
                            onChange={(e) => setSearchDateDebut(e.target.value)}
                          />
                        </div>
                        <div className="search-field">
                          <label htmlFor="search-date-fin">
                            <Calendar size={13} />
                            Date fin
                          </label>
                          <input
                            id="search-date-fin"
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
                            id="btn-search-tickets"
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
                            id="btn-reset-search"
                            title="Réinitialiser la recherche"
                          >
                            <RotateCcw size={15} />
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>

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
                              <th>Projet</th>
                              <th>Niveau</th>
                              <th>Statut</th>
                              <th>Assigné à</th>
                              <th>Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {tickets.map(ticket => (
                              <tr key={ticket.id} onClick={() => handleTicketClick(ticket)} className="clickable-row">
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
                  </div>
                  )}
                </div>
              )}

              {/* ===== STATISTIQUES ===== */}
              {activeTab === 'statistiques' && (
                <div className="tab-content" key="statistiques">
                  <StatsReporter />
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
                              <option value="" disabled>— Sélectionnez un projet —</option>
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
