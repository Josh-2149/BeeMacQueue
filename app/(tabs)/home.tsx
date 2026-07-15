import { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  RefreshControl, Alert,
} from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { useEstablishments } from '../../hooks/useEstablishments';
import { useQueue } from '../../hooks/useQueue';
import { EstablishmentCard } from '../../components/EstablishmentCard';
import { QueueTicketCard } from '../../components/QueueTicketCard';
import { JoinModal } from '../../components/JoinModal';
import { FilterBar } from '../../components/FilterBar';
import { SectionLabel, EmptyState, LiveDot } from '../../components/ui';
import { COLORS } from '../../lib/constants';
import { Establishment } from '../../types';

const FILTERS = [
  { key: 'all',      label: 'All Branches' },
  { key: 'jollibee', label: '🐝 Jollibee' },
  { key: 'mcdo',     label: "🍟 McDonald's" },
  { key: 'open',     label: '✅ Open Now' },
];

export default function HomeScreen() {
  const { user, profile } = useAuth();
  const {
    establishments, totalInQueue, avgWait,
    loading: estLoading, loadEstablishments,
  } = useEstablishments();
  const {
    activeQueue, joining,
    joinQueue, leaveQueue, refreshActive,
  } = useQueue(user?.id);

  const [filter, setFilter] = useState('all');
  const [selectedEst, setSelectedEst] = useState<Establishment | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const filtered = establishments.filter((e) => {
    if (filter === 'jollibee') return e.brand === 'jollibee';
    if (filter === 'mcdo') return e.brand === 'mcdo';
    if (filter === 'open') return e.is_open;
    return true;
  });

  async function onRefresh() {
    setRefreshing(true);
    await Promise.all([loadEstablishments(), refreshActive()]);
    setRefreshing(false);
  }

  async function handleJoin() {
    if (!selectedEst || !user) return;
    if (activeQueue) {
      Alert.alert(
        'Already in queue',
        `You have ticket #${activeQueue.ticket_number}. Leave it first.`
      );
      setSelectedEst(null);
      return;
    }
    try {
      const ticket = await joinQueue(selectedEst.id);
      setSelectedEst(null);
      Alert.alert('🎫 Joined!', `Ticket #${ticket} at ${selectedEst.name} — ${selectedEst.branch}.`);
    } catch (e: any) {
      setSelectedEst(null);
      Alert.alert('Could not join', e.message);
    }
  }

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>
            🍔 Bee<Text style={styles.headerYellow}>Mac</Text>Queue
          </Text>
          <LiveDot />
        </View>
        <Text style={styles.headerGreet}>
          {greeting()}, {profile?.name?.split(' ')[0] ?? 'there'}!
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.red}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>Skip the line in CDO 🏙️</Text>
          <Text style={styles.heroSub}>
            Real-time queue management for Jollibee & McDonald's
          </Text>
          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatNum}>{establishments.length}</Text>
              <Text style={styles.heroStatLabel}>Branches</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatNum}>{totalInQueue}</Text>
              <Text style={styles.heroStatLabel}>In queue now</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatNum}>{avgWait}m</Text>
              <Text style={styles.heroStatLabel}>Avg wait</Text>
            </View>
          </View>
        </View>

        {activeQueue && (
          <>
            <SectionLabel>YOUR ACTIVE TICKET</SectionLabel>
            <QueueTicketCard
              queue={activeQueue}
              onLeave={leaveQueue}
              onRefresh={refreshActive}
            />
          </>
        )}

        <SectionLabel>BROWSE BRANCHES</SectionLabel>
        <FilterBar filters={FILTERS} active={filter} onSelect={setFilter} />

        {estLoading && establishments.length === 0 ? (
          <EmptyState icon="⏳" title="Loading branches..." />
        ) : filtered.length === 0 ? (
          <EmptyState icon="🏬" title="No branches found" sub="Try a different filter" />
        ) : (
          filtered.map((est) => (
            <EstablishmentCard
              key={est.id}
              establishment={est}
              onJoin={() => setSelectedEst(est)}
            />
          ))
        )}
      </ScrollView>

      <JoinModal
        visible={!!selectedEst}
        establishment={selectedEst}
        joining={joining}
        onConfirm={handleJoin}
        onClose={() => setSelectedEst(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    backgroundColor: COLORS.red, paddingTop: 56, paddingHorizontal: 20,
    paddingBottom: 16, flexDirection: 'row',
    justifyContent: 'space-between', alignItems: 'flex-end',
  },
  headerTitle: { fontSize: 22, fontWeight: '900', color: COLORS.white, letterSpacing: -0.5, marginBottom: 4 },
  headerYellow: { color: COLORS.yellow },
  headerGreet: { fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: '500' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 36 },
  heroCard: { backgroundColor: COLORS.red, borderRadius: 18, padding: 20, marginBottom: 20 },
  heroTitle: { fontSize: 17, fontWeight: '800', color: COLORS.white, marginBottom: 5 },
  heroSub: { fontSize: 12, color: 'rgba(255,255,255,0.75)', lineHeight: 18, marginBottom: 18 },
  heroStats: {
    flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: 12, padding: 14,
  },
  heroStat: { flex: 1, alignItems: 'center' },
  heroStatNum: { fontSize: 26, fontWeight: '900', color: COLORS.yellow },
  heroStatLabel: {
    fontSize: 9, color: 'rgba(255,255,255,0.65)',
    textTransform: 'uppercase', letterSpacing: 0.4, marginTop: 3,
  },
  heroStatDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: 4 },
});
