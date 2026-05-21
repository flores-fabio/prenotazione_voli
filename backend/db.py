# ✈️ CONFIGURAZIONE DATABASE - PRENOTAZIONE VOLI
# File di utilità per la connessione al database

import pymysql
import os
from dotenv import load_dotenv
# PyMySQL: libreria per connettersi a MariaDB/MySQL

# ================================
# CONFIGURAZIONE DELLA CONNESSIONE
# ================================

load_dotenv()
# Carico le variabili d'ambiente dal file .env se presente

# Dati di connessione al database MariaDB (prelevati da variabili d'ambiente se presenti)
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
# CLASSE PER GESTIRE IL DATABASE
# ================================

class DatabaseManager:
    """
    Classe per gestire tutte le operazioni sul database.
    Questa classe centralizza la logica di connessione e query.
    """
    
    def __init__(self, config=DB_CONFIG):
        """
        Inizializzatore della classe.
        
        Parametri:
        - config: dizionario con le credenziali di connessione
        """
        self.config = config
        # Salvo la configurazione
    
    def connect(self):
        """
        Crea una connessione al database.
        Restituisce: oggetto di connessione oppure None se fallisce
        """
        try:
            # Provo a connettermi con le credenziali
            connection = pymysql.connect(**self.config)
            return connection
            # Restituisco la connessione riuscita
        except pymysql.Error as e:
            # Se fallisce, stampo l'errore
            print(f"❌ Errore di connessione: {e}")
            return None
            # Restituisco None per indicare il fallimento
    
    def execute_query(self, sql, params=None):
        """
        Esegue una query SELECT.
        
        Parametri:
        - sql: comando SQL da eseguire
        - params: parametri da inserire nella query (es: WHERE id = %s)
        
        Restituisce: lista di dizionari con i risultati
        """
        connection = self.connect()
        # Mi connetto al database
        
        if not connection:
            # Se la connessione fallisce, esco
            return None
        
        try:
            with connection.cursor() as cursor:
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
                # Restituisco una lista di dizionari
        
        except pymysql.Error as e:
            # Se c'è un errore nella query
            print(f"❌ Errore query: {e}")
            return None
        
        finally:
            connection.close()
            # Chiudo SEMPRE la connessione quando finisco
    
    def execute_update(self, sql, params=None):
        """
        Esegue una query che modifica il database (INSERT, UPDATE, DELETE).
        
        Parametri:
        - sql: comando SQL da eseguire
        - params: parametri da inserire nella query
        
        Restituisce: 
        - ID della riga inserita (per INSERT)
        - Numero di righe modificate (per UPDATE/DELETE)
        - None se c'è un errore
        """
        connection = self.connect()
        
        if not connection:
            return None
        
        try:
            with connection.cursor() as cursor:
                # Eseguo la query
                if params:
                    cursor.execute(sql, params)
                else:
                    cursor.execute(sql)
                
                # Salvo i cambiamenti nel database
                connection.commit()
                # COMMIT: scrivo le modifiche sul database
                
                # Restituisco l'ID della riga appena inserita (se INSERT)
                if cursor.lastrowid:
                    return cursor.lastrowid
                else:
                    # Oppure il numero di righe modificate (se UPDATE/DELETE)
                    return cursor.rowcount
        
        except pymysql.Error as e:
            # Se c'è un errore, annullo le modifiche
            connection.rollback()
            # ROLLBACK: cancello le modifiche incomplete
            print(f"❌ Errore modifica: {e}")
            return None
        
        finally:
            connection.close()
    
    def test_connection(self):
        """
        Testa se la connessione al database funziona.
        Restituisce: True se la connessione è OK, False altrimenti
        """
        try:
            connection = self.connect()
            # Provo a connettermi
            
            if connection:
                # Se la connessione è riuscita
                connection.close()
                # Chiudo la connessione
                print("✅ Connessione al database OK")
                return True
            else:
                # Se la connessione è fallita
                print("❌ Errore: non riesco a connettermi al database")
                return False
        
        except Exception as e:
            print(f"❌ Errore test connessione: {e}")
            return False

# ================================
# ISTANZA GLOBALE DEL MANAGER
# ================================

# Creo un'istanza del DatabaseManager che posso usare in tutto il progetto
db_manager = DatabaseManager()
# Questa istanza è disponibile in tutta l'applicazione

# ================================
# FUNZIONI UTILITY
# ================================

def get_db_connection():
    """
    Funzione utility per ottenere una connessione al database.
    Usare questa funzione quando serveDopo una connessione.
    """
    return db_manager.connect()

def test_db():
    """
    Funzione utility per testare la connessione.
    Usare questa funzione per verificare che il database sia raggiungibile.
    """
    return db_manager.test_connection()

# ================================
# ESECUZIONE TEST (se il file viene eseguito direttamente)
# ================================

if __name__ == '__main__':
    # Se questo file viene eseguito come script principale
    
    print("🔍 Test connessione database...")
    # Stampo un messaggio di informazione
    
    # Testo la connessione
    if test_db():
        print("✅ Database è pronto!")
    else:
        print("❌ Errore: non riesco a connettermi al database")
        print("Verifica che:")
        print("  1. MariaDB sia in esecuzione")
        print("  2. Le credenziali in DB_CONFIG siano corrette")
        print("  3. Il database 'prenotazione_volo' esista")
