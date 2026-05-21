📚 DOCUMENTAZIONE COMPLETA - PRENOTAZIONE VOLI
===============================================

Una guida completa per lo studente che deve spiegare il progetto al professore.

================================================================================
📋 INDICE
================================================================================

1. 🏗️ Architettura del Progetto
2. 🔄 Flusso Dati Completo
3. 🎓 Concetti Chiave
4. 🎤 15 Domande Frequenti dell'Esame
5. 💻 Esempi di Live Coding
6. 🔒 Sicurezza e Best Practices
7. 📊 Diagramma Banca Dati

================================================================================
🏗️ ARCHITETTURA DEL PROGETTO
================================================================================

STRUTTURA GENERALE:
┌─────────────────────────────────────────────────────────────────┐
│                    BROWSER (Frontend Angular)                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Componenti:                                             │  │
│  │  - ListaVoli (ricerca e visualizzazione)                │  │
│  │  - DettaglioVolo (selezione posti e prenotazione)       │  │
│  │  - Login (autenticazione)                               │  │
│  │  - LeMiePrenotazioni (visualizzazione prenotazioni)     │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↕️ HTTP REST API
                        (localhost:4200)
┌─────────────────────────────────────────────────────────────────┐
│                 SERVER (Backend Flask Python)                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Routes (API Endpoints):                                 │  │
│  │  - /api/voli (GET, POST)                                │  │
│  │  - /api/prenotazioni (GET, POST, DELETE)                │  │
│  │  - /api/pagamenti (POST, GET)                           │  │
│  │  - /api/utenti (GET, PUT, POST)                         │  │
│  │  - /api/aeroporti (GET)                                 │  │
│  │  - /api/compagnie (GET)                                 │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↕️ PyMySQL
                        (localhost:3306)
┌─────────────────────────────────────────────────────────────────┐
│                    DATABASE (MariaDB)                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Tabelle:                                                │  │
│  │  - Compagnie_Aeree  - Aerei       - Aeroporti           │  │
│  │  - Voli             - Utenti      - Prenotazioni        │  │
│  │  - Biglietti        - Posti       - Pagamenti           │  │
│  │  - Bagagli                                              │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘

================================================================================
🔄 FLUSSO DATI COMPLETO (DA ZERO A PRENOTAZIONE)
================================================================================

FLUSSO 1: RICERCA VOLI
─────────────────────

1. Utente entra in home (localhost:4200/)
2. Caricamento automatico del componente ListaVoli
3. ListaVoli chiama VoliService.getAllVoli()
4. VoliService fa una richiesta HTTP GET a: http://localhost:5000/api/voli
5. Backend Flask (app.py) riceve la GET su @app.route('/api/voli')
6. Flask esegue una JOIN complessa tra:
   - Voli
   - Aeroporti (partenza e arrivo)
   - Aerei
   - Compagnie_Aeree
7. I risultati ritornano in JSON al frontend
8. Angular riceve i dati e li visualizza in una lista

CODICE BACKEND (app.py):
────────────────────────
@app.route('/api/voli', methods=['GET'])
def get_voli():
    sql = """
    SELECT v.id_volo, v.numero_volo, v.data_partenza,
           ap.nome as aeroporto_partenza,
           aa.nome as aeroporto_arrivo,
           c.nome as compagnia, v.prezzo_base
    FROM Voli v
    JOIN Aeroporti ap ON v.id_aeroporto_partenza = ap.id_aeroporto
    JOIN Aeroporti aa ON v.id_aeroporto_arrivo = aa.id_aeroporto
    JOIN Aerei ae ON v.id_aereo = ae.id_aereo
    JOIN Compagnie_Aeree c ON ae.id_compagnia = c.id_compagnia
    ORDER BY v.data_partenza
    """
    voli = esegui_query(sql)
    return jsonify(voli), 200

CODICE FRONTEND (lista-voli.component.ts):
──────────────────────────────────────────
ngOnInit(): void {
    this.voliService.getAllVoli().subscribe(
        (dati: any[]) => {
            this.voli = dati;  // Salvo i voli
            this.voli_filtrati = dati;  // Mostro tutti
        },
        (errore: any) => {
            this.errore = 'Errore nel caricamento';
        }
    );
}

FLUSSO 2: PRENOTAZIONE
──────────────────────

1. Utente clicca su "Prenota" per un volo
2. Naviga a /dettaglio-volo/1 (dove 1 è l'ID)
3. Componente DettaglioVolo carica i dettagli con VoliService.getVoloDettaglio(1)
4. Backend ritorna: dati volo + lista posti disponibili
5. Utente seleziona N posti cliccando su di essi
6. Utente clicca "Procedi alla Prenotazione"
7. Frontend chiama PrenotazioniService.creaPrenotazione(dati)
8. Richiesta POST a http://localhost:5000/api/prenotazioni
9. Backend:
   a) Verifica che l'utente esista
   b) Verifica che il volo esista
   c) Crea un record in Prenotazioni
   d) Per ogni posto: crea un record in Biglietti
   e) Marca i posti come non disponibili in Posti
   f) Aggiorna posti_disponibili in Voli
10. Backend ritorna il numero della prenotazione
11. Frontend mostra messaggio di successo
12. Utente reindirizzato a /le-mie-prenotazioni

