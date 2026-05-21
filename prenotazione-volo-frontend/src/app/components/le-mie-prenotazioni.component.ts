// ✈️ COMPONENTE LE MIE PRENOTAZIONI - PRENOTAZIONE VOLI
// Mostra tutte le prenotazioni effettuate dall'utente loggato

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { UtentiService } from '../services/utenti.service';
import { PrenotazioniService } from '../services/prenotazioni.service';

@Component({
  selector: 'app-le-mie-prenotazioni',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './le-mie-prenotazioni.component.html',
  styleUrls: ['./le-mie-prenotazioni.component.css']
})

export class LeMiePrenotazioniComponent implements OnInit {
  // Componente per visualizzare le prenotazioni dell'utente

  // ================================
  // PROPRIETÀ
  // ================================

  prenotazioni: any[] = [];
  // Array con tutte le prenotazioni dell'utente

  caricamento = true;
  // Flag di caricamento

  errore: string | null = null;
  // Messaggio di errore

  utente: any = null;
  // Dati dell'utente loggato

  prenotazione_selezionata: any = null;
  // Prenotazione attualmente selezionata per visualizzare i dettagli

  // ================================
  // CONSTRUCTOR
  // ================================

  constructor(
    private utentiService: UtentiService,
    private prenotazioniService: PrenotazioniService,
    private router: Router
  ) { }

  // ================================
  // NGONIT
  // ================================

  ngOnInit(): void {
    // Recupero l'utente loggato
    this.utente = this.utentiService.getUtenteCorrente();

    // Se non c'è un utente loggato, reindirizzo al login
    if (!this.utente) {
      this.router.navigate(['/login']);
      return;
    }

    // Carico le prenotazioni dell'utente
    this.caricaPrenotazioni();
  }

  // ================================
  // METODO: CARICA PRENOTAZIONI
  // ================================

  caricaPrenotazioni(): void {
    // Scarica le prenotazioni dal backend

    this.caricamento = true;
    this.errore = null;

    // Chiamo il servizio per ottenere le prenotazioni
    this.prenotazioniService.getPrenotazioniUtente(this.utente.id_utente).subscribe(
      (dati: any[]) => {
        this.prenotazioni = dati;
        // Salvo le prenotazioni

        this.caricamento = false;

        console.log('✅ Prenotazioni caricate:', dati);
      },
      (errore: any) => {
        this.errore = 'Errore nel caricamento delle prenotazioni';
        this.caricamento = false;
        console.error('❌ Errore:', errore);
      }
    );
  }

  // ================================
  // METODO: VISUALIZZA DETTAGLI
  // ================================

  visualizzaDettagli(id_prenotazione: number): void {
    // Mostra i dettagli completi di una prenotazione

    this.prenotazioniService.getDettagliPrenotazione(id_prenotazione).subscribe(
      (dati: any) => {
        this.prenotazione_selezionata = dati;
        // Salvo i dettagli

        console.log('✅ Dettagli prenotazione:', dati);
      },
      (errore: any) => {
        this.errore = 'Errore nel caricamento dei dettagli';
        console.error('❌ Errore:', errore);
      }
    );
  }

  // ================================
  // METODO: CHIUDI DETTAGLI
  // ================================

  chiudiDettagli(): void {
    // Chiude il popup dei dettagli
    this.prenotazione_selezionata = null;
  }

  // ================================
  // METODO: ANNULLA PRENOTAZIONE
  // ================================

  annullaPrenotazione(id_prenotazione: number): void {
    // Cancella una prenotazione

    if (!confirm('Sei sicuro di voler annullare questa prenotazione?')) {
      return;
      // Se l'utente clicca "No", esco
    }

    // Chiamo il servizio per annullare
    this.prenotazioniService.annullaPrenotazione(id_prenotazione).subscribe(
      (risposta: any) => {
        // Successo!
        console.log('✅ Prenotazione annullata:', risposta);

        // Ricarico le prenotazioni
        this.caricaPrenotazioni();

        // Chiudo i dettagli se erano aperti
        this.chiudiDettagli();
      },
      (errore: any) => {
        this.errore = 'Errore nell\'annullamento della prenotazione';
        console.error('❌ Errore:', errore);
      }
    );
  }

  // ================================
  // METODO: FORMATTA DATA
  // ================================

  formattaData(data: string): string {
    const d = new Date(data);
    const giorno = String(d.getDate()).padStart(2, '0');
    const mese = String(d.getMonth() + 1).padStart(2, '0');
    const anno = d.getFullYear();
    const ore = String(d.getHours()).padStart(2, '0');
    const minuti = String(d.getMinutes()).padStart(2, '0');

    return `${giorno}/${mese}/${anno} ${ore}:${minuti}`;
  }

  // ================================
  // METODO: LOGOUT
  // ================================

  logout(): void {
    // Effettua il logout

    this.utentiService.logout();
    // Chiamo il metodo di logout del servizio

    // Reindirizzo alla home
    this.router.navigate(['/']);
  }
}
