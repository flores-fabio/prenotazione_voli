// ✈️ SERVIZIO PRENOTAZIONI - PRENOTAZIONE VOLI
// Gestisce le chiamate API per le prenotazioni

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PrenotazioniService {
  // Servizio che gestisce tutte le operazioni sulle prenotazioni

  // URL del backend Flask (prende il valore da environment)
  private apiUrl = `${environment.apiUrl}/prenotazioni`;

  constructor(private http: HttpClient) {
    // Inietto HttpClient per fare richieste HTTP
  }

  // ================================
  // METODO: OTTIENI PRENOTAZIONI DELL'UTENTE
  // ================================

  getPrenotazioniUtente(id_utente: number): Observable<any[]> {
    // Recupera tutte le prenotazioni di un utente specifico
    // Parametri: id_utente (numero intero)
    // Restituisce: Observable con array di prenotazioni
    
    // Faccio una richiesta GET con il parametro id_utente
    return this.http.get<any[]>(this.apiUrl, {
      params: { id_utente: id_utente.toString() }
      // Aggiungo il parametro alla query string: ?id_utente=1
    });
  }

  // ================================
  // METODO: OTTIENI DETTAGLI PRENOTAZIONE
  // ================================

  getDettagliPrenotazione(id_prenotazione: number): Observable<any> {
    // Recupera i dettagli completi di una singola prenotazione
    // Parametri: id_prenotazione (numero intero)
    // Restituisce: Observable con i dettagli della prenotazione
    
    // Faccio una richiesta GET: http://localhost:5000/api/prenotazioni/1
    return this.http.get<any>(`${this.apiUrl}/${id_prenotazione}`);
  }

  // ================================
  // METODO: CREA NUOVA PRENOTAZIONE
  // ================================

  creaPrenotazione(dati: {
    id_utente: number,      // ID dell'utente che prenota
    id_volo: number,        // ID del volo da prenotare
    numero_passeggeri: number,  // Numero di passeggeri
    posti: number[]         // Array di ID dei posti selezionati
  }): Observable<any> {
    // Crea una nuova prenotazione nel sistema
    // Parametri: oggetto con i dati della prenotazione
    // Restituisce: Observable con i dati della prenotazione creata
    
    // Faccio una richiesta POST all'indirizzo dei voli
    // POST = aggiungere dati al server
    return this.http.post<any>(this.apiUrl, dati);
    // I dati vengono inviati nel body della richiesta (convertiti automaticamente in JSON)
  }

  // ================================
  // METODO: ANNULLA PRENOTAZIONE
  // ================================

  annullaPrenotazione(id_prenotazione: number): Observable<any> {
    // Cancella una prenotazione esistente
    // Parametri: id_prenotazione (numero intero)
    // Restituisce: Observable con il messaggio di conferma
    
    // Faccio una richiesta DELETE all'indirizzo: http://localhost:5000/api/prenotazioni/1
    // DELETE = cancellare dati dal server
    return this.http.delete<any>(`${this.apiUrl}/${id_prenotazione}`);
  }

  // ================================
  // METODO: AGGIORNA PRENOTAZIONE
  // ================================

  aggiornaPrenotazione(id_prenotazione: number, dati: any): Observable<any> {
    // Aggiorna una prenotazione esistente
    // Parametri: 
    // - id_prenotazione: numero intero
    // - dati: oggetto con i campi da aggiornare
    // Restituisce: Observable con la conferma dell'aggiornamento
    
    // Faccio una richiesta PUT all'indirizzo: http://localhost:5000/api/prenotazioni/1
    // PUT = modificare dati nel server
    return this.http.put<any>(`${this.apiUrl}/${id_prenotazione}`, dati);
  }
}
