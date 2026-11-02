using System.Reflection;
using System.Text.Json;

namespace SwitchBotDashboard.Core;

public sealed class DisplayNameMap
{
    private readonly IReadOnlyDictionary<string, string> _names;

    public DisplayNameMap()
    {
        using var stream = Assembly.GetExecutingAssembly().GetManifestResourceStream("display_names.json")
            ?? throw new InvalidOperationException("The display_names.json resource is missing.");
        _names = JsonSerializer.Deserialize<Dictionary<string, string>>(stream)
            ?? throw new InvalidOperationException("The display_names.json resource is invalid.");
    }

    public string Resolve(string name) => _names.TryGetValue(name, out var displayName) ? displayName : name;
}
