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
    // CAMBIO: Si ya está logueado, usar redirección inteligente basada en permisos
    if (this.authService.isLoggedIn()) {
      const defaultRoute = this.authService.getDefaultRoute();
      this.router.navigate([defaultRoute]);
      return;
    }

    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  togglePasswordVisibility() {
    // Activar animación
    this.isTogglingPassword = true;
    
    // Cambiar visibilidad
    this.showPassword = !this.showPassword;
    
    // Desactivar animación después de completarse
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
        // Guardamos los datos del usuario (incluye permisos)
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
          // CAMBIO CRÍTICO: Usar redirección inteligente basada en permisos
          const defaultRoute = this.authService.getDefaultRoute();
          this.router.navigate([defaultRoute]);
        });
      },
      error: err => {
        const mensajeBackend = err.error?.message || '';

        // Manejo de errores específicos del backend
        if (
          mensajeBackend.toLowerCase().includes('desactivado') || 
          mensajeBackend.toLowerCase().includes('inactivo') ||
          mensajeBackend.toLowerCase().includes('advertencia') ||
          mensajeBackend.toLowerCase().includes('intento(s)')
        ) {
          AffiAlert.fire({
            icon: 'warning',
            title: 'Atención',
            text: mensajeBackend
          });
        } else {
          AffiAlert.fire({
            icon: 'error',
            title: 'Error al iniciar sesión',
            text: 'Correo o contraseña incorrectos.'
          });
        }
      }
    });
  }
}