// auth.routes.ts
import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login';
import { RegisterComponent } from './pages/register/register';
import { ForgotPasswordComponent } from './pages/forgot-password/forgot-password';
import { ResetPasswordComponent } from './pages/reset-password/reset-password';
import { ActivateAccountComponent } from './pages/activate-account/activate-account';

export const AUTH_ROUTES: Routes = [
  { 
    path: 'login', 
    component: LoginComponent,
    data: { animation: 'LoginPage' }
  },
  { 
    path: 'register', 
    component: RegisterComponent,
    data: { animation: 'RegisterPage' }
  },
  { 
    path: 'activate', 
    component: ActivateAccountComponent 
  },
  { 
    path: 'forgot-password', 
    component: ForgotPasswordComponent,
    data: { animation: 'ForgotPasswordPage' }
  },
  { 
    path: 'reset-password', 
    component: ResetPasswordComponent,
    data: { animation: 'ResetPasswordPage' }
  }
];