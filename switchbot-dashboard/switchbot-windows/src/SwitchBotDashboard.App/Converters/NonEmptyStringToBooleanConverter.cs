using Microsoft.UI.Xaml.Data;

namespace SwitchBotDashboard.App.Converters;

public sealed class NonEmptyStringToBooleanConverter : IValueConverter
{
    public object Convert(object value, Type targetType, object parameter, string language) =>
        value is string text && !string.IsNullOrWhiteSpace(text);

    public object ConvertBack(object value, Type targetType, object parameter, string language) =>
        throw new NotSupportedException();
}
