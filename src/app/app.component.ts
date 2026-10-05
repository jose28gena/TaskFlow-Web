import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: `
    <header class="topbar">
      <span class="brand">TaskFlow</span>
      @if (auth.email(); as email) {
        <div class="session">
          <span class="muted">{{ email }}</span>
          <button type="button" class="btn btn-ghost" (click)="auth.logout()">Cerrar sesión</button>
        </div>
      }
    </header>
    <main class="container">
      <router-outlet />
    </main>
  `
})
export class AppComponent {
  protected readonly auth = inject(AuthService);
}
