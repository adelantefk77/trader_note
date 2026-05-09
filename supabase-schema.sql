-- ============================================================
-- TraderNote — Schemat Bazy Danych PostgreSQL (Supabase)
-- Wklej i uruchom w: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. TABELA STRATEGII
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS strategies (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        VARCHAR(100) NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- 2. TABELA TRANSAKCJI
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS trades (
  id              UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID           NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  strategy_id     UUID           REFERENCES strategies(id) ON DELETE SET NULL,
  instrument      VARCHAR(20)    NOT NULL,
  direction       VARCHAR(5)     NOT NULL CHECK (direction IN ('LONG', 'SHORT')),
  entry_time      TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  exit_time       TIMESTAMPTZ,
  entry_price     NUMERIC(15,5)  NOT NULL,
  exit_price      NUMERIC(15,5),
  stop_loss       NUMERIC(15,5)  NOT NULL,
  take_profit     NUMERIC(15,5),
  position_size   NUMERIC(15,5)  NOT NULL,
  commission_fees NUMERIC(10,2)  NOT NULL DEFAULT 0.00,
  notes           TEXT,
  status          VARCHAR(6)     NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'CLOSED')),
  created_at      TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trades_user_id    ON trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_entry_time ON trades(entry_time DESC);
CREATE INDEX IF NOT EXISTS idx_trades_instrument ON trades(instrument);
CREATE INDEX IF NOT EXISTS idx_trades_status     ON trades(status);

-- 3. TABELA TAGÓW
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tags (
  id       UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id  UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name     VARCHAR(50) NOT NULL,
  category VARCHAR(10) NOT NULL CHECK (category IN ('MISTAKE','CONDITION','EMOTION','QUALITY')),
  UNIQUE(user_id, name)
);

-- 4. TABELA ŁĄCZNIKOWA TRANSAKCJA ↔ TAG
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS trade_tags (
  trade_id UUID NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
  tag_id   UUID NOT NULL REFERENCES tags(id)   ON DELETE CASCADE,
  PRIMARY KEY (trade_id, tag_id)
);

-- 5. TABELA ZRZUTÓW EKRANU (metadane — pliki w Supabase Storage)
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS screenshots (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_id     UUID        NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_path TEXT        NOT NULL,
  phase        VARCHAR(15) NOT NULL CHECK (phase IN ('BEFORE_ENTRY','AFTER_EXIT')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE strategies  ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades       ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags         ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_tags   ENABLE ROW LEVEL SECURITY;
ALTER TABLE screenshots  ENABLE ROW LEVEL SECURITY;

-- Polityki: każdy widzi tylko swoje dane
CREATE POLICY "own_strategies" ON strategies  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_trades"     ON trades      FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_tags"       ON tags        FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_screenshots" ON screenshots FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "own_trade_tags" ON trade_tags FOR ALL
  USING (EXISTS (
    SELECT 1 FROM trades WHERE trades.id = trade_tags.trade_id AND trades.user_id = auth.uid()
  ));

-- ============================================================
-- SEED: DOMYŚLNE TAGI (uruchom po zalogowaniu na konto)
-- Zastąp '00000000-0000-0000-0000-000000000000' swoim user_id
-- (znajdziesz go w: Authentication → Users)
-- ============================================================

-- DO $$
-- DECLARE
--   v_user_id UUID := '00000000-0000-0000-0000-000000000000'; -- << WSTAW SWOJE USER_ID
-- BEGIN
--   INSERT INTO tags (user_id, name, category) VALUES
--     (v_user_id, 'FOMO',            'MISTAKE'),
--     (v_user_id, 'Revenge Trading', 'MISTAKE'),
--     (v_user_id, 'Oversize',        'MISTAKE'),
--     (v_user_id, 'Hesitation',      'MISTAKE'),
--     (v_user_id, 'A-Setup',         'QUALITY'),
--     (v_user_id, 'Zgodnie z Planem','QUALITY'),
--     (v_user_id, 'Cierpliwość',     'EMOTION'),
--     (v_user_id, 'Skupienie',       'EMOTION'),
--     (v_user_id, 'Euforia',         'EMOTION'),
--     (v_user_id, 'Silny Trend',     'CONDITION'),
--     (v_user_id, 'Niska Płynność',  'CONDITION'),
--     (v_user_id, 'Pre-News',        'CONDITION')
--   ON CONFLICT (user_id, name) DO NOTHING;
-- END $$;
