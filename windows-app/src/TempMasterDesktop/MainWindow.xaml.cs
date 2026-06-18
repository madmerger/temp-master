using System.Windows;
using System.Windows.Controls;
using System.Windows.Media;
using OxyPlot;
using OxyPlot.Axes;
using OxyPlot.Series;
using OxyPlot.Wpf;
using TempMasterDesktop.ViewModels;

namespace TempMasterDesktop;

public partial class MainWindow : Window
{
    private readonly MainViewModel _viewModel;

    public MainWindow()
    {
        InitializeComponent();
        _viewModel = new MainViewModel();
        DataContext = _viewModel;

        InitializeControls();
        _viewModel.PropertyChanged += ViewModel_PropertyChanged;
    }

    private void InitializeControls()
    {
        TimeScaleCombo.ItemsSource = _viewModel.TimeScaleOptions;
        TimeScaleCombo.SelectedIndex = 1; // "Last 24 Hours"

        MetersPanel.ItemsSource = _viewModel.Meters;
    }

    private void ViewModel_PropertyChanged(object? sender, System.ComponentModel.PropertyChangedEventArgs e)
    {
        Dispatcher.Invoke(() =>
        {
            switch (e.PropertyName)
            {
                case nameof(MainViewModel.IsConnected):
                    UpdateConnectionStatus();
                    break;
                case nameof(MainViewModel.ConnectionStatus):
                    StatusText.Text = _viewModel.ConnectionStatus;
                    break;
                case nameof(MainViewModel.MetersCount):
                    MetersCountText.Text = $"{_viewModel.MetersCount} meters";
                    break;
                case nameof(MainViewModel.LastRefreshTime):
                    LastRefreshText.Text = $"Last refresh: {_viewModel.LastRefreshTime}";
                    break;
                case nameof(MainViewModel.IsRateLimited):
                    RateLimitBanner.Visibility = _viewModel.IsRateLimited
                        ? Visibility.Visible : Visibility.Collapsed;
                    break;
                case nameof(MainViewModel.IsRefreshing):
                    RefreshButton.IsEnabled = !_viewModel.IsRefreshing;
                    RefreshButton.Content = _viewModel.IsRefreshing ? "Refreshing..." : "\U0001f504 Refresh Data";
                    break;
            }
        });
    }

    private void UpdateConnectionStatus()
    {
        if (_viewModel.IsConnected)
        {
            StatusBadge.Background = (SolidColorBrush)FindResource("SuccessBrush");
            StatusText.Text = "Connected";
        }
        else
        {
            StatusBadge.Background = (SolidColorBrush)FindResource("DangerBrush");
            StatusText.Text = _viewModel.ConnectionStatus;
        }
    }

    private void TimeScaleCombo_SelectionChanged(object sender, SelectionChangedEventArgs e)
    {
        if (TimeScaleCombo.SelectedItem is TimeScaleOption option)
        {
            _viewModel.SelectedTimeScale = option.Value;
        }
    }

    private async void RefreshButton_Click(object sender, RoutedEventArgs e)
    {
        await _viewModel.RefreshAsync();
    }

    private void PlotView_Loaded(object sender, RoutedEventArgs e)
    {
        if (sender is PlotView plotView && plotView.DataContext is MeterViewModel meter)
        {
            meter.PropertyChanged += (s, args) =>
            {
                if (args.PropertyName == nameof(MeterViewModel.History))
                {
                    Dispatcher.Invoke(() => UpdateChart(plotView, meter));
                }
            };
            UpdateChart(plotView, meter);
        }
    }

    private void UpdateChart(PlotView plotView, MeterViewModel meter)
    {
        var model = new PlotModel
        {
            Background = OxyColors.Transparent,
            PlotAreaBorderColor = OxyColor.FromArgb(40, 255, 255, 255),
            TextColor = OxyColor.FromRgb(148, 163, 184),
        };

        var dateAxis = new DateTimeAxis
        {
            Position = AxisPosition.Bottom,
            StringFormat = GetTimeFormat(_viewModel.SelectedTimeScale),
            TicklineColor = OxyColor.FromArgb(30, 255, 255, 255),
            MajorGridlineStyle = LineStyle.Dot,
            MajorGridlineColor = OxyColor.FromArgb(20, 255, 255, 255),
            TextColor = OxyColor.FromRgb(148, 163, 184),
            FontSize = 10,
        };

        var valueAxis = new LinearAxis
        {
            Position = AxisPosition.Left,
            StringFormat = "0.0°",
            TicklineColor = OxyColor.FromArgb(30, 255, 255, 255),
            MajorGridlineStyle = LineStyle.Dot,
            MajorGridlineColor = OxyColor.FromArgb(20, 255, 255, 255),
            TextColor = OxyColor.FromRgb(148, 163, 184),
            FontSize = 10,
        };

        model.Axes.Add(dateAxis);
        model.Axes.Add(valueAxis);

        var series = new LineSeries
        {
            Color = OxyColor.FromRgb(239, 68, 68),
            StrokeThickness = 2,
            MarkerSize = 3,
            MarkerType = MarkerType.Circle,
            MarkerFill = OxyColor.FromRgb(239, 68, 68),
            InterpolationAlgorithm = InterpolationAlgorithms.CanonicalSpline,
        };

        foreach (var reading in meter.History)
        {
            if (DateTime.TryParse(reading.Timestamp, out var dt))
            {
                series.Points.Add(new DataPoint(DateTimeAxis.ToDouble(dt), reading.Temperature));
            }
        }

        // Add area fill
        var areaSeries = new AreaSeries
        {
            Color = OxyColor.FromRgb(239, 68, 68),
            Fill = OxyColor.FromArgb(40, 239, 68, 68),
            StrokeThickness = 2,
        };

        foreach (var reading in meter.History)
        {
            if (DateTime.TryParse(reading.Timestamp, out var dt))
            {
                areaSeries.Points.Add(new DataPoint(DateTimeAxis.ToDouble(dt), reading.Temperature));
            }
        }

        model.Series.Add(areaSeries);
        plotView.Model = model;
    }

    private static string GetTimeFormat(string timeScale) => timeScale switch
    {
        "hour" => "HH:mm",
        "day" => "HH:mm",
        "week" => "MM/dd",
        "month" => "MM/dd",
        "year" => "yyyy/MM",
        _ => "HH:mm"
    };

    protected override void OnClosed(EventArgs e)
    {
        _viewModel.Dispose();
        base.OnClosed(e);
    }
}
