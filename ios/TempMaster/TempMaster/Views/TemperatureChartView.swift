import Charts
import SwiftUI

struct TemperatureChartView: View {
    let deviceId: String
    let history: [MeterReading]
    let timeScale: TimeScale
    @State private var selectedIndex: Int?

    private var axisIndices: [Int] { MeterRules.labelIndices(count: history.count) }

    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            Chart {
                ForEach(Array(history.enumerated()), id: \.offset) { index, reading in
                    AreaMark(x: .value("Index", index), y: .value("Temperature", reading.temperature))
                        .foregroundStyle(Color(red: 0.85, green: 0.33, blue: 0.31).opacity(0.15))
                        .interpolationMethod(.catmullRom)
                    LineMark(x: .value("Index", index), y: .value("Temperature", reading.temperature))
                        .foregroundStyle(Color(red: 0.85, green: 0.33, blue: 0.31))
                        .interpolationMethod(.catmullRom)
                    PointMark(x: .value("Index", index), y: .value("Temperature", reading.temperature))
                        .foregroundStyle(Color(red: 0.85, green: 0.33, blue: 0.31))
                }
            }
            .chartXAxis {
                AxisMarks(values: axisIndices) { value in
                    AxisGridLine().foregroundStyle(Color.gray.opacity(0.1))
                    AxisTick()
                    AxisValueLabel {
                        if let index = value.as(Int.self), history.indices.contains(index) {
                            Text(verbatim: MeterRules.formatLabel(history[index].timestamp, scale: timeScale))
                        }
                    }
                }
            }
            .chartYAxis {
                AxisMarks { value in
                    AxisGridLine().foregroundStyle(Color.gray.opacity(0.1))
                    AxisValueLabel {
                        if let temperature = value.as(Double.self) {
                            Text(verbatim: "\(MeterRules.numberString(temperature))°")
                        }
                    }
                }
            }
            .chartXSelection(value: $selectedIndex)
            .frame(height: 165)
            .accessibilityElement(children: .ignore)
            .accessibilityIdentifier("meterChart_\(deviceId)")
            .accessibilityValue(L10n.format("chart_points", history.count))
            if let selectedIndex, history.indices.contains(selectedIndex) {
                Text(verbatim: L10n.format("chart_temperature", history[selectedIndex].temperature))
                    .font(.caption)
            }
        }
    }
}
