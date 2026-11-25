import { createApiClient, formatTimestamp, getDisplayName, isStaleMeter, type Meter } from '@temp-master/shared'
import { QueryClient, QueryClientProvider, useMutation, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native'
import { LineChart } from 'react-native-gifted-charts'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'

const api = createApiClient(process.env.EXPO_PUBLIC_API_URL)
const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

const light = {
  background: '#f4f7fb',
  surface: '#ffffff',
  ink: '#152238',
  muted: '#515f73',
  border: '#dce4ee',
  accent: '#235ed3',
  line: '#d9534f',
  error: '#af3239',
}

const dark: typeof light = {
  background: '#0e1727',
  surface: '#162235',
  ink: '#eef3fb',
  muted: '#a8b8ce',
  border: '#2d3b51',
  accent: '#80aaff',
  line: '#ff8a85',
  error: '#ffa0a4',
}

type Palette = typeof light

function HistoryChart({ meter, colors }: { meter: Meter; colors: Palette }) {
  const [width, setWidth] = useState(0)
  const result = useQuery({
    queryKey: ['history', meter.device_id, 'day'],
    queryFn: ({ signal }) => api.getHistory(meter.device_id, 'day', signal),
    select: (response) => response.history,
  })
  if (result.isPending) return <ActivityIndicator accessibilityLabel="Loading history" color={colors.accent} />
  if (result.isError) return <Text style={{ color: colors.error }}>Failed to load history</Text>
  if (!result.data.length) return <Text style={{ color: colors.muted }}>No readings in this range</Text>

  const first = result.data[0]
  const last = result.data[result.data.length - 1]
  const data = result.data.map(({ timestamp, temperature }) => ({
    value: temperature,
    x: Date.parse(timestamp),
  }))
  const timeSpan = Math.max(Date.parse(last.timestamp) - Date.parse(first.timestamp), 1)
  const yAxisWidth = 42
  const plotWidth = width - yAxisWidth
  const plotInset = 12

  return (
    <View
      accessibilityLabel={`Temperature history for ${getDisplayName(meter.device_name)} in degrees Celsius`}
      onLayout={({ nativeEvent }) => setWidth(nativeEvent.layout.width)}
      style={styles.chart}
    >
      <Text style={[styles.caption, { color: colors.muted }]}>Last 24 hours · °C</Text>
      {plotWidth > 2 * plotInset && (
        <>
          <LineChart
            data={data}
            height={120}
            width={plotWidth}
            yAxisLabelWidth={yAxisWidth}
            initialSpacing={plotInset}
            endSpacing={plotInset}
            spacing={1}
            xOffset={data[0].x}
            xScale={(plotWidth - 2 * plotInset) / timeSpan}
            disableScroll
            hideDataPoints={data.length > 1}
            color={colors.line}
            dataPointsColor={colors.line}
            rulesColor={colors.border}
            xAxisColor={colors.border}
            yAxisColor={colors.border}
            yAxisTextStyle={{ color: colors.muted, fontSize: 10 }}
          />
          <View style={[styles.chartTimes, { paddingLeft: yAxisWidth, paddingRight: plotInset }]}>
            <Text style={[styles.caption, { color: colors.muted }]}>{formatTimestamp(first.timestamp, 'day')}</Text>
            {last.timestamp !== first.timestamp && (
              <Text style={[styles.caption, { color: colors.muted }]}>{formatTimestamp(last.timestamp, 'day')}</Text>
            )}
          </View>
        </>
      )}
    </View>
  )
}

function MeterCard({ meter, colors, expanded, stale, onToggle }: {
  meter: Meter
  colors: Palette
  expanded: boolean
  stale: boolean
  onToggle: () => void
}) {
  const details = (
    <>
      <Text style={[styles.meterName, { color: colors.ink }]}>{getDisplayName(meter.device_name)}</Text>
      <Text style={[styles.temperature, { color: colors.line }]}>
        {meter.current_temperature == null ? '—' : `${meter.current_temperature}°C`}
      </Text>
      <Text style={{ color: colors.ink }}>
        Humidity {meter.current_humidity == null ? '—' : `${meter.current_humidity}%`}
        {'  ·  '}Battery {meter.battery == null ? '—' : `${meter.battery}%`}
      </Text>
      <Text style={[styles.caption, { color: colors.muted }]}>
        Last updated: {meter.last_updated ? formatTimestamp(meter.last_updated) : '—'}
      </Text>
    </>
  )

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {stale ? (
        <View style={styles.cardBody}>
          {details}
          <Text style={[styles.caption, { color: colors.muted }]}>履歴データの取得対象外</Text>
        </View>
      ) : (
        <Pressable onPress={onToggle} accessibilityRole="button" accessibilityState={{ expanded }} style={styles.cardBody}>
          {details}
          <Text style={[styles.caption, { color: colors.accent }]}>{expanded ? 'Hide history' : 'Show history'}</Text>
        </Pressable>
      )}
      {expanded && !stale && <HistoryChart meter={meter} colors={colors} />}
    </View>
  )
}

function Dashboard() {
  const isDark = useColorScheme() === 'dark'
  const colors = isDark ? dark : light
  const [expandedId, setExpandedId] = useState<string>()
  const meters = useQuery({
    queryKey: ['meters'],
    queryFn: ({ signal }) => api.getMeters(signal),
  })
  const refresh = useMutation({
    mutationFn: api.refreshMeters,
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ['meters'] })
      await queryClient.invalidateQueries({ queryKey: ['history'] })
    },
  })
  const error = meters.error
    ? `Failed to load meters: ${meters.error.message}`
    : refresh.error && `Failed to refresh: ${refresh.error.message}`

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <FlatList
        data={meters.data?.meters}
        keyExtractor={(meter) => meter.device_id}
        contentContainerStyle={styles.list}
        alwaysBounceVertical
        refreshControl={(
          <RefreshControl refreshing={refresh.isPending} onRefresh={() => refresh.mutate()} tintColor={colors.accent} />
        )}
        ListHeaderComponent={(
          <View style={styles.header}>
            <Text accessibilityRole="header" style={[styles.title, { color: colors.ink }]}>Temp Master</Text>
            <Text style={{ color: colors.muted }}>Meters</Text>
            {error && <Text accessibilityRole="alert" style={{ color: colors.error }}>{error}</Text>}
          </View>
        )}
        ListEmptyComponent={meters.isPending
          ? <ActivityIndicator accessibilityLabel="Loading meters" color={colors.accent} />
          : error ? undefined : <Text style={{ color: colors.muted }}>No meters found</Text>}
        renderItem={({ item }) => (
          <MeterCard
            meter={item}
            colors={colors}
            expanded={expandedId === item.device_id}
            stale={isStaleMeter(item, meters.dataUpdatedAt)}
            onToggle={() => setExpandedId((id) => id === item.device_id ? undefined : item.device_id)}
          />
        )}
      />
    </SafeAreaView>
  )
}

export default function App() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <Dashboard />
      </QueryClientProvider>
    </SafeAreaProvider>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  list: { flexGrow: 1, padding: 18, gap: 12 },
  header: { marginBottom: 8, gap: 4 },
  title: { fontSize: 30, fontWeight: '700' },
  card: { borderWidth: 1, borderRadius: 14 },
  cardBody: { padding: 16, gap: 6 },
  meterName: { fontSize: 17, fontWeight: '600' },
  temperature: { fontSize: 27, fontWeight: '700', fontVariant: ['tabular-nums'] },
  caption: { fontSize: 12 },
  chart: { marginHorizontal: 16, marginBottom: 16, gap: 8 },
  chartTimes: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 6 },
})
