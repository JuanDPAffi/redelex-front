import { Component, OnInit } from '@angular/core'; // Agregué OnInit
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AffiAlert } from '../../../../shared/services/affi-alert';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class LoginComponent implements OnInit {
  form!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private titleService: Title
  ) {
    // 🔒 CORRECCIÓN 1: Usamos isLoggedIn() en lugar de getToken()
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/panel']); // Ojo: Asegúrate que esta ruta exista
      return;
    }

    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.titleService.setTitle('Affi - Iniciar Sesión');
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
          this.router.navigate(['/panel']);
        });
      },
      error: err => {
        const mensajeBackend = err.error?.message || '';

        // Buscamos palabras clave: "desactivada", "inactivo" O "advertencia"
        if (
          mensajeBackend.toLowerCase().includes('desactivada') || 
          mensajeBackend.toLowerCase().includes('inactivo') ||
          mensajeBackend.toLowerCase().includes('advertencia') // <--- NUEVO
        ) {
          AffiAlert.fire({
            icon: 'warning', // Amarillo
            title: 'Atención',
            text: mensajeBackend
          });
        } else {
          AffiAlert.fire({
            icon: 'error', // Rojo
            title: 'Error al iniciar sesión',
            text: 'Credenciales inválidas.'
          });
        }
      }
    });
  }
}