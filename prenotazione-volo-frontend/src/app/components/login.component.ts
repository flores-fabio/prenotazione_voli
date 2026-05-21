// ✈️ COMPONENTE LOGIN - PRENOTAZIONE VOLI
// Permette agli utenti di accedere al loro account

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { UtentiService } from '../services/utenti.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})

export class LoginComponent {
  // Componente per il login degli utenti

  // ================================
  // PROPRIETÀ
  // ================================

  email = '';
  // Email dell'utente

  password = '';
  // Password dell'utente

  errore: string | null = null;
  // Messaggio di errore

  caricamento = false;
  // Flag per indicare che il login è in corso

  // ================================
  // CONSTRUCTOR
  // ================================

  constructor(
    private utentiService: UtentiService,
    private router: Router
  ) { }

  // ================================
  // METODO: EFFETTUA LOGIN
  // ================================

  effettuaLogin(): void {
    // Autentica l'utente con email e password

    // Reset dei messaggi
    this.errore = null;

    // Validazione dei campi
    if (!this.email || !this.password) {
      this.errore = 'Inserisci email e password';
      return;
    }

    // Avvio il login
    this.caricamento = true;

    // Chiamo il servizio di login
    this.utentiService.login(this.email, this.password).subscribe(
      (risposta: any) => {
        // Successo!

        // Salvo l'utente loggato
        this.utentiService.setUtenteLoggato(risposta);

        this.caricamento = false;

        // Reindirizzo alla home
        this.router.navigate(['/']);

        console.log('✅ Login effettuato:', risposta);
      },
      (errore: any) => {
        // Errore nel login

        this.errore = 'Email o password scorretti';
        this.caricamento = false;

        console.error('❌ Errore login:', errore);
      }
    );
  }

  // ================================
  // METODO: REGISTRAZIONE
  // ================================

  vaiARegistrazione(): void {
    // Naviga alla pagina di registrazione
    this.router.navigate(['/registrazione']);
  }
}
