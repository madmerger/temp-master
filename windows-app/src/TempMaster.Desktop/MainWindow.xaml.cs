using System.Diagnostics;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Threading;
using TempMaster.Desktop.Controls;
using TempMaster.Desktop.Models;
using TempMaster.Desktop.Services;

namespace TempMaster.Desktop;

public partial class MainWindow : Window
{
    private const double CardWidth = 360;
    private static readonly TimeSpan AutoRefreshInterval = TimeSpan.FromSeconds(30);

    private readonly TempMasterApiClient _api = new();
    private readonly Dictionary<string, MeterCard> _cards = new();
    private readonly DispatcherTimer _autoRefresh;
    private string _timeScale = "day";
    private bool _loading;

    public MainWindow()
    {
        InitializeComponent();

        SourceText.Text = "Source: " + _api.BaseUrl;

        _autoRefresh = new DispatcherTimer { Interval = AutoRefreshInterval };
        _autoRefresh.Tick += async (_, _) => await LoadDataAsync();

        Loaded += async (_, _) =>
        {
            await LoadDataAsync();
            _autoRefresh.Start();
        };

        InputBindings.Add(new KeyBinding(new RelayCommand(async () => await LoadDataAsync()), Key.F5, ModifierKeys.None));
    }

    private async Task LoadDataAsync()
    {
        if (_loading)
            return;
        _loading = true;
        try
        {
            var metersTask = _api.GetMetersAsync();
            var statusTask = _api.GetStatusAsync();
            await Task.WhenAll(metersTask, statusTask);

            var meters = metersTask.Result.Meters;
            var status = statusTask.Result;

            SetConnected(true);
            UpdateStatusHeader(status);
            RenderMeters(meters);
            await LoadHistoriesAsync(meters);

            LoadingText.Visibility = Visibility.Collapsed;
        }
        catch (Exception ex)
        {
            SetConnected(false);
            ShowBanner("Failed to fetch data: " + ex.Message, isError: true);
            LoadingText.Visibility = Visibility.Collapsed;
        }
        finally
        {
            _loading = false;
        }
    }

    private void RenderMeters(IReadOnlyList<MeterDevice> meters)
    {
        var seen = new HashSet<string>();
        foreach (var meter in meters)
        {
            seen.Add(meter.DeviceId);
            if (!_cards.TryGetValue(meter.DeviceId, out var card))
            {
                card = new MeterCard { Width = CardWidth };
                _cards[meter.DeviceId] = card;
                MetersItems.Items.Add(card);
            }
            card.Bind(meter);
        }

        // Remove cards for devices no longer present.
        foreach (var stale in _cards.Keys.Where(id => !seen.Contains(id)).ToList())
        {
            MetersItems.Items.Remove(_cards[stale]);
            _cards.Remove(stale);
        }
    }

    private async Task LoadHistoriesAsync(IReadOnlyList<MeterDevice> meters)
    {
        var timeScale = _timeScale;
        foreach (var meter in meters)
        {
            try
            {
                var history = await _api.GetHistoryAsync(meter.DeviceId, timeScale);
                if (_cards.TryGetValue(meter.DeviceId, out var card))
                    card.SetHistory(history.History, timeScale);
            }
            catch
            {
                // A single device's history failing should not break the dashboard.
            }
        }
    }

    private void UpdateStatusHeader(StatusResponse status)
    {
        var count = status.MetersCount;
        MetersCountText.Text = $"Monitoring {count} {(count == 1 ? "meter" : "meters")}";

        if (status.IsRateLimited)
            ShowBanner($"Rate limited. SwitchBot API rate limit reached. Retry in {status.BackoffRemaining} seconds.", isError: false);
        else
            HideBanner();
    }

    private void SetConnected(bool connected)
    {
        StatusText.Text = connected ? "Connected" : "Disconnected";
        StatusBadge.Background = connected
            ? (Brush)FindResource("SuccessBrush")
            : (Brush)FindResource("DangerBrush");
    }

    private void ShowBanner(string message, bool isError)
    {
        BannerText.Text = message;
        BannerBorder.Background = isError
            ? new SolidColorBrush(Color.FromRgb(0xF2, 0xDE, 0xDE))
            : new SolidColorBrush(Color.FromRgb(0xFC, 0xF8, 0xE3));
        BannerBorder.BorderBrush = isError
            ? new SolidColorBrush(Color.FromRgb(0xEB, 0xCC, 0xD1))
            : new SolidColorBrush(Color.FromRgb(0xFA, 0xEB, 0xCC));
        BannerText.Foreground = isError
            ? new SolidColorBrush(Color.FromRgb(0xA9, 0x44, 0x42))
            : new SolidColorBrush(Color.FromRgb(0x8A, 0x6D, 0x3B));
        BannerBorder.Visibility = Visibility.Visible;
    }

    private void HideBanner() => BannerBorder.Visibility = Visibility.Collapsed;

    // ----- Event handlers -----

    private async void OnRefreshClick(object sender, RoutedEventArgs e)
    {
        RefreshButton.IsEnabled = false;
        var original = ((TextBlock)((StackPanel)RefreshButton.Content).Children[1]).Text;
        ((TextBlock)((StackPanel)RefreshButton.Content).Children[1]).Text = "Refreshing...";
        try
        {
            await _api.RefreshAsync();
        }
        catch (Exception ex)
        {
            ShowBanner("Failed to refresh: " + ex.Message, isError: true);
        }
        finally
        {
            await LoadDataAsync();
            ((TextBlock)((StackPanel)RefreshButton.Content).Children[1]).Text = original;
            RefreshButton.IsEnabled = true;
        }
    }

    private void OnBackupClick(object sender, RoutedEventArgs e)
    {
        try
        {
            Process.Start(new ProcessStartInfo(_api.BackupUri.ToString()) { UseShellExecute = true });
        }
        catch (Exception ex)
        {
            ShowBanner("Failed to open backup: " + ex.Message, isError: true);
        }
    }

    private void OnTimeScaleChanged(object sender, SelectionChangedEventArgs e)
    {
        if (TimeScaleCombo.SelectedItem is ComboBoxItem { Tag: string tag })
        {
            _timeScale = tag;
            if (IsLoaded)
                _ = LoadHistoriesAsync(_cards.Keys.Select(id => new MeterDevice { DeviceId = id }).ToList());
        }
    }

    private void OnExitClick(object sender, RoutedEventArgs e) => Close();

    private void OnAboutClick(object sender, RoutedEventArgs e)
        => MessageBox.Show(
            this,
            "Temp Master Dashboard\nWindows Native Edition (WPF / .NET)\n\n" +
            "Monitors SwitchBot environmental sensors\n(temperature, humidity, battery).\n\n" +
            "Source: " + _api.BaseUrl,
            "About Temp Master",
            MessageBoxButton.OK,
            MessageBoxImage.Information);

    protected override void OnClosed(EventArgs e)
    {
        _autoRefresh.Stop();
        _api.Dispose();
        base.OnClosed(e);
    }
}

/// <summary>Minimal ICommand used for key bindings.</summary>
internal sealed class RelayCommand : ICommand
{
    private readonly Action _execute;
    public RelayCommand(Action execute) => _execute = execute;
    public event EventHandler? CanExecuteChanged
    {
        add => CommandManager.RequerySuggested += value;
        remove => CommandManager.RequerySuggested -= value;
    }
    public bool CanExecute(object? parameter) => true;
    public void Execute(object? parameter) => _execute();
}
