using System.Collections.Generic;

namespace TempMaster.App.Services;

/// <summary>
/// Maps raw SwitchBot device names to the chemical-plant equipment labels used
/// across the Temp Master dashboards. Mirrors DISPLAY_NAMES in the web frontend.
/// </summary>
public static class DisplayNameMapper
{
    private static readonly IReadOnlyDictionary<string, string> Names = new Dictionary<string, string>
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

    public static string Resolve(string? deviceName)
    {
        if (string.IsNullOrWhiteSpace(deviceName))
        {
            return "(名称未設定)";
        }

        return Names.TryGetValue(deviceName, out var mapped) ? mapped : deviceName;
    }
}
