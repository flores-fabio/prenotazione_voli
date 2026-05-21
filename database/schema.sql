-- ✈️ SCHEMA DATABASE PRENOTAZIONE VOLI
-- Database completo con tutte le tabelle necessarie

CREATE DATABASE IF NOT EXISTS prenotazione_volo;
USE prenotazione_volo;

-- ================================
-- 1. TABELLA COMPAGNIE AEREE
-- ================================
CREATE TABLE IF NOT EXISTS Compagnie_Aeree (
    id_compagnia INT PRIMARY KEY AUTO_INCREMENT,
    -- ID univoco della compagnia aerea
    nome VARCHAR(100) NOT NULL UNIQUE,
    -- Nome della compagnia (es: Alitalia, Lufthansa)
    codice_iata VARCHAR(3) NOT NULL UNIQUE,
    -- Codice IATA a 3 lettere (es: AZ per Alitalia)
    descrizione TEXT,
    -- Descrizione della compagnia aerea
    data_creazione TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    -- Data e ora di creazione del record
);

-- ================================
-- 2. TABELLA AEROPORTI
-- ================================
CREATE TABLE IF NOT EXISTS Aeroporti (
    id_aeroporto INT PRIMARY KEY AUTO_INCREMENT,
    -- ID univoco dell'aeroporto
    codice_iata VARCHAR(3) NOT NULL UNIQUE,
    -- Codice IATA (es: FCO per Roma Fiumicino)
    nome VARCHAR(100) NOT NULL,
    -- Nome dell'aeroporto
    citta VARCHAR(50) NOT NULL,
    -- Città dove si trova l'aeroporto
    paese VARCHAR(50) NOT NULL,
    -- Paese dell'aeroporto
    data_creazione TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    -- Data e ora di creazione
);

-- ================================
-- 3. TABELLA AEREI
-- ================================
CREATE TABLE IF NOT EXISTS Aerei (
    id_aereo INT PRIMARY KEY AUTO_INCREMENT,
    -- ID univoco dell'aereo
    codice_aereo VARCHAR(10) NOT NULL UNIQUE,
    -- Codice identificativo dell'aereo (es: EI-RJA)
    modello VARCHAR(50) NOT NULL,
    -- Modello dell'aereo (es: Boeing 737, Airbus A320)
    capienza_passeggeri INT NOT NULL,
    -- Numero totale di posti passeggeri
    id_compagnia INT NOT NULL,
    -- ID della compagnia aerea proprietaria
    data_creazione TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Data e ora di creazione
    FOREIGN KEY (id_compagnia) REFERENCES Compagnie_Aeree(id_compagnia) ON DELETE CASCADE
    -- Collegamento alla tabella delle compagnie
);

-- ================================
-- 4. TABELLA VOLI
-- ================================
CREATE TABLE IF NOT EXISTS Voli (
    id_volo INT PRIMARY KEY AUTO_INCREMENT,
    -- ID univoco del volo
    numero_volo VARCHAR(10) NOT NULL UNIQUE,
    -- Numero del volo (es: AZ123)
    id_aereo INT NOT NULL,
    -- ID dell'aereo che effettua il volo
    id_aeroporto_partenza INT NOT NULL,
    -- ID dell'aeroporto di partenza
    id_aeroporto_arrivo INT NOT NULL,
    -- ID dell'aeroporto di arrivo
    data_partenza DATETIME NOT NULL,
    -- Data e ora della partenza
    data_arrivo DATETIME NOT NULL,
    -- Data e ora dell'arrivo
    prezzo_base DECIMAL(10, 2) NOT NULL,
    -- Prezzo base del biglietto
    posti_disponibili INT NOT NULL,
    -- Numero di posti ancora disponibili
    stato VARCHAR(20) DEFAULT 'Programmato',
    -- Stato del volo (Programmato, In Volo, Completato, Cancellato)
    data_creazione TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Data e ora di creazione
    FOREIGN KEY (id_aereo) REFERENCES Aerei(id_aereo) ON DELETE CASCADE,
    FOREIGN KEY (id_aeroporto_partenza) REFERENCES Aeroporti(id_aeroporto),
    FOREIGN KEY (id_aeroporto_arrivo) REFERENCES Aeroporti(id_aeroporto)
    -- Collegamenti alle tabelle correlate
);

