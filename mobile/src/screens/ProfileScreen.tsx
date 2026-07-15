import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { logout, updateUser, AppDispatch, RootState } from '../store';
import { COLORS } from '../theme/colors';
import Icon from '../components/Icon';
import AppLogo from '../components/AppLogo';
import { userAPI } from '../services/api';
import { formatVarietyName, getVarietyMeta } from '../utils/varietyMeta';
import AnimatedPressable from '../components/AnimatedPressable';
import ScreenHeader from '../components/ScreenHeader';

export default function ProfileScreen({ navigation }: any) {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { stats } = useSelector((state: RootState) => state.history);

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(user?.displayName || '');
  const [saving, setSaving] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [sendingTicket, setSendingTicket] = useState(false);

  useEffect(() => {
    setEditName(user?.displayName || '');
  }, [user?.displayName]);

  const displayName = user?.displayName || 'Durian Lover';
  const email = user?.email || '';
  const initial = displayName[0]?.toUpperCase() || '?';
  const totalScans = stats?.totalScans ?? 0;
  const byVariety = stats?.byVariety || [];
  const recentScans = stats?.recentScans || [];
  const lastScanDate = recentScans[0]?.created_at || recentScans[0]?.createdAt || stats?.stats?.last_scan_at;
  const lastScanLabel = lastScanDate
    ? new Date(lastScanDate).toLocaleDateString('en-MY', { day: 'numeric', month: 'short' })
    : '-';
  const favouriteVariety = byVariety[0];
  const favouriteName = favouriteVariety?.predicted_variety || null;
  const favouriteCount = favouriteVariety?._count?.id || 0;
  const favMeta = getVarietyMeta(favouriteName);

  const closeEdit = () => {
    setEditing(false);
    setEditName(user?.displayName || '');
  };

  const handleSave = async () => {
    if (!editName.trim()) {
      Alert.alert('Name Required', 'Please enter your display name.');
      return;
    }

    setSaving(true);
    try {
      const response = await userAPI.updateMe({
        displayName: editName.trim(),
      });
      dispatch(updateUser(response.data));
      setEditing(false);
      Alert.alert('Saved', 'Your profile has been updated.');
    } catch {
      Alert.alert('Error', 'Could not update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const submitTicket = async () => {
    if (ticketSubject.trim().length < 3 || ticketMessage.trim().length < 10) {
      Alert.alert('More Details Needed', 'Please add a subject and at least 10 characters in your message.');
      return;
    }

    setSendingTicket(true);
    try {
      const response = await userAPI.submitSupportTicket({
        subject: ticketSubject.trim(),
        message: ticketMessage.trim(),
      });
      setSupportOpen(false);
      setTicketSubject('');
      setTicketMessage('');
      Alert.alert('Ticket Sent', `Reference: ${response.data.ticketId}`);
    } catch {
      Alert.alert('Error', 'Could not send your ticket. Please try again.');
    } finally {
      setSendingTicket(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <ScreenHeader title="Profile" onBack={() => navigation.goBack()} />

      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>

        {editing ? (
          <View style={styles.editForm}>
            <Text style={styles.editLabel}>Display Name</Text>
            <TextInput
              style={styles.editInput}
              value={editName}
              onChangeText={setEditName}
              autoFocus
              maxLength={100}
            />
            <Text style={styles.readOnlyEmail}>{email}</Text>
            <View style={styles.editActions}>
              <AnimatedPressable style={styles.editCancel} onPress={closeEdit}>
                <Text style={styles.editCancelText}>Cancel</Text>
              </AnimatedPressable>
              <AnimatedPressable style={styles.editSave} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator size="small" color={COLORS.white} /> : <Text style={styles.editSaveText}>Save</Text>}
              </AnimatedPressable>
            </View>
          </View>
        ) : (
          <>
            <Text style={styles.name}>{displayName}</Text>
            <Text style={styles.email}>{email}</Text>
            <AnimatedPressable style={styles.editBtn} onPress={() => setEditing(true)}>
              <Text style={styles.editBtnText}>Edit Profile</Text>
            </AnimatedPressable>
          </>
        )}

        <View style={styles.statsRow}>
          {[
            [String(totalScans), 'Scans'],
            [String(byVariety.length), 'Varieties'],
            [lastScanLabel, 'Last Scan'],
          ].map(([value, label]) => (
            <View key={label as string} style={styles.statItem}>
              <Text style={styles.statValue}>{value}</Text>
              <Text style={styles.statLabel}>{label}</Text>
            </View>
          ))}
        </View>
      </View>

      {totalScans > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Favourite Variety</Text>
          <View style={styles.favCard}>
            <View style={[styles.favIcon, { backgroundColor: favMeta.bgLight }]}>
              <Icon name={favMeta.icon} size={26} color={favMeta.color} />
            </View>
            <View style={styles.favInfo}>
              <Text style={styles.favName}>{formatVarietyName(favouriteName)}</Text>
              <Text style={styles.favCount}>{favouriteCount} of {totalScans} scans</Text>
            </View>
          </View>
        </View>
      ) : null}

      <View style={styles.section}>
        <AnimatedPressable style={[styles.settingRow, styles.settingBorder]} onPress={() => setSupportOpen(true)} pressedScale={0.98}>
          <View style={styles.settingLeft}>
            <Icon name="help" size={18} color={COLORS.textSecondary} />
            <Text style={styles.settingLabel}>Help & Support</Text>
          </View>
          <Icon name="chevronRight" size={18} color={COLORS.textTertiary} />
        </AnimatedPressable>
        <AnimatedPressable style={styles.settingRow} onPress={() => setAboutOpen(true)} pressedScale={0.98}>
          <View style={styles.settingLeft}>
            <Icon name="about" size={18} color={COLORS.textSecondary} />
            <Text style={styles.settingLabel}>About Durian Lens</Text>
          </View>
          <Icon name="chevronRight" size={18} color={COLORS.textTertiary} />
        </AnimatedPressable>
      </View>

      <AnimatedPressable style={styles.signOutBtn} onPress={() => dispatch(logout())}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </AnimatedPressable>

      <Modal visible={supportOpen} animationType="slide" transparent onRequestClose={() => setSupportOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Help & Support</Text>
            <TextInput
              style={styles.modalInput}
              value={ticketSubject}
              onChangeText={setTicketSubject}
              placeholder="Subject"
              placeholderTextColor={COLORS.textTertiary}
            />
            <TextInput
              style={[styles.modalInput, styles.messageInput]}
              value={ticketMessage}
              onChangeText={setTicketMessage}
              placeholder="Complaint, comment, or issue"
              placeholderTextColor={COLORS.textTertiary}
              multiline
              textAlignVertical="top"
            />
            <View style={styles.modalActions}>
              <AnimatedPressable style={styles.modalCancel} onPress={() => setSupportOpen(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </AnimatedPressable>
              <AnimatedPressable style={styles.modalSend} onPress={submitTicket} disabled={sendingTicket}>
                {sendingTicket ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.modalSendText}>Send</Text>}
              </AnimatedPressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={aboutOpen} animationType="fade" transparent onRequestClose={() => setAboutOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.aboutCard}>
            <View style={styles.aboutLogo}>
              <AppLogo size={48} />
            </View>
            <Text style={styles.modalTitle}>Durian Lens 1.0</Text>
            <Text style={styles.aboutText}>Developed by</Text>
            <Text style={styles.aboutName}>SITI NUR SYUHADAH BINTI MOHD ZAYADI</Text>
            <Text style={styles.aboutText}>2024806602</Text>
            <AnimatedPressable style={styles.aboutClose} onPress={() => setAboutOpen(false)}>
              <Text style={styles.modalSendText}>Close</Text>
            </AnimatedPressable>
          </View>
        </View>
      </Modal>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    alignItems: 'center',
    paddingTop: 22,
    paddingBottom: 28,
    paddingHorizontal: 20,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.textPrimary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  avatarText: { color: COLORS.white, fontSize: 32, fontWeight: '700' },
  name: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 2 },
  email: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 2 },
  editBtn: {
    marginTop: 10,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: COLORS.primarySoft,
  },
  editBtnText: { color: COLORS.primary, fontSize: 13, fontWeight: '600' },
  editForm: { width: '100%', alignItems: 'center' },
  editLabel: {
    alignSelf: 'flex-start',
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '700',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  editInput: {
    width: '100%',
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  readOnlyEmail: { color: COLORS.textTertiary, marginBottom: 12 },
  editActions: { flexDirection: 'row', gap: 12 },
  editCancel: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: COLORS.background,
  },
  editCancelText: { color: COLORS.textSecondary, fontSize: 14, fontWeight: '600' },
  editSave: {
    minWidth: 88,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  editSaveText: { color: COLORS.white, fontSize: 14, fontWeight: '600' },
  statsRow: { flexDirection: 'row', justifyContent: 'center', gap: 32, marginTop: 18 },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary },
  statLabel: {
    fontSize: 10,
    color: COLORS.textTertiary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 2,
  },
  section: { paddingHorizontal: 20, paddingTop: 20 },
  sectionLabel: {
    fontSize: 11,
    color: COLORS.textTertiary,
    fontWeight: '600',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  favCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  favInfo: { flex: 1 },
  favIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  favName: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 2 },
  favCount: { fontSize: 12, color: COLORS.textSecondary },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  settingBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingLabel: { fontSize: 14, color: COLORS.textSecondary },
  signOutBtn: {
    marginHorizontal: 20,
    marginTop: 24,
    backgroundColor: COLORS.errorBg,
    borderWidth: 1,
    borderColor: COLORS.error,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  signOutText: { color: COLORS.error, fontSize: 15, fontWeight: '600' },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  modalSheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 14, textAlign: 'center' },
  modalInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.background,
  },
  messageInput: { minHeight: 120 },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalCancel: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  modalCancelText: { color: COLORS.textSecondary, fontWeight: '700' },
  modalSend: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: COLORS.primary,
  },
  modalSendText: { color: COLORS.white, fontWeight: '700' },
  aboutCard: {
    margin: 24,
    padding: 22,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    alignItems: 'center',
  },
  aboutLogo: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: COLORS.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  aboutText: { color: COLORS.textSecondary, fontSize: 14, textAlign: 'center', marginBottom: 6 },
  aboutName: { color: COLORS.textPrimary, fontSize: 14, fontWeight: '700', textAlign: 'center', marginBottom: 6 },
  aboutClose: {
    marginTop: 12,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
});