CODICE BACKEND:
───────────────
@app.route('/api/prenotazioni', methods=['POST'])
def crea_prenotazione():
    dati = request.get_json()
    id_utente = dati['id_utente']
    id_volo = dati['id_volo']
    numero_passeggeri = dati['numero_passeggeri']
    posti = dati['posti']  # Lista di ID posti
    
    # 1. Verifico utente
    result_utente = esegui_query("SELECT id_utente FROM Utenti WHERE id_utente = %s", (id_utente,))
    if not result_utente:
        return jsonify({'errore': 'Utente non trovato'}), 404
    
    # 2. Ottengo prezzo base volo
    result_volo = esegui_query("SELECT prezzo_base FROM Voli WHERE id_volo = %s", (id_volo,))
    prezzo_base = float(result_volo[0]['prezzo_base'])
    prezzo_totale = prezzo_base * numero_passeggeri
    
    # 3. Genero numero prenotazione univoco
    numero_prenotazione = f"PV{datetime.now().strftime('%Y%m%d')}{random.randint(1000, 9999)}"
    
    # 4. Creo la prenotazione
    sql_insert = """
    INSERT INTO Prenotazioni 
    (id_utente, id_volo, numero_prenotazione, numero_passeggeri, prezzo_totale, stato)
    VALUES (%s, %s, %s, %s, %s, 'Confermata')
    """
    id_prenotazione = esegui_modifica(sql_insert, 
        (id_utente, id_volo, numero_prenotazione, numero_passeggeri, prezzo_totale))
    
    # 5. Creo i biglietti e marco i posti
    for i, id_posto in enumerate(posti):
        # Creo biglietto
        numero_biglietto = f"BG{numero_prenotazione}{i+1}"
        sql_biglietto = """
        INSERT INTO Biglietti (id_prenotazione, id_posto, numero_biglietto, nome_passeggero, stato)
        VALUES (%s, %s, %s, 'Passeggero', 'Attivo')
        """
        esegui_modifica(sql_biglietto, (id_prenotazione, id_posto, numero_biglietto))
        
        # Marco il posto come non disponibile
        esegui_modifica("UPDATE Posti SET disponibile = FALSE WHERE id_posto = %s", (id_posto,))
    
    # 6. Aggiorno posti disponibili volo
    esegui_modifica(
        "UPDATE Voli SET posti_disponibili = posti_disponibili - %s WHERE id_volo = %s",
        (numero_passeggeri, id_volo)
    )
    
    return jsonify({
        'id_prenotazione': id_prenotazione,
        'numero_prenotazione': numero_prenotazione,
        'prezzo_totale': prezzo_totale
    }), 201

CODICE FRONTEND:
────────────────
procedintePrenotazione(): void {
    const utente = this.utentiService.getUtenteCorrente();
    const dati_prenotazione = {
        id_utente: utente.id_utente,
        id_volo: this.volo.id_volo,
        numero_passeggeri: this.numero_passeggeri,
        posti: this.posti_selezionati.map((p: any) => p.id_posto)
    };
    
    this.prenotazioniService.creaPrenotazione(dati_prenotazione).subscribe(
        (risposta: any) => {
            this.successo = `Prenotazione ${risposta.numero_prenotazione} effettuata!`;
            setTimeout(() => this.router.navigate(['/le-mie-prenotazioni']), 2000);
        }
    );
}

================================================================================
🎓 CONCETTI CHIAVE
================================================================================

1. OBSERVABLE (RxJS)
───────────────────
Cos'è: Un oggetto che emette valori nel tempo (come un flusso di dati)
Perché: Per gestire le richieste HTTP asincrone in modo elegante

Esempio:
    this.voliService.getAllVoli().subscribe(
        (dati) => console.log('Dati ricevuti:', dati),  // Success
        (errore) => console.error('Errore:', errore)     // Error
    );

Nel servizio:
    getAllVoli(): Observable<any[]> {
        return this.http.get<any[]>(this.apiUrl);
        // Ritorno un Observable che emette l'array dei voli
    }

2. TWO-WAY BINDING
─────────────────
Cosa significa: Sincronizzazione automatica tra HTML e TypeScript

HTML:
    <input [(ngModel)]="numero_passeggeri">

TypeScript:
    numero_passeggeri = 1;

Se cambio HTML → numero_passeggeri cambia automaticamente
Se cambio numero_passeggeri → HTML cambia automaticamente

3. DEPENDENCY INJECTION
──────────────────────
Cosa significa: Passare le dipendenze al constructor, non crearle dentro

Corretto (DI):
    constructor(private http: HttpClient) { }

Sbagliato (NO DI):
    const http = new HttpClient();

Perché: Più facile da testare, più disaccoppiato, più mantenibile

4. REST API
──────────
Basata su 4 verbi HTTP:
- GET: legge dati (GET /api/voli)
- POST: crea dati (POST /api/prenotazioni)
- PUT: modifica dati (PUT /api/prenotazioni/1)
- DELETE: cancella dati (DELETE /api/prenotazioni/1)

Esempio di URL REST:
    GET /api/voli → ottieni tutti i voli
    GET /api/voli/1 → ottieni il volo con ID 1
    POST /api/voli → crea un nuovo volo
    PUT /api/voli/1 → modifica il volo 1
    DELETE /api/voli/1 → cancella il volo 1

