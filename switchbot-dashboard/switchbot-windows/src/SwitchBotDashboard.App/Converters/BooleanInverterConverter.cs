using Microsoft.UI.Xaml.Data;

namespace SwitchBotDashboard.App.Converters;

public sealed class BooleanInverterConverter : IValueConverter
{
    public object Convert(object value, Type targetType, object parameter, string language) =>
        value is bool boolean && !boolean;

    public object ConvertBack(object value, Type targetType, object parameter, string language) =>
        value is bool boolean && !boolean;
}
