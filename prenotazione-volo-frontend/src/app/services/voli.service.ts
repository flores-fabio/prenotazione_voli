// ✈️ SERVIZIO VOLI - PRENOTAZIONE VOLI
// Questo servizio gestisce le chiamate API al backend per i voli

import { Injectable } from '@angular/core';
// Injectable: decora tale che il servizio può essere iniettato in altri componenti
import { HttpClient, HttpParams } from '@angular/common/http';
// HttpClient: usato per fare richieste HTTP (GET, POST, PUT, DELETE)
// HttpParams: per aggiungere parametri alle query string

import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
// Observable: oggetto che emette valori nel tempo (come un flusso di dati)
// Usato per gestire le risposte asincrone dalle API

// ================================
// DECORATOR @Injectable
// ================================

@Injectable({
  providedIn: 'root'
  // 'providedIn: root' significa che il servizio è disponibile in tutta l'app
  // (non devo dichiararlo manualmente nei moduli)
})
export class VoliService {
  // Classe che gestisce tutte le operazioni sui voli

  // URL del backend Flask (prende il valore da environment)
  private apiUrl = `${environment.apiUrl}/voli`;
  // Questo è l'indirizzo del nostro server Flask
  
  // ================================
  // CONSTRUCTOR - DEPENDENCY INJECTION
  // ================================
  
  constructor(private http: HttpClient) {
    // http: inietto il servizio HttpClient per fare richieste HTTP
    // 'private' significa che è una proprietà privata della classe
  }

  // ================================
  // METODO: OTTIENI TUTTI I VOLI
  // ================================

  getAllVoli(): Observable<any[]> {
    // Recupera la lista di tutti i voli disponibili
    // Restituisce: Observable che emette un array di voli
    
    // Faccio una richiesta GET all'indirizzo http://localhost:5000/api/voli
    return this.http.get<any[]>(this.apiUrl);
    // <any[]> significa che mi aspetto un array come risposta
    // L'Observable verrà completato quando il backend risponde
  }

  // ================================
  // METODO: OTTIENI UN SINGOLO VOLO
  // ================================

  getVoloDettaglio(id_volo: number): Observable<any> {
    // Recupera i dettagli di un singolo volo
    // Parametri: id_volo (numero intero dell'ID del volo)
    // Restituisce: Observable con i dettagli del volo
    
    // Faccio una richiesta GET all'indirizzo: http://localhost:5000/api/voli/1
    return this.http.get<any>(`${this.apiUrl}/${id_volo}`);
    // Uso `` (backtick) per fare string interpolation (inserire variabili in una stringa)
  }

  // ================================
  // METODO: CERCA VOLI CON FILTRI
  // ================================

  cercaVoli(filtri: {
    partenza?: string,   // Codice IATA aeroporto partenza (es: FCO)
    arrivo?: string,     // Codice IATA aeroporto arrivo (es: CDG)
    data_inizio?: string, // Data inizio (formato: YYYY-MM-DD)
    data_fine?: string    // Data fine (formato: YYYY-MM-DD)
  }): Observable<any[]> {
    // Cerca voli usando i filtri forniti
    // I parametri con ? sono opzionali (l'utente non deve fornirli tutti)
    // Restituisce: Observable con l'array di voli che corrispondono ai criteri
    
    // Creo un oggetto HttpParams per aggiungere i filtri alla query string
    let params = new HttpParams();
    // Questo oggetto raccoglie i parametri da inviare nell'URL
    
    // Aggiungo il filtro di partenza (se è stato fornito)
    if (filtri.partenza) {
      params = params.set('partenza', filtri.partenza);
      // set() aggiunge un parametro: URL diventerà ?partenza=FCO
    }
    
    // Aggiungo il filtro di arrivo
    if (filtri.arrivo) {
      params = params.set('arrivo', filtri.arrivo);
    }
    
    // Aggiungo la data inizio
    if (filtri.data_inizio) {
      params = params.set('data_inizio', filtri.data_inizio);
    }
    
    // Aggiungo la data fine
    if (filtri.data_fine) {
      params = params.set('data_fine', filtri.data_fine);
    }
    
    // Faccio la richiesta GET con i parametri
    // URL finale sarà: http://localhost:5000/api/voli/cerca?partenza=FCO&arrivo=CDG...
    return this.http.get<any[]>(`${this.apiUrl}/cerca`, { params: params });
    // params: params aggiunge i parametri all'URL
  }

  // ================================
  // METODO: OTTIENI AEROPORTI
  // ================================

  getAeroporti(): Observable<any[]> {
    // Recupera la lista di tutti gli aeroporti disponibili
    // Utile per popolare i dropdown nelle form di ricerca
    // Restituisce: Observable con l'array di aeroporti
    
    const url = `${environment.apiUrl}/aeroporti`;
    // URL per ottenere gli aeroporti
    
    return this.http.get<any[]>(url);
  }

  // ================================
  // METODO: OTTIENI COMPAGNIE
  // ================================

  getCompagnie(): Observable<any[]> {
    // Recupera la lista di tutte le compagnie aeree
    // Utile per filtri e informazioni generali
    // Restituisce: Observable con l'array di compagnie
    
    const url = `${environment.apiUrl}/compagnie`;
    // URL per ottenere le compagnie
    
    return this.http.get<any[]>(url);
  }
}
