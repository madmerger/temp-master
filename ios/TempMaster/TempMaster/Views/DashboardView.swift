import SwiftUI

struct DashboardView: View {
    @ObservedObject var viewModel: DashboardViewModel
    let isActive: Bool
    @Environment(\.horizontalSizeClass) private var sizeClass
    @State private var shouldScrollToStale = ProcessInfo.processInfo.arguments.contains("-UITestScrollToStale")

    private var columns: [GridItem] {
        [GridItem(.adaptive(minimum: sizeClass == .regular ? 340 : 320), spacing: 14)]
    }

    var body: some View {
        ScrollViewReader { proxy in
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    controls
                    if let statusCountText = viewModel.statusCountText {
                        HStack {
                            Text(verbatim: statusCountText).accessibilityIdentifier("statusMetersCount")
                            Spacer(minLength: 8)
                            if let lastRefreshText = viewModel.lastRefreshText {
                                Text(verbatim: lastRefreshText).accessibilityIdentifier("statusLastRefresh")
                            }
                        }
                        .font(.subheadline)
                    }
                    if let status = viewModel.status, status.isRateLimited {
                        VStack(alignment: .leading, spacing: 4) {
                            Text(verbatim: L10n.text("rate_limited_title")).bold()
                            Text(verbatim: L10n.format("rate_limited_text", status.backoffRemaining))
                                .accessibilityIdentifier("rateLimitText")
                        }
                        .padding(12)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(Color.orange.opacity(0.16))
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                        .accessibilityElement(children: .contain)
                        .accessibilityIdentifier("rateLimitWarning")
                    }
                    if viewModel.isLoading {
                        ProgressView(L10n.text("loading_data"))
                            .frame(maxWidth: .infinity)
                            .accessibilityIdentifier("loadingText")
                    }
                    if let error = viewModel.errorMessage {
                        VStack(alignment: .leading, spacing: 4) {
                            Text(verbatim: L10n.text("error_title")).bold()
                            Text(verbatim: error).accessibilityIdentifier("errorText")
                        }
                        .padding(12)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(Color.red.opacity(0.12))
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                        .accessibilityElement(children: .contain)
                        .accessibilityIdentifier("errorBanner")
                    }
                    LazyVGrid(columns: columns, spacing: 14) {
                        ForEach(viewModel.activeMeters) { meter in
                            MeterCardView(meter: meter, isStale: false, history: viewModel.histories[meter.deviceId] ?? [], timeScale: viewModel.timeScale)
                        }
                    }
                    if !viewModel.staleMeters.isEmpty {
                        VStack(alignment: .leading, spacing: 8) {
                            Text(verbatim: L10n.text("stale_title"))
                                .font(.title3.bold())
                                .foregroundStyle(Color(red: 0.54, green: 0.43, blue: 0.23))
                            Text(verbatim: L10n.text("stale_subtitle"))
                                .font(.caption)
                                .foregroundStyle(Color(red: 0.54, green: 0.43, blue: 0.23))
                            LazyVGrid(columns: columns, spacing: 14) {
                                ForEach(viewModel.staleMeters) { meter in
                                    MeterCardView(meter: meter, isStale: true, history: [], timeScale: viewModel.timeScale)
                                }
                            }
                            .padding(10)
                            .background(Color(red: 0.988, green: 0.973, blue: 0.89))
                            .clipShape(RoundedRectangle(cornerRadius: 10))
                            .overlay(RoundedRectangle(cornerRadius: 10).stroke(Color(red: 0.98, green: 0.92, blue: 0.8)))
                        }
                        .id("staleSection")
                        .accessibilityElement(children: .contain)
                        .accessibilityIdentifier("staleSection")
                    }
                    Text(verbatim: L10n.text("footer"))
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 16)
                        .accessibilityIdentifier("footerText")
                }
                .padding()
            }
            .navigationTitle(L10n.text("dashboard_title"))
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Text(verbatim: viewModel.isConnected ? L10n.text("connection_connected") : L10n.text("connection_disconnected"))
                        .font(.caption.bold())
                        .foregroundStyle(.white)
                        .padding(.horizontal, 9)
                        .padding(.vertical, 5)
                        .background(viewModel.isConnected ? Color(red: 0.36, green: 0.72, blue: 0.36) : Color(red: 0.85, green: 0.33, blue: 0.31))
                        .clipShape(Capsule())
                        .accessibilityIdentifier("connectionStatus")
                }
            }
            .onChange(of: viewModel.isLoading) { _, isLoading in
                guard !isLoading, shouldScrollToStale else { return }
                shouldScrollToStale = false
                withAnimation { proxy.scrollTo("staleSection", anchor: .top) }
            }
            .task(id: isActive) {
                guard isActive else { return }
                await viewModel.fetchData()
                while !Task.isCancelled {
                    do { try await Task.sleep(for: .seconds(viewModel.refreshInterval)) }
                    catch { return }
                    await viewModel.fetchData()
                }
            }
        }
        .sheet(item: $viewModel.backupFile, onDismiss: { viewModel.finishSharingBackup() }) { file in
            ShareSheet(activityItems: [file.fileURL])
        }
    }

    private var controls: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text(verbatim: L10n.text("time_range"))
                Picker(L10n.text("time_range"), selection: Binding(
                    get: { viewModel.timeScale },
                    set: { scale in Task { await viewModel.setTimeScale(scale) } }
                )) {
                    Text(verbatim: L10n.text("range_hour")).tag(TimeScale.hour)
                    Text(verbatim: L10n.text("range_day")).tag(TimeScale.day)
                    Text(verbatim: L10n.text("range_week")).tag(TimeScale.week)
                    Text(verbatim: L10n.text("range_month")).tag(TimeScale.month)
                    Text(verbatim: L10n.text("range_year")).tag(TimeScale.year)
                }
                .pickerStyle(.menu)
                .accessibilityIdentifier("timeRangePicker")
            }
            HStack {
                Button {
                    Task { await viewModel.refresh() }
                } label: {
                    Text(verbatim: viewModel.isRefreshing ? L10n.text("refreshing") : L10n.text("refresh_button"))
                }
                .buttonStyle(.borderedProminent)
                .disabled(viewModel.isRefreshing)
                .accessibilityIdentifier("refreshButton")
                Button {
                    Task { await viewModel.downloadBackup() }
                } label: {
                    Text(verbatim: viewModel.isDownloading ? L10n.text("downloading") : L10n.text("backup_button"))
                }
                .buttonStyle(.bordered)
                .disabled(viewModel.isDownloading)
                .accessibilityIdentifier("backupButton")
            }
        }
        .padding(12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color(uiColor: .secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 10))
    }
}
