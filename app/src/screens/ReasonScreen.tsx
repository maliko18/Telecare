import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { createTicket, fetchReasons, Reason, toUserMessage } from '../api';
import { ErrorNotice } from '../components/ErrorNotice';

export function ReasonScreen({
  onJoined,
}: {
  onJoined: (ticketId: string, reasonLabel: string) => void;
}) {
  const [reasons, setReasons] = useState<Reason[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setReasons(await fetchReasons());
    } catch (caught) {
      setError(toUserMessage(caught));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function join() {
    const reason = reasons.find((item) => item.id === selectedId);
    if (!reason || joining) return;

    setJoining(true);
    setError(null);
    try {
      const ticket = await createTicket(reason.id);
      onJoined(ticket.id, reason.label);
    } catch (caught) {
      setError(toUserMessage(caught));
      setJoining(false);
    }
  }

  if (loading && reasons.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text>Chargement…</Text>
      </View>
    );
  }

  if (error && reasons.length === 0) {
    return (
      <View style={styles.screen}>
        <ErrorNotice message={error} onRetry={() => void load()} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView>
        <Text style={styles.title}>Motif de consultation</Text>
        {reasons.map((reason) => {
          const selected = reason.id === selectedId;
          return (
            <Pressable
              key={reason.id}
              onPress={() => setSelectedId(reason.id)}
              style={[styles.row, selected && styles.rowSelected]}
            >
              <Text style={styles.label}>{selected ? `• ${reason.label}` : reason.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
      {error ? <ErrorNotice message={error} onRetry={() => void join()} /> : null}
      <Pressable
        disabled={!selectedId || joining}
        onPress={() => void join()}
        style={[styles.button, (!selectedId || joining) && styles.buttonDisabled]}
      >
        <Text style={styles.buttonText}>{joining ? 'Inscription…' : 'Rejoindre la file'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff', padding: 20, paddingTop: 48 },
  center: { flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', gap: 8 },
  title: { fontSize: 22, fontWeight: '600', marginBottom: 8 },
  row: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#e5e5e5' },
  rowSelected: { backgroundColor: '#f4f4f4' },
  label: { fontSize: 16 },
  button: { marginTop: 16, backgroundColor: '#111', padding: 14, alignItems: 'center' },
  buttonDisabled: { opacity: 0.35 },
  buttonText: { color: '#fff', fontSize: 16 },
});
