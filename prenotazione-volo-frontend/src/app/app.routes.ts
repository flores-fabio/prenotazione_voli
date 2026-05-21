// ✈️ ROUTING CONFIGURATION - PRENOTAZIONE VOLI
// Definisce tutte le rotte (pagine) dell'applicazione

import { Routes } from '@angular/router';
// Routes: array con le definizioni delle rotte

import { ListaVoliComponent } from './components/lista-voli.component';
// Componente per la ricerca voli

import { DettaglioVoloComponent } from './components/dettaglio-volo.component';
// Componente per il dettaglio del volo e la prenotazione

import { LoginComponent } from './components/login.component';
// Componente per il login

import { LeMiePrenotazioniComponent } from './components/le-mie-prenotazioni.component';
// Componente per visualizzare le prenotazioni dell'utente

// ================================
// DEFINIZIONE DELLE ROTTE
// ================================

export const routes: Routes = [
  // Rotta home (pagina iniziale)
  {
    path: '',
    // Percorso: http://localhost:4200/
    component: ListaVoliComponent
    // Mostra il componente ListaVoli
  },

  // Rotta dettaglio volo
  {
    path: 'dettaglio-volo/:id',
    // Percorso: http://localhost:4200/dettaglio-volo/1
    // :id è un parametro dinamico (l'ID del volo)
    component: DettaglioVoloComponent
    // Mostra il componente DettaglioVolo
  },

  // Rotta login
  {
    path: 'login',
    // Percorso: http://localhost:4200/login
    component: LoginComponent
  },

  // Rotta le mie prenotazioni
  {
    path: 'le-mie-prenotazioni',
    // Percorso: http://localhost:4200/le-mie-prenotazioni
    component: LeMiePrenotazioniComponent
  },

  // Rotta wildcard (cattura tutti i percorsi non definiti)
  {
    path: '**',
    // ** significa "qualsiasi percorso non trovato"
    redirectTo: ''
    // Reindirizza alla home (pagina iniziale)
  }
];
