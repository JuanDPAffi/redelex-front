import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UsersService, User } from '../../services/users.service';
import { AffiAlert } from '../../../../shared/services/affi-alert'; // Tu servicio de alertas
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users-list.component.html',
  styleUrls: ['./users-list.component.scss']
})
export class UsersListComponent implements OnInit {
  users: User[] = [];
  loading = true;

  // Para el modal de edición rápida (si quieres hacerlo en la misma vista)
  selectedUser: User | null = null;
  
  // Lista de roles posibles para el select
  availableRoles = [
    { value: 'admin', label: 'Administrador' },
    { value: 'affi', label: 'Colaborador Affi' },
    { value: 'inmobiliaria', label: 'Inmobiliaria' }
  ];

  constructor(private usersService: UsersService) {}

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.loading = true;
    this.usersService.getAllUsers().subscribe({
      next: (data) => {
        this.users = data;
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
        AffiAlert.fire({ icon: 'error', title: 'Error', text: 'No se pudieron cargar los usuarios.' });
      }
    });
  }

  // Activar / Desactivar
  toggleStatus(user: User) {
    const accion = user.isActive ? 'desactivar' : 'activar';
    
    // 1. Preguntamos primero
    AffiAlert.fire({
      title: '¿Estás seguro?',
      text: `Estás a punto de ${accion} el acceso al usuario ${user.name}.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: user.isActive ? '#d33' : '#10b981', // Rojo para desactivar, Verde para activar
      confirmButtonText: `Sí, ${accion}`,
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      
      // 2. Si el usuario confirma, procedemos
      if (result.isConfirmed) {
        this.usersService.toggleStatus(user._id).subscribe({
          next: () => {
            user.isActive = !user.isActive; // Actualizamos la vista
            
            // Feedback de éxito silencioso o Toast (opcional)
            AffiAlert.fire({
              icon: 'success',
              title: 'Estado actualizado',
              text: `El usuario ha sido ${user.isActive ? 'activado' : 'desactivado'} correctamente.`,
              timer: 2000,
              showConfirmButton: false
            });
          },
          error: (err) => {
            console.error(err);
            AffiAlert.fire({ 
              icon: 'error', 
              title: 'Error', 
              text: 'No se pudo cambiar el estado del usuario.' 
            });
          }
        });
      }
    });
  }

  // Cambiar Rol
  changeRole(user: User, newRole: string) {
    if (!confirm(`¿Estás seguro de cambiar el rol a ${newRole}? Esto reiniciará sus permisos.`)) {
      // Si cancela, revertir el select en la vista (requiere lógica extra de UI, por ahora simple)
      return; 
    }

    this.usersService.changeRole(user._id, newRole).subscribe({
      next: (updatedUser) => {
        // Actualizamos el usuario en la lista con la respuesta del server
        const index = this.users.findIndex(u => u._id === user._id);
        if (index !== -1) {
          this.users[index] = updatedUser;
        }
        AffiAlert.fire({ icon: 'success', title: 'Rol actualizado', text: 'Permisos reiniciados a valores por defecto.' });
      },
      error: (err) => {
        AffiAlert.fire({ icon: 'error', title: 'Error', text: 'No se pudo cambiar el rol.' });
      }
    });
  }
}