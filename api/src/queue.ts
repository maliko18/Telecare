import { randomUUID } from 'crypto';
import { ConflictError, NotFoundError, ValidationError } from './errors';
import { REASONS } from './reasons';
import { Ticket, TicketView } from './types';

export interface QueueOptions {
  /** Durée moyenne d'une consultation, en minutes (5 par défaut). */
  averageConsultationMinutes?: number;
  /** Nombre de patients fictifs présents au démarrage (3 par défaut). */
  initialPatients?: number;
}

/**
 * Toute la logique métier de la file d'attente, sans Express ni timer :
 * c'est ce qui la rend simple à tester.
 */
export class WaitingQueue {
  /** Tous les tickets, dans l'ordre d'arrivée. L'ordre de la file = cet ordre. */
  private tickets: Ticket[] = [];
  private readonly averageConsultationMinutes: number;

  constructor(options: QueueOptions = {}) {
    this.averageConsultationMinutes = options.averageConsultationMinutes ?? 5;
    const initialPatients = options.initialPatients ?? 3;
    for (let i = 1; i <= initialPatients; i++) {
      this.tickets.push({ id: `fictif-${i}`, reason: 'autre', status: 'waiting' });
    }
  }

  join(reason: unknown): TicketView {
    if (typeof reason !== 'string' || reason.trim() === '') {
      throw new ValidationError('Le motif est obligatoire.');
    }
    if (!REASONS.some((r) => r.id === reason)) {
      throw new ValidationError(`Motif inconnu : "${reason}".`);
    }
    const ticket: Ticket = { id: randomUUID(), reason, status: 'waiting' };
    this.tickets.push(ticket);
    return this.toView(ticket);
  }

  get(id: string): TicketView {
    return this.toView(this.findOrThrow(id));
  }

  leave(id: string): TicketView {
    const ticket = this.findOrThrow(id);
    if (ticket.status !== 'waiting') {
      throw new ConflictError(
        `Impossible de quitter la file : le ticket est déjà "${ticket.status}".`,
      );
    }
    ticket.status = 'cancelled';
    return this.toView(ticket);
  }

  /** Appelle le premier ticket en attente. Retourne le ticket appelé, ou null si la file est vide. */
  advance(): Ticket | null {
    const next = this.tickets.find((t) => t.status === 'waiting');
    if (!next) return null;
    next.status = 'called';
    return next;
  }

  private findOrThrow(id: string): Ticket {
    const ticket = this.tickets.find((t) => t.id === id);
    if (!ticket) throw new NotFoundError(`Ticket introuvable : ${id}`);
    return ticket;
  }

  /** La position est calculée à la volée : pas d'état à garder synchronisé. */
  private toView(ticket: Ticket): TicketView {
    const position =
      ticket.status === 'waiting'
        ? this.tickets.filter((t) => t.status === 'waiting').indexOf(ticket) + 1
        : 0;
    return {
      id: ticket.id,
      reason: ticket.reason,
      status: ticket.status,
      position,
      estimatedWaitMinutes: position * this.averageConsultationMinutes,
    };
  }
}
