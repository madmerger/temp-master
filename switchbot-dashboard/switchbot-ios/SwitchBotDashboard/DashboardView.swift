import SwiftUI
import SwitchBotCore

struct DashboardView: View {
    @ObservedObject var viewModel: DashboardViewModel
    @AppStorage("appearance") private var appearance = "system"

    private var preferredColorScheme: ColorScheme? {
        switch appearance {
        case "light": .light
        case "dark": .dark
        default: nil
        }
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    connectionSummary
                    timeRangePicker
                    if let rateLimitMessage = viewModel.state.rateLimitMessage {
                        messageBanner(rateLimitMessage, identifier: "RateLimitBanner", color: .orange)
                    }
                    if let errorMessage = viewModel.state.errorMessage {
                        messageBanner(errorMessage, identifier: "ErrorBanner", color: .red)
                    }
                    meterGrid
                    staleSection
                }
                .padding()
            }
            .refreshable {
                await viewModel.refresh()
            }
            .navigationTitle("Temp Master Dashboard")
            .toolbar {
                ToolbarItemGroup(placement: .topBarTrailing) {
                    Menu {
                        Picker("Appearance", selection: $appearance) {
                            Text("System").tag("system")
                            Text("Light").tag("light")
                            Text("Dark").tag("dark")
                        }
                    } label: {
                        Image(systemName: "circle.lefthalf.filled")
                    }
                    .accessibilityLabel("Appearance")
                    .accessibilityIdentifier("AppearancePicker")

                    Button {
                        Task { await viewModel.refresh() }
                    } label: {
                        Image(systemName: "arrow.clockwise")
                    }
                    .accessibilityLabel("Refresh")
                    .accessibilityIdentifier("RefreshButton")
                }
            }
            .task {
                await viewModel.load()
                while !Task.isCancelled {
                    do {
                        try await Task.sleep(nanoseconds: 30_000_000_000)
                    } catch {
                        break
                    }
                    guard !Task.isCancelled else {
                        break
                    }
                    await viewModel.load()
                }
            }
        }
        .preferredColorScheme(preferredColorScheme)
    }

    private var connectionSummary: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(viewModel.state.connection.rawValue.capitalized)
                    .font(.subheadline.weight(.semibold))
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
                    .background(connectionColor.opacity(0.16), in: Capsule())
                    .foregroundStyle(connectionColor)
                    .accessibilityIdentifier("ConnectionStatus")
                Spacer()
                Text(appearance.capitalized)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .accessibilityIdentifier("CurrentAppearance")
            }
            Text(viewModel.state.statusText)
                .font(.subheadline)
            if let lastRefresh = viewModel.lastRefreshText() {
                Text(lastRefresh)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
    }

    private var connectionColor: Color {
        switch viewModel.state.connection {
        case .connected: .green
        case .disconnected: .red
        case .connecting: .secondary
        }
    }

    private var timeRangePicker: some View {
        Picker(
            "Time range",
            selection: Binding(
                get: { viewModel.selectedTimeScale },
                set: { viewModel.selectTimeScale($0) }
            )
        ) {
            ForEach(TimeScale.allCases, id: \.self) { timeScale in
                Text(timeScale.displayLabel).tag(timeScale)
            }
        }
        .pickerStyle(.segmented)
        .accessibilityIdentifier("TimeRangePicker")
    }

    private var meterGrid: some View {
        LazyVGrid(columns: [GridItem(.adaptive(minimum: 320), spacing: 14)], spacing: 14) {
            ForEach(viewModel.state.activeMeters, id: \.deviceID) { meter in
                MeterCardView(
                    meter: meter,
                    displayName: viewModel.displayNames.resolve(meter.deviceName),
                    history: viewModel.state.histories[meter.deviceID] ?? []
                )
            }
        }
    }

    private var staleSection: some View {
        Group {
            if !viewModel.state.staleMeters.isEmpty {
                VStack(alignment: .leading, spacing: 12) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Stale meters")
                            .font(.title2.weight(.semibold))
                        Text("Not updated for 7+ days")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }
                    LazyVGrid(columns: [GridItem(.adaptive(minimum: 320), spacing: 14)], spacing: 14) {
                        ForEach(viewModel.state.staleMeters, id: \.deviceID) { meter in
                            StaleMeterCardView(
                                meter: meter,
                                displayName: viewModel.displayNames.resolve(meter.deviceName)
                            )
                        }
                    }
                }
                .accessibilityElement(children: .contain)
                .accessibilityIdentifier("StaleSection")
            }
        }
    }

    private func messageBanner(_ text: String, identifier: String, color: Color) -> some View {
        Text(text)
            .font(.subheadline)
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(12)
            .background(color.opacity(0.12), in: RoundedRectangle(cornerRadius: 10))
            .foregroundStyle(color)
            .accessibilityIdentifier(identifier)
    }
}