-- ================================
-- 5. TABELLA UTENTI
-- ================================
CREATE TABLE IF NOT EXISTS Utenti (
    id_utente INT PRIMARY KEY AUTO_INCREMENT,
    -- ID univoco dell'utente
    email VARCHAR(100) NOT NULL UNIQUE,
    -- Email dell'utente (usata come login)
    password_hash VARCHAR(255) NOT NULL,
    -- Password crittografata (non in chiaro!)
    nome VARCHAR(50) NOT NULL,
    -- Nome dell'utente
    cognome VARCHAR(50) NOT NULL,
    -- Cognome dell'utente
    data_nascita DATE,
    -- Data di nascita
    nazionalita VARCHAR(50),
    -- Nazionalità
    numero_passaporto VARCHAR(20),
    -- Numero del passaporto
    numero_telefono VARCHAR(20),
    -- Numero di telefono
    indirizzo VARCHAR(100),
    -- Indirizzo di residenza
    data_iscrizione TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Data di iscrizione al sistema
    ultimo_accesso TIMESTAMP,
    -- Data dell'ultimo accesso
    stato_account VARCHAR(20) DEFAULT 'Attivo'
    -- Stato dell'account (Attivo, Sospeso, Chiuso)
);

-- ================================
-- 6. TABELLA POSTI
-- ================================
CREATE TABLE IF NOT EXISTS Posti (
    id_posto INT PRIMARY KEY AUTO_INCREMENT,
    -- ID univoco del posto
    id_volo INT NOT NULL,
    -- ID del volo a cui appartiene il posto
    numero_posto VARCHAR(5) NOT NULL,
    -- Numero del posto (es: 12A, 1F)
    classe VARCHAR(20) DEFAULT 'Economica',
    -- Classe del posto (Economica, Business, First)
    disponibile BOOLEAN DEFAULT TRUE,
    -- TRUE se il posto è disponibile, FALSE se prenotato
    data_creazione TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Data e ora di creazione
    UNIQUE KEY unique_posto (id_volo, numero_posto),
    -- Combinazione (volo, numero_posto) deve essere unica
    FOREIGN KEY (id_volo) REFERENCES Voli(id_volo) ON DELETE CASCADE
    -- Collegamento alla tabella voli
);

-- ================================
-- 7. TABELLA PRENOTAZIONI
-- ================================
CREATE TABLE IF NOT EXISTS Prenotazioni (
    id_prenotazione INT PRIMARY KEY AUTO_INCREMENT,
    -- ID univoco della prenotazione
    id_utente INT NOT NULL,
    -- ID dell'utente che ha effettuato la prenotazione
    id_volo INT NOT NULL,
    -- ID del volo prenotato
    data_prenotazione DATETIME DEFAULT CURRENT_TIMESTAMP,
    -- Data e ora della prenotazione
    numero_prenotazione VARCHAR(20) NOT NULL UNIQUE,
    -- Numero di riferimento della prenotazione
    stato VARCHAR(20) DEFAULT 'Confermata',
    -- Stato (Confermata, In Attesa, Annullata)
    numero_passeggeri INT NOT NULL,
    -- Numero di passeggeri inclusi nella prenotazione
    prezzo_totale DECIMAL(10, 2) NOT NULL,
    -- Prezzo totale della prenotazione
    data_modifica TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    -- Data dell'ultima modifica
    FOREIGN KEY (id_utente) REFERENCES Utenti(id_utente) ON DELETE CASCADE,
    FOREIGN KEY (id_volo) REFERENCES Voli(id_volo) ON DELETE CASCADE
    -- Collegamenti alle tabelle correlate
);

-- ================================
-- 8. TABELLA BIGLIETTI
-- ================================
CREATE TABLE IF NOT EXISTS Biglietti (
    id_biglietto INT PRIMARY KEY AUTO_INCREMENT,
    -- ID univoco del biglietto
    id_prenotazione INT NOT NULL,
    -- ID della prenotazione associata
    id_posto INT NOT NULL,
    -- ID del posto prenotato
    numero_biglietto VARCHAR(20) NOT NULL UNIQUE,
    -- Numero univoco del biglietto
    nome_passeggero VARCHAR(100) NOT NULL,
    -- Nome completo del passeggero
    cognome_passeggero VARCHAR(100) NOT NULL,
    -- Cognome del passeggero
    data_emissione DATETIME DEFAULT CURRENT_TIMESTAMP,
    -- Data di emissione del biglietto
    stato VARCHAR(20) DEFAULT 'Attivo',
    -- Stato (Attivo, Utilizzato, Annullato)
    FOREIGN KEY (id_prenotazione) REFERENCES Prenotazioni(id_prenotazione) ON DELETE CASCADE,
    FOREIGN KEY (id_posto) REFERENCES Posti(id_posto) ON DELETE CASCADE
    -- Collegamenti alle tabelle correlate
);