5. JSON
───────
Formato per scambiare dati tra frontend e backend

Esempio risposta volo:
{
    "id_volo": 1,
    "numero_volo": "AZ001",
    "data_partenza": "2026-06-15T09:00:00",
    "prezzo_base": 150.00,
    "posti_disponibili": 140,
    "aeroporto_partenza": "Roma Fiumicino",
    "aeroporto_arrivo": "Parigi Charles de Gaulle"
}

6. QUERY SQL (JOIN)
───────────────────
Unire dati da più tabelle

Esempio:
    SELECT v.numero_volo, ap.nome, aa.nome, c.nome
    FROM Voli v
    JOIN Aeroporti ap ON v.id_aeroporto_partenza = ap.id_aeroporto
    JOIN Aeroporti aa ON v.id_aeroporto_arrivo = aa.id_aeroporto
    JOIN Aerei ae ON v.id_aereo = ae.id_aereo
    JOIN Compagnie_Aeree c ON ae.id_compagnia = c.id_compagnia

Spiegazione:
- FROM Voli: partenza dalla tabella Voli
- JOIN Aeroporti: unisci i dati di Aeroporti
- ON v.id_aeroporto_partenza = ap.id_aeroporto: condizione di unione

7. PASSWORD HASHING
───────────────────
Non salvare mai le password in chiaro!

Corretto:
    import hashlib
    password_hash = hashlib.sha256(password.encode()).hexdigest()
    # salvo password_hash nel database

Login:
    password_hash_utente = hashlib.sha256(password_inserito.encode()).hexdigest()
    if password_hash_utente == password_salvata:
        # password corretta

Sbagliato:
    # Salvare la password così
    password = "password123"  # SECURITY RISK!

8. SESSIONI E LOCALSTORAGE
──────────────────────────
Salvare i dati dell'utente loggato

Nel servizio:
    setUtenteLoggato(utente: any): void {
        this.utenteLoggato.next(utente);  // BehaviorSubject
        localStorage.setItem('utente_loggato', JSON.stringify(utente));
    }

Quando l'utente ricarica la pagina:
    private caricaUtenteLoggato(): void {
        const utenteJson = localStorage.getItem('utente_loggato');
        if (utenteJson) {
            const utente = JSON.parse(utenteJson);
            this.utenteLoggato.next(utente);  // Rimane loggato
        }
    }

================================================================================
🎤 15 DOMANDE FREQUENTI DELL'ESAME
================================================================================

Domanda 1: Qual è l'architettura del progetto?
──────────────────────────────────────────────
Risposta:
Il progetto usa un'architettura a 3 livelli:

1. FRONTEND (Angular)
   - Componenti: ListaVoli, DettaglioVolo, Login, LeMiePrenotazioni
   - Servizi: VoliService, PrenotazioniService, UtentiService, PagamentiService
   - Utilizza HttpClient per comunicare col backend

2. BACKEND (Flask)
   - Routes REST API per voli, prenotazioni, pagamenti, utenti
   - Database queries con PyMySQL
   - Gestione errori (404, 500, ecc)

3. DATABASE (MariaDB)
   - 10 tabelle relazionate
   - Chiavi esterne per l'integrità referenziale
   - Indici per ottimizzare le query

---

Domanda 2: Come funziona una ricerca di voli dal frontend al database?
──────────────────────────────────────────────────────────────────────
Risposta passo per passo:

1. Utente inserisce filtri (partenza, arrivo, date)
2. Clicca "Cerca"
3. ListaVolo.ricercaVoli() viene eseguito
4. Chiama VoliService.cercaVoli(filtri)
5. VoliService fa una GET a: http://localhost:5000/api/voli/cerca?partenza=FCO&arrivo=CDG
6. Flask riceve la GET
7. Legge i parametri: request.args.get('partenza'), ecc.
8. Costruisce una query SQL dinamica:
   SELECT * FROM Voli 
   WHERE id_aeroporto_partenza = (SELECT id_aeroporto FROM Aeroporti WHERE codice_iata = 'FCO')
   AND id_aeroporto_arrivo = (SELECT id_aeroporto FROM Aeroporti WHERE codice_iata = 'CDG')
   AND DATE(data_partenza) >= '2026-06-15'
9. Esegue la query su MariaDB
10. Database ritorna i risultati
11. Flask li converte in JSON
12. Frontend riceve il JSON
13. Aggiorna voli_filtrati[]
14. Angular re-renderizza la lista con i voli trovati

---

Domanda 3: Spiega il processo di prenotazione
───────────────────────────────────────────────
Risposta:
Fase 1: Selezione
- Utente visualizza un volo
- Seleziona N posti cliccando su di essi
- Il componente aggiunge i posti a posti_selezionati[]

Fase 2: Invio prenotazione
- Utente clicca "Procedi"
- Frontend verifica che abbia selezionato abbastanza posti
- Crea un oggetto:
  {
    id_utente: 1,
    id_volo: 5,
    numero_passeggeri: 2,
    posti: [12, 15]  // ID dei posti
  }
- Invia POST a /api/prenotazioni

