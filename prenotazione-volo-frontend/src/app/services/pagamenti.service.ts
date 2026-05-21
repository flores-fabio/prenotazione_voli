// ✈️ SERVIZIO PAGAMENTI - PRENOTAZIONE VOLI
// Gestisce le operazioni di pagamento

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PagamentiService {
  // Servizio per gestire i pagamenti

  private apiUrl = `${environment.apiUrl}/pagamenti`;

  constructor(private http: HttpClient) {
    // Inietto HttpClient
  }

  // ================================
  // METODO: CREA NUOVO PAGAMENTO
  // ================================

  creaPagamento(dati: {
    id_prenotazione: number,    // ID della prenotazione da pagare
    importo: number,            // Importo da pagare
    metodo_pagamento: string,   // Metodo di pagamento (es: "Carta Credito")
    numero_carta?: string       // Numero della carta (opzionale)
  }): Observable<any> {
    // Crea un nuovo pagamento per una prenotazione
    // Parametri: oggetto con i dati del pagamento
    // Restituisce: Observable con i dati del pagamento creato
    
    // Faccio una richiesta POST
    return this.http.post<any>(this.apiUrl, dati);
  }

  // ================================
  // METODO: OTTIENI PAGAMENTI PRENOTAZIONE
  // ================================

  getPagamentiPrenotazione(id_prenotazione: number): Observable<any[]> {
    // Recupera tutti i pagamenti di una prenotazione
    // Parametri: id_prenotazione (numero intero)
    // Restituisce: Observable con array di pagamenti
    
    // Faccio una richiesta GET all'indirizzo: /api/pagamenti/1
    return this.http.get<any[]>(`${this.apiUrl}/${id_prenotazione}`);
  }

  // ================================
  // METODO: VALIDA NUMERO CARTA
  // ================================

  validaNumeroCarta(numeroCarta: string): boolean {
    // Valida il formato del numero di carta (Luhn algorithm)
    // Parametri: numeroCarta (stringa)
    // Restituisce: true se valido, false altrimenti
    
    // Rimuovo gli spazi
    numeroCarta = numeroCarta.replace(/\s/g, '');
    
    // Verifico che contenga solo cifre
    if (!/^\d+$/.test(numeroCarta)) {
      return false;
      // Se non contiene solo numeri, non è valido
    }
    
    // Verifico la lunghezza (16 cifre per la maggior parte delle carte)
    if (numeroCarta.length !== 16) {
      return false;
    }
    
    // Applicò l'algoritmo di Luhn (formula per validare le carte)
    let somma = 0;
    // Variabile per accumulare la somma
    
    for (let i = 0; i < numeroCarta.length; i++) {
      // Ciclo su ogni cifra della carta
      
      let cifra = parseInt(numeroCarta[i]);
      // Converto il carattere in numero
      
      // Se la posizione è pari, moltiplico per 2
      if ((numeroCarta.length - i) % 2 === 0) {
        cifra *= 2;
        // Raddoppio la cifra
        
        // Se il risultato è > 9, sottraggo 9
        if (cifra > 9) {
          cifra -= 9;
        }
      }
      
      // Aggiungo alla somma
      somma += cifra;
    }
    
    // Se la somma è divisibile per 10, la carta è valida
    return somma % 10 === 0;
  }

  // ================================
  // METODO: VALIDA DATA SCADENZA
  // ================================

  validaDataScadenza(mese: string, anno: string): boolean {
    // Valida se la data di scadenza della carta è ancora valida
    // Parametri: mese (es: "12") e anno (es: "2025")
    // Restituisce: true se valida, false se scaduta
    
    // Converto in numeri
    const mese_num = parseInt(mese);
    const anno_num = parseInt(anno);
    
    // Ottengo la data corrente
    const adesso = new Date();
    const mese_corrente = adesso.getMonth() + 1;  // getMonth() ritorna 0-11
    const anno_corrente = adesso.getFullYear();
    
    // Se l'anno è minore di quello corrente, è scaduta
    if (anno_num < anno_corrente) {
      return false;
    }
    
    // Se l'anno è uguale, verifico il mese
    if (anno_num === anno_corrente && mese_num < mese_corrente) {
      return false;
      // Se il mese è minore, è scaduta
    }
    
    // Altrimenti è ancora valida
    return true;
  }

  // ================================
  // METODO: VALIDA CVC
  // ================================

  validaCVC(cvc: string): boolean {
    // Valida il format del CVC (CVV) della carta
    // Parametri: cvc (stringa)
    // Restituisce: true se valido (3-4 cifre), false altrimenti
    
    // Rimuovo gli spazi
    cvc = cvc.replace(/\s/g, '');
    
    // Verifico che contenga solo cifre e sia di 3 o 4 caratteri
    return /^\d{3,4}$/.test(cvc);
    // /^\d{3,4}$/ = regex che controlla 3 o 4 cifre
  }
}
