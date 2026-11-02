using Microsoft.UI.Xaml.Data;
using Microsoft.UI.Xaml.Media;
using SwitchBotDashboard.Core;
using Windows.UI;

namespace SwitchBotDashboard.App.Converters;

public sealed class ConnectionStatusBackgroundConverter : IValueConverter
{
    public object Convert(object value, Type targetType, object parameter, string language)
    {
        var color = value is ConnectionState.Connected
            ? Color.FromArgb(255, 223, 246, 221)
            : value is ConnectionState.Disconnected
                ? Color.FromArgb(255, 253, 231, 233)
                : Color.FromArgb(255, 255, 244, 206);
        return new SolidColorBrush(color);
    }

    public object ConvertBack(object value, Type targetType, object parameter, string language) =>
        throw new NotSupportedException();
}