Fase 3: Elaborazione backend
- Flask riceve la POST
- Verifica che l'utente e il volo esistano
- Calcola il prezzo totale: numero_passeggeri * prezzo_base
- Genera un numero univoco: PV20260615XXXX
- Crea un record in tabella Prenotazioni
- Per ogni posto:
  - Crea un record in Biglietti
  - Aggiorna Posti SET disponibile = FALSE
- Aggiorna Voli SET posti_disponibili -= numero_passeggeri
- Esegue COMMIT per salvare tutto

Fase 4: Risposta al frontend
- Backend ritorna il numero della prenotazione
- Frontend mostra: "Prenotazione PV202606151234 effettuata!"
- Reindirizza a /le-mie-prenotazioni

---

Domanda 4: Come funziona il login?
──────────────────────────────────
Risposta:
1. Utente inserisce email e password
2. Frontend chiama UtentiService.login(email, password)
3. Richiesta POST a /api/utenti/login con body:
   { "email": "user@example.com", "password": "password123" }

4. Backend:
   a) Estrae email e password dal JSON
   b) Hashizza la password: hash = SHA256(password)
   c) Cerca l'utente: SELECT * FROM Utenti WHERE email = ? AND password_hash = ?
   d) Se trovato, restituisce i dati dell'utente
   e) Se non trovato, ritorna errore 401 (Unauthorized)

5. Frontend:
   a) Se successo: salva i dati in BehaviorSubject (per accesso in tempo reale)
   b) Salva anche in localStorage (per persistenza tra reload)
   c) Reindirizza a /
   
6. Quando l'utente ricarica la pagina:
   - Il servizio carica automaticamente i dati da localStorage
   - L'utente rimane loggato

---

Domanda 5: Cosa sono gli Observable in RxJS?
──────────────────────────────────────────────
Risposta:
Gli Observable sono oggetti che emettono valori nel tempo.
Sono come un "flusso di dati" che puoi "ascoltare" con subscribe().

Analogia:
Un Observable è come una stazione radio:
- subscribe() = accendi la radio
- next() = il DJ trasmette una canzone
- complete() = la trasmissione finisce
- error() = c'è un'interferenza (errore)

Codice:
// Nel servizio
getAllVoli(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
}

// Nel componente
this.voliService.getAllVoli().subscribe(
    (dati) => {
        // Questa funzione viene chiamata quando i dati arrivano
        console.log('Voli ricevuti:', dati);
    },
    (errore) => {
        // Questa viene chiamata se c'è un errore
        console.error('Errore:', errore);
    },
    () => {
        // Questa viene chiamata quando è finito
        console.log('Completato');
    }
);

Vantaggi:
- Asincrono per natura (perfetto per HTTP)
- Cancellabile (unsubscribe())
- Composabile (pipe, map, filter, ecc)

---

Domanda 6: Spiega una JOIN in SQL
──────────────────────────────────
Risposta:
Una JOIN unisce i dati di due tabelle basandosi su una condizione.

Immagina di avere:

Tabella Voli:
| id_volo | numero_volo | id_aereo |
|---------|-------------|----------|
| 1       | AZ001       | 100      |
| 2       | AZ002       | 101      |

Tabella Aerei:
| id_aereo | modello    |
|----------|-----------|
| 100      | Boeing 737 |
| 101      | Airbus A320|

Senza JOIN (sbagliato):
SELECT numero_volo FROM Voli;
// Ottengo solo numero_volo, non so quale aereo è

Con JOIN (corretto):
SELECT v.numero_volo, ae.modello
FROM Voli v
JOIN Aerei ae ON v.id_aereo = ae.id_aereo;

Risultato:
| numero_volo | modello     |
|------------|-----------|
| AZ001      | Boeing 737 |
| AZ002      | Airbus A320|

Tipi di JOIN:
- INNER JOIN: tutte le righe che hanno una corrispondenza
- LEFT JOIN: tutte le righe della tabella sinistra
- RIGHT JOIN: tutte le righe della tabella destra

---

Domanda 7: Come validi l'email in Angular?
────────────────────────────────────────────
Risposta:
Uso una regex (regular expression):

// Nel servizio utenti
private valida_email(email: string): boolean {
    const pattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return pattern.test(email);
}

// Spiegazione della regex:
// ^[a-zA-Z0-9._%+-]+ = uno o più caratteri validi all'inizio
// @ = la @
// [a-zA-Z0-9.-]+ = il dominio
// \. = il punto
// [a-zA-Z]{2,} = almeno 2 lettere per l'estensione (com, it, org, ecc)
// $ = fine della stringa

// Nel componente
if (!valida_email(email)) {
    this.errore = 'Email non valida';
    return;
}

Esempio email valide:
- mario@example.com ✅
- maria.rossi@gmail.co.uk ✅
- test+tag@domain.org ✅

Esempio email NON valide:
- mario@  ❌ (manca dominio)
- @example.com ❌ (manca parte prima @)
- mario.example.com ❌ (manca @)

---

Domanda 8: Come gestiamo gli errori nel backend?
─────────────────────────────────────────────────
Risposta:
Usiamo i codici di stato HTTP:

