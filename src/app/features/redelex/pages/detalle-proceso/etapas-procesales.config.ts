export interface EtapaProcesal {
  id: number;
  nombreInterno: string[];
  color: string;
  nombreCliente: string;
  definicion: string;
}

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
    color: '#FF6D6D',
    nombreCliente: 'TERMINACION',
    definicion: 'El proceso ha finalizado judicialmente.'
  }
];

const REGLAS_VISIBILIDAD: Record<string, number[]> = {
  'EJECUTIVO SINGULAR': [1, 2, 3, 5, 6, 7, 8, 9, 10],
  'VERBAL SUMARIO': [1, 2, 4, 5, 6, 7, 8],
};

export function getEtapaConfig(nombreInterno: string | null | undefined): EtapaProcesal | null {
  if (!nombreInterno) return null;
  const nombreUpper = nombreInterno.toUpperCase().trim();
  
  return ETAPAS_MASTER.find(etapa => 
    etapa.nombreInterno.some(keyword => nombreUpper.includes(keyword))
  ) || null;
}

export function getEtapasParaStepper(claseProceso: string = ''): { nombre: string; color: string; id: number }[] {
  const claseUpper = claseProceso.toUpperCase();
  let idsVisibles: number[] = [];

  if (claseUpper.includes('VERBAL SUMARIO') || claseUpper.includes('RESTITUCION')) {
    idsVisibles = REGLAS_VISIBILIDAD['VERBAL SUMARIO'];
  } else if (claseUpper.includes('EJECUTIVO') || claseUpper.includes('SINGULAR')) {
    idsVisibles = REGLAS_VISIBILIDAD['EJECUTIVO SINGULAR'];
  } else {
    idsVisibles = REGLAS_VISIBILIDAD['EJECUTIVO SINGULAR'];
  }

  return ETAPAS_MASTER
    .filter(etapa => idsVisibles.includes(etapa.id))
    .map(etapa => ({
      id: etapa.id,
      nombre: etapa.nombreCliente,
      color: etapa.color
    }));
}