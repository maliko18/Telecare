import { Pressable, StyleSheet, Text, View } from 'react-native';

export function ErrorNotice({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View accessibilityRole="alert" style={styles.box}>
      <Text style={styles.title}>Un problème est survenu</Text>
      <Text style={styles.message}>{message}</Text>
      <Pressable accessibilityRole="button" onPress={onRetry} style={styles.button}>
        <Text style={styles.buttonText}>Réessayer</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: '#fdecec',
    borderRadius: 8,
    padding: 16,
    gap: 8,
  },
  title: { fontSize: 16, fontWeight: '600', color: '#7a2424' },
  message: { fontSize: 16, lineHeight: 22, color: '#3d1c1c' },
  button: {
    marginTop: 4,
    alignSelf: 'flex-start',
    backgroundColor: '#7a2424',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  buttonText: { color: '#fff', fontSize: 16 },
});