-- ================================
-- 9. TABELLA PAGAMENTI
-- ================================
CREATE TABLE IF NOT EXISTS Pagamenti (
    id_pagamento INT PRIMARY KEY AUTO_INCREMENT,
    -- ID univoco del pagamento
    id_prenotazione INT NOT NULL,
    -- ID della prenotazione associata
    importo DECIMAL(10, 2) NOT NULL,
    -- Importo pagato
    metodo_pagamento VARCHAR(50) NOT NULL,
    -- Metodo (Carta Credito, PayPal, Bonifico, ecc)
    data_pagamento DATETIME DEFAULT CURRENT_TIMESTAMP,
    -- Data e ora del pagamento
    numero_transazione VARCHAR(50) NOT NULL UNIQUE,
    -- Numero di transazione univoco
    stato VARCHAR(20) DEFAULT 'Completato',
    -- Stato del pagamento (Completato, In Sospeso, Fallito)
    descrizione TEXT,
    -- Descrizione aggiuntiva del pagamento
    FOREIGN KEY (id_prenotazione) REFERENCES Prenotazioni(id_prenotazione) ON DELETE CASCADE
    -- Collegamento alla tabella prenotazioni
);

-- ================================
-- 10. TABELLA BAGAGLI
-- ================================
CREATE TABLE IF NOT EXISTS Bagagli (
    id_bagaglio INT PRIMARY KEY AUTO_INCREMENT,
    -- ID univoco del bagaglio
    id_biglietto INT NOT NULL,
    -- ID del biglietto associato
    peso_kg DECIMAL(5, 2) NOT NULL,
    -- Peso del bagaglio in kg
    tipo_bagaglio VARCHAR(50),
    -- Tipo (Mano, Stiva, Extra)
    stato VARCHAR(20) DEFAULT 'In Elaborazione',
    -- Stato (In Elaborazione, Caricato, Consegnato, Smarrito)
    data_registrazione TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Data di registrazione del bagaglio
    FOREIGN KEY (id_biglietto) REFERENCES Biglietti(id_biglietto) ON DELETE CASCADE
    -- Collegamento alla tabella biglietti
);

-- ================================
-- INDICI PER OTTIMIZZARE LE QUERY
-- ================================
CREATE INDEX idx_voli_partenza ON Voli(id_aeroporto_partenza);
-- Indice per cercare voli per aeroporto di partenza
CREATE INDEX idx_voli_arrivo ON Voli(id_aeroporto_arrivo);
-- Indice per cercare voli per aeroporto di arrivo
CREATE INDEX idx_voli_data ON Voli(data_partenza);
-- Indice per cercare voli per data
CREATE INDEX idx_prenotazioni_utente ON Prenotazioni(id_utente);
-- Indice per cercare prenotazioni per utente
CREATE INDEX idx_pagamenti_prenotazione ON Pagamenti(id_prenotazione);
-- Indice per cercare pagamenti per prenotazione
CREATE INDEX idx_posti_volo ON Posti(id_volo);
-- Indice per cercare posti per volo

-- ================================
-- DATI DI ESEMPIO PER TEST
-- ================================

-- Inserimento compagnie aeree
INSERT INTO Compagnie_Aeree (nome, codice_iata, descrizione) VALUES
('Alitalia', 'AZ', 'Compagnia aerea italiana'),
('Lufthansa', 'LH', 'Compagnia aerea tedesca'),
('Air France', 'AF', 'Compagnia aerea francese');

-- Inserimento aeroporti
INSERT INTO Aeroporti (codice_iata, nome, citta, paese) VALUES
('FCO', 'Fiumicino', 'Roma', 'Italia'),
('MXP', 'Malpensa', 'Milano', 'Italia'),
('CDG', 'Charles de Gaulle', 'Parigi', 'Francia'),
('TXL', 'Berlin', 'Berlino', 'Germania');

-- Inserimento aerei
INSERT INTO Aerei (codice_aereo, modello, capienza_passeggeri, id_compagnia) VALUES
('EI-ABC', 'Boeing 737', 150, 1),
('EI-DEF', 'Airbus A320', 180, 1),
('LH-001', 'Airbus A380', 555, 2);

-- Inserimento voli
INSERT INTO Voli (numero_volo, id_aereo, id_aeroporto_partenza, id_aeroporto_arrivo, 
                   data_partenza, data_arrivo, prezzo_base, posti_disponibili, stato) VALUES
('AZ001', 1, 1, 3, '2026-06-15 09:00:00', '2026-06-15 12:30:00', 150.00, 140, 'Programmato'),
('AZ002', 2, 3, 1, '2026-06-15 14:00:00', '2026-06-15 17:30:00', 160.00, 170, 'Programmato'),
('LH001', 3, 2, 4, '2026-06-16 10:00:00', '2026-06-16 13:00:00', 200.00, 550, 'Programmato');

-- Inserimento utente di test
INSERT INTO Utenti (email, password_hash, nome, cognome, data_nascita, nazionalita, numero_telefono) VALUES
('test@example.com', 'hashed_password', 'Mario', 'Rossi', '2000-01-15', 'Italiana', '3331234567');
