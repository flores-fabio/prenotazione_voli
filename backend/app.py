# ✈️ BACKEND FLASK - PRENOTAZIONE VOLI
# Sistema completo di API REST per gestire voli, prenotazioni e pagamenti

# ================================
# IMPORTAZIONI LIBRERIE
# ================================

from flask import Flask, request, jsonify
# Flask: framework web per creare il server
# request: oggetto per accedere ai dati inviati dal client
# jsonify: funzione per convertire dati Python in JSON

from flask_cors import CORS
# CORS: permette al frontend Angular (localhost:4200) di comunicare con il backend

import pymysql
# PyMySQL: libreria per connettersi a MariaDB/MySQL
import os
from dotenv import load_dotenv
# load_dotenv: carica le variabili d'ambiente dal file .env

from datetime import datetime
# datetime: per gestire date e ore

import re
# re: per validare email e altri dati

from decimal import Decimal
# Decimal: per gestire soldi senza errori di arrotondamento

# ================================
# CONFIGURAZIONE FLASK
# ================================

load_dotenv()
# Carico le variabili d'ambiente dal file .env se presente

app = Flask(__name__)
# Creo l'applicazione Flask

# Abilito CORS; origine di default può essere sovrascritta dalla variabile d'ambiente CORS_ORIGINS
cors_origins = os.getenv('CORS_ORIGINS', '*')
CORS(app, resources={r"/api/*": {"origins": cors_origins}})
# Abilito CORS per permettere al frontend di comunicare

# ================================
# CONFIGURAZIONE DATABASE
# ================================

# Dati di connessione al database MariaDB (prendibili da variabili d'ambiente)
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'user': os.getenv('DB_USER', 'root'),
    'password': os.getenv('DB_PASSWORD', 'password'),
    'database': os.getenv('DB_NAME', 'prenotazione_volo'),
    'charset': 'utf8mb4',
    'cursorclass': pymysql.cursors.DictCursor
}

if os.getenv('DB_SOCKET'):
    DB_CONFIG['unix_socket'] = os.getenv('DB_SOCKET')

# ================================
# FUNZIONI HELPER (UTILITÀ)
# ================================

def get_db_connection():
    """
    Crea una nuova connessione al database.
    Questa funzione viene usata prima di ogni query.
    """
    try:
        # Provo a connettermi con le credenziali
        connection = pymysql.connect(**DB_CONFIG)
        return connection
    except pymysql.Error as e:
        # Se fallisce, stampo l'errore
        print(f"Errore connessione database: {e}")
        return None

def esegui_query(sql, params=None):
    """
    Esegue una query SQL e restituisce i risultati.
    
    Parametri:
    - sql: comando SQL da eseguire
    - params: valori da inserire nella query (se ci sono ?)
    """
    conn = get_db_connection()
    # Mi connetto al database
    
    if not conn:
        return None
    # Se la connessione fallisce, esco
    
    try:
        with conn.cursor() as cursor:
            # cursor: oggetto per eseguire query
            if params:
                # Se ho parametri, li inserisco nella query
                cursor.execute(sql, params)
            else:
                # Altrimenti eseguo la query così com'è
                cursor.execute(sql)
            
            # Recupero tutti i risultati
            risultati = cursor.fetchall()
            return risultati
    except pymysql.Error as e:
        print(f"Errore query: {e}")
        return None
    finally:
        conn.close()
        # Chiudo sempre la connessione quando finisco

def esegui_modifica(sql, params=None):
    """
    Esegue query che modificano il database (INSERT, UPDATE, DELETE).
    Restituisce l'ID della riga creata (per INSERT) o il numero di righe modificate.
    """
    conn = get_db_connection()
    
    if not conn:
        return None
    
    try:
        with conn.cursor() as cursor:
            if params:
                cursor.execute(sql, params)
            else:
                cursor.execute(sql)
            
            # Salvo i cambiamenti nel database
            conn.commit()
            
            # Restituisco l'ID della riga appena inserita
            if cursor.lastrowid:
                return cursor.lastrowid
            else:
                # Oppure il numero di righe modificate
                return cursor.rowcount
    except pymysql.Error as e:
        # Se c'è un errore, annullo le modifiche
        conn.rollback()
        print(f"Errore modifica: {e}")
        return None
    finally:
        conn.close()

def valida_email(email):
    """
    Verifica se un'email ha il formato corretto.
    Restituisce True se valida, False altrimenti.
    """
    # Regex: pattern per controllare che l'email sia nel formato xxx@xxx.xxx
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

