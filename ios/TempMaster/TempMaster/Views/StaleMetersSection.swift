import SwiftUI

/// L-09: warning section for meters stale >= 7 days.
struct StaleMetersSection: View {
    let meters: [MeterDevice]
    let histories: [String: [MeterReading]]

    var body: some View {
        if !meters.isEmpty {
            VStack(alignment: .leading, spacing: 10) {
                HStack(spacing: 6) {
                    Image(systemName: "exclamationmark.triangle.fill")
                        .foregroundStyle(Color(hex: 0x8a6d3b))
                    Text("stale.section_title".localized)
                        .font(.headline)
                        .foregroundStyle(Color(hex: 0x8a6d3b))
                }
                Text("stale.section_subtitle".localized)
                    .font(.caption)
                    .foregroundStyle(Color(hex: 0x8a6d3b))

                LazyVGrid(columns: [GridItem(.adaptive(minimum: 320))], spacing: 12) {
                    ForEach(meters) { meter in
                        MeterCardView(meter: meter,
                                      history: histories[meter.deviceID] ?? [],
                                      timeScale: .day,
                                      isStale: true)
                    }
                }
            }
            .padding()
            .background(Color(hex: 0xfcf8e3))
            .clipShape(RoundedRectangle(cornerRadius: 8))
            .overlay(RoundedRectangle(cornerRadius: 8)
                .stroke(Color(hex: 0xf0ad4e)))
            .accessibilityIdentifier("stale-section")
        }
    }
}
