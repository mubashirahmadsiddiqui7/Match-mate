// src/screens/Fisherman/AddTrip/styles.ts
import { StyleSheet } from 'react-native';

const COLORS = {
  bg: '#F7F9FB',
  card: '#FFFFFF',
  text: '#111827',
  subtext: '#6B7280',
  border: '#E5E7EB',
  primary: '#1f720d', // brand green
  primaryAlt: '#2e8f19',
  infoBg: '#F0FDF4', // light green tint
  warnBg: '#FEF3C7',
  warnText: '#92400E',
};

export const s = StyleSheet.create({
  page: { backgroundColor: COLORS.bg },

  container: { flex: 1, paddingHorizontal: 16 },

  // HERO
  hero: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    marginLeft: 10,
    marginTop: 40,
    marginBottom: 10,
  },
  chipRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  chip: {
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'column',
    minWidth: 120,
  },
  chipOk: { backgroundColor: COLORS.infoBg, borderColor: '#A7F3D0' },
  chipWarn: { backgroundColor: COLORS.warnBg, borderColor: '#FDE68A' },
  chipLabel: { fontSize: 11, color: COLORS.subtext, marginBottom: 2 },
  chipValue: { fontSize: 13, color: COLORS.text, fontWeight: '700' },

  // SECTION
  cardWrap: { marginTop: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text },
  sectionSubtitle: {
    fontSize: 12,
    color: COLORS.subtext,
    marginTop: 2,
    marginBottom: 8,
  },

  cardBody: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },

  // FIELDS (kept from your previous design, just tuned a bit)
  field: { marginTop: 10 },
  label: {
    fontSize: 14,
    marginBottom: 6,
    color: COLORS.text,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 48,
    fontSize: 16,
    backgroundColor: '#fff',
    color: COLORS.text,
  },
  inputError: { borderColor: '#EF4444' },
  errorText: { color: '#EF4444', marginTop: 6, fontSize: 12 },

  // GENERIC CARD (for LocationCard content)
  card: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 12,
    backgroundColor: COLORS.card,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
    color: COLORS.text,
  },
  cardText: { fontSize: 13, color: COLORS.subtext, marginBottom: 8 },

  // BUTTONS
  button: {
    backgroundColor: COLORS.primary,
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    marginBottom: 35,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  buttonSecondary: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  buttonSecondaryText: {
    color: COLORS.primaryAlt,
    fontSize: 14,
    fontWeight: '700',
  },
  buttonDisabled: { opacity: 0.6 },

  // DROPDOWN
  dropdown: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 48,
    justifyContent: 'center',
    backgroundColor: '#fff',
    zIndex: 1000,
    elevation: 5,
    minHeight: 48,
  },
});
