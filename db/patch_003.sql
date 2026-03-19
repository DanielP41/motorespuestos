-- Patch 003 — Auth: logout invalidation + password reset tokens

-- Usuarios admin/vendedor
ALTER TABLE usuarios
    ADD COLUMN IF NOT EXISTS token_invalidated_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS password_reset_token  VARCHAR(100),
    ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMPTZ;

-- Clientes públicos
ALTER TABLE cliente
    ADD COLUMN IF NOT EXISTS token_invalidated_at  TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS password_reset_token  VARCHAR(100),
    ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_usuarios_reset_token ON usuarios (password_reset_token);
CREATE INDEX IF NOT EXISTS idx_cliente_reset_token  ON cliente  (password_reset_token);

SELECT 'Patch 003 aplicado correctamente' AS resultado;
