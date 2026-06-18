using TempMaster.App.Services;

namespace TempMaster.Tests;

public class DisplayNameMapperTests
{
    [Theory]
    [InlineData("Bedroom Meter", "第1蒸留塔 (T-101)")]
    [InlineData("マダラアオジタ", "ボイラー (B-1501)")]
    [InlineData("蛇棚", "貯蔵タンク (TK-901)")]
    public void Resolve_MapsKnownNames(string raw, string expected)
    {
        Assert.Equal(expected, DisplayNameMapper.Resolve(raw));
    }

    [Fact]
    public void Resolve_ReturnsRawWhenUnknown()
    {
        Assert.Equal("Unknown Device", DisplayNameMapper.Resolve("Unknown Device"));
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void Resolve_HandlesEmpty(string? raw)
    {
        Assert.Equal("(名称未設定)", DisplayNameMapper.Resolve(raw));
    }
}
