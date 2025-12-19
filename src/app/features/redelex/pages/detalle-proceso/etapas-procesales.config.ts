// src/app/features/redelex/pages/detalle-proceso/etapas-procesales.config.ts

export interface EtapaProcesal {
  id: number; // Usamos id para coincidir con tus reglas (1, 2, 3...)
  nombreInterno: string[];
  color: string;
  nombreCliente: string;
  definicion: string;
}

// 1. MAESTRA DE ETAPAS (Todas las posibles)
export const ETAPAS_MASTER: EtapaProcesal[] = [
  {
    id: 1,
    nombreInterno: ['ALISTAMIENTO', 'DOCUMENTACION', 'ASIGNACION'],
    color: '#FFFF99',
    nombreCliente: 'RECOLECCION Y VALIDACION DOCUMENTAL',
    definicion: 'Se está completando y revisando la información necesaria para iniciar los procesos.'
  },
  {
    id: 2,
    nombreInterno: ['DEMANDA'],
    color: '#F1A983',
    nombreCliente: 'DEMANDA',
    definicion: 'Hemos iniciado el proceso judicial.'
  },
  {
    id: 3,
    nombreInterno: ['MANDAMIENTO'],
    color: '#FBE2D5',
    nombreCliente: 'MANDAMIENTO DE PAGO',
    definicion: 'El juez ordena el pago de la obligación.'
  },
  {
    id: 4,
    nombreInterno: ['ADMISION'],
    color: '#92D050',
    nombreCliente: 'ADMISION DEMANDA',
    definicion: 'El juez acepta tramitar la demanda de restitución.'
  },
  {
    id: 5,
    nombreInterno: ['NOTIFICACION', 'EMPLAZAMIENTO'],
    color: '#B5E6A2',
    nombreCliente: 'NOTIFICACION',
    definicion: 'Etapa en la que se comunica la existencia del proceso.'
  },
  {
    id: 6,
    nombreInterno: ['EXCEPCIONES', 'CONTESTACION'],
    color: '#00B0F0',
    nombreCliente: 'EXCEPCIONES',
    definicion: 'El demandado presentó objeciones o contestó la demanda.'
  },
  {
    id: 7,
    nombreInterno: ['AUDIENCIA'],
    color: '#C0E6F5',
    nombreCliente: 'AUDIENCIA',
    definicion: 'Diligencia donde el juez escucha a las partes.'
  },
  {
    id: 8,
    nombreInterno: ['SENTENCIA'],
    color: '#D86DCD',
    nombreCliente: 'SENTENCIA',
    definicion: 'El juez decidió sobre la demanda.'
  },
  {
    id: 9,
    nombreInterno: ['LIQUIDACION', 'AVALUO', 'REMATE'],
    color: '#E49EDD',
    nombreCliente: 'LIQUIDACION',
    definicion: 'Etapa en la que se cuantifica la deuda, se avalúan bienes o se realiza el remate.'
  },
  {
    id: 10,
    nombreInterno: ['LANZAMIENTO', 'ENTREGA'],
    color: '#FFC000',
    nombreCliente: 'LANZAMIENTO',
    definicion: 'Se está gestionando la restitución o entrega del inmueble.'
  },
  {
    id: 11,
    nombreInterno: ['TERMINACION', 'TERMINADO', 'DESISTIMIENTO'],
    color: '#FF6D6D', // Color rojo suave para terminación
    nombreCliente: 'TERMINACION',
    definicion: 'El proceso ha finalizado judicialmente.'
  }
];

// 2. REGLAS DE VISIBILIDAD (IDs a mostrar según la clase)
const REGLAS_VISIBILIDAD: Record<string, number[]> = {
  // Ejecutivo: Muestra Mandamiento(3), Liq(9), Lanzamiento(10). Oculta Admisión(4).
  'EJECUTIVO SINGULAR': [1, 2, 3, 5, 6, 7, 8, 9, 10],
  
  // Restitución: Muestra Admisión(4). Oculta Mandamiento(3), Liq(9), Lanzamiento(10).
  // NOTA: Según tu script, Restitución usa [1, 2, 4, 5, 6, 7, 8, 11]
  'VERBAL SUMARIO': [1, 2, 4, 5, 6, 7, 8],
};

// 3. FUNCIONES HELPER

export function getEtapaConfig(nombreInterno: string | null | undefined): EtapaProcesal | null {
  if (!nombreInterno) return null;
  const nombreUpper = nombreInterno.toUpperCase().trim();
  
  // Buscamos en la maestra completa para obtener la info de la etapa actual, 
  // independientemente de si se muestra en el stepper o no.
  return ETAPAS_MASTER.find(etapa => 
    etapa.nombreInterno.some(keyword => nombreUpper.includes(keyword))
  ) || null;
}

export function getEtapasParaStepper(claseProceso: string = ''): { nombre: string; color: string; id: number }[] {
  const claseUpper = claseProceso.toUpperCase();
  let idsVisibles: number[] = [];

  // Lógica de selección de reglas
  if (claseUpper.includes('VERBAL SUMARIO') || claseUpper.includes('RESTITUCION')) {
    idsVisibles = REGLAS_VISIBILIDAD['VERBAL SUMARIO'];
  } else if (claseUpper.includes('EJECUTIVO') || claseUpper.includes('SINGULAR')) {
    idsVisibles = REGLAS_VISIBILIDAD['EJECUTIVO SINGULAR'];
  } else {
    // Default si no coincide (podríamos mostrar todas o el ejecutivo por defecto)
    idsVisibles = REGLAS_VISIBILIDAD['EJECUTIVO SINGULAR'];
  }

  // Filtramos la maestra según los IDs visibles
  return ETAPAS_MASTER
    .filter(etapa => idsVisibles.includes(etapa.id))
    .map(etapa => ({
      id: etapa.id,
      nombre: etapa.nombreCliente,
      color: etapa.color
    }));
}