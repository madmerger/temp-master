import SwiftUI

struct LatencyView: View {
    @ObservedObject var viewModel: LatencyViewModel

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text(verbatim: L10n.text("latency_stats")).font(.title2.bold())
                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 10) {
                    stat("latency_total", "\(viewModel.stats.totalCalls)", id: "total")
                    stat("latency_average", ms(viewModel.stats.avgLatencyMs), id: "avg")
                    stat("latency_minimum", ms(viewModel.stats.minLatencyMs), id: "min")
                    stat("latency_maximum", ms(viewModel.stats.maxLatencyMs), id: "max")
                    stat("latency_success", "\(viewModel.stats.successfulCalls)", id: "success")
                    stat("latency_failed", "\(viewModel.stats.failedCalls)", id: "failed")
                    stat("latency_rate", "\(MeterRules.numberString(viewModel.stats.successRate))%", id: "rate")
                }
                Group {
                    TextField(L10n.text("latency_endpoint"), text: $viewModel.endpoint)
                        .textFieldStyle(.roundedBorder)
                        .accessibilityIdentifier("latencyFilterEndpoint")
                    TextField(L10n.text("latency_device_id"), text: $viewModel.deviceId)
                        .textFieldStyle(.roundedBorder)
                        .accessibilityIdentifier("latencyFilterDevice")
                    TextField(L10n.text("latency_limit"), text: $viewModel.limit)
                        .keyboardType(.numberPad)
                        .textFieldStyle(.roundedBorder)
                        .accessibilityIdentifier("latencyFilterLimit")
                    Toggle(L10n.text("filter_start"), isOn: $viewModel.startEnabled)
                        .accessibilityIdentifier("latencyFilterStartToggle")
                    if viewModel.startEnabled {
                        DatePicker(L10n.text("filter_start"), selection: $viewModel.startDate)
                    }
                    Toggle(L10n.text("filter_end"), isOn: $viewModel.endEnabled)
                        .accessibilityIdentifier("latencyFilterEndToggle")
                    if viewModel.endEnabled {
                        DatePicker(L10n.text("filter_end"), selection: $viewModel.endDate)
                    }
                    Button(L10n.text("apply")) { Task { await viewModel.apply() } }
                        .buttonStyle(.borderedProminent)
                        .accessibilityIdentifier("latencyApplyButton")
                }
                Text(verbatim: L10n.format("latency_logs", viewModel.logs.count))
                    .font(.headline)
                    .accessibilityIdentifier("latencyLogCount")
                if let errorMessage = viewModel.errorMessage {
                    Text(verbatim: errorMessage).foregroundStyle(.red)
                }
                ForEach(Array(viewModel.logs.enumerated()), id: \.offset) { index, log in
                    VStack(alignment: .leading, spacing: 5) {
                        Text(verbatim: log.endpoint).font(.headline)
                        if let deviceId = log.deviceId { Text(verbatim: deviceId) }
                        Text(verbatim: "\(MeterRules.numberString(log.latencyMs)) ms • \(log.statusCode) • \(L10n.text(log.success ? "success" : "failed"))")
                        Text(verbatim: DateFormatter.localizedString(from: log.timestamp, dateStyle: .short, timeStyle: .medium))
                            .font(.caption).foregroundStyle(.secondary)
                        if let errorMessage = log.errorMessage { Text(verbatim: errorMessage).font(.caption) }
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(10)
                    .background(Color(uiColor: .secondarySystemBackground))
                    .clipShape(RoundedRectangle(cornerRadius: 8))
                    .accessibilityElement(children: .contain)
                    .accessibilityIdentifier("latencyLogRow_\(index)")
                }
            }
            .padding()
        }
        .navigationTitle(L10n.text("tab_latency"))
        .task { await viewModel.apply() }
    }

    private func stat(_ key: String, _ value: String, id: String) -> some View {
        VStack(alignment: .leading, spacing: 5) {
            Text(verbatim: L10n.text(key)).font(.caption).foregroundStyle(.secondary)
            Text(verbatim: value).font(.headline)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(10)
        .background(Color(uiColor: .secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 8))
        .accessibilityIdentifier("latencyStats_\(id)")
    }

    private func ms(_ value: Double?) -> String {
        guard let value else { return "-" }
        return "\(MeterRules.numberString(value)) ms"
    }
}
