import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { cancelTicket, fetchTicket, Ticket, toUserMessage } from '../api';
import { ErrorNotice } from '../components/ErrorNotice';

const POLL_MS = 12_000;

export function WaitingScreen({
  ticketId,
  reasonLabel,
  onDone,
}: {
  ticketId: string;
  reasonLabel: string;
  onDone: () => void;
}) {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const seenTicket = useRef(false);

  useEffect(() => {
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const controller = new AbortController();

    async function cycle() {
      if (seenTicket.current) setRefreshing(true);
      else setLoading(true);

      try {
        const next = await fetchTicket(ticketId, controller.signal);
        if (stopped) return;
        seenTicket.current = true;
        setTicket(next);
        setError(null);
        if (next.status === 'waiting') {
          timer = setTimeout(() => void cycle(), POLL_MS);
        }
      } catch (caught) {
        if (stopped) return;
        setError(toUserMessage(caught));
      } finally {
        if (!stopped) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    }

    void cycle();
    return () => {
      stopped = true;
      controller.abort();
      if (timer) clearTimeout(timer);
    };
  }, [ticketId, retryKey]);

  async function leave() {
    if (leaving) return;
    setLeaving(true);
    setError(null);
    try {
      await cancelTicket(ticketId);
      onDone();
    } catch (caught) {
      setError(toUserMessage(caught));
      setLeaving(false);
      setConfirming(false);
    }
  }

  if (loading && !ticket) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text>Chargement…</Text>
      </View>
    );
  }

  if (error && !ticket) {
    return (
      <View style={styles.screen}>
        <ErrorNotice message={error} onRetry={() => setRetryKey((key) => key + 1)} />
      </View>
    );
  }

  if (!ticket) return null;

  const waiting = ticket.status === 'waiting';

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>{ticket.status === 'called' ? "C'est votre tour" : "Salle d'attente"}</Text>
      <Text style={styles.muted}>{reasonLabel}</Text>

      {ticket.status === 'called' ? (
        <Text style={styles.body}>Un médecin est disponible.</Text>
      ) : waiting ? (
        <View>
          <Text style={styles.position}>{ticket.position}</Text>
          <Text style={styles.body}>Position dans la file</Text>
          <Text style={styles.body}>Attente estimée : {ticket.estimatedWaitMinutes} min</Text>
          {refreshing ? <Text style={styles.muted}>Mise à jour…</Text> : null}
        </View>
      ) : (
        <Text style={styles.body}>Vous avez quitté la file.</Text>
      )}

      {error ? <ErrorNotice message={error} onRetry={() => setRetryKey((key) => key + 1)} /> : null}

      <View style={styles.footer}>
        {waiting && confirming ? (
          <View>
            <Text style={styles.body}>Quitter la file ? Vous perdrez votre place.</Text>
            <Pressable disabled={leaving} onPress={() => setConfirming(false)} style={styles.secondary}>
              <Text>Annuler</Text>
            </Pressable>
            <Pressable disabled={leaving} onPress={() => void leave()} style={styles.button}>
              <Text style={styles.buttonText}>{leaving ? 'Sortie…' : 'Quitter'}</Text>
            </Pressable>
          </View>
        ) : waiting ? (
          <Pressable onPress={() => setConfirming(true)} style={styles.button}>
            <Text style={styles.buttonText}>Quitter la file</Text>
          </Pressable>
        ) : (
          <Pressable onPress={onDone} style={styles.button}>
            <Text style={styles.buttonText}>Nouvelle demande</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff', padding: 20, paddingTop: 48 },
  center: { flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', gap: 8 },
  title: { fontSize: 22, fontWeight: '600' },
  muted: { color: '#666', marginTop: 4, marginBottom: 16 },
  position: { fontSize: 40, fontWeight: '600', marginBottom: 4 },
  body: { fontSize: 16, marginBottom: 8 },
  footer: { marginTop: 'auto' },
  button: { marginTop: 12, backgroundColor: '#111', padding: 14, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16 },
  secondary: { marginTop: 12, padding: 14, alignItems: 'center' },
});
