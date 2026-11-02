using System.ComponentModel;
using LiveChartsCore.SkiaSharpView.WinUI;
using Microsoft.UI.Dispatching;
using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;
using Microsoft.UI.Xaml.Media;
using SwitchBotDashboard.App.Converters;
using SwitchBotDashboard.Core;

namespace SwitchBotDashboard.App;

public sealed partial class MainWindow : Window
{
    private readonly ThemeService _themeService = new();
    private readonly HashSet<MeterCardViewModel> _observedCards = [];
    private bool _updatingThemeToggle;

    public MainWindow(DashboardViewModel viewModel)
    {
        ViewModel = viewModel;
        InitializeComponent();
        RootGrid.DataContext = ViewModel;

        _themeService.ThemeChanged += OnThemeChanged;
        _themeService.Apply(RootGrid, DispatcherQueue.GetForCurrentThread()!);
        ThemeToggle.IsOn = _themeService.EffectiveTheme == "Dark";
        CurrentTheme.Text = _themeService.EffectiveTheme;

        ThemeToggle.Toggled += OnThemeToggleChanged;
        TimeRangeSelector.SelectionChanged += OnTimeRangeChanged;
        ActiveMetersRepeater.ElementPrepared += (_, _) => UpdateChartTheme();
        Activated += OnWindowActivated;
        Closed += OnWindowClosed;
        RootGrid.Loaded += OnWindowLoaded;
    }

    public DashboardViewModel ViewModel { get; }

    private async void OnRefreshClicked(object sender, RoutedEventArgs args)
    {
        await ViewModel.RefreshCommand.ExecuteAsync(null);
    }

    private void OnThemeToggleChanged(object sender, RoutedEventArgs args)
    {
        if (!_updatingThemeToggle)
        {
            _themeService.SetExplicitTheme(ThemeToggle.IsOn);
        }
    }

    private void OnTimeRangeChanged(object sender, SelectionChangedEventArgs args)
    {
        if (TimeRangeSelector.SelectedItem is ComboBoxItem { Tag: string value }
            && Enum.TryParse<TimeScale>(value, out var timeScale))
        {
            ViewModel.SelectedTimeScale = timeScale;
        }
    }

    private void OnThemeChanged(object? sender, EventArgs args)
    {
        CurrentTheme.Text = _themeService.EffectiveTheme;
        _updatingThemeToggle = true;
        ThemeToggle.IsOn = _themeService.EffectiveTheme == "Dark";
        _updatingThemeToggle = false;
        UpdateChartTheme();
    }

    private void OnWindowActivated(object sender, WindowActivatedEventArgs args)
    {
        ViewModel.StartPolling();
    }

    private void OnWindowLoaded(object sender, RoutedEventArgs args)
    {
        TimeRangeSelector.SelectedIndex = (int)ViewModel.SelectedTimeScale;
        UpdateChartTheme();
    }

    private void OnWindowClosed(object sender, WindowEventArgs args)
    {
        ViewModel.StopPolling();
        foreach (var meter in _observedCards)
        {
            meter.PropertyChanged -= OnMeterCardPropertyChanged;
        }

        _observedCards.Clear();
        _themeService.ThemeChanged -= OnThemeChanged;
        _themeService.Dispose();
    }

    private void UpdateChartTheme()
    {
        var count = ActiveMetersRepeater.ItemsSourceView?.Count ?? 0;
        if (count == 0)
        {
            return;
        }

        var isDark = _themeService.EffectiveTheme == "Dark";
        var activeMeters = ViewModel.ActiveMeters.ToHashSet();
        foreach (var oldMeter in _observedCards.Where(meter => !activeMeters.Contains(meter)).ToArray())
        {
            oldMeter.PropertyChanged -= OnMeterCardPropertyChanged;
            _observedCards.Remove(oldMeter);
        }

        foreach (var meter in activeMeters)
        {
            if (_observedCards.Add(meter))
            {
                meter.PropertyChanged += OnMeterCardPropertyChanged;
            }
        }

        for (var index = 0; index < count; index++)
        {
            if (ActiveMetersRepeater.TryGetElement(index) is not FrameworkElement element
                || element.DataContext is not MeterCardViewModel meter)
            {
                continue;
            }

            var chart = FindDescendant<CartesianChart>(element);
            if (chart is null)
            {
                continue;
            }

            if (ViewModel.UseMockData)
            {
                chart.AnimationsSpeed = TimeSpan.Zero;
                chart.EasingFunction = null;
            }

            chart.Series = ChartSeriesConverter.Create(meter.Points, isDark);
            chart.XAxes = ChartAxesConverter.CreateXAxes(meter.Labels, isDark);
            chart.YAxes = ChartAxesConverter.CreateYAxes(isDark);
        }
    }

    private void OnMeterCardPropertyChanged(object? sender, PropertyChangedEventArgs args)
    {
        if (args.PropertyName is nameof(MeterCardViewModel.Points) or nameof(MeterCardViewModel.Labels))
        {
            UpdateChartTheme();
        }
    }

    private static T? FindDescendant<T>(DependencyObject root) where T : DependencyObject
    {
        var childCount = VisualTreeHelper.GetChildrenCount(root);
        for (var index = 0; index < childCount; index++)
        {
            var child = VisualTreeHelper.GetChild(root, index);
            if (child is T match)
            {
                return match;
            }

            var descendant = FindDescendant<T>(child);
            if (descendant is not null)
            {
                return descendant;
            }
        }

        return null;
    }
}
