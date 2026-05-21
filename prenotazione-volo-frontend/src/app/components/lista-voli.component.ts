// ✈️ COMPONENTE LISTA VOLI - PRENOTAZIONE VOLI
// Mostra la lista di tutti i voli disponibili

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
// Component: decoratore per creare un componente Angular
// OnInit: interfaccia che permette di eseguire codice quando il componente viene inizializzato

import { VoliService } from '../services/voli.service';
// Importo il servizio per comunicare con il backend

// ================================
// DECORATOR @Component
// ================================

@Component({
  selector: 'app-lista-voli',
  // Il nome del componente che userò nell'HTML: <app-lista-voli></app-lista-voli>
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './lista-voli.component.html',
  // Il file HTML che contiene il layout di questo componente
  
  styleUrls: ['./lista-voli.component.css']
  // Il file CSS con gli stili per questo componente
})

// ================================
// CLASSE DEL COMPONENTE
// ================================

export class ListaVoliComponent implements OnInit {
  // Implemento l'interfaccia OnInit

  // ================================
  // PROPRIETÀ DEL COMPONENTE
  // ================================

  voli: any[] = [];
  // Array che conterrà la lista dei voli
  // any[] significa array di oggetti generici

  voli_filtrati: any[] = [];
  // Array con i voli filtrati (quando l'utente cerca)

  caricamento = true;
  // Booleano: true se sto caricando i dati, false se ho finito
  // Usato per mostrare un loader/spinner

  errore: string | null = null;
  // Stringa che contiene il messaggio di errore (null = nessun errore)

  // Filtri di ricerca
  aeroporto_partenza = '';
  // Codice IATA del'aeroporto di partenza (es: FCO)

  aeroporto_arrivo = '';
  // Codice IATA dell'aeroporto di arrivo (es: CDG)

  data_inizio = '';
  // Data di inizio ricerca (formato: YYYY-MM-DD)

  data_fine = '';
  // Data di fine ricerca (formato: YYYY-MM-DD)

  aeroporti: any[] = [];
  // Array con la lista degli aeroporti disponibili

  // ================================
  // CONSTRUCTOR - DEPENDENCY INJECTION
  // ================================

  constructor(
    private voliService: VoliService,
    // Inietto il servizio per i voli
    private router: Router
    // Inietto il router per navigare
  ) { }

  // ================================
  // NGONIT - ESEGUITO AL CARICAMENTO
  // ================================

  ngOnInit(): void {
    // Questo metodo viene eseguito quando il componente viene caricato
    // Usato per inizializzare i dati

    // Carico la lista di tutti i voli
    this.caricaTuttiVoli();

    // Carico la lista degli aeroporti per i filtri
    this.caricaAeroporti();
  }

  // ================================
  // METODO: CARICA TUTTI I VOLI
  // ================================

  caricaTuttiVoli(): void {
    // Scarica dal backend la lista di tutti i voli

    // Setto il flag di caricamento
    this.caricamento = true;
    this.errore = null;
    // Azzero il messaggio di errore

    // Chiamo il servizio per ottenere i voli
    this.voliService.getAllVoli().subscribe(
      // subscribe() si iscrive all'Observable per ricevere i dati

      (dati: any[]) => {
        // Questo blocco viene eseguito quando i dati arrivano dal backend
        // dati: l'array di voli ricevuto

        this.voli = dati;
        // Salvo i voli nella proprietà del componente

        this.voli_filtrati = dati;
        // Mostro tutti i voli anche nei filtrati

        this.caricamento = false;
        // Finito di caricareStampo il messaggio nella console per debug
        console.log('✅ Voli caricati:', dati);
      },

      (errore: any) => {
        // Questo blocco viene eseguito se c'è un errore dalla richiesta HTTP

        this.errore = 'Errore nel caricamento dei voli';
        // Setto il messaggio di errore

        this.caricamento = false;
        // Finito (anche se con errore)

        console.error('❌ Errore:', errore);
        // Stampo l'errore nella console
      }
    );
  }

  // ================================
  // METODO: CARICA AEROPORTI
  // ================================

  caricaAeroporti(): void {
    // Scarica dal backend la lista degli aeroporti

    this.voliService.getAeroporti().subscribe(
      (dati: any[]) => {
        this.aeroporti = dati;
        // Salvo gli aeroporti
        console.log('✅ Aeroporti caricati:', dati);
      },
      (errore: any) => {
        console.error('❌ Errore caricamento aeroporti:', errore);
      }
    );
  }

  // ================================
  // METODO: RICERCA VOLI
  // ================================

