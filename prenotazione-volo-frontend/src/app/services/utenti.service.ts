// ✈️ SERVIZIO UTENTI - PRENOTAZIONE VOLI
// Gestisce le operazioni relative agli utenti (registrazione, login, profilo)

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';
// BehaviorSubject: un Observable speciale che mantiene sempre l'ultimo valore

@Injectable({
  providedIn: 'root'
})
export class UtentiService {
  // Servizio per gestire i dati degli utenti

  private apiUrl = `${environment.apiUrl}/utenti`;
  
  // BehaviorSubject per tracciare l'utente loggato
  // Questo permette a tutta l'app di sapere chi è loggato
  private utenteLoggato = new BehaviorSubject<any>(null);
  // Inizialmente nessun utente è loggato (null)
  
  // Observable pubblico: altri componenti possono ascoltare i cambiamenti
  public utenteLoggato$ = this.utenteLoggato.asObservable();

  constructor(private http: HttpClient) {
    // Inietto HttpClient
    this.caricaUtenteLoggato();
    // Carico l'utente loggato dal localStorage (se esiste)
  }

  // ================================
  // METODO: REGISTRAZIONE NUOVO UTENTE
  // ================================

  registrati(dati: {
    email: string,          // Email dell'utente
    password: string,       // Password
    nome: string,           // Nome
    cognome: string,        // Cognome
    data_nascita?: string,  // Data di nascita (opzionale)
    numero_telefono?: string // Numero di telefono (opzionale)
  }): Observable<any> {
    // Crea un nuovo account utente
    // Parametri: oggetto con i dati della registrazione
    // Restituisce: Observable con i dati del nuovo utente
    
    // Faccio una richiesta POST per creare un nuovo utente
    return this.http.post<any>(this.apiUrl, dati);
  }

  // ================================
  // METODO: LOGIN
  // ================================

  login(email: string, password: string): Observable<any> {
    // Autentica un utente e lo loggadell'app
    // Parametri: email e password
    // Restituisce: Observable con i dati dell'utente
    
    // Faccio una richiesta POST all'endpoint di login
    return this.http.post<any>(`${this.apiUrl}/login`, {
      email: email,
      password: password
    });
    // Invio email e password nel body della richiesta
  }

  // ================================
  // METODO: SALVA UTENTE LOGGATO
  // ================================

  setUtenteLoggato(utente: any): void {
    // Salva che l'utente è loggato
    // Parametri: oggetto con i dati dell'utente
    // Restituisce: nulla (void)
    
    // Salvo l'utente nel BehaviorSubject
    this.utenteLoggato.next(utente);
    // next() emette il nuovo valore agli observer
    
    // Salvo anche nel localStorage per persistenza
    // (così rimane loggato anche se chiude il browser)
    localStorage.setItem('utente_loggato', JSON.stringify(utente));
    // JSON.stringify() converte l'oggetto in una stringa JSON
  }

  // ================================
  // METODO: LOGOUT
  // ================================

  logout(): void {
    // Disconnette l'utente
    // Restituisce: nulla (void)
    
    // Tolgo l'utente dal BehaviorSubject
    this.utenteLoggato.next(null);
    // Setto a null per indicare che nessuno è loggato
    
    // Cancello dal localStorage
    localStorage.removeItem('utente_loggato');
    // removeItem() cancella una chiave dal localStorage
  }

  // ================================
  // METODO: CARICA UTENTE DAL LOCALSTORAGE
  // ================================

  private caricaUtenteLoggato(): void {
    // Carica l'utente dal localStorage (se esiste)
    // Questo viene eseguito quando il servizio viene inizializzato
    
    // Recupero dal localStorage
    const utenteJson = localStorage.getItem('utente_loggato');
    // getItem() recupera il valore salvato
    
    if (utenteJson) {
      // Se c'è un utente salvato
      const utente = JSON.parse(utenteJson);
      // JSON.parse() converte la stringa JSON in oggetto
      
      this.utenteLoggato.next(utente);
      // Setto l'utente nel BehaviorSubject
    }
  }

  // ================================
  // METODO: OTTIENI UTENTE CORRENTE
  // ================================

  getUtenteCorrente(): any {
    // Restituisce l'utente attualmente loggato
    // Restituisce: oggetto utente oppure null se non loggato
    
    // Restituisco il valore corrente del BehaviorSubject
    return this.utenteLoggato.value;
    // value: proprietà che contiene l'ultimo valore emesso
  }

  // ================================
  // METODO: OTTIENI PROFILO UTENTE
  // ================================

  getProfiloUtente(id_utente: number): Observable<any> {
    // Recupera il profilo completo di un utente
    // Parametri: id_utente (numero intero)
    // Restituisce: Observable con i dati del profilo
    
    // Faccio una richiesta GET
    return this.http.get<any>(`${this.apiUrl}/${id_utente}`);
  }

  // ================================
  // METODO: AGGIORNA PROFILO UTENTE
  // ================================

  aggiornaProfiloUtente(id_utente: number, dati: any): Observable<any> {
    // Aggiorna i dati del profilo di un utente
    // Parametri:
    // - id_utente: numero intero
    // - dati: oggetto con i campi da aggiornare
    // Restituisce: Observable con la conferma dell'aggiornamento
    
    // Faccio una richiesta PUT
    return this.http.put<any>(`${this.apiUrl}/${id_utente}`, dati);
  }

  // ================================
  // METODO: VERIFICA SE LOGGATO
  // ================================

  isLoggato(): boolean {
    // Verifica se un utente è attualmente loggato
    // Restituisce: true se loggato, false altrimenti
    
    // Restituisco true solo se c'è un utente
    return this.utenteLoggato.value !== null;
  }
}
