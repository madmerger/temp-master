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

    var body: some View {
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
            AxisMarks(values: .automatic(desiredCount: 8)) { value in
                AxisGridLine().foregroundStyle(Color.black.opacity(0.05))
                AxisValueLabel {
                    if let date = value.as(Date.self) {
                        Text(ChartLabelFormatter.label(for: date, scale: timeScale))
                            .font(.system(size: 10))
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
