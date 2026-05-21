// Modulo di routing (opzionale, utile per editor e test)
// Importa le rotte definite in app.routes.ts e le espone come modulo
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { routes } from './app.routes';

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