  ricercaVoli(): void {
    // Cerca i voli secondo i filtri inseriti

    // Creo un oggetto con i filtri
    const filtri = {
      partenza: this.aeroporto_partenza || undefined,
      // || undefined significa: se è vuoto, non includerlo
      arrivo: this.aeroporto_arrivo || undefined,
      data_inizio: this.data_inizio || undefined,
      data_fine: this.data_fine || undefined
    };

    // Se l'utente non ha inserito nessun filtro, carico tutti i voli
    if (!this.aeroporto_partenza && !this.aeroporto_arrivo && !this.data_inizio && !this.data_fine) {
      this.caricaTuttiVoli();
      return;
      // Esco dal metodo
    }

    // Altrimenti cerco con i filtri
    this.caricamento = true;

    this.voliService.cercaVoli(filtri).subscribe(
      (dati: any[]) => {
        this.voli_filtrati = dati;
        // Mostro i risultati della ricerca

        this.caricamento = false;

        if (dati.length === 0) {
          this.errore = 'Nessun volo trovato con i criteri selezionati';
          // Messaggio se non ci sono risultati
        } else {
          this.errore = null;
        }

        console.log('✅ Ricerca completata:', dati);
      },
      (errore: any) => {
        this.errore = 'Errore nella ricerca dei voli';
        this.caricamento = false;
        console.error('❌ Errore ricerca:', errore);
      }
    );
  }

  // ================================
  // METODO: REIMPOSTA FILTRI
  // ================================

  resettaFiltri(): void {
    // Cancella tutti i filtri e mostra di nuovo tutti i voli

    // Azzero i valori dei filtri
    this.aeroporto_partenza = '';
    this.aeroporto_arrivo = '';
    this.data_inizio = '';
    this.data_fine = '';

    // Carico di nuovo tutti i voli
    this.caricaTuttiVoli();
  }

  // ================================
  // METODO: NAVIGA AL DETTAGLIO DEL VOLO
  // ================================

  vaiADettaglio(id_volo: number): void {
    // Naviga alla pagina di dettaglio di un volo specifico
    // Parametri: id_volo (numero intero)

    // Navigò a /dettaglio-volo/1 (per esempio)
    this.router.navigate(['/dettaglio-volo', id_volo]);
    // this.router.navigate() cambia la rotta
    // ['/dettaglio-volo', id_volo] = array con il percorso
  }

  // ================================
  // METODO: FORMATTA DATA
  // ================================

  formattaData(data: string): string {
    // Formatta una data ISO (2026-06-15T09:00:00) in formato leggibile (15/06/2026 09:00)
    // Parametri: data (stringa ISO)
    // Restituisce: data formattata

    const d = new Date(data);
    // Creo un oggetto Date da una stringa ISO

    // Ottengo i componenti della data
    const giorno = String(d.getDate()).padStart(2, '0');
    // getDate(): giorno del mese (1-31)
    // padStart(2, '0'): aggiunge uno 0 davanti se è minore di 10 (5 → 05)

    const mese = String(d.getMonth() + 1).padStart(2, '0');
    // getMonth(): mese (0-11), aggiungo 1 perché parte da 0

    const anno = d.getFullYear();
    // getFullYear(): anno

    const ore = String(d.getHours()).padStart(2, '0');
    const minuti = String(d.getMinutes()).padStart(2, '0');

    // Ritorno la data formattata
    return `${giorno}/${mese}/${anno} ${ore}:${minuti}`;
    // Template string: stringa con variabili inserite con ${}
  }

  // ================================
  // METODO: CALCOLA DURATA VOLO
  // ================================

  calcolaDurata(data_partenza: string, data_arrivo: string): string {
    // Calcola quanti minuti dura il volo
    // Parametri: data di partenza e arrivo (stringhe ISO)
    // Restituisce: stringa con ore e minuti (es: "3h 30m")

    const partenza = new Date(data_partenza);
    const arrivo = new Date(data_arrivo);

    // Calcolo la differenza in millisecondi
    const differenza_ms = arrivo.getTime() - partenza.getTime();
    // getTime(): ritorna i millisecondi dall'1 gennaio 1970

    // Converto in minuti
    const minuti_totali = Math.floor(differenza_ms / (1000 * 60));
    // Math.floor(): arrotonda per difetto

    // Calcolo ore e minuti
    const ore = Math.floor(minuti_totali / 60);
    const minuti = minuti_totali % 60;
    // % modulo: resto della divisione

    // Ritorno il formato ore e minuti
    if (ore > 0) {
      return `${ore}h ${minuti}m`;
    } else {
      return `${minuti}m`;
    }
  }
}
