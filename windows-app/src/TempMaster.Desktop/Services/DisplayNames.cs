namespace TempMaster.Desktop.Services;

/// <summary>
/// Maps raw SwitchBot device names to chemical-plant style display names.
/// Mirrors the DISPLAY_NAMES table in the legacy web frontend.
/// </summary>
public static class DisplayNames
{
    private static readonly Dictionary<string, string> Map = new()
    {
        ["Bedroom Meter"] = "第1蒸留塔 (T-101)",
        ["Living Meter"] = "第2蒸留塔 (T-102)",
        ["2世"] = "反応器 (R-201)",
        ["夢男"] = "熱交換器 (E-301)",
        ["夢"] = "熱交換器 (E-302)",
        ["アワコ"] = "冷却塔 (CT-401)",
        ["ジャガ百万石"] = "加熱炉 (H-501)",
        ["ネズミ"] = "コンプレッサー (C-601)",
        ["バロン"] = "遠心分離機 (S-701)",
        ["ゴンタ"] = "混合槽 (M-801)",
        ["蛇棚"] = "貯蔵タンク (TK-901)",
        ["中華棚"] = "貯蔵タンク (TK-902)",
        ["へておケージ"] = "配管ライン (PL-1001)",
        ["外"] = "屋外モニター (EM-1101)",
        ["インキュベーター"] = "乾燥機 (D-1201)",
        ["ビアク"] = "吸収塔 (A-1301)",
        ["ブロッチ Hot Spot"] = "フレアスタック (FS-1401)",
        ["マダラアオジタ"] = "ボイラー (B-1501)",
    };

    public static string Resolve(string deviceName)
        => Map.TryGetValue(deviceName, out var display) ? display : deviceName;
}
