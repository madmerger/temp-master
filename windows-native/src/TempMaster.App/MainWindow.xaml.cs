using System;
using System.Windows;
using System.Windows.Threading;
using TempMaster.App.Services;
using TempMaster.App.ViewModels;

namespace TempMaster.App;

/// <summary>
/// Interaction logic for MainWindow.xaml
/// </summary>
public partial class MainWindow : Window
{
    private readonly AppSettings _settings;
    private readonly MainViewModel _viewModel;
    private readonly DispatcherTimer _timer;

    public MainWindow()
    {
        InitializeComponent();

        _settings = AppSettings.Load();
        _viewModel = new MainViewModel(_settings);
        DataContext = _viewModel;

        _timer = new DispatcherTimer
        {
            Interval = TimeSpan.FromSeconds(_settings.EffectiveRefreshSeconds),
        };
        _timer.Tick += OnTimerTick;

        Loaded += OnLoaded;
        Closed += OnClosed;
    }

    private async void OnLoaded(object sender, RoutedEventArgs e)
    {
        await _viewModel.LoadAsync(triggerBackendRefresh: false);
        _timer.Start();
    }

    private async void OnTimerTick(object? sender, EventArgs e)
    {
        _timer.Interval = TimeSpan.FromSeconds(_settings.EffectiveRefreshSeconds);
        await _viewModel.LoadAsync(triggerBackendRefresh: false);
    }

    private void OnClosed(object? sender, EventArgs e)
    {
        _timer.Stop();
        _timer.Tick -= OnTimerTick;
    }
}
