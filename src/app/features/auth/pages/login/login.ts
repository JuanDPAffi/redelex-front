import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AffiAlert } from '../../../../shared/services/affi-alert';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, CommonModule],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class LoginComponent implements OnInit {
  form!: FormGroup;
  showPassword = false;
  isTogglingPassword = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private titleService: Title
  ) {
    if (this.authService.isLoggedIn()) {
      const target = this.authService.getRedirectUrl();
      this.router.navigate([target]);
      return;
    }

    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  togglePasswordVisibility() {
    this.isTogglingPassword = true;
    this.showPassword = !this.showPassword;
    setTimeout(() => {
      this.isTogglingPassword = false;
    }, 400);
  }

  ngOnInit(): void {
    this.titleService.setTitle('Estados Procesales - Iniciar Sesión');
  }

  submit() {
    if (this.form.invalid) {
      AffiAlert.fire({
        icon: 'info',
        title: 'Datos incompletos',
        text: 'Ingresa tu correo y contraseña para continuar.'
      });
      return;
    }

    this.authService.login(this.form.value).subscribe({
      next: res => {
        if (res.user) {
           this.authService.saveUserData(res.user);
        }

        AffiAlert.fire({
          icon: 'success',
          title: 'Bienvenido',
          text: 'Inicio de sesión exitoso.',
          timer: 1300,
          showConfirmButton: false
          }).then(() => {
          const target = this.authService.getRedirectUrl();
          this.router.navigate([target]);
        });
      },
      error: err => {
        const mensajeBackend = err.error?.message || 'Error desconocido';
        const msgLower = mensajeBackend.toLowerCase();

        if (
          msgLower.includes('desactivad') || 
          msgLower.includes('inactiva') ||
          msgLower.includes('bloqueada')
        ) {
          AffiAlert.fire({
            icon: 'error',
            title: 'Acceso Denegado',
            text: mensajeBackend
          });
        } 
        else if (
          msgLower.includes('intento(s)') ||
          msgLower.includes('advertencia')
        ) {
          AffiAlert.fire({
            icon: 'warning',
            title: 'Advertencia de Seguridad',
            text: mensajeBackend
          });
        } 
        else {
          AffiAlert.fire({
            icon: 'error',
            title: 'Error de acceso',
            text: 'Correo o contraseña incorrectos.'
          });
        }
      }
    });
  }
}