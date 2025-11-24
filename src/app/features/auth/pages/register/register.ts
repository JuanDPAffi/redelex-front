import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service'; // Ajusta la ruta si es necesario
import { Router, RouterLink } from '@angular/router';
import { AffiAlert } from '../../../../shared/services/affi-alert';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.scss'
})
export class RegisterComponent implements OnInit {
  form!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private titleService: Title 
  ) {
    // Si ya tiene sesión, lo sacamos
    const token = this.authService.getToken();
    if (token) {
      this.router.navigate(['/panel']);
      return;
    }

    this.form = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      // Regex que coincide con tu Backend (Min 8, Mayus, Minus, Num/Simbolo)
      password: ['', [
        Validators.required, 
        Validators.minLength(8),
        Validators.pattern(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/)
      ]],
      // NUEVOS CAMPOS
      nit: ['', Validators.required],
      codigoInmobiliaria: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.titleService.setTitle('Affi - Registrarse');
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched(); // Para que se vean los errores visuales
      return;
    }

    this.authService.register(this.form.value).subscribe({
      next: (res: any) => {
        // CAMBIO IMPORTANTE: Ya no guardamos token ni redireccionamos al panel
        // porque la cuenta requiere activación por correo.
        
        AffiAlert.fire({
          icon: 'success',
          title: 'Registro exitoso',
          text: 'Hemos enviado un enlace a tu correo. Por favor actívalo para iniciar sesión.',
          confirmButtonText: 'Ir al Login'
        }).then(() => {
          this.router.navigate(['/auth/login']);
        });
      },
      error: (err) => {
        // Mostramos el mensaje exacto del backend (ej: "Inmobiliaria ocupada")
        AffiAlert.fire({
          icon: 'error',
          title: 'No se pudo registrar',
          text: err.error?.message || 'Verifica los datos ingresados.'
        });
      }
    });
  }
}