# ================================
# ROTTE PER VOLI
# ================================

@app.route('/api/voli', methods=['GET'])
def get_voli():
    """
    Recupera tutti i voli disponibili.
    GET /api/voli
    Restituisce: lista di voli in formato JSON
    """
    try:
        # Query per ottenere tutti i voli con informazioni aggiuntive
        sql = """
        SELECT 
            v.id_volo,
            v.numero_volo,
            v.data_partenza,
            v.data_arrivo,
            v.prezzo_base,
            v.posti_disponibili,
            v.stato,
            ap.nome as aeroporto_partenza,
            ap.codice_iata as codice_partenza,
            aa.nome as aeroporto_arrivo,
            aa.codice_iata as codice_arrivo,
            c.nome as compagnia,
            ae.modello as modello_aereo
        FROM Voli v
        JOIN Aeroporti ap ON v.id_aeroporto_partenza = ap.id_aeroporto
        JOIN Aeroporti aa ON v.id_aeroporto_arrivo = aa.id_aeroporto
        JOIN Aerei ae ON v.id_aereo = ae.id_aereo
        JOIN Compagnie_Aeree c ON ae.id_compagnia = c.id_compagnia
        ORDER BY v.data_partenza
        """
        
        # Eseguo la query
        voli = esegui_query(sql)
        
        if voli is None:
            # Se c'è un errore, restituisco 500
            return jsonify({'errore': 'Errore nel recupero dei voli'}), 500
        
        # Converto i risultati (che potrebbero contenere Decimal) in formato JSON-friendly
        voli_response = []
        for volo in voli:
            volo['prezzo_base'] = float(volo['prezzo_base'])  # Converto Decimal in float
            voli_response.append(volo)
        
        # Restituisco la lista di voli con codice 200 (successo)
        return jsonify(voli_response), 200
    
    except Exception as e:
        # Se c'è un errore non previsto
        print(f"Errore: {e}")
        return jsonify({'errore': 'Errore interno del server'}), 500

@app.route('/api/voli/<int:id_volo>', methods=['GET'])
def get_volo_dettaglio(id_volo):
    """
    Recupera i dettagli di un singolo volo.
    GET /api/voli/1
    Parametri: id_volo (numero intero)
    Restituisce: dettagli del volo + lista dei posti disponibili
    """
    try:
        # Query per ottenere il volo con tutti i dettagli
        sql = """
        SELECT 
            v.id_volo,
            v.numero_volo,
            v.data_partenza,
            v.data_arrivo,
            v.prezzo_base,
            v.posti_disponibili,
            v.stato,
            ap.nome as aeroporto_partenza,
            ap.citta as citta_partenza,
            aa.nome as aeroporto_arrivo,
            aa.citta as citta_arrivo,
            c.nome as compagnia,
            ae.modello as modello_aereo,
            ae.capienza_passeggeri
        FROM Voli v
        JOIN Aeroporti ap ON v.id_aeroporto_partenza = ap.id_aeroporto
        JOIN Aeroporti aa ON v.id_aeroporto_arrivo = aa.id_aeroporto
        JOIN Aerei ae ON v.id_aereo = ae.id_aereo
        JOIN Compagnie_Aeree c ON ae.id_compagnia = c.id_compagnia
        WHERE v.id_volo = %s
        """
        
        # Eseguo la query con il parametro id_volo
        risultato = esegui_query(sql, (id_volo,))
        
        if not risultato:
            # Se il volo non esiste, restituisco 404
            return jsonify({'errore': 'Volo non trovato'}), 404
        
        # Prendo il primo (e unico) risultato
        volo = risultato[0]
        
        # Converto Decimal in float per il JSON
        volo['prezzo_base'] = float(volo['prezzo_base'])
        
        # Ora ottengo la lista dei posti disponibili
        sql_posti = """
        SELECT id_posto, numero_posto, classe, disponibile
        FROM Posti
        WHERE id_volo = %s
        ORDER BY numero_posto
        """
        
        # Eseguo la query per i posti
        posti = esegui_query(sql_posti, (id_volo,))
        
        # Aggiungo i posti ai dati del volo
        volo['posti'] = posti if posti else []
        
        # Restituisco il volo con codice 200
        return jsonify(volo), 200
    
    except Exception as e:
        print(f"Errore: {e}")
        return jsonify({'errore': 'Errore interno del server'}), 500