200 OK - Successo
201 Created - Risorsa creata
400 Bad Request - Dati invalidi
401 Unauthorized - Non autenticato
404 Not Found - Risorsa non trovata
500 Internal Server Error - Errore del server

Esempi nel codice:

# Se l'utente non fornisce email/password
if not all(k in dati for k in ['email', 'password']):
    return jsonify({'errore': 'Dati mancanti'}), 400

# Se l'utente non esiste
result = esegui_query("SELECT * FROM Utenti WHERE email = %s", (email,))
if not result:
    return jsonify({'errore': 'Utente non trovato'}), 404

# Se la password è sbagliata
if password_hash != password_salvata:
    return jsonify({'errore': 'Password scorretta'}), 401

# Se successo
return jsonify({'id_utente': id_utente, ...}), 200

# Se creazione riuscita
return jsonify({'id_prenotazione': id, ...}), 201

Nel frontend:
this.service.login(email, password).subscribe(
    (risposta) => {  // Codice 200-201
        console.log('Login ok');
    },
    (errore) => {  // Codice 400-500
        if (errore.status === 401) {
            this.errore = 'Password sbagliata';
        } else if (errore.status === 404) {
            this.errore = 'Utente non trovato';
        }
    }
);

---

Domanda 9: Che differenza c'è tra POST e PUT?
───────────────────────────────────────────────
Risposta:
POST: CREA nuove risorse
PUT: MODIFICA risorse esistenti

Esempi:

POST /api/prenotazioni
{
    "id_utente": 1,
    "id_volo": 5,
    "numero_passeggeri": 2
}
→ Crea una nuova prenotazione

PUT /api/prenotazioni/123
{
    "stato": "Annullata"
}
→ Modifica la prenotazione con ID 123

Nel codice:

# POST - Creazione
@app.route('/api/prenotazioni', methods=['POST'])
def crea_prenotazione():
    dati = request.get_json()
    # Creo un nuovo record
    id_nuova = esegui_modifica(sql_insert, params)
    return jsonify({'id_prenotazione': id_nuova}), 201

# PUT - Modifica
@app.route('/api/prenotazioni/<int:id>', methods=['PUT'])
def aggiorna_prenotazione(id):
    dati = request.get_json()
    # Aggiorno il record
    esegui_modifica(sql_update, params)
    return jsonify({'messaggio': 'Aggiornato'}), 200

---

Domanda 10: Come salvare l'utente loggato in localStorage?
──────────────────────────────────────────────────────────
Risposta:

// Quando l'utente accede
setUtenteLoggato(utente: any): void {
    // Salvo nel BehaviorSubject (accesso istantaneo)
    this.utenteLoggato.next(utente);
    
    // Converto a stringa JSON e salvo in localStorage
    localStorage.setItem('utente_loggato', JSON.stringify(utente));
    // JSON.stringify: converte oggetto in stringa
}

// Quando l'app si carica
private caricaUtenteLoggato(): void {
    // Recupero il dato da localStorage
    const utenteJson = localStorage.getItem('utente_loggato');
    
    if (utenteJson) {
        // Converto la stringa JSON in oggetto
        const utente = JSON.parse(utenteJson);
        // Setto il BehaviorSubject
        this.utenteLoggato.next(utente);
    }
}

// Quando l'utente fa logout
logout(): void {
    this.utenteLoggato.next(null);  // Tolgo dal BehaviorSubject
    localStorage.removeItem('utente_loggato');  // Tolgo da localStorage
}

Vantaggi:
- L'utente rimane loggato anche se ricarica la pagina
- Non deve fare login di nuovo
- I dati rimangono finché non fa logout

---

Domanda 11: Come funziona la validazione dei dati nei form?
────────────────────────────────────────────────────────────
Risposta:
Validazione lato frontend + backend

FRONTEND (validazione veloce):
────────────────────────────
<form>
    <input
        type="email"
        [(ngModel)]="email"
        required
        email
    >
    <!-- required: campo obbligatorio -->
    <!-- email: deve essere un email valido -->
    
    <button [disabled]="!form.valid">
        Login
    </button>
    <!-- Disabilita il bottone se il form non è valido -->
</form>

BACKEND (validazione vera e propria):
────────────────────────────────────
@app.route('/api/utenti/login', methods=['POST'])
def login():
    dati = request.get_json()
    
    # Verifico che i dati siano presenti
    if not all(k in dati for k in ['email', 'password']):
        return jsonify({'errore': 'Dati mancanti'}), 400
    
    email = dati['email']
    password = dati['password']
    
    # Valido l'email
    if not valida_email(email):
        return jsonify({'errore': 'Email non valida'}), 400
    
    # Valido la password (almeno 6 caratteri)
    if len(password) < 6:
        return jsonify({'errore': 'Password troppo corta'}), 400
    
    # Se passa tutto, procedo
    # ...

Perché due livelli?
- Frontend: feedback veloce all'utente
- Backend: sicurezza (frontend può essere aggirato)

---

Domanda 12: Cos'è il two-way binding?
──────────────────────────────────────
Risposta:
Il two-way binding sincronizza automaticamente HTML e TypeScript.

HTML:
<input [(ngModel)]="numero_passeggeri">

TypeScript:
numero_passeggeri = 1;

Cosa accade:

