import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-activate-account',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './activate-account.html',
  styleUrls: ['./activate-account.scss'] 
})
export class ActivateAccountComponent implements OnInit {
  status: 'loading' | 'success' | 'error' = 'loading';
  message: string = 'Estamos validando tu enlace de activación...';

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const token = params['token'];
      const email = params['email'];

      if (!token || !email) {
        this.setError('El enlace no es válido o está incompleto.');
        return;
      }

      this.activate(email, token);
    });
  }

  activate(email: string, token: string) {
    this.authService.activateAccount(email, token).subscribe({
      next: () => {
        this.status = 'success';
        this.message = 'Tu cuenta ha sido activada correctamente. Ya puedes acceder a la plataforma.';
      },
      error: (err) => {
        this.setError(err.error?.message || 'El enlace ha expirado.');
      }
    });
  }

  private setError(msg: string) {
    this.status = 'error';
    this.message = msg;
  }
}