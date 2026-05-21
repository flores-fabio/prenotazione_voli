# ✈️ Prenotazione Voli - Progetto Fullstack Completo

## 📋 Descrizione

Sistema completo per la prenotazione di voli con:
- **Frontend**: Angular con componenti moderni
- **Backend**: Flask (Python) con API REST
- **Database**: MariaDB con 10 tabelle relazionate
- **UI**: Responsive design mobile-friendly

## 🚀 Quick Start

### 1️⃣ Installazione Database

```bash
# Accedi a MariaDB
mysql -u root -p

# Esegui lo script SQL
SOURCE /path/to/database/schema.sql

# Verifica che il database sia stato creato
USE prenotazione_volo;
SHOW TABLES;
```

### 2️⃣ Installazione Backend (Flask)

```bash
# Entra nella cartella backend
cd backend

# Crea un ambiente virtuale
python3 -m venv venv

# Attiva l'ambiente
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows

# Installa le dipendenze
pip install -r requirements.txt
```

### 2.1️⃣ Configurazione variabili d'ambiente

Copia il file di esempio e modifica le credenziali se necessario:

```bash
cp .env.example .env
```

Poi avvia il server:

```bash
python app.py
```

Il backend partirà su http://localhost:5000

### ⚠️ Creazione utente database (consigliato)

Per evitare di usare l'account `root`, crea un utente dedicato e assegna i permessi:

```sql
-- esegui come utente con privilegi (es. sudo mysql)
CREATE USER IF NOT EXISTS 'prenotazione_user'@'localhost' IDENTIFIED BY 'Prenotazione123!';
GRANT ALL PRIVILEGES ON prenotazione_volo.* TO 'prenotazione_user'@'localhost';
FLUSH PRIVILEGES;
```

Poi aggiorna il file `backend/.env` con le credenziali dell'utente creato:

```
DB_HOST=localhost
DB_USER=prenotazione_user
DB_PASSWORD=Prenotazione123!
DB_NAME=prenotazione_volo
DB_SOCKET=/run/mysqld/mysqld.sock
CORS_ORIGINS=http://localhost:4200
```

Non committare mai il file `backend/.env` su repository pubblici. Il file è aggiunto a `.gitignore`.

### ▶️ Comandi utili per avviare il progetto (sviluppo)

Backend (avvia il server Flask):
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # oppure creare/aggiornare backend/.env con le tue credenziali
python app.py
```

Frontend (avvia il dev server Angular):
```bash
cd prenotazione-volo-frontend
npm install
npm run build   # per produzione/build
ng serve --open  # sviluppo, apre http://localhost:4200
```

### ⚙️ Test rapido API (curl)

Lista voli:
```bash
curl http://127.0.0.1:5000/api/voli
```

Dettaglio volo:
```bash
curl http://127.0.0.1:5000/api/voli/1
```

Crea prenotazione (esempio):
```bash
curl -X POST http://127.0.0.1:5000/api/prenotazioni \
    -H "Content-Type: application/json" \
    -d '{"id_utente":1,"id_volo":1,"numero_passeggeri":1,"posti":[1]}'
```



### 3️⃣ Installazione Frontend (Angular)

```bash
# Entra nella cartella frontend
cd prenotazione-volo-frontend

# Installa le dipendenze
npm install

# Avvia il server di sviluppo
ng serve --open
# Si aprirà automaticamente http://localhost:4200
```

## 📁 Struttura del Progetto

```
prenotazione_voli/
├── database/
│   └── schema.sql          # Schema database con 10 tabelle
├── backend/
│   ├── app.py              # API Flask con tutti i routes
│   ├── db.py               # Gestione connessione database
│   └── requirements.txt     # Dipendenze Python
└── prenotazione-volo-frontend/
    ├── src/
    │   ├── app/
    │   │   ├── components/
    │   │   │   ├── lista-voli.component.ts
    │   │   │   ├── dettaglio-volo.component.ts
    │   │   │   ├── login.component.ts
    │   │   │   └── le-mie-prenotazioni.component.ts
    │   │   ├── services/
    │   │   │   ├── voli.service.ts
    │   │   │   ├── prenotazioni.service.ts
    │   │   │   ├── utenti.service.ts
    │   │   │   └── pagamenti.service.ts
    │   └── main.ts
    └── package.json
```

## 🔌 API REST Endpoints

### Voli
```
GET    /api/voli                 # Lista tutti i voli
GET    /api/voli/<id>            # Dettagli singolo volo
GET    /api/voli/cerca?...       # Ricerca con filtri
```

### Prenotazioni
```
GET    /api/prenotazioni?id_utente=1     # Prenotazioni dell'utente
GET    /api/prenotazioni/<id>            # Dettagli prenotazione
POST   /api/prenotazioni                 # Crea prenotazione
DELETE /api/prenotazioni/<id>            # Annulla prenotazione
```

### Utenti
```
POST   /api/utenti/login                 # Login
POST   /api/utenti                       # Registrazione
GET    /api/utenti/<id>                  # Profilo utente
PUT    /api/utenti/<id>                  # Aggiorna profilo
```

## 🎓 Note per l'Esame

Vedi il file **DOCUMENTAZIONE_ESAME.md** per:
- **15 domande frequenti** con risposte complete
- **Spiegazione flusso dati** completa
- **Esempi di live coding**
- **Concetti chiave** semplificati
- **Architettura e design patterns**

Tutto il codice è **commentato riga per riga in italiano semplice** per facilare la comprensione e lo studio.

## 🐛 Troubleshooting

### Database non si connette
```bash
# Verificare che MariaDB sia in esecuzione
sudo systemctl start mariadb

# Testare connessione
mysql -u root -p
```

### CORS Policy Error
```bash
# Assicurati che in backend app.py c'è:
from flask_cors import CORS
CORS(app)
```

### Port already in use
```bash
# Cambia la porta in app.py
app.run(port=5001)

# O in Angular
ng serve --port 4201
```

---

**Progetto scolastico per esame informatica**
**Linguaggio: Italiano semplice**
**Ultimo aggiornamento: Maggio 2026**