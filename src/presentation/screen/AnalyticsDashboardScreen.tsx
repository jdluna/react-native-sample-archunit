// src/presentation/screens/AnalyticsDashboardScreen.tsx
// Presentation Layer — React Native screen, uses ViewModel only (no direct domain/data imports)

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { AnalyticsDashboardViewModel } from '../viewmodels/AnalyticsDashboardViewModel';
import { MetricsSummary } from '@contracts/sdk/IAnalyticsSDKContract';

interface Props {
  viewModel: AnalyticsDashboardViewModel;
}

export const AnalyticsDashboardScreen: React.FC<Props> = ({ viewModel }) => {
  const [state, setState] = useState(viewModel.state);

  useEffect(() => {
    const unsubscribe = viewModel.subscribe(() => setState(viewModel.state));
    viewModel.loadDashboard();
    return unsubscribe;
  }, [viewModel]);

  if (state.status === 'idle' || state.status === 'loading') {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (state.status === 'error') {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{state.message}</Text>
        <TouchableOpacity onPress={() => viewModel.loadDashboard()}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const summary: MetricsSummary = state.data;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Analytics Dashboard</Text>

      <View style={styles.row}>
        <MetricCard label="Total Events" value={summary.totalEvents.toLocaleString()} />
        <MetricCard label="Active Users" value={summary.activeUsers.toLocaleString()} />
        <MetricCard
          label="Error Rate"
          value={`${(summary.errorRate * 100).toFixed(1)}%`}
          highlight={summary.errorRate > 0.05}
        />
      </View>

      <Text style={styles.sectionTitle}>Top Screens</Text>
      <FlatList
        data={summary.topScreens}
        keyExtractor={item => item.name}
        renderItem={({ item }) => (
          <View style={styles.screenRow}>
            <Text style={styles.screenName}>{item.name}</Text>
            <Text style={styles.screenViews}>{item.views.toLocaleString()} views</Text>
          </View>
        )}
      />
    </View>
  );
};

const MetricCard: React.FC<{
  label: string;
  value: string;
  highlight?: boolean;
}> = ({ label, value, highlight = false }) => (
  <View style={[styles.card, highlight && styles.cardHighlight]}>
    <Text style={styles.cardValue}>{value}</Text>
    <Text style={styles.cardLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#F9F9F9' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '600', marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '500', marginTop: 24, marginBottom: 8 },
  row: { flexDirection: 'row', gap: 12 },
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHighlight: { borderWidth: 1.5, borderColor: '#E24B4A' },
  cardValue: { fontSize: 20, fontWeight: '700', color: '#1A1A1A' },
  cardLabel: { fontSize: 12, color: '#888', marginTop: 4 },
  screenRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E0E0',
  },
  screenName: { fontSize: 14, color: '#1A1A1A' },
  screenViews: { fontSize: 14, color: '#888' },
  errorText: { fontSize: 14, color: '#E24B4A', marginBottom: 12 },
  retryText: { fontSize: 14, color: '#185FA5', fontWeight: '500' },
});
