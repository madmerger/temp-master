import Charts
import Foundation
import SwiftUI
import SwitchBotCore

struct MeterCardView: View {
    let meter: Meter
    let displayName: String
    let history: [MeterReading]

    private let accent = Color(red: 217 / 255, green: 83 / 255, blue: 79 / 255)

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 4) {
                    Text(displayName)
                        .font(.headline)
                        .accessibilityIdentifier("MeterName_\(meter.deviceID)")
                    Text(meter.deviceType)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                Spacer()
            }
            HStack(spacing: 10) {
                if let temperature = meter.currentTemperature {
                    valueChip(String(format: "%.1f°C", locale: Locale(identifier: "en_US_POSIX"), temperature))
                }
                if let humidity = meter.currentHumidity {
                    valueChip("\(humidity)%")
                }
                if let battery = meter.battery {
                    valueChip("\(battery)%")
                }
            }
            if history.isEmpty {
                Text("No data")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .frame(maxWidth: .infinity, minHeight: 150)
            } else {
                Chart(history, id: \.timestamp) { reading in
                    AreaMark(
                        x: .value("Time", reading.timestamp),
                        yStart: .value("Baseline", 0),
                        yEnd: .value("Temperature", reading.temperature)
                    )
                    .foregroundStyle(accent.opacity(0.16))
                    LineMark(
                        x: .value("Time", reading.timestamp),
                        y: .value("Temperature", reading.temperature)
                    )
                    .foregroundStyle(accent)
                    .lineStyle(StrokeStyle(lineWidth: 2))
                }
                .chartBackground { _ in Color.clear }
                .chartPlotStyle { plot in plot.background(Color.clear) }
                .chartXAxis {
                    AxisMarks { _ in
                        AxisGridLine()
                        AxisValueLabel()
                    }
                }
                .chartYAxis {
                    AxisMarks { _ in
                        AxisGridLine()
                        AxisValueLabel()
                    }
                }
                .frame(height: 170)
                .accessibilityElement(children: .ignore)
                .accessibilityLabel("Temperature history")
                .accessibilityIdentifier("TemperatureChart_\(meter.deviceID)")
            }
            Text(lastUpdatedText)
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .padding(16)
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 14))
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier("MeterCard_\(meter.deviceID)")
    }

    private var lastUpdatedText: String {
        guard let lastUpdated = meter.lastUpdated else {
            return "Last updated: —"
        }
        let formatter = DateFormatter()
        formatter.dateStyle = .short
        formatter.timeStyle = .short
        return "Last updated: \(formatter.string(from: lastUpdated))"
    }

    private func valueChip(_ value: String) -> some View {
        Text(value)
            .font(.caption.weight(.medium))
            .padding(.horizontal, 9)
            .padding(.vertical, 5)
            .background(.thinMaterial, in: Capsule())
    }
}

struct StaleMeterCardView: View {
    let meter: Meter
    let displayName: String

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 4) {
                    Text(displayName)
                        .font(.headline)
                        .accessibilityIdentifier("MeterName_\(meter.deviceID)")
                    Text(meter.deviceType)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                Spacer()
                Text("7+ days stale")
                    .font(.caption.weight(.semibold))
                    .padding(.horizontal, 9)
                    .padding(.vertical, 5)
                    .background(.orange.opacity(0.15), in: Capsule())
                    .foregroundStyle(.orange)
            }
            if let lastUpdated = meter.lastUpdated {
                Text("Last update: \(lastUpdated.formatted(date: .abbreviated, time: .shortened))")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            } else {
                Text("No data received")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
        }
        .padding(16)
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 14))
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier("MeterCard_\(meter.deviceID)")
    }
}