@app.route('/api/voli/cerca', methods=['GET'])
def cerca_voli():
    """
    Cerca voli con filtri.
    GET /api/voli/cerca?partenza=FCO&arrivo=CDG&data_inizio=2026-06-15&data_fine=2026-06-20
    Parametri (opzionali):
    - partenza: codice IATA aeroporto partenza
    - arrivo: codice IATA aeroporto arrivo
    - data_inizio: data minima (formato: YYYY-MM-DD)
    - data_fine: data massima (formato: YYYY-MM-DD)
    Restituisce: lista di voli che corrispondono ai criteri
    """
    try:
        # Recupero i parametri dalla query string
        partenza = request.args.get('partenza')  # es: FCO
        arrivo = request.args.get('arrivo')      # es: CDG
        data_inizio = request.args.get('data_inizio')  # es: 2026-06-15
        data_fine = request.args.get('data_fine')      # es: 2026-06-20
        
        # Costruisco la query base
        sql = """
        SELECT 
            v.id_volo,
            v.numero_volo,
            v.data_partenza,
            v.data_arrivo,
            v.prezzo_base,
            v.posti_disponibili,
            v.stato,
            ap.nome as aeroporto_partenza,
            ap.codice_iata as codice_partenza,
            aa.nome as aeroporto_arrivo,
            aa.codice_iata as codice_arrivo,
            c.nome as compagnia
        FROM Voli v
        JOIN Aeroporti ap ON v.id_aeroporto_partenza = ap.id_aeroporto
        JOIN Aeroporti aa ON v.id_aeroporto_arrivo = aa.id_aeroporto
        JOIN Aerei ae ON v.id_aereo = ae.id_aereo
        JOIN Compagnie_Aeree c ON ae.id_compagnia = c.id_compagnia
        WHERE 1=1
        """
        # WHERE 1=1 è un trucco per aggiungere facilmente altri WHERE dinamici
        
        # Lista per i parametri
        params = []
        
        # Se l'utente ha inserito un aeroporto di partenza
        if partenza:
            sql += " AND ap.codice_iata = %s"
            params.append(partenza)
        
        # Se l'utente ha inserito un aeroporto di arrivo
        if arrivo:
            sql += " AND aa.codice_iata = %s"
            params.append(arrivo)
        
        # Se l'utente ha inserito una data inizio
        if data_inizio:
            sql += " AND DATE(v.data_partenza) >= %s"
            params.append(data_inizio)
        
        # Se l'utente ha inserito una data fine
        if data_fine:
            sql += " AND DATE(v.data_partenza) <= %s"
            params.append(data_fine)
        
        # Ordino per data di partenza
        sql += " ORDER BY v.data_partenza"
        
        # Eseguo la query con i parametri
        voli = esegui_query(sql, params if params else None)
        
        if voli is None:
            return jsonify({'errore': 'Errore nella ricerca'}), 500
        
        # Converto i Decimal
        for volo in voli:
            volo['prezzo_base'] = float(volo['prezzo_base'])
        
        return jsonify(voli), 200
    
    except Exception as e:
        print(f"Errore: {e}")
        return jsonify({'errore': 'Errore interno del server'}), 500

# ================================
# ROTTE PER PRENOTAZIONI
# ================================

@app.route('/api/prenotazioni', methods=['GET'])
def get_prenotazioni():
    """
    Recupera tutte le prenotazioni dell'utente loggato.
    GET /api/prenotazioni?id_utente=1
    Parametri: id_utente (numero intero)
    Restituisce: lista di prenotazioni
    """
    try:
        # Recupero id_utente dai parametri
        id_utente = request.args.get('id_utente')
        
        if not id_utente:
            # Se non è stato fornito un id, restituisco errore 400 (bad request)
            return jsonify({'errore': 'id_utente è obbligatorio'}), 400
        
        # Query per ottenere tutte le prenotazioni dell'utente
        sql = """
        SELECT 
            p.id_prenotazione,
            p.numero_prenotazione,
            p.data_prenotazione,
            p.stato,
            p.numero_passeggeri,
            p.prezzo_totale,
            v.numero_volo,
            v.data_partenza,
            v.data_arrivo,
            ap.codice_iata as aeroporto_partenza,
            aa.codice_iata as aeroporto_arrivo
        FROM Prenotazioni p
        JOIN Voli v ON p.id_volo = v.id_volo
        JOIN Aeroporti ap ON v.id_aeroporto_partenza = ap.id_aeroporto
        JOIN Aeroporti aa ON v.id_aeroporto_arrivo = aa.id_aeroporto
        WHERE p.id_utente = %s
        ORDER BY p.data_prenotazione DESC
        """
        
        # Eseguo la query
        prenotazioni = esegui_query(sql, (id_utente,))
        
        if prenotazioni is None:
            return jsonify({'errore': 'Errore nel recupero delle prenotazioni'}), 500
        
        # Converto i Decimal
        for p in prenotazioni:
            p['prezzo_totale'] = float(p['prezzo_totale'])
        
        return jsonify(prenotazioni), 200
    
    except Exception as e:
        print(f"Errore: {e}")
        return jsonify({'errore': 'Errore interno del server'}), 500

