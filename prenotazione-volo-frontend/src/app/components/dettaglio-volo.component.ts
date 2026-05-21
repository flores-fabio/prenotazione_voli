// ✈️ COMPONENTE DETTAGLIO VOLO - PRENOTAZIONE VOLI
// Mostra i dettagli di un singolo volo e permette di prenotare

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
// ActivatedRoute: accede ai parametri della rotta (es: l'ID del volo)

import { VoliService } from '../services/voli.service';
import { PrenotazioniService } from '../services/prenotazioni.service';
import { UtentiService } from '../services/utenti.service';

@Component({
  selector: 'app-dettaglio-volo',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './dettaglio-volo.component.html',
  styleUrls: ['./dettaglio-volo.component.css']
})

export class DettaglioVoloComponent implements OnInit {
  // Componente per visualizzare e prenotare un volo

  // ================================
  // PROPRIETÀ
  // ================================

  volo: any = null;
  // Il volo che stiamo visualizzando

  caricamento = true;
  // Flag per lo stato di caricamento

  errore: string | null = null;
  // Messaggio di errore

  numero_passeggeri = 1;
  // Numero di passeggeri (inizialmente 1)

  posti_selezionati: any[] = [];
  // Array con i posti selezionati per la prenotazione

  mostra_form_prenotazione = false;
  // Booleano: true se devo mostrare il form di prenotazione

  prenotazione_in_corso = false;
  // Flag per indicare che la prenotazione è in corso

  successo: string | null = null;
  // Messaggio di successo della prenotazione

  // ================================
  // CONSTRUCTOR
  // ================================

  constructor(
    private activatedRoute: ActivatedRoute,
    // Accedo ai parametri della rotta
    private voliService: VoliService,
    private prenotazioniService: PrenotazioniService,
    private utentiService: UtentiService,
    private router: Router
  ) { }

  // ================================
  // NGONIT
  // ================================

  ngOnInit(): void {
    // Recupero l'ID del volo dai parametri della rotta

    this.activatedRoute.params.subscribe((params: any) => {
      // params.id contiene il numero passato nell'URL
      const id_volo = params['id'];

      // Carico i dettagli del volo
      this.caricaDettagliVolo(id_volo);
    });
  }

  // ================================
  // METODO: CARICA DETTAGLI VOLO
  // ================================

  caricaDettagliVolo(id_volo: number): void {
    // Scarica i dettagli completi del volo dal backend

    this.caricamento = true;
    this.errore = null;

    this.voliService.getVoloDettaglio(id_volo).subscribe(
      (dati: any) => {
        this.volo = dati;
        // Salvo i dettagli del volo

        this.caricamento = false;

        console.log('✅ Volo caricato:', dati);
      },
      (errore: any) => {
        this.errore = 'Errore nel caricamento del volo';
        this.caricamento = false;
        console.error('❌ Errore:', errore);
      }
    );
  }

  // ================================
  // METODO: AGGIORNA NUMERO PASSEGGERI
  // ================================

  aggiornaNumeroPasseggeri(nuovo_numero: number): void {
    // Aggiorna il numero di passeggeri e resetta la selezione dei posti

    // Verifico che il numero sia valido
    if (nuovo_numero < 1 || nuovo_numero > this.volo.posti_disponibili) {
      return;
      // Esco se il numero non è valido
    }

    this.numero_passeggeri = nuovo_numero;
    // Salvo il nuovo numero

    this.posti_selezionati = [];
    // Resetto i posti selezionati
  }

  // ================================
  // METODO: SELEZIONA/DESELEZIONA POSTO
  // ================================

  togglePosto(id_posto: number, numero_posto: string): void {
    // Alterna la selezione di un posto (seleziona/deseleziona)
    // Parametri: id_posto e numero_posto

    // Cerco se il posto è già selezionato
    const indice = this.posti_selezionati.findIndex((p: any) => p.id_posto === id_posto);
    // findIndex() ritorna l'indice se trovato, -1 altrimenti

    if (indice === -1) {
      // Se il posto NON è selezionato

      // Verifico che non abbia già selezionato abbastanza posti
      if (this.posti_selezionati.length < this.numero_passeggeri) {
        // Aggiungo il posto alla lista
        this.posti_selezionati.push({
          id_posto: id_posto,
          numero_posto: numero_posto
        });
      } else {
        // Se ho già selezionato abbastanza posti
        this.errore = `Hai già selezionato ${this.numero_passeggeri} posti`;
        // Mostro un errore
      }
    } else {
      // Se il posto è selezionato, lo tolgo
      this.posti_selezionati.splice(indice, 1);
      // splice() rimuove l'elemento all'indice specificato
      this.errore = null;
    }
  }