1. Utente scrive "3" nell'input
   → numero_passeggeri diventa automaticamente 3
   → Angular sa che è cambiato

2. Nel codice: numero_passeggeri = 5
   → L'input mostra automaticamente 5

È un valore "sincronizzato":
HTML ← → TypeScript

Esempio pratico:
<input [(ngModel)]="numero_passeggeri">
<p>Hai selezionato {{ numero_passeggeri }} passeggeri</p>

// Quando utente scrive "2" → paragrafo mostra "Hai selezionato 2 passeggeri"

Come funziona internamente:
[(ngModel)] = [ngModel] + (ngModelChange)
              (property binding) + (event binding)

[ngModel]="numero_passeggeri"          // Variabile → HTML
(ngModelChange)="numero_passeggeri=$event"  // HTML → Variabile

---

Domanda 13: Come funziona il routing in Angular?
───────────────────────────────────────────────
Risposta:
Il routing permette di navigare tra diverse pagine/componenti senza ricaricare.

app-routing.module.ts:
──────────────────
const routes: Routes = [
    { path: '', component: ListaVoliComponent },
    { path: 'dettaglio-volo/:id', component: DettaglioVoloComponent },
    { path: 'login', component: LoginComponent },
    { path: 'le-mie-prenotazioni', component: LeMiePrenotazioniComponent }
];

Nel componente:
──────────────
constructor(private router: Router) { }

// Per navigare programmaticamente:
this.router.navigate(['/dettaglio-volo', id_volo]);
// Equivalente a: www.example.com/dettaglio-volo/1

// Leggere i parametri della rotta:
constructor(private activatedRoute: ActivatedRoute) { }

ngOnInit(): void {
    this.activatedRoute.params.subscribe((params: any) => {
        const id = params['id'];  // Leggo l'ID dalla URL
        this.caricaVolo(id);
    });
}

Nel template:
─────────────
<a [routerLink]="['/dettaglio-volo', volo.id_volo]">
    Visualizza
</a>
<!-- Crea un link senza ricaricare la pagina -->

---

Domanda 14: Come si usa il metodo map() in TypeScript/JavaScript?
──────────────────────────────────────────────────────────────────
Risposta:
map() trasforma ogni elemento di un array in un altro valore.

Sintassi:
array.map((elemento) => elemento * 2)

Esempio 1 - Numeri:
const numeri = [1, 2, 3, 4, 5];
const raddoppiati = numeri.map((n) => n * 2);
// Risultato: [2, 4, 6, 8, 10]

Esempio 2 - Oggetti:
const voli = [
    { id: 1, nome: 'AZ001' },
    { id: 2, nome: 'AZ002' }
];
const nomi = voli.map((v) => v.nome);
// Risultato: ['AZ001', 'AZ002']

Esempio 3 - Nel codice del progetto:
// Estraggo solo gli ID dei posti
posti: this.posti_selezionati.map((p: any) => p.id_posto)
// Se posti_selezionati è:
// [{ id_posto: 10, numero: '12A' }, { id_posto: 11, numero: '12B' }]
// Risultato: [10, 11]

Differenza con forEach():
────────────────────────
forEach non crea un nuovo array:
numeri.forEach((n) => console.log(n * 2));
// Stampa i valori ma non crea un array

map crea un nuovo array:
const raddoppiati = numeri.map((n) => n * 2);
// Crea [2, 4, 6, 8, 10]

---

Domanda 15: Spiega brevemente come il database è strutturato
─────────────────────────────────────────────────────────────
Risposta:
Il database ha 10 tabelle relazionate con chiavi esterne (FK):

┌─────────────────────────────────────────────────────────────┐
│ Compagnie_Aeree (id_compagnia, nome, codice_iata)          │
│                    ↓                                        │
│ Aerei (id_aereo, codice, modello, id_compagnia*)           │
│              ↓                                              │
│ Voli (id_volo, numero, id_aereo*, id_aero_partenza*,      │
│       id_aero_arrivo*, data_partenza, data_arrivo, ...)   │
│       ↓                    ↑ ↑                              │
│    ┌─ Aeroporti (id_aeroporto, codice_iata, nome, ...)    │
│    │       ↑ ↓                                              │
│    └─ Posti (id_posto, id_volo*, numero, classe, ...)     │
│              ↓              ↓                               │
│       Prenotazioni    Biglietti                             │
│       (id_prenot,    (id_bill,                              │
│        id_utente*,    id_prenot*,                           │
│        id_volo*,      id_posto*,                            │
│        ...)           numero_bill, ...)                     │
│          ↓                ↓                                  │
│       Pagamenti      Bagagli                                │
│       (id_pag,       (id_bagaglio,                          │
│        id_prenot*,    id_bill*,                             │
│        ...)           peso, ...)                            │
│                                                              │
│ * = Foreign Key (chiave esterna)                           │
└─────────────────────────────────────────────────────────────┘

Relazioni principali:
1. Compagnie_Aeree 1-→ N Aerei
   Un'azienda ha più aerei

2. Aerei 1-→ N Voli
   Un aereo effettua più voli

3. Aeroporti 1-→ N Voli (due volte: partenza e arrivo)
   Un aeroporto ha più partenze e arrivi

4. Voli 1-→ N Posti
   Un volo ha più posti