@app.route('/api/prenotazioni', methods=['POST'])
def crea_prenotazione():
    """
    Crea una nuova prenotazione.
    POST /api/prenotazioni
    Body JSON:
    {
        "id_utente": 1,
        "id_volo": 1,
        "numero_passeggeri": 2,
        "posti": [1, 5]  # ID dei posti da prenotare
    }
    Restituisce: dettagli della nuova prenotazione
    """
    try:
        # Recupero i dati dal body della richiesta
        dati = request.get_json()
        
        # Valido i dati obbligatori
        if not all(k in dati for k in ['id_utente', 'id_volo', 'numero_passeggeri', 'posti']):
            # Se mancano dei campi obbligatori
            return jsonify({'errore': 'Dati mancanti'}), 400
        
        id_utente = dati['id_utente']
        id_volo = dati['id_volo']
        numero_passeggeri = dati['numero_passeggeri']
        posti = dati['posti']  # Lista di ID dei posti
        
        # Verifico che l'utente esista
        sql_check_utente = "SELECT id_utente FROM Utenti WHERE id_utente = %s"
        result_utente = esegui_query(sql_check_utente, (id_utente,))
        
        if not result_utente:
            # Se l'utente non esiste
            return jsonify({'errore': 'Utente non trovato'}), 404
        
        # Verifico che il volo esista
        sql_check_volo = "SELECT id_volo, prezzo_base FROM Voli WHERE id_volo = %s"
        result_volo = esegui_query(sql_check_volo, (id_volo,))
        
        if not result_volo:
            # Se il volo non esiste
            return jsonify({'errore': 'Volo non trovato'}), 404
        
        prezzo_base = float(result_volo[0]['prezzo_base'])
        
        # Calcolo il prezzo totale
        prezzo_totale = prezzo_base * numero_passeggeri
        
        # Genero un numero di prenotazione univoco
        # Formato: PV + data + 4 cifre casuali
        import random
        numero_prenotazione = f"PV{datetime.now().strftime('%Y%m%d')}{random.randint(1000, 9999)}"
        
        # Creo la prenotazione nel database
        sql_insert = """
        INSERT INTO Prenotazioni 
        (id_utente, id_volo, numero_prenotazione, numero_passeggeri, prezzo_totale, stato)
        VALUES (%s, %s, %s, %s, %s, 'Confermata')
        """
        
        id_prenotazione = esegui_modifica(sql_insert, 
                                         (id_utente, id_volo, numero_prenotazione, 
                                          numero_passeggeri, prezzo_totale))
        
        if not id_prenotazione:
            return jsonify({'errore': 'Errore nella creazione della prenotazione'}), 500
        
        # Ora creo i biglietti per ogni passeggero
        for i, id_posto in enumerate(posti):
            # Numero del biglietto: univoco
            numero_biglietto = f"BG{numero_prenotazione}{i+1}"
            
            sql_biglietto = """
            INSERT INTO Biglietti 
            (id_prenotazione, id_posto, numero_biglietto, nome_passeggero, cognome_passeggero, stato)
            VALUES (%s, %s, %s, 'Passeggero', %s, 'Attivo')
            """
            
            esegui_modifica(sql_biglietto, 
                          (id_prenotazione, id_posto, numero_biglietto, f"Num{i+1}"))
            
            # Marcò il posto come non disponibile
            sql_update_posto = "UPDATE Posti SET disponibile = FALSE WHERE id_posto = %s"
            esegui_modifica(sql_update_posto, (id_posto,))
        
        # Aggiorno i posti disponibili del volo
        sql_update_volo = f"""
        UPDATE Voli 
        SET posti_disponibili = posti_disponibili - %s 
        WHERE id_volo = %s
        """
        esegui_modifica(sql_update_volo, (numero_passeggeri, id_volo))
        
        # Restituisco i dati della prenotazione creata con codice 201 (created)
        return jsonify({
            'id_prenotazione': id_prenotazione,
            'numero_prenotazione': numero_prenotazione,
            'prezzo_totale': prezzo_totale,
            'data_prenotazione': datetime.now().isoformat()
        }), 201
    
    except Exception as e:
        print(f"Errore: {e}")
        return jsonify({'errore': 'Errore interno del server'}), 500