  // ================================
  // METODO: VERIFICA SE POSTO SELEZIONATO
  // ================================

  isPostoSelezionato(id_posto: number): boolean {
    // Verifica se un posto è stato selezionato
    // Restituisce: true se selezionato, false altrimenti

    // Cerco il posto nella lista
    return this.posti_selezionati.some((p: any) => p.id_posto === id_posto);
    // some() ritorna true se almeno un elemento soddisfa la condizione
  }

  // ================================
  // METODO: PROCEDI A PRENOTAZIONE
  // ================================

  procedintePrenotazione(): void {
    // Verifica se l'utente ha selezionato i posti e procede alla prenotazione

    // Resetto i messaggi
    this.errore = null;
    this.successo = null;

    // Verifico che siano stati selezionati abbastanza posti
    if (this.posti_selezionati.length !== this.numero_passeggeri) {
      this.errore = `Seleziona ${this.numero_passeggeri} posti`;
      return;
    }

    // Verifico che l'utente sia loggato
    const utente = this.utentiService.getUtenteCorrente();
    if (!utente) {
      this.errore = 'Devi essere loggato per prenotare';
      // Reindirizzo al login
      this.router.navigate(['/login']);
      return;
    }

    // Avvio la prenotazione
    this.effettuaPrenotazione(utente);
  }

  // ================================
  // METODO: EFFETTUA PRENOTAZIONE
  // ================================

  effettuaPrenotazione(utente: any): void {
    // Invia la prenotazione al backend

    this.prenotazione_in_corso = true;

    // Creo l'oggetto dati per la prenotazione
    const dati_prenotazione = {
      id_utente: utente.id_utente,
      id_volo: this.volo.id_volo,
      numero_passeggeri: this.numero_passeggeri,
      posti: this.posti_selezionati.map((p: any) => p.id_posto)
      // map() estrae solo gli ID dei posti
    };

    // Chiamo il servizio per creare la prenotazione
    this.prenotazioniService.creaPrenotazione(dati_prenotazione).subscribe(
      (risposta: any) => {
        // Successo!

        this.successo = `Prenotazione effettuata! Numero: ${risposta.numero_prenotazione}`;
        // Mostro il messaggio di successo

        this.prenotazione_in_corso = false;

        // Resetto il form
        this.posti_selezionati = [];
        this.numero_passeggeri = 1;

        // Reindirizzo alle mie prenotazioni dopo 2 secondi
        setTimeout(() => {
          this.router.navigate(['/le-mie-prenotazioni']);
        }, 2000);

        console.log('✅ Prenotazione effettuata:', risposta);
      },
      (errore: any) => {
        // Errore nella prenotazione

        this.errore = 'Errore nella creazione della prenotazione';
        this.prenotazione_in_corso = false;

        console.error('❌ Errore:', errore);
      }
    );
  }

  // ================================
  // METODO: FORMATTA DATA
  // ================================

  formattaData(data: string): string {
    // Uguale al componente della lista voli
    const d = new Date(data);
    const giorno = String(d.getDate()).padStart(2, '0');
    const mese = String(d.getMonth() + 1).padStart(2, '0');
    const anno = d.getFullYear();
    const ore = String(d.getHours()).padStart(2, '0');
    const minuti = String(d.getMinutes()).padStart(2, '0');

    return `${giorno}/${mese}/${anno} ${ore}:${minuti}`;
  }

  // ================================
  // METODO: OTTIENI POSTI DISPONIBILI
  // ================================

  getPostiDisponibili(): any[] {
    // Restituisce solo i posti disponibili (non prenotati)

    if (!this.volo || !this.volo.posti) {
      return [];
    }

    // Filtro i posti che hanno disponibile = true
    return this.volo.posti.filter((p: any) => p.disponibile === true);
  }

  // ================================
  // METODO: TORNA INDIETRO
  // ================================

  tornaIndietro(): void {
    // Torna alla lista voli
    this.router.navigate(['/']);
  }
}