5. Posti 1-→ N Biglietti
   Un posto può diventare tanti biglietti (se il volo si ripete)

6. Voli 1-→ N Prenotazioni
   Un volo può essere prenotato da tanti utenti

7. Utenti 1-→ N Prenotazioni
   Un utente può fare tante prenotazioni

8. Prenotazioni 1-→ N Biglietti
   Una prenotazione contiene più biglietti (uno per passeggero)

9. Prenotazioni 1-→ N Pagamenti
   Una prenotazione può avere più pagamenti (rata)

10. Biglietti 1-→ N Bagagli
    Un biglietto può avere più bagagli

Vincoli di integrità:
- ON DELETE CASCADE: se elimino un volo, si cancellano automaticamente
  le prenotazioni, i biglietti, e tutto il resto

================================================================================
💻 ESEMPI DI LIVE CODING
================================================================================

ESERCIZIO 1: Aggiungere un volo
────────────────────────────────

Backend (Flask):
@app.route('/api/voli', methods=['POST'])
def crea_volo():
    dati = request.get_json()
    
    # Valido i dati
    if not all(k in dati for k in ['numero_volo', 'id_aereo']):
        return jsonify({'errore': 'Dati mancanti'}), 400
    
    # Inserisco nel DB
    sql = """
    INSERT INTO Voli (numero_volo, id_aereo, id_aeroporto_partenza, 
                      id_aeroporto_arrivo, data_partenza, data_arrivo, 
                      prezzo_base, posti_disponibili, stato)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'Programmato')
    """
    
    id_volo = esegui_modifica(sql, (
        dati['numero_volo'],
        dati['id_aereo'],
        dati['id_aeroporto_partenza'],
        dati['id_aeroporto_arrivo'],
        dati['data_partenza'],
        dati['data_arrivo'],
        dati['prezzo_base'],
        dati['posti_disponibili']
    ))
    
    return jsonify({'id_volo': id_volo, 'messaggio': 'Volo creato'}), 201

Frontend (Angular):
// Nel servizio
creaVolo(dati: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, dati);
}

// Nel componente
this.voliService.creaVolo(dati_volo).subscribe(
    (risposta) => {
        console.log('Volo creato:', risposta.id_volo);
        this.caricaTuttiVoli();  // Ricarico la lista
    }
);

ESERCIZIO 2: Annullare una prenotazione
────────────────────────────────────────

Backend:
@app.route('/api/prenotazioni/<int:id>', methods=['DELETE'])
def annulla_prenotazione(id):
    # Verifica prenotazione
    sql_check = "SELECT numero_passeggeri, id_volo FROM Prenotazioni WHERE id_prenotazione = %s"
    result = esegui_query(sql_check, (id,))
    
    if not result:
        return jsonify({'errore': 'Prenotazione non trovata'}), 404
    
    numero_passeggeri = result[0]['numero_passeggeri']
    id_volo = result[0]['id_volo']
    
    # Libero i posti
    sql_posti = "SELECT id_posto FROM Biglietti WHERE id_prenotazione = %s"
    posti = esegui_query(sql_posti, (id,))
    for posto in posti:
        esegui_modifica("UPDATE Posti SET disponibile = TRUE WHERE id_posto = %s", 
                       (posto['id_posto'],))
    
    # Aggiorno posti volo
    esegui_modifica("UPDATE Voli SET posti_disponibili = posti_disponibili + %s WHERE id_volo = %s",
                   (numero_passeggeri, id_volo))
    
    # Cancello
    esegui_modifica("DELETE FROM Biglietti WHERE id_prenotazione = %s", (id,))
    esegui_modifica("DELETE FROM Prenotazioni WHERE id_prenotazione = %s", (id,))
    
    return jsonify({'messaggio': 'Annullato'}), 200

Frontend:
this.prenotazioniService.annullaPrenotazione(id).subscribe(
    () => {
        alert('Prenotazione annullata!');
        this.caricaPrenotazioni();
    }
);

ESERCIZIO 3: Filtrare voli per data
────────────────────────────────────

Backend:
@app.route('/api/voli/filtra-data', methods=['GET'])
def filtra_data():
    data_inizio = request.args.get('data_inizio')  # '2026-06-15'
    data_fine = request.args.get('data_fine')      # '2026-06-20'
    
    sql = "SELECT * FROM Voli WHERE DATE(data_partenza) BETWEEN %s AND %s ORDER BY data_partenza"
    
    voli = esegui_query(sql, (data_inizio, data_fine))
    
    return jsonify(voli), 200

Frontend:
filtraPerData(): void {
    const filtri = {
        data_inizio: this.data_inizio,
        data_fine: this.data_fine
    };
    
    this.voliService.filtraPerData(filtri).subscribe(
        (voli) => {
            this.voli = voli;
        }
    );
}

================================================================================
🔒 SICUREZZA E BEST PRACTICES
================================================================================

1. PASSWORD
───────────
✅ CORRETTO:
    import hashlib
    password_hash = hashlib.sha256(password.encode()).hexdigest()
    # Salvo password_hash nel database

❌ SBAGLIATO:
    password = request.json['password']
    # Salvo password nel database  <- SECURITY RISK!

