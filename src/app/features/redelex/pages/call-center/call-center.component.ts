import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FeatherModule } from 'angular-feather';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { AffiAlert } from '../../../../shared/services/affi-alert';
import { AuthService } from '../../../auth/services/auth.service';
import { debounceTime, distinctUntilChanged, switchMap, catchError, of, filter } from 'rxjs';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-call-center',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, FeatherModule],
  templateUrl: './call-center.component.html',
  styleUrls: ['./call-center.component.scss']
})
export class CallCenterComponent {
  currentStep = 1;
  form: FormGroup;
  loading = false;
  
  hubspotInfo: any = { companyFound: false, contactFound: false };
  procesosEncontrados: any[] = [];
  selectedProceso: any = null;
  selectedOwnerId: string | null = null;
  filterText: string = '';
  
  asesorName = '';

  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private titleService = inject(Title);
  private apiUrl = `${environment.apiUrl}api`;

  constructor() {
    this.asesorName = this.authService.getUserData()?.name || 'Asesor';
    
    this.form = this.fb.group({
      // Step 1
      callType: ['Entrante', Validators.required],
      transferArea: [''],

      // Step 2 (Cliente)
      companyNit: ['', Validators.required],
      companyName: ['', Validators.required],
      gerenteComercial: [''],
      contactEmail: ['', [Validators.required, Validators.email]],
      contactName: ['', Validators.required],
      contactPhone: [''],

      // Step 3 (Consulta)
      query: ['', Validators.required],

      // Step 4 (Proceso)
      inquilinoIdentificacion: [''],
      inquilinoNombre: [''],
      cuenta: [''],
      procesoId: ['']
    });

    this.setupAutocomplete();
  }

ngOnInit() {
    this.titleService.setTitle('Estados Procesales - Centro de Llamadas');
  }

  setupAutocomplete() {
    this.form.get('companyNit')?.valueChanges.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      filter(val => val && val.length > 5),
      switchMap(nit => this.http.get<any>(`${this.apiUrl}/support/hubspot/search-company?nit=${nit}`).pipe(
        catchError(() => of({ found: false }))
      ))
    ).subscribe(res => {
      if (res.found) {
        this.hubspotInfo.companyFound = true;
        this.selectedOwnerId = res.ownerId;
        const displayOwner = res.ownerName || res.ownerId || '';

        this.form.patchValue({ 
          companyName: res.name, 
          gerenteComercial: displayOwner
        }, { emitEvent: false });        
        
        
        AffiAlert.fire({
          icon: 'success',
          title: 'Empresa Encontrada',
          text: `Se cargaron los datos de ${res.name}`,
          timer: 2000,
          timerProgressBar: true,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
      } else {
        this.hubspotInfo.companyFound = false;
        this.selectedOwnerId = null;
      }
    });

    this.form.get('contactEmail')?.valueChanges.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      filter(val => val && val.includes('@')),
      switchMap(email => this.http.get<any>(`${this.apiUrl}/support/hubspot/search-contact?email=${email}`).pipe(
        catchError(() => of({ found: false }))
      ))
    ).subscribe(res => {
      if (res.found) {
        this.hubspotInfo.contactFound = true;
        this.form.patchValue({ 
          contactName: res.name,
          contactPhone: res.phone 
        }, { emitEvent: false });

        AffiAlert.fire({
          icon: 'success',
          title: 'Contacto Encontrado',
          text: `Datos cargados para ${res.name}`,
          timer: 2000,
          timerProgressBar: true,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
      } else {
        this.hubspotInfo.contactFound = false;
      }
    });
  }

  buscarProcesos() {
    const id = this.form.get('inquilinoIdentificacion')?.value;
    if (!id) return;

    this.loading = true;
    this.http.get<any>(`${this.apiUrl}/redelex/procesos-por-identificacion/${id}`).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success && res.procesos.length > 0) {
          this.procesosEncontrados = res.procesos;
        } else {
          this.procesosEncontrados = [];
          AffiAlert.fire({
            icon: 'warning',
            title: 'Sin resultados',
            text: 'No se encontraron procesos asociados a esa identificación.',
            timer: 3000
          });
        }
      },
      error: () => {
        this.loading = false;
        AffiAlert.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo consultar la base de datos de procesos.'
        });
      }
    });
  }

  seleccionarProceso(proc: any) {
    this.selectedProceso = proc;
    this.form.patchValue({
      procesoId: proc.procesoId,
      cuenta: proc.codigoAlterno || 'Sin Radicado',
      inquilinoNombre: proc.demandadoNombre,
      etapaProcesal: proc.etapaProcesal
    });
  }

  // --- STEPPER ---
  nextStep() {
    if (this.currentStep === 1 && this.form.get('callType')?.invalid) {
      AffiAlert.fire({
        icon: 'warning',
        title: 'Campo requerido',
        text: 'Por favor seleccione el tipo de llamada.',
        timer: 2000
      });
      return;
    }

    if (this.currentStep === 2 && (this.form.get('companyNit')?.invalid || this.form.get('contactEmail')?.invalid)) {
      AffiAlert.fire({
        icon: 'warning',
        title: 'Datos incompletos',
        text: 'Por favor complete el NIT y el Correo del contacto.',
        timer: 2500
      });
      return;
    }
    
    if (this.currentStep === 3 && this.form.get('query')?.invalid) {
      AffiAlert.fire({
        icon: 'warning',
        title: 'Falta información',
        text: 'Debe ingresar la descripción de la consulta.',
        timer: 2500
      });
      return;
    }
    
    this.currentStep++;
  }

  prevStep() {
    this.currentStep--;
  }

  // --- SUBMIT FINAL ---
  submit() {
    if (this.form.invalid) {
      AffiAlert.fire({
        icon: 'warning',
        title: 'Formulario incompleto',
        text: 'Revise que todos los campos obligatorios estén llenos.'
      });
      return;
    }
    
    this.loading = true;
    this.http.post(`${this.apiUrl}/support/call-ticket`, this.form.value).subscribe({
      next: () => {
        this.loading = false;
        AffiAlert.fire({
          icon: 'success',
          title: 'Llamada Registrada',
          text: 'El ticket se ha creado en HubSpot correctamente.',
          showConfirmButton: true,
          confirmButtonText: 'Nueva Llamada'
        }).then(() => {
          window.location.reload();
        });
      },
      error: (err) => {
        this.loading = false;
        console.error(err);
        AffiAlert.fire({ 
          icon: 'error', 
          title: 'Error de creación', 
          text: 'No se pudo guardar el ticket en HubSpot. Intente nuevamente.' 
        });
      }
    });
  }

  // --- HELPERS PARA EL HTML (DIALOGOS) ---
  get isEntrante() { return this.form.get('callType')?.value === 'Entrante' || this.form.get('callType')?.value === 'Llamada Transferida'; }
}