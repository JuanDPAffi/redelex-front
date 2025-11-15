import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, RouterLink } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink],
  template: `
    <div class="dashboard-layout">
      <!-- SIDEBAR -->
      <aside class="sidebar">
        <div class="sidebar__logo">
          <img src="/Affi_logo.png" alt="Logo" class="logo-img" />
          <span class="logo-text">Consulta Redelex</span>
        </div>

        <nav class="sidebar__nav">
          <div class="nav-section">
            <div class="nav-section__title">Consultas</div>
            <a routerLink="/dashboard/consultar"
               routerLinkActive="is-active"
               class="nav-link is-active">
              <span class="nav-link__icon">📄</span>
              <span class="nav-link__text">Consultar Reportes</span>
            </a>
          </div>
        </nav>
      </aside>

      <!-- MAIN AREA -->
      <div class="main">
        <!-- TOP HEADER -->
        <header class="top-header">
          <!--  <button class="menu-btn">☰</button> -->

          <div class="top-header__actions">
            <!--   <button class="icon-btn">👤</button> -->
            <button class="icon-btn" (click)="logout()">⏻</button>
          </div>
        </header>

        <!-- CONTENT -->
        <main class="main__content">
          <router-outlet></router-outlet>
        </main>

        <!-- FOOTER -->
        <footer class="footer">
          <div class="footer__text">Copyright ©2025 Affi latam</div>
          <div class="footer__links">
            <a href="#">Política de privacidad</a>
          </div>
        </footer>
      </div>
    </div>
  `,
  styleUrl: './dashboard.scss'
})
export class DashboardComponent {
  constructor(private router: Router) {}

  logout() {
    localStorage.removeItem('redelex_token');
    this.router.navigate(['/auth/login']);
  }
}