2. SQL INJECTION
────────────────
✅ CORRETTO (Parametrizzato):
    sql = "SELECT * FROM Utenti WHERE email = %s"
    cursor.execute(sql, (email,))  # email è un parametro

❌ SBAGLIATO (Concatenazione):
    sql = f"SELECT * FROM Utenti WHERE email = '{email}'"
    # Se email è: ' OR '1'='1
    # La query diventa: SELECT * FROM Utenti WHERE email = '' OR '1'='1'
    # Che restituisce TUTTI gli utenti!

3. CORS (Cross-Origin Resource Sharing)
────────────────────────────────────────
✅ Abilitiamo CORS nel backend:
    from flask_cors import CORS
    app = Flask(__name__)
    CORS(app)  # Permette le richieste dal frontend

Senza CORS:
- Frontend (localhost:4200) non può chiamare Backend (localhost:5000)
- Errore: "Access to XMLHttpRequest blocked by CORS policy"

4. ERRORI INFORMATIVI
──────────────────────
✅ CORRETTO:
    return jsonify({'errore': 'Email o password scorretti'}), 401

❌ SBAGLIATO:
    return jsonify({'errore': 'L\'utente mario@example.com non è registrato'}), 404
    # Rivelo che quell'email esiste!

5. VALIDAZIONE INPUT
─────────────────────
Validare sempre sia frontend che backend:

Frontend: feedback veloce (UX)
Backend: sicurezza vera (il frontend può essere aggirato)

6. HTTPS in Produzione
──────────────────────
✅ In produzione: usare HTTPS (non HTTP)
   - Crittografa i dati in transito
   - Previene man-in-the-middle attacks

❌ In localhost: OK usare HTTP (solo per sviluppo)

7. Environment Variables
─────────────────────────
✅ CORRETTO:
    DB_PASSWORD = os.getenv('DB_PASSWORD')
    # La password viene da una variabile d'ambiente

❌ SBAGLIATO:
    DB_PASSWORD = 'password123'
    # La password è nel codice sorgente!

================================================================================
📊 DIAGRAMMA DELLA BANCA DATI (ER Diagram)
================================================================================

Compagnie_Aeree
├─ id_compagnia (PK)
├─ nome
├─ codice_iata
└─ descrizione

Aerei
├─ id_aereo (PK)
├─ codice_aereo
├─ modello
├─ capienza_passeggeri
└─ id_compagnia (FK → Compagnie_Aeree)

Aeroporti
├─ id_aeroporto (PK)
├─ codice_iata
├─ nome
├─ citta
└─ paese

Voli
├─ id_volo (PK)
├─ numero_volo
├─ id_aereo (FK → Aerei)
├─ id_aeroporto_partenza (FK → Aeroporti)
├─ id_aeroporto_arrivo (FK → Aeroporti)
├─ data_partenza
├─ data_arrivo
├─ prezzo_base
├─ posti_disponibili
└─ stato

Utenti
├─ id_utente (PK)
├─ email
├─ password_hash
├─ nome
├─ cognome
├─ data_nascita
├─ nazionalita
├─ numero_passaporto
├─ numero_telefono
├─ indirizzo
└─ ultimo_accesso

Posti
├─ id_posto (PK)
├─ id_volo (FK → Voli)
├─ numero_posto
├─ classe
└─ disponibile

Prenotazioni
├─ id_prenotazione (PK)
├─ id_utente (FK → Utenti)
├─ id_volo (FK → Voli)
├─ numero_prenotazione
├─ data_prenotazione
├─ numero_passeggeri
├─ prezzo_totale
└─ stato

Biglietti
├─ id_biglietto (PK)
├─ id_prenotazione (FK → Prenotazioni)
├─ id_posto (FK → Posti)
├─ numero_biglietto
├─ nome_passeggero
└─ stato

Pagamenti
├─ id_pagamento (PK)
├─ id_prenotazione (FK → Prenotazioni)
├─ importo
├─ metodo_pagamento
├─ data_pagamento
├─ numero_transazione
└─ stato

Bagagli
├─ id_bagaglio (PK)
├─ id_biglietto (FK → Biglietti)
├─ peso_kg
├─ tipo_bagaglio
└─ stato

================================================================================
✅ SOMMARIO PER L'ESAME
================================================================================

Punti chiave da ricordare:

1. ✈️ ARCHITETTURA: Frontend Angular → Backend Flask → Database MariaDB

2. 🔄 FLUSSO DATI: Componente → Servizio → HttpClient → Backend → Database

3. 🎯 OBSERVABLE: Streaming asincrono di dati (perfetto per HTTP)

4. 💾 DATABASE: 10 tabelle relazionate con chiavi esterne

5. 🔐 SICUREZZA: Parametri SQL + Hash password + Validazione input

6. 📱 REST API: GET (leggi), POST (crea), PUT (modifica), DELETE (cancella)

7. 🔗 JOIN SQL: Unisce tabelle per ottenere dati correlati

8. 🛡️ VALIDAZIONE: Frontend (UX) + Backend (Sicurezza)

9. 💡 TWO-WAY BINDING: HTML ↔ TypeScript sincronizzati

10. 🚀 DEPLOYMENT: Frontend su server web, Backend su server app, DB su server database

================================================================================
Fine documentazione
================================================================================
