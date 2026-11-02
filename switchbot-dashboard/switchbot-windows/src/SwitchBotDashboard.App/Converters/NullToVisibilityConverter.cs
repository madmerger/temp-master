using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Data;

namespace SwitchBotDashboard.App.Converters;

public sealed class NullToVisibilityConverter : IValueConverter
{
    public object Convert(object value, Type targetType, object parameter, string language) =>
        value is null || string.IsNullOrEmpty(value.ToString())
            ? Visibility.Collapsed
            : Visibility.Visible;

    public object ConvertBack(object value, Type targetType, object parameter, string language) =>
        throw new NotSupportedException();
}
