import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'claseProceso',
  standalone: true
})

export class ClaseProcesoPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) return '-';

    const clase = value.trim().toUpperCase();
    if (clase.includes('EJECUTIVO SINGULAR')) {
      return 'EJECUTIVO';
    }
    if (clase.includes('VERBAL SUMARIO')) {
      return 'RESTITUCIÓN';
    }
    return value;
  }
}