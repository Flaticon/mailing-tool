-- schema-tracking.sql
-- Crear tabla para tracking de emails

CREATE TABLE IF NOT EXISTS email_opens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tracking_id TEXT NOT NULL,
  timestamp DATETIME NOT NULL,
  user_agent TEXT,
  ip_address TEXT,
  referer TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_tracking_id ON email_opens(tracking_id);
CREATE INDEX IF NOT EXISTS idx_timestamp ON email_opens(timestamp);

-- Insertar datos de prueba
INSERT OR IGNORE INTO email_opens (tracking_id, timestamp, user_agent, ip_address) VALUES 
('test123abc', '2024-08-29T10:30:00Z', 'Mozilla/5.0 Test Browser', '127.0.0.1'),
('test456def', '2024-08-29T11:45:00Z', 'Chrome/120.0 Test', '192.168.1.1');