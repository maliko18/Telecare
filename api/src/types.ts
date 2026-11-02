export type TicketStatus = 'waiting' | 'called' | 'cancelled';

export interface Reason {
  id: string;
  label: string;
}

/** Ticket tel qu'il est stocké en mémoire (sans position : elle est calculée). */
export interface Ticket {
  id: string;
  reason: string;
  status: TicketStatus;
}

/** Ticket tel qu'il est renvoyé par l'API. */
export interface TicketView {
  id: string;
  reason: string;
  status: TicketStatus;
  position: number; // 1 = prochain à être appelé ; 0 si le ticket n'est plus en attente
  estimatedWaitMinutes: number;
}
