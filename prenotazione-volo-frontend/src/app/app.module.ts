// Modulo principale Angular che contiene la configurazione dell'app
// Questo modulo definisce i componenti principali e le importazioni condivise
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { App } from './app';

@NgModule({
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    AppRoutingModule,
    App
  ],
  providers: [],
  bootstrap: [App]
})
export class AppModule {}
