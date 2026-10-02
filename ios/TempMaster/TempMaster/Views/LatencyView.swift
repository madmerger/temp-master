import SwiftUI

/// L-11: latency stats + filterable log list (newest first).
struct LatencyView: View {
    @EnvironmentObject private var environment: AppEnvironment
    @StateObject private var vm: LatencyViewModel

    init() {
        _vm = StateObject(wrappedValue: LatencyViewModel(service: MockMeterService()))
    }

    var body: some View {
        NavigationStack {
            List {
                if let stats = vm.stats {
                    Section("latency.stats_section".localized) {
                        statsGrid(stats)
                    }
                }
                Section("latency.filters_section".localized) {
                    TextField("latency.filter_endpoint".localized, text: $vm.endpoint)
                        .textInputAutocapitalization(.never)
                        .accessibilityIdentifier("latency-filter-endpoint")
                    TextField("latency.filter_device_id".localized, text: $vm.deviceID)
                        .textInputAutocapitalization(.never)
                        .accessibilityIdentifier("latency-filter-device-id")
                    Stepper(value: $vm.limit, in: 1...1000) {
                        Text("latency.filter_limit".localized)
                            + Text(verbatim: " \(vm.limit)")
                    }
                    Toggle("latency.use_start".localized, isOn: $vm.useStart)
                    if vm.useStart {
                        DatePicker("latency.filter_start".localized,
                                   selection: $vm.start)
                    }
                    Toggle("latency.use_end".localized, isOn: $vm.useEnd)
                    if vm.useEnd {
                        DatePicker("latency.filter_end".localized,
                                   selection: $vm.end)
                    }
                    Button("latency.apply".localized) {
                        Task { await vm.load() }
                    }
                    .accessibilityIdentifier("latency-apply")
                }
                Section {
                    ForEach(vm.logs) { log in
                        VStack(alignment: .leading, spacing: 4) {
                            HStack {
                                Text(verbatim: log.endpoint)
                                    .font(.subheadline.weight(.semibold))
                                Spacer()
                                Image(systemName: log.success
                                      ? "checkmark.circle.fill"
                                      : "xmark.circle.fill")
                                    .foregroundStyle(log.success ? .green : .red)
                                Text(verbatim: "\(log.statusCode)")
                                    .font(.caption.monospacedDigit())
                            }
                            HStack {
                                Text(verbatim: log.timestamp.formatted(
                                    date: .abbreviated, time: .standard))
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                                if let device = log.deviceID {
                                    Text(verbatim: device)
                                        .font(.caption)
                                        .foregroundStyle(.secondary)
                                }
                                Spacer()
                                Text(verbatim: String(format: "%.1f ms", log.latencyMs))
                                    .font(.caption.monospacedDigit())
                            }
                            if let error = log.errorMessage {
                                Text(verbatim: error)
                                    .font(.caption)
                                    .foregroundStyle(.red)
                            }
                        }
                    }
                }
            }
            .navigationTitle("latency.title".localized)
            .task(id: environment.serviceVersion) {
                vm.service = environment.service
                await vm.load()
            }
            .overlay {
                if let error = vm.errorMessage {
                    Text(verbatim: error)
                        .foregroundStyle(.red)
                        .accessibilityIdentifier("latency-error")
                }
            }
        }
    }

    private func statsGrid(_ stats: LatencyStats) -> some View {
        let items: [(String, String)] = [
            ("latency.stat_total", "\(stats.totalCalls)"),
            ("latency.stat_avg", format(stats.avgLatencyMs)),
            ("latency.stat_min", format(stats.minLatencyMs)),
            ("latency.stat_max", format(stats.maxLatencyMs)),
            ("latency.stat_success", "\(stats.successfulCalls)"),
            ("latency.stat_failed", "\(stats.failedCalls)"),
            ("latency.stat_rate", String(format: "%.1f%%", stats.successRate)),
        ]
        return LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())],
                         spacing: 8) {
            ForEach(items, id: \.0) { key, value in
                VStack {
                    Text(key.localized).font(.caption).foregroundStyle(.secondary)
                    Text(verbatim: value).font(.headline)
                }
                .frame(maxWidth: .infinity)
                .padding(8)
                .background(Color(.secondarySystemGroupedBackground))
                .clipShape(RoundedRectangle(cornerRadius: 8))
            }
        }
        .accessibilityIdentifier("latency-stats")
    }

    /// Avg/min/max use JS-style number formatting so full precision shows
    /// (e.g. 137.625); integral values render without decimals.
    private func format(_ v: Double?) -> String {
        guard let v else { return "-" }
        return NumberFormatting.jsString(v)
    }
}