@app.route('/api/prenotazioni/<int:id_prenotazione>', methods=['GET'])
def get_prenotazione_dettaglio(id_prenotazione):
    """
    Recupera i dettagli di una singola prenotazione.
    GET /api/prenotazioni/1
    Parametri: id_prenotazione (numero intero)
    Restituisce: dettagli completi della prenotazione + biglietti
    """
    try:
        # Query per ottenere la prenotazione
        sql = """
        SELECT 
            p.id_prenotazione,
            p.numero_prenotazione,
            p.data_prenotazione,
            p.stato,
            p.numero_passeggeri,
            p.prezzo_totale,
            u.nome,
            u.cognome,
            u.email,
            v.numero_volo,
            v.data_partenza,
            v.data_arrivo
        FROM Prenotazioni p
        JOIN Utenti u ON p.id_utente = u.id_utente
        JOIN Voli v ON p.id_volo = v.id_volo
        WHERE p.id_prenotazione = %s
        """
        
        # Eseguo la query
        risultato = esegui_query(sql, (id_prenotazione,))
        
        if not risultato:
            return jsonify({'errore': 'Prenotazione non trovata'}), 404
        
        prenotazione = risultato[0]
        prenotazione['prezzo_totale'] = float(prenotazione['prezzo_totale'])
        
        # Ottengo i biglietti associati alla prenotazione
        sql_biglietti = """
        SELECT b.id_biglietto, b.numero_biglietto, b.nome_passeggero, b.cognome_passeggero,
               b.stato, p.numero_posto
        FROM Biglietti b
        JOIN Posti p ON b.id_posto = p.id_posto
        WHERE b.id_prenotazione = %s
        """
        
        biglietti = esegui_query(sql_biglietti, (id_prenotazione,))
        prenotazione['biglietti'] = biglietti if biglietti else []
        
        return jsonify(prenotazione), 200
    
    except Exception as e:
        print(f"Errore: {e}")
        return jsonify({'errore': 'Errore interno del server'}), 500

@app.route('/api/prenotazioni/<int:id_prenotazione>', methods=['DELETE'])
def annulla_prenotazione(id_prenotazione):
    """
    Annulla una prenotazione (la cancella dal database).
    DELETE /api/prenotazioni/1
    Parametri: id_prenotazione (numero intero)
    Restituisce: messaggio di conferma
    """
    try:
        # Prima verifico che la prenotazione esista
        sql_check = "SELECT id_volo, numero_passeggeri FROM Prenotazioni WHERE id_prenotazione = %s"
        result = esegui_query(sql_check, (id_prenotazione,))
        
        if not result:
            return jsonify({'errore': 'Prenotazione non trovata'}), 404
        
        id_volo = result[0]['id_volo']
        numero_passeggeri = result[0]['numero_passeggeri']
        
        # Ottengo i posti associati ai biglietti
        sql_posti = """
        SELECT b.id_posto 
        FROM Biglietti b 
        WHERE b.id_prenotazione = %s
        """
        posti_result = esegui_query(sql_posti, (id_prenotazione,))
        
        # Libero i posti
        for posto_obj in posti_result:
            id_posto = posto_obj['id_posto']
            sql_free = "UPDATE Posti SET disponibile = TRUE WHERE id_posto = %s"
            esegui_modifica(sql_free, (id_posto,))
        
        # Aggiorno i posti disponibili del volo
        sql_update_volo = """
        UPDATE Voli 
        SET posti_disponibili = posti_disponibili + %s 
        WHERE id_volo = %s
        """
        esegui_modifica(sql_update_volo, (numero_passeggeri, id_volo))
        
        # Cancello i biglietti
        sql_delete_biglietti = "DELETE FROM Biglietti WHERE id_prenotazione = %s"
        esegui_modifica(sql_delete_biglietti, (id_prenotazione,))
        
        # Cancello la prenotazione
        sql_delete = "DELETE FROM Prenotazioni WHERE id_prenotazione = %s"
        esegui_modifica(sql_delete, (id_prenotazione,))
        
        return jsonify({'messaggio': 'Prenotazione annullata con successo'}), 200
    
    except Exception as e:
        print(f"Errore: {e}")
        return jsonify({'errore': 'Errore interno del server'}), 500

