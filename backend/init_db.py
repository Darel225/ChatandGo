import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

# Script de création des tables fourni par l'utilisateur
SCHEMA_SQL = """
-- Table principale des prestataires
CREATE TABLE IF NOT EXISTS prestataires (
    id                  SERIAL PRIMARY KEY,
    nom                 VARCHAR(255) NOT NULL,
    prenom              VARCHAR(255),
    categorie           VARCHAR(100) NOT NULL,
    sous_categorie      VARCHAR(100),
    ville               VARCHAR(100) NOT NULL,
    quartier            VARCHAR(100),
    telephone           VARCHAR(20) NOT NULL,
    whatsapp            VARCHAR(20),
    description         TEXT,
    experience_annees   INTEGER,
    tarif_min           INTEGER,
    tarif_max           INTEGER,
    unite_tarif         VARCHAR(50) DEFAULT 'par intervention',
    note_moyenne        DECIMAL(2,1) DEFAULT 0.0,
    nb_avis             INTEGER DEFAULT 0,
    disponible          BOOLEAN DEFAULT TRUE,
    zone_intervention   TEXT[],
    langues             TEXT[] DEFAULT ARRAY['Français'],
    photo_url           TEXT,
    verified            BOOLEAN DEFAULT FALSE,
    date_inscription    TIMESTAMP DEFAULT NOW(),
    actif               BOOLEAN DEFAULT TRUE
);

-- Table des avis clients
CREATE TABLE IF NOT EXISTS avis (
    id              SERIAL PRIMARY KEY,
    prestataire_id  INTEGER REFERENCES prestataires(id) ON DELETE CASCADE,
    note            SMALLINT CHECK (note BETWEEN 1 AND 5),
    commentaire     TEXT,
    date_avis       TIMESTAMP DEFAULT NOW()
);

-- Table des conversations
CREATE TABLE IF NOT EXISTS conversations (
    id              SERIAL PRIMARY KEY,
    session_id      VARCHAR(100) NOT NULL,
    message_user    TEXT NOT NULL,
    reponse_agent   TEXT,
    intention       VARCHAR(100),
    categorie_detectee VARCHAR(100),
    ville_detectee  VARCHAR(100),
    prestataires_proposes INTEGER[],
    timestamp       TIMESTAMP DEFAULT NOW()
);

-- Index pour la performance
CREATE INDEX IF NOT EXISTS idx_prestataires_categorie ON prestataires(categorie);
CREATE INDEX IF NOT EXISTS idx_prestataires_ville ON prestataires(ville);
CREATE INDEX IF NOT EXISTS idx_prestataires_disponible ON prestataires(disponible);
CREATE INDEX IF NOT EXISTS idx_conversations_session ON conversations(session_id);
"""

conn = psycopg2.connect(os.getenv("DATABASE_URL"))
cur = conn.cursor()

try:
    print("Création des tables en cours...")
    cur.execute(SCHEMA_SQL)
    conn.commit()
    print("Tables créées avec succès !")
except Exception as e:
    print(f"Erreur lors de la création : {e}")
finally:
    cur.close()
    conn.close()
