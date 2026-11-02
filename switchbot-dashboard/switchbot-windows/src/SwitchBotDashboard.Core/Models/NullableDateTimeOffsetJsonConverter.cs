using System.Globalization;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace SwitchBotDashboard.Core.Models;

public sealed class NullableDateTimeOffsetJsonConverter : JsonConverter<DateTimeOffset?>
{
    public override DateTimeOffset? Read(
        ref Utf8JsonReader reader,
        Type typeToConvert,
        JsonSerializerOptions options)
    {
        if (reader.TokenType == JsonTokenType.Null)
        {
            return null;
        }

        if (reader.TokenType == JsonTokenType.String
            && DateTimeOffset.TryParse(
                reader.GetString(),
                CultureInfo.InvariantCulture,
                DateTimeStyles.None,
                out var value))
        {
            return value;
        }

        return null;
    }

    public override void Write(
        Utf8JsonWriter writer,
        DateTimeOffset? value,
        JsonSerializerOptions options)
    {
        if (value is null)
        {
            writer.WriteNullValue();
            return;
        }

        writer.WriteStringValue(value.Value);
    }
}