# ================================
# ROTTE PER PAGAMENTI
# ================================

@app.route('/api/pagamenti', methods=['POST'])
def crea_pagamento():
    """
    Crea un nuovo pagamento per una prenotazione.
    POST /api/pagamenti
    Body JSON:
    {
        "id_prenotazione": 1,
        "importo": 300.00,
        "metodo_pagamento": "Carta Credito",
        "numero_carta": "1234567890123456"
    }
    Restituisce: dettagli del pagamento creato
    """
    try:
        # Recupero i dati dal body
        dati = request.get_json()
        
        # Valido i dati obbligatori
        if not all(k in dati for k in ['id_prenotazione', 'importo', 'metodo_pagamento']):
            return jsonify({'errore': 'Dati mancanti'}), 400
        
        id_prenotazione = dati['id_prenotazione']
        importo = dati['importo']
        metodo_pagamento = dati['metodo_pagamento']
        
        # Verifico che la prenotazione esista
        sql_check = "SELECT id_prenotazione FROM Prenotazioni WHERE id_prenotazione = %s"
        result = esegui_query(sql_check, (id_prenotazione,))
        
        if not result:
            return jsonify({'errore': 'Prenotazione non trovata'}), 404
        
        # Genero un numero di transazione univoco
        import random
        numero_transazione = f"TX{datetime.now().strftime('%Y%m%d%H%M%S')}{random.randint(100, 999)}"
        
        # Inserisco il pagamento nel database
        sql_insert = """
        INSERT INTO Pagamenti 
        (id_prenotazione, importo, metodo_pagamento, numero_transazione, stato, descrizione)
        VALUES (%s, %s, %s, %s, 'Completato', 'Pagamento processato con successo')
        """
        
        id_pagamento = esegui_modifica(sql_insert, 
                                      (id_prenotazione, importo, metodo_pagamento, numero_transazione))
        
        if not id_pagamento:
            return jsonify({'errore': 'Errore nella creazione del pagamento'}), 500
        
        return jsonify({
            'id_pagamento': id_pagamento,
            'numero_transazione': numero_transazione,
            'importo': importo,
            'metodo_pagamento': metodo_pagamento,
            'stato': 'Completato',
            'data_pagamento': datetime.now().isoformat()
        }), 201
    
    except Exception as e:
        print(f"Errore: {e}")
        return jsonify({'errore': 'Errore interno del server'}), 500

@app.route('/api/pagamenti/<int:id_prenotazione>', methods=['GET'])
def get_pagamenti(id_prenotazione):
    """
    Recupera tutti i pagamenti di una prenotazione.
    GET /api/pagamenti/1
    Parametri: id_prenotazione (numero intero)
    Restituisce: lista dei pagamenti
    """
    try:
        # Query per ottenere tutti i pagamenti della prenotazione
        sql = """
        SELECT 
            id_pagamento,
            importo,
            metodo_pagamento,
            data_pagamento,
            numero_transazione,
            stato
        FROM Pagamenti
        WHERE id_prenotazione = %s
        ORDER BY data_pagamento DESC
        """
        
        pagamenti = esegui_query(sql, (id_prenotazione,))
        
        if pagamenti is None:
            return jsonify({'errore': 'Errore nel recupero dei pagamenti'}), 500
        
        # Converto i Decimal
        for p in pagamenti:
            p['importo'] = float(p['importo'])
        
        return jsonify(pagamenti), 200
    
    except Exception as e:
        print(f"Errore: {e}")
        return jsonify({'errore': 'Errore interno del server'}), 500

# ================================
# ROTTE PER UTENTI
# ================================

