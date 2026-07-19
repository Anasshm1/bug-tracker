import React, { useEffect, useState } from 'react';
import { fetchDevStats } from '../services/api';
import {
  RadialBarChart, RadialBar, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
  PieChart, Pie
} from 'recharts';
import { Trophy, ShieldCheck, AlertTriangle, ShieldAlert, Layers, Clock, CheckCircle2, MessageSquare } from 'lucide-react';

// ── Helpers ────────────────────────────────────────────────────
function getBadgeStyle(evalCode) {
  switch (evalCode) {
    case 'VERT':  return { color: '#10b981', bg: 'rgba(16,185,129,0.12)', icon: <ShieldCheck size={28} />, label: 'Excellent' };
    case 'JAUNE': return { color: '#eab308', bg: 'rgba(234,179,8,0.12)',  icon: <AlertTriangle size={28} />, label: 'Correct' };
    case 'ROUGE': return { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  icon: <ShieldAlert size={28} />, label: 'Insuffisant' };
    default:       return { color: '#6b7280', bg: 'rgba(107,114,128,0.12)', icon: <Layers size={28} />, label: 'N/A' };
  }
}

const KPI_CARDS = [
  { key: 'totalAssignes', label: 'Total assignés',  icon: <Layers size={20} />,       color: '#6366f1' },
  { key: 'nbEnAttente',   label: 'En attente',      icon: <Clock size={20} />,          color: '#3b82f6' },
  { key: 'nbAcceptes',    label: 'Acceptés',        icon: <CheckCircle2 size={20} />,   color: '#10b981' },
  { key: 'nbRetourInfo',  label: "Retour d'info",   icon: <MessageSquare size={20} />,  color: '#f59e0b' },
];

export default function StatsDev() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetchDevStats()
      .then(data => setStats(data))
      .catch(err => { console.error(err); setError(err.message); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-container"><span className="spinner"></span></div>;
  if (error)   return <div className="empty-state" style={{ color: '#ef4444' }}>Erreur: {error}</div>;
  if (!stats)  return <div className="empty-state">Données indisponibles</div>;

  const badge = getBadgeStyle(stats.evalGlobale);

  const barData = [
    { name: 'Assignés',     value: stats.totalAssignes, color: '#6366f1' },
    { name: 'En attente',   value: stats.nbEnAttente,   color: '#3b82f6' },
    { name: 'Acceptés',     value: stats.nbAcceptes,    color: '#10b981' },
    { name: "Retour d'info", value: stats.nbRetourInfo, color: '#f59e0b' },
    { name: 'Traités',      value: stats.nbTraites,     color: '#8b5cf6' },
  ];

  const radialData = [{ name: 'Score', value: stats.scoreQualite, fill: badge.color }];

  return (
    <div className="stats-dashboard">

      {/* ── ROW 1 : KPI Cards ───────────────────────────────── */}
      <div className="kpi-grid">
        {KPI_CARDS.map(({ key, label, icon, color }) => (
          <div className="kpi-card" key={key}>
            <div className="kpi-icon" style={{ backgroundColor: `${color}20`, color }}>
              {icon}
            </div>
            <div className="kpi-content">
              <span className="kpi-value" style={{ color }}>{stats[key]}</span>
              <span className="kpi-label">{label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── ROW 2 : Disque % + Évaluation + Classement ──────── */}
      <div className="stats-row">

        {/* Disque de pourcentage */}
        <div className="card-panel stats-chart-card" style={{ flex: '0 0 220px', minWidth: '220px', alignItems: 'center' }}>
          <h3>Score de Rigueur</h3>
          <div style={{ position: 'relative', width: 180, height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                innerRadius="65%"
                outerRadius="100%"
                data={radialData}
                startAngle={90}
                endAngle={90 - (360 * stats.scoreQualite / 100)}
              >
                <RadialBar dataKey="value" background={{ fill: 'rgba(255,255,255,0.06)' }} cornerRadius={8} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%,-50%)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: badge.color, lineHeight: 1 }}>
                {stats.scoreQualite}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>/ 100</div>
            </div>
          </div>
          <div style={{ color: badge.color, fontWeight: 600, marginTop: 8 }}>{badge.label}</div>
        </div>

        {/* Évaluation unique */}
        <div className="card-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '12px' }}>
          <h3>Évaluation Globale</h3>
          <div className="eval-badge-big" style={{ background: badge.bg, borderColor: badge.color }}>
            <div style={{ color: badge.color }}>{badge.icon}</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem', color: badge.color }}>{badge.label}</div>
              <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary)' }}>{stats.evalMessage}</p>
            </div>
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            Rang mensuel : <strong style={{ color: 'var(--text-primary)' }}>{stats.rangMensuel > 0 ? `#${stats.rangMensuel}` : 'Non classé'}</strong>
          </div>
        </div>

        {/* Classement du mois */}
        <div className="card-panel stats-ranking-card">
          <h3><Trophy size={18} style={{ color: '#eab308', marginRight: 6 }} /> Best of the Month</h3>
          {stats.topDevs && stats.topDevs.length > 0 ? (
            <ul className="ranking-list">
              {stats.topDevs.map((d, i) => (
                <li key={i} className="ranking-item">
                  <div className="ranking-info">
                    <span className={`rank-badge rank-${i + 1}`}>{i + 1}</span>
                    <span className="rank-name">{d.fullName}</span>
                  </div>
                  <span className="rank-score">{d.score} acceptés</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="empty-state" style={{ padding: '20px 0', fontSize: '0.85rem' }}>Aucun ticket accepté ce mois-ci</div>
          )}
        </div>
      </div>

      {/* ── ROW 3 : Graphique à barres + Tableau ─────────────── */}
      <div className="stats-row">

        {/* Graphique à barres */}
        <div className="card-panel stats-chart-card" style={{ flex: 2 }}>
          <h3>Répartition des tickets</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart margin={{ top: 40, right: 40, bottom: 40, left: 40 }}>
              <Pie
                data={barData.filter(d => d.name !== 'Assignés' && d.value > 0).map(d => ({ ...d, fill: d.color }))}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={85}
                paddingAngle={5}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={true}
              >
                {barData.filter(d => d.name !== 'Assignés' && d.value > 0).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8 }}
                itemStyle={{ color: 'var(--text-secondary)' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Tableau récapitulatif */}
        <div className="card-panel" style={{ flex: 1, minWidth: '220px' }}>
          <h3>Résumé</h3>
          <table className="stats-table">
            <tbody>
              {barData.map((row, i) => (
                <tr key={i}>
                  <td><span style={{ backgroundColor: row.color, width: 10, height: 10, borderRadius: '50%', display: 'inline-block', marginRight: 8 }}></span>{row.name}</td>
                  <td style={{ fontWeight: 700, color: row.color, textAlign: 'right' }}>{row.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
