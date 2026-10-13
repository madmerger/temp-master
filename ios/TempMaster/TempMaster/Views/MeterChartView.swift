import Charts
import SwiftUI

/// L-10: temperature chart — LineMark + AreaMark (#d9534f, area 0.15),
/// catmullRom, x labels via ChartLabelFormatter (~8 ticks), y axis "N°".
/// Accessibility value exposes "<n> points".
struct MeterChartView: View {
    let history: [MeterReading]
    let timeScale: TimeScale
    let deviceID: String

    private let lineColor = Color(hex: 0xd9534f)

    /// Legacy Chart.js uses one category label per data point. Mirror that
    /// for small histories (one label per reading); larger histories fall
    /// back to automatic ticks.
    static func xAxisDates(_ history: [MeterReading]) -> [Date]? {
        guard (1...8).contains(history.count) else { return nil }
        return history.map(\.timestamp)
    }

    var body: some View {
        if history.count == 1 {
            // Centre the single point so its axis label renders.
            let t = history[0].timestamp
            chartBody
                .chartXScale(domain: t.addingTimeInterval(-1800)...t.addingTimeInterval(1800))
        } else {
            chartBody
        }
    }

    private var chartBody: some View {
        Chart {
            ForEach(Array(history.enumerated()), id: \.offset) { _, reading in
                LineMark(
                    x: .value("Time", reading.timestamp),
                    y: .value("Temperature (C)", reading.temperature))
                .foregroundStyle(lineColor)
                .interpolationMethod(.catmullRom)
                AreaMark(
                    x: .value("Time", reading.timestamp),
                    y: .value("Temperature (C)", reading.temperature))
                .foregroundStyle(lineColor.opacity(0.15))
                .interpolationMethod(.catmullRom)
                PointMark(
                    x: .value("Time", reading.timestamp),
                    y: .value("Temperature (C)", reading.temperature))
                .foregroundStyle(lineColor)
                .symbolSize(20)
            }
        }
        .chartXAxis {
            if let dates = Self.xAxisDates(history) {
                AxisMarks(values: dates) { value in
                    AxisGridLine().foregroundStyle(Color.black.opacity(0.05))
                    AxisValueLabel(collisionResolution: .greedy) {
                        if let date = value.as(Date.self) {
                            Text(ChartLabelFormatter.label(for: date, scale: timeScale))
                                .font(.system(size: 10))
                        }
                    }
                }
            } else {
                AxisMarks(values: .automatic(desiredCount: 5)) { value in
                    AxisGridLine().foregroundStyle(Color.black.opacity(0.05))
                    AxisValueLabel(collisionResolution: .greedy) {
                        if let date = value.as(Date.self) {
                            Text(ChartLabelFormatter.label(for: date, scale: timeScale))
                                .font(.system(size: 10))
                        }
                    }
                }
            }
        }
        .chartYAxis {
            AxisMarks { value in
                AxisGridLine().foregroundStyle(Color.black.opacity(0.05))
                AxisValueLabel {
                    if let v = value.as(Double.self) {
                        Text(verbatim: "\(Int(v))°").font(.system(size: 10))
                    }
                }
            }
        }
        .chartLegend(.hidden)
        .frame(height: 200)
        .accessibilityIdentifier("chart-\(deviceID)")
        .accessibilityValue(String(
            format: "chart.points".localizedString, history.count))
    }
}