@app.route('/api/utenti', methods=['POST'])
def crea_utente():
    """
    Crea un nuovo utente (registrazione).
    POST /api/utenti
    Body JSON:
    {
        "email": "test@example.com",
        "password": "password123",
        "nome": "Mario",
        "cognome": "Rossi",
        "data_nascita": "2000-01-15",
        "numero_telefono": "3331234567"
    }
    Restituisce: ID del nuovo utente
    """
    try:
        # Recupero i dati
        dati = request.get_json()
        
        # Valido i dati obbligatori
        if not all(k in dati for k in ['email', 'password', 'nome', 'cognome']):
            return jsonify({'errore': 'Dati mancanti'}), 400
        
        email = dati['email']
        password = dati['password']
        nome = dati['nome']
        cognome = dati['cognome']
        
        # Valido il formato dell'email
        if not valida_email(email):
            return jsonify({'errore': 'Email non valida'}), 400
        
        # Verifico che l'email non sia già registrata
        sql_check = "SELECT id_utente FROM Utenti WHERE email = %s"
        result = esegui_query(sql_check, (email,))
        
        if result:
            return jsonify({'errore': 'Email già registrata'}), 400
        
        # In una vera applicazione, la password andrebbe crittografata
        # Per questo progetto scolastico, usiamo un hash semplice
        import hashlib
        password_hash = hashlib.sha256(password.encode()).hexdigest()
        
        # Parametri opzionali
        data_nascita = dati.get('data_nascita')
        numero_telefono = dati.get('numero_telefono')
        indirizzo = dati.get('indirizzo')
        
        # Inserisco il nuovo utente
        sql_insert = """
        INSERT INTO Utenti 
        (email, password_hash, nome, cognome, data_nascita, numero_telefono, indirizzo, stato_account)
        VALUES (%s, %s, %s, %s, %s, %s, %s, 'Attivo')
        """
        
        id_utente = esegui_modifica(sql_insert, 
                                   (email, password_hash, nome, cognome, data_nascita, numero_telefono, indirizzo))
        
        if not id_utente:
            return jsonify({'errore': 'Errore nella creazione dell\'utente'}), 500
        
        return jsonify({
            'id_utente': id_utente,
            'email': email,
            'nome': nome,
            'cognome': cognome,
            'messaggio': 'Utente registrato con successo'
        }), 201
    
    except Exception as e:
        print(f"Errore: {e}")
        return jsonify({'errore': 'Errore interno del server'}), 500

@app.route('/api/utenti/login', methods=['POST'])
def login_utente():
    """
    Login di un utente.
    POST /api/utenti/login
    Body JSON:
    {
        "email": "test@example.com",
        "password": "password123"
    }
    Restituisce: dati dell'utente se login riuscito
    """
    try:
        # Recupero le credenziali
        dati = request.get_json()
        
        if not all(k in dati for k in ['email', 'password']):
            return jsonify({'errore': 'Email o password mancanti'}), 400
        
        email = dati['email']
        password = dati['password']
        
        # Hash della password
        import hashlib
        password_hash = hashlib.sha256(password.encode()).hexdigest()
        
        # Cerco l'utente con queste credenziali
        sql = "SELECT id_utente, nome, cognome, email FROM Utenti WHERE email = %s AND password_hash = %s"
        result = esegui_query(sql, (email, password_hash))
        
        if not result:
            # Se le credenziali non sono corrette
            return jsonify({'errore': 'Email o password scorretti'}), 401
        
        utente = result[0]
        
        # Aggiorno l'ultimo accesso
        sql_update = "UPDATE Utenti SET ultimo_accesso = NOW() WHERE id_utente = %s"
        esegui_modifica(sql_update, (utente['id_utente'],))
        
        # Restituisco i dati dell'utente
        return jsonify({
            'id_utente': utente['id_utente'],
            'nome': utente['nome'],
            'cognome': utente['cognome'],
            'email': utente['email'],
            'messaggio': 'Login riuscito'
        }), 200
    
    except Exception as e:
        print(f"Errore: {e}")
        return jsonify({'errore': 'Errore interno del server'}), 500

@app.route('/api/utenti/<int:id_utente>', methods=['GET'])
def get_profilo_utente(id_utente):
    """
    Recupera il profilo di un utente.
    GET /api/utenti/1
    Parametri: id_utente (numero intero)
    Restituisce: profilo completo dell'utente
    """
    try:
        # Query per ottenere i dati dell'utente
        sql = """
        SELECT id_utente, email, nome, cognome, data_nascita, nazionalita, 
               numero_passaporto, numero_telefono, indirizzo, data_iscrizione, 
               ultimo_accesso, stato_account
        FROM Utenti
        WHERE id_utente = %s
        """
        
        result = esegui_query(sql, (id_utente,))
        
        if not result:
            return jsonify({'errore': 'Utente non trovato'}), 404
        
        utente = result[0]
        return jsonify(utente), 200
    
    except Exception as e:
        print(f"Errore: {e}")
        return jsonify({'errore': 'Errore interno del server'}), 500

