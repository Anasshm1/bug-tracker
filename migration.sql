CREATE TABLE IF NOT EXISTS status_sla (
    status VARCHAR(30) PRIMARY KEY,
    max_days INT NOT NULL
);

INSERT INTO status_sla (status, max_days) VALUES 
('EN_COURS', 2), 
('ACCEPTE', 5), 
('TRAITE', 2), 
('RETOUR_INFO', 2)
ON CONFLICT (status) DO NOTHING;

CREATE TABLE IF NOT EXISTS status_history (
    id BIGSERIAL PRIMARY KEY,
    ticket_id BIGINT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    old_status VARCHAR(30),
    new_status VARCHAR(30) NOT NULL,
    changed_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_status_history_ticket ON status_history(ticket_id);

CREATE OR REPLACE FUNCTION enforce_old_status_rule()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.old_status IS NULL THEN
        IF EXISTS (SELECT 1 FROM status_history WHERE ticket_id = NEW.ticket_id) THEN
            RAISE EXCEPTION 'old_status can only be NULL for the first status entry of a ticket';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_enforce_old_status ON status_history;
CREATE TRIGGER trigger_enforce_old_status
BEFORE INSERT ON status_history
FOR EACH ROW
EXECUTE FUNCTION enforce_old_status_rule();

-- ─────────────────────────────────────────────────────────────────
--  VUE : ticket_monitoring
--  Logique :
--    - Base = table tickets (tous les tickets sont inclus)
--    - LEFT JOIN status_history pour recuperer le dernier statut connu
--    - Si aucun historique : on utilise le statut et la date de creation du ticket
--    - Calcule le nombre de jours dans ce statut (depuis changed_at ou created_at)
--    - Compare avec status_sla.max_days
--    - Alert = 'Retard' si days_in_status > max_days, sinon 'OK'
--    - Les statuts sans SLA defini (ex: COMPLETE, RESOLU) -> alert 'OK'
-- ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW ticket_monitoring AS
WITH latest_status AS (
    SELECT DISTINCT ON (ticket_id)
        ticket_id,
        new_status  AS status,
        changed_at  AS status_date
    FROM status_history
    ORDER BY ticket_id, changed_at DESC
)
SELECT
    t.id                                                        AS ticket_id,
    COALESCE(ls.status, t.status)                               AS status,
    COALESCE(ls.status_date, t.created_at)                      AS status_date,
    EXTRACT(DAY FROM (NOW() - COALESCE(ls.status_date, t.created_at)))::INT
                                                                AS days_in_status,
    CASE
        WHEN sla.max_days IS NULL THEN 'OK'
        WHEN EXTRACT(DAY FROM (NOW() - COALESCE(ls.status_date, t.created_at))) > sla.max_days
             THEN 'Retard'
        ELSE 'OK'
    END                                                         AS alert
FROM tickets t
LEFT JOIN latest_status ls  ON ls.ticket_id = t.id
LEFT JOIN status_sla    sla ON sla.status   = COALESCE(ls.status, t.status);
