/**
 * Carte de statistique réutilisable.
 */
export default function StatsCard({ label, value, icon, variant = 'total' }) {
  return (
    <div className={`stat-card ${variant}`}>
      <div className="stat-card-header">
        <span className="stat-card-label">{label}</span>
        <div className="stat-card-icon">{icon}</div>
      </div>
      <div className="stat-card-value">{value}</div>
    </div>
  );
}