@app.route('/api/utenti/<int:id_utente>', methods=['PUT'])
def aggiorna_profilo_utente(id_utente):
    """
    Aggiorna il profilo di un utente.
    PUT /api/utenti/1
    Body JSON: (campi da aggiornare - opzionali)
    {
        "nome": "Mario",
        "cognome": "Rossi",
        "numero_telefono": "3331234567",
        "indirizzo": "Via Roma 1"
    }
    Restituisce: conferma dell'aggiornamento
    """
    try:
        # Recupero i dati
        dati = request.get_json()
        
        # Verifico che l'utente esista
        sql_check = "SELECT id_utente FROM Utenti WHERE id_utente = %s"
        result = esegui_query(sql_check, (id_utente,))
        
        if not result:
            return jsonify({'errore': 'Utente non trovato'}), 404
        
        # Costruisco la query di aggiornamento dinamicamente
        campi_update = []
        params = []
        
        # Campi che possono essere aggiornati
        campi_allowed = ['nome', 'cognome', 'numero_telefono', 'indirizzo', 'numero_passaporto', 'nazionalita']
        
        for campo in campi_allowed:
            if campo in dati:
                campi_update.append(f"{campo} = %s")
                params.append(dati[campo])
        
        if not campi_update:
            return jsonify({'errore': 'Nessun campo da aggiornare'}), 400
        
        # Aggiungo l'ID alla fine per la clausola WHERE
        params.append(id_utente)
        
        # Creo la query finale
        sql = f"UPDATE Utenti SET {', '.join(campi_update)} WHERE id_utente = %s"
        
        # Eseguo l'aggiornamento
        esegui_modifica(sql, params)
        
        return jsonify({'messaggio': 'Profilo aggiornato con successo'}), 200
    
    except Exception as e:
        print(f"Errore: {e}")
        return jsonify({'errore': 'Errore interno del server'}), 500

# ================================
# ROTTE PER AEROPORTI E COMPAGNIE
# ================================

@app.route('/api/aeroporti', methods=['GET'])
def get_aeroporti():
    """
    Recupera la lista di tutti gli aeroporti.
    GET /api/aeroporti
    Restituisce: lista degli aeroporti
    """
    try:
        sql = "SELECT id_aeroporto, codice_iata, nome, citta, paese FROM Aeroporti ORDER BY citta"
        
        aeroporti = esegui_query(sql)
        
        if aeroporti is None:
            return jsonify({'errore': 'Errore nel recupero degli aeroporti'}), 500
        
        return jsonify(aeroporti), 200
    
    except Exception as e:
        print(f"Errore: {e}")
        return jsonify({'errore': 'Errore interno del server'}), 500

@app.route('/api/compagnie', methods=['GET'])
def get_compagnie():
    """
    Recupera la lista di tutte le compagnie aeree.
    GET /api/compagnie
    Restituisce: lista delle compagnie
    """
    try:
        sql = "SELECT id_compagnia, nome, codice_iata, descrizione FROM Compagnie_Aeree ORDER BY nome"
        
        compagnie = esegui_query(sql)
        
        if compagnie is None:
            return jsonify({'errore': 'Errore nel recupero delle compagnie'}), 500
        
        return jsonify(compagnie), 200
    
    except Exception as e:
        print(f"Errore: {e}")
        return jsonify({'errore': 'Errore interno del server'}), 500

# ================================
# ROTTA HEALTH CHECK
# ================================

@app.route('/api/health', methods=['GET'])
def health_check():
    """
    Verifica che il server Flask sia in funzione.
    GET /api/health
    Restituisce: messaggio di stato
    """
    return jsonify({'status': 'ok', 'messaggio': 'Server Flask in funzione'}), 200

# ================================
# GESTIONE DEGLI ERRORI
# ================================

@app.errorhandler(404)
def non_trovato(e):
    """
    Gestisce gli errori 404 (risorsa non trovata).
    """
    return jsonify({'errore': 'Risorsa non trovata'}), 404

@app.errorhandler(500)
def errore_interno(e):
    """
    Gestisce gli errori 500 (errore interno del server).
    """
    return jsonify({'errore': 'Errore interno del server'}), 500

# ================================
# AVVIO DELL'APPLICAZIONE
# ================================

if __name__ == '__main__':
    # Avvio il server Flask in modalità debug
    # debug=True: il server si riavvia quando modifico il codice
    # port=5000: il server ascolterà sulla porta 5000
    app.run(debug=True, port=5000, host='0.0.0.0')
    # host='0.0.0.0' permette di accedere da altri computer
