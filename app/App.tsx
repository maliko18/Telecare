import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ReasonScreen } from './src/screens/ReasonScreen';
import { WaitingScreen } from './src/screens/WaitingScreen';

type Route = { name: 'reason' } | { name: 'waiting'; ticketId: string; reasonLabel: string };

export default function App() {
  const [route, setRoute] = useState<Route>({ name: 'reason' });

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      {route.name === 'reason' ? (
        <ReasonScreen
          onJoined={(ticketId, reasonLabel) => setRoute({ name: 'waiting', ticketId, reasonLabel })}
        />
      ) : (
        <WaitingScreen
          ticketId={route.ticketId}
          reasonLabel={route.reasonLabel}
          onDone={() => setRoute({ name: 'reason' })}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
});
