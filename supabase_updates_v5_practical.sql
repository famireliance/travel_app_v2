-- Phase 5: population と practical_info (JSONB) カラムの追加

-- populationがまだない場合は追加 (前回実行済みであればエラーにならないようIF NOT EXISTS相当の処理が必要ですが、単純なADD COLUMNを記載します)
-- 既に実行済みの場合は以下の行はエラーになりますが無視して構いません
ALTER TABLE islands ADD COLUMN IF NOT EXISTS population TEXT;

-- 実用情報や競合対抗の評価パラメータを格納するJSONBカラム
ALTER TABLE islands ADD COLUMN IF NOT EXISTS practical_info JSONB DEFAULT '{}'::jsonb;
