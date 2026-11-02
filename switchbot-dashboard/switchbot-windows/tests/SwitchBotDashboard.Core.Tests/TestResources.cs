using System.Reflection;

namespace SwitchBotDashboard.Core.Tests;

internal static class TestResources
{
    public static string Read(string fileName)
    {
        var assembly = Assembly.GetExecutingAssembly();
        var resourceName = assembly.GetManifestResourceNames()
            .Single(name => name.EndsWith(fileName, StringComparison.Ordinal));
        using var stream = assembly.GetManifestResourceStream(resourceName)
            ?? throw new InvalidOperationException($"Missing test resource {fileName}.");
        using var reader = new StreamReader(stream);
        return reader.ReadToEnd();
    }
}
