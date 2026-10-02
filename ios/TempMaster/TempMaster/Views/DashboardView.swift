import SwiftUI

struct DashboardView: View {
    @EnvironmentObject private var environment: AppEnvironment
    @StateObject private var vm: DashboardViewModel
    @State private var showShareSheet = false
    @State private var autoRefreshTask: Task<Void, Never>?

    init() {
        // Service is rebound to environment.service on each serviceVersion bump.
        _vm = StateObject(wrappedValue: DashboardViewModel(
            service: MockMeterService()))  // placeholder; replaced in task
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 12) {
                    controls
                    if vm.isRateLimited {
                        rateLimitWarning
                    }
                    if vm.status != nil {
                        statusRow
                    }
                    if vm.isLoading {
                        Text("dashboard.loading".localized)
                            .foregroundStyle(.secondary)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 40)
                            .accessibilityIdentifier("loading")
                    }
                    if let error = vm.errorMessage {
                        errorBanner(error)
                    }
                    meterGrid
                    StaleMetersSection(
                        meters: vm.activeStale.stale,
                        histories: vm.histories)
                    footer
                }
                .padding()
            }
            .navigationTitle("dashboard.title".localized)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    connectionBadge
                }
            }
            .refreshable { await vm.load() }
        }
        .task(id: environment.serviceVersion) {
            vm.service = environment.service
            await vm.load()
            autoRefreshTask?.cancel()
            autoRefreshTask = Task { // B-06: auto refresh every 30 s
                while !Task.isCancelled {
                    try? await Task.sleep(for: .seconds(30))
                    guard !Task.isCancelled else { break }
                    await vm.load()
                }
            }
        }
        .onDisappear { autoRefreshTask?.cancel() }
        .sheet(isPresented: $showShareSheet) {
            if let url = vm.backupURL {
                ShareSheet(items: [url])
            }
        }
        .onChange(of: vm.backupURL) { _, url in
            if url != nil { showShareSheet = true }
        }
    }

    // MARK: - subviews

    private var connectionBadge: some View {
        Text(vm.isConnected ? "connection.connected".localized
                            : "connection.disconnected".localized)
            .font(.caption.weight(.semibold))
            .padding(.horizontal, 8).padding(.vertical, 3)
            .foregroundStyle(.white)
            .background(vm.isConnected ? Color.green : Color.red)
            .clipShape(Capsule())
            .accessibilityIdentifier("connection-status")
    }

    private var controls: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Text("timerange.label".localized)
                Picker("timerange.label".localized,
                       selection: $vm.timeScale) {
                    ForEach(TimeScale.allCases) { scale in
                        Text(scale.labelKey.localized).tag(scale)
                    }
                }
                .pickerStyle(.menu)
                .accessibilityIdentifier("time-scale-picker")
                .onChange(of: vm.timeScale) { _, scale in
                    Task { await vm.setTimeScale(scale) }
                }
            }
            HStack(spacing: 12) {
                Button {
                    Task { await vm.refreshTapped() }
                } label: {
                    Text(vm.isRefreshing ? "dashboard.refreshing".localized
                                         : "dashboard.refresh_button".localized)
                }
                .buttonStyle(.borderedProminent)
                .disabled(vm.isRefreshing)
                .accessibilityIdentifier("btn-refresh")

                Button {
                    Task { await vm.backupTapped() }
                } label: {
                    Text("dashboard.backup_button".localized)
                }
                .buttonStyle(.bordered)
                .accessibilityIdentifier("btn-backup")
            }
        }
        .padding()
        .background(Color(.secondarySystemGroupedBackground))
        .clipShape(RoundedRectangle(cornerRadius: 8))
    }

    private var statusRow: some View {
        HStack {
            Text(vm.statusText)
                .accessibilityIdentifier("status-meters-count")
            Spacer()
            Text(vm.lastRefreshText)
                .accessibilityIdentifier("status-last-refresh")
        }
        .padding()
        .foregroundStyle(Color(red: 0.19, green: 0.37, blue: 0.5))
        .background(Color(red: 0.85, green: 0.92, blue: 0.96))
        .clipShape(RoundedRectangle(cornerRadius: 8))
    }

    private var rateLimitWarning: some View {
        (Text("ratelimit.title".localized).bold()
            + Text(verbatim: " " + vm.rateLimitText))
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .foregroundStyle(Color(red: 0.54, green: 0.43, blue: 0.23))
        .background(Color(red: 0.99, green: 0.97, blue: 0.89))
        .clipShape(RoundedRectangle(cornerRadius: 8))
        .accessibilityIdentifier("rate-limit-warning")
    }

    private func errorBanner(_ message: String) -> some View {
        HStack {
            Text("error.title".localized).bold()
            Text(message)
                .accessibilityIdentifier("error-text")
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .foregroundStyle(Color(red: 0.66, green: 0.28, blue: 0.26))
        .background(Color(red: 0.95, green: 0.87, blue: 0.87))
        .clipShape(RoundedRectangle(cornerRadius: 8))
        .accessibilityIdentifier("error")
    }

    private var meterGrid: some View {
        LazyVGrid(columns: [GridItem(.adaptive(minimum: 320))], spacing: 12) {
            ForEach(vm.activeStale.active) { meter in
                MeterCardView(meter: meter,
                              history: vm.histories[meter.deviceID] ?? [],
                              timeScale: vm.timeScale,
                              isStale: false)
            }
        }
    }

    private var footer: some View {
        Text("footer.text".localized)
            .font(.caption)
            .foregroundStyle(.secondary)
            .frame(maxWidth: .infinity)
            .padding(.top, 20)
            .accessibilityIdentifier("footer")
    }
}
