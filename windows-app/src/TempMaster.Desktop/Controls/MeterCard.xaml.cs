using System.Globalization;
using System.Windows;
using System.Windows.Controls;
using TempMaster.Desktop.Models;
using TempMaster.Desktop.Services;

namespace TempMaster.Desktop.Controls;

public partial class MeterCard : UserControl
{
    public string DeviceId { get; private set; } = string.Empty;

    public MeterCard()
    {
        InitializeComponent();
    }

    public void Bind(MeterDevice meter)
    {
        DeviceId = meter.DeviceId;
        NameText.Text = DisplayNames.Resolve(meter.DeviceName);
        TypeText.Text = meter.DeviceType;

        if (meter.CurrentTemperature is { } temp)
        {
            TempBadge.Visibility = Visibility.Visible;
            TempText.Text = temp.ToString("0.#", CultureInfo.InvariantCulture) + "\u00b0C";
        }
        else
        {
            TempBadge.Visibility = Visibility.Collapsed;
        }

        if (meter.CurrentHumidity is { } humidity)
        {
            HumidityBadge.Visibility = Visibility.Visible;
            HumidityText.Text = humidity + "%";
        }
        else
        {
            HumidityBadge.Visibility = Visibility.Collapsed;
        }

        if (meter.Battery is { } battery)
        {
            BatteryBadge.Visibility = Visibility.Visible;
            BatteryText.Text = battery + "%";
        }
        else
        {
            BatteryBadge.Visibility = Visibility.Collapsed;
        }

        LastUpdatedText.Text = meter.LastUpdated is { } updated
            ? "Last updated: " + updated.ToLocalTime().ToString("g", CultureInfo.CurrentCulture)
            : string.Empty;
    }

    public void SetHistory(IEnumerable<MeterReading> readings, string timeScale)
        => Chart.SetData(readings, timeScale);
}
