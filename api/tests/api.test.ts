import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { WaitingQueue } from '../src/queue';

describe('API HTTP', () => {
  let queue: WaitingQueue;
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    queue = new WaitingQueue();
    app = createApp(queue);
  });

  it('GET /reasons renvoie la liste des motifs', async () => {
    const res = await request(app).get('/reasons');
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toHaveProperty('id');
    expect(res.body[0]).toHaveProperty('label');
  });

  it('POST /tickets crée un ticket (201)', async () => {
    const res = await request(app).post('/tickets').send({ reason: 'fievre' });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      reason: 'fievre',
      status: 'waiting',
      position: 4,
      estimatedWaitMinutes: 20,
    });
  });

  it('POST /tickets renvoie 400 sans motif, sans body ou avec un motif inconnu', async () => {
    expect((await request(app).post('/tickets').send({})).status).toBe(400);
    expect((await request(app).post('/tickets')).status).toBe(400);
    expect((await request(app).post('/tickets').send({ reason: 'xyz' })).status).toBe(400);
  });

  it('POST /tickets renvoie 400 si le JSON est invalide', async () => {
    const res = await request(app)
      .post('/tickets')
      .set('Content-Type', 'application/json')
      .send('{ pas du json');
    expect(res.status).toBe(400);
  });

  it('GET /tickets/:id renvoie 404 si le ticket est inconnu', async () => {
    const res = await request(app).get('/tickets/inexistant');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });

  it("DELETE /tickets/:id annule le ticket, puis renvoie 409 si on recommence", async () => {
    const { body: ticket } = await request(app).post('/tickets').send({ reason: 'douleur' });

    const first = await request(app).delete(`/tickets/${ticket.id}`);
    expect(first.status).toBe(200);
    expect(first.body.status).toBe('cancelled');

    const second = await request(app).delete(`/tickets/${ticket.id}`);
    expect(second.status).toBe(409);
  });

  it('DELETE /tickets/:id renvoie 409 si le ticket a déjà été appelé', async () => {
    const { body: ticket } = await request(app).post('/tickets').send({ reason: 'autre' });
    for (let i = 0; i < 4; i++) queue.advance();

    const res = await request(app).delete(`/tickets/${ticket.id}`);
    expect(res.status).toBe(409);
  });
});
