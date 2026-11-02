import { describe, expect, it } from 'vitest';
import { WaitingQueue } from '../src/queue';

describe('WaitingQueue', () => {
  it('place un nouveau ticket derrière les 3 patients fictifs', () => {
    const queue = new WaitingQueue();
    const ticket = queue.join('fievre');
    expect(ticket.status).toBe('waiting');
    expect(ticket.position).toBe(4);
    expect(ticket.estimatedWaitMinutes).toBe(20); // 4 x 5 min
  });

  it("utilise la durée moyenne paramétrée pour l'attente estimée", () => {
    const queue = new WaitingQueue({ averageConsultationMinutes: 10 });
    expect(queue.join('douleur').estimatedWaitMinutes).toBe(40);
  });

  it('fait avancer la file : la position diminue, puis le ticket est appelé', () => {
    const queue = new WaitingQueue();
    const { id } = queue.join('fievre');

    queue.advance();
    expect(queue.get(id).position).toBe(3);

    queue.advance();
    queue.advance();
    expect(queue.get(id).position).toBe(1);

    queue.advance();
    const called = queue.get(id);
    expect(called.status).toBe('called');
    expect(called.position).toBe(0);
    expect(called.estimatedWaitMinutes).toBe(0);
  });

  it("ne plante pas quand plus personne n'attend", () => {
    const queue = new WaitingQueue({ initialPatients: 0 });
    expect(queue.advance()).toBeNull();
  });

  it("fait avancer ceux qui sont derrière quand un patient quitte la file", () => {
    const queue = new WaitingQueue({ initialPatients: 0 });
    const first = queue.join('fievre');
    const second = queue.join('douleur');
    expect(second.position).toBe(2);

    queue.leave(first.id);
    expect(queue.get(first.id).status).toBe('cancelled');
    expect(queue.get(second.id).position).toBe(1);
  });

  it('refuse un motif absent ou inconnu (400)', () => {
    const queue = new WaitingQueue();
    expect(() => queue.join(undefined)).toThrow('obligatoire');
    expect(() => queue.join('')).toThrow('obligatoire');
    expect(() => queue.join('inconnu')).toThrow('inconnu');
  });

  it('refuse de quitter un ticket déjà appelé ou annulé (409)', () => {
    const queue = new WaitingQueue({ initialPatients: 0 });
    const a = queue.join('fievre');
    const b = queue.join('douleur');

    queue.advance(); // appelle a
    expect(() => queue.leave(a.id)).toThrow('called');

    queue.leave(b.id);
    expect(() => queue.leave(b.id)).toThrow('cancelled');
  });

  it("lève une erreur 404 pour un ticket inconnu", () => {
    const queue = new WaitingQueue();
    expect(() => queue.get('nope')).toThrow('introuvable');
  });
});
