import { StyleSheet } from 'react-native';

export const theme = {
  primary: '#1f720d',
  primaryDark: '#15530a',
  bgSoft: '#F6FAF6',
  card: '#fff',
  text: '#111',
  subtext: '#667085',
  border: '#E6EAE6',
  blue: '#0A84FF',
  warnBg: '#FFF4E5',
  okBg: '#E8FFF2',
};

export const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.bgSoft },
  container: { flex: 1, paddingHorizontal: 16 },

  hero: {
    backgroundColor: theme.primary,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 3,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },

  chipRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  chip: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  chipLabel: { color: '#F1F5F9', fontSize: 12, marginBottom: 4 },
  chipValue: { color: '#fff', fontSize: 14, fontWeight: '700' },
  chipOk: { backgroundColor: 'rgba(0,0,0,0.18)' },
  chipWarn: { backgroundColor: 'rgba(255,255,255,0.15)' },

  section: {
    backgroundColor: theme.card,
    borderRadius: 16,
    padding: 14,
    marginTop: 14,
    borderWidth: 1,
    borderColor: theme.border,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: theme.text },
  sectionSubtitle: { fontSize: 12, color: theme.subtext, marginTop: 2 },

  row: { marginTop: 12 },
  label: { fontSize: 14, color: theme.text, marginBottom: 6, fontWeight: '600' },
  input: {
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D0D5DD',
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    color: '#111',
  },
  inputError: { borderColor: '#D92D20' },
  helperText: { fontSize: 12, color: '#D92D20', marginTop: 6 },

  readonlyRow: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: theme.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
  },
  readonlyLabel: { fontSize: 12, color: theme.subtext },
  readonlyValue: { fontSize: 14, fontWeight: '600', color: theme.text, marginTop: 2 },

  locRow: { marginTop: 8 },
  locText: { fontSize: 14, color: theme.text, marginBottom: 8 },
  btnGhost: {
    height: 44,
    
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
   btnGhost1: {
    height: 44,
    width:'100%',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnGhostText: { color: theme.blue, fontWeight: '700' },

  photo: { width: '100%', height: 180, borderRadius: 12, backgroundColor: '#EAEAEA', marginBottom: 10 },
  photoActions: { flexDirection: 'row', gap: 10 },

  saveBar: {
    marginTop: 16,
    backgroundColor: theme.primary,
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBarDisabled: { opacity: 0.5 },
  saveBarText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  errorText: { color: '#D92D20', marginTop: 6, fontSize: 12 },
});
