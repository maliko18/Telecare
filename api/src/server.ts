import { createApp } from './app';
import { WaitingQueue } from './queue';

const PORT = Number(process.env.PORT ?? 3000);
const AVERAGE_CONSULTATION_MINUTES = Number(process.env.AVERAGE_CONSULTATION_MINUTES ?? 5);
const ADVANCE_INTERVAL_MS = Number(process.env.ADVANCE_INTERVAL_MS ?? 20_000);

const queue = new WaitingQueue({ averageConsultationMinutes: AVERAGE_CONSULTATION_MINUTES });

// Toutes les 20 s, un médecin se libère : le premier ticket en attente est appelé.
setInterval(() => {
  const called = queue.advance();
  if (called) console.log(`Ticket appelé : ${called.id}`);
}, ADVANCE_INTERVAL_MS);

createApp(queue).listen(PORT, () => {
  console.log(`API prête sur http://localhost:${PORT}`);
});
