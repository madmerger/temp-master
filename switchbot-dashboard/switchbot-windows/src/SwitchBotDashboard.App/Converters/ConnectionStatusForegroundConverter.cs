using Microsoft.UI.Xaml.Data;
using Microsoft.UI.Xaml.Media;
using SwitchBotDashboard.Core;
using Windows.UI;

namespace SwitchBotDashboard.App.Converters;

public sealed class ConnectionStatusForegroundConverter : IValueConverter
{
    public object Convert(object value, Type targetType, object parameter, string language)
    {
        var color = value is ConnectionState.Connected
            ? Color.FromArgb(255, 16, 124, 16)
            : value is ConnectionState.Disconnected
                ? Color.FromArgb(255, 138, 31, 23)
                : Color.FromArgb(255, 92, 67, 0);
        return new SolidColorBrush(color);
    }

    public object ConvertBack(object value, Type targetType, object parameter, string language) =>
        throw new NotSupportedException();
}
