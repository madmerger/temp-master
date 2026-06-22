// ============================================================
// Global variables
// ============================================================

// When served from the FastAPI backend (same origin), API_URL stays empty.
// When opened directly as a file:// URL, fall back to the production backend.
var API_URL = (window.location.protocol === 'file:') ? 'https://temp-master.fly.dev' : '';

var REFRESH_INTERVAL = 30000;
var currentTimeScale = 'day';
var metersData = [];
var statusData = null;
var charts = {}; // device_id -> Chart instance map

var DISPLAY_NAMES = {
  'Bedroom Meter': '第1蒸留塔 (T-101)',
  'Living Meter': '第2蒸留塔 (T-102)',
  '2世': '反応器 (R-201)',
  '夢男': '熱交換器 (E-301)',
  '夢': '熱交換器 (E-302)',
  'アワコ': '冷却塔 (CT-401)',
  'ジャガ百万石': '加熱炉 (H-501)',
  'ネズミ': 'コンプレッサー (C-601)',
  'バロン': '遠心分離機 (S-701)',
  'ゴンタ': '混合槽 (M-801)',
  '蛇棚': '貯蔵タンク (TK-901)',
  '中華棚': '貯蔵タンク (TK-902)',
  'へておケージ': '配管ライン (PL-1001)',
  '外': '屋外モニター (EM-1101)',
  'インキュベーター': '乾燥機 (D-1201)',
  'ビアク': '吸収塔 (A-1301)',
  'ブロッチ Hot Spot': 'フレアスタック (FS-1401)',
  'マダラアオジタ': 'ボイラー (B-1501)'
};

function getDisplayName(deviceName) {
  return DISPLAY_NAMES[deviceName] || deviceName;
}

// ============================================================
// Utility functions
// ============================================================

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function pad2(n) {
  return n < 10 ? '0' + n : '' + n;
}

// Ported from src/components/Chart.tsx (lines 33-49)
function formatTimestamp(timestamp, timeScale) {
  var date = new Date(timestamp);
  var hours = pad2(date.getHours());
  var minutes = pad2(date.getMinutes());
  var dayShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
  var monthShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][date.getMonth()];
  var dayNum = date.getDate();

  switch (timeScale) {
    case 'hour':
      return hours + ':' + minutes;
    case 'day':
      return hours + ':' + minutes;
    case 'week':
      return dayShort + ' ' + hours;
    case 'month':
      return monthShort + ' ' + dayNum;
    case 'year':
      return monthShort + ' ' + dayNum;
    default:
      return date.toLocaleString();
  }
}

// ============================================================
// API calls (jQuery $.ajax)
// ============================================================

function fetchMeters(onSuccess, onError) {
  $.ajax({
    url: API_URL + '/api/meters',
    type: 'GET',
    dataType: 'json',
    success: function(data) {
      if (onSuccess) onSuccess(data);
    },
    error: function(xhr, status, err) {
      if (onError) onError(err || status);
    }
  });
}

function fetchStatus(onSuccess, onError) {
  $.ajax({
    url: API_URL + '/api/status',
    type: 'GET',
    dataType: 'json',
    success: function(data) {
      if (onSuccess) onSuccess(data);
    },
    error: function(xhr, status, err) {
      if (onError) onError(err || status);
    }
  });
}

function fetchHistory(deviceId, timeScale, callback) {
  $.ajax({
    url: API_URL + '/api/meters/' + encodeURIComponent(deviceId) + '/history',
    type: 'GET',
    data: { time_scale: timeScale },
    dataType: 'json',
    success: function(data) {
      callback(null, data);
    },
    error: function(xhr, status, err) {
      callback(err || status, null);
    }
  });
}

function triggerRefresh(callback) {
  $.ajax({
    url: API_URL + '/api/meters/refresh',
    type: 'POST',
    success: function(data) {
      if (callback) callback(null, data);
    },
    error: function(xhr, status, err) {
      if (callback) callback(err || status, null);
    }
  });
}

// ============================================================
// Top-level data load (nested callbacks, no Promise.all)
// ============================================================

function fetchData() {
  fetchMeters(function(metersResp) {
    fetchStatus(function(statusResp) {
      metersData = (metersResp && metersResp.meters) ? metersResp.meters : [];
      statusData = statusResp;

      $('#loading').hide();
      $('#error').hide();
      $('#connection-status').removeClass('label-danger').addClass('label-success').text('Connected');

      updateStatusBar();
      renderMeters();
      renderCharts();
    }, function(err) {
      showError('Failed to fetch status: ' + err);
    });
  }, function(err) {
    showError('Failed to fetch meters: ' + err);
  });
}

function showError(msg) {
  $('#loading').hide();
  $('#error-text').text(msg);
  $('#error').show();
  $('#connection-status').removeClass('label-success').addClass('label-danger').text('Disconnected');
}

// ============================================================
// Status bar / rate limit
// ============================================================

function updateStatusBar() {
  if (!statusData) {
    $('#status-bar').hide();
    return;
  }

  var count = statusData.meters_count || 0;
  var noun = count === 1 ? 'meter' : 'meters';
  $('#status-meters-count').text('Monitoring ' + count + ' ' + noun);

  var now = new Date();
  var refreshText = 'Last refresh: ' + pad2(now.getHours()) + ':' + pad2(now.getMinutes()) + ':' + pad2(now.getSeconds());
  $('#status-last-refresh').text(refreshText);
  $('#status-bar').show();

  if (statusData.is_rate_limited) {
    var remaining = statusData.backoff_remaining || 0;
    $('#rate-limit-text').text('SwitchBot API rate limit reached. Retry in ' + remaining + ' seconds.');
    $('#rate-limit-warning').show();
  } else {
    $('#rate-limit-warning').hide();
  }
}

// ============================================================
// Rendering
// ============================================================

function renderMeters() {
  renderDefaultView();
}

function renderDefaultView() {
  var html = '<div class="row">';
  for (var i = 0; i < metersData.length; i++) {
    html += '<div class="col-md-4 col-sm-6">' + createMeterPanel(metersData[i]) + '</div>';
  }
  html += '</div>';
  $('#meters-container').html(html);
}

function createMeterPanel(meter) {
  var deviceId = escapeHtml(meter.device_id);
  var deviceName = escapeHtml(getDisplayName(meter.device_name));
  var deviceType = escapeHtml(meter.device_type);

  var html = '';
  html += '<div class="panel panel-default">';
  html += '  <div class="panel-heading">';
  html += '    <div class="meter-panel-header">';
  html += '      <strong>' + deviceName + '</strong>';
  html += '      <span class="device-type-tag">' + deviceType + '</span>';
  html += '    </div>';
  html += '  </div>';
  html += '  <div class="panel-body">';
  html += '    <div class="meter-stats">';

  if (meter.current_temperature !== null && meter.current_temperature !== undefined) {
    html += '<span class="label label-danger">' + escapeHtml(meter.current_temperature) + '\u00b0C</span>';
  }
  if (meter.current_humidity !== null && meter.current_humidity !== undefined) {
    html += '<span class="label label-info">' + escapeHtml(meter.current_humidity) + '%</span>';
  }
  if (meter.battery !== null && meter.battery !== undefined) {
    html += '<span class="label label-success">' + escapeHtml(meter.battery) + '%</span>';
  }

  html += '    </div>';
  html += '    <div class="meter-chart-wrap">';
  html += '      <canvas id="chart-' + deviceId + '"></canvas>';
  html += '    </div>';

  if (meter.last_updated) {
    var d = new Date(meter.last_updated);
    var lastUpdatedStr = d.toLocaleString();
    html += '    <p class="meter-last-updated">Last updated: ' + escapeHtml(lastUpdatedStr) + '</p>';
  }

  html += '  </div>';
  html += '</div>';
  return html;
}

// ============================================================
// Chart rendering (Chart.js v2 API)
// ============================================================

function renderCharts() {
  for (var i = 0; i < metersData.length; i++) {
    (function(meter) {
      fetchHistory(meter.device_id, currentTimeScale, function(err, data) {
        if (err) {
          return;
        }
        var history = (data && data.history) ? data.history : [];
        renderSingleChart(meter.device_id, history);
      });
    })(metersData[i]);
  }
}

function renderSingleChart(deviceId, history) {
  var canvas = document.getElementById('chart-' + deviceId);
  if (!canvas) return;
  var ctx = canvas.getContext('2d');

  var labels = [];
  var temperatures = [];
  for (var i = 0; i < history.length; i++) {
    labels.push(formatTimestamp(history[i].timestamp, currentTimeScale));
    temperatures.push(history[i].temperature);
  }

  // Destroy existing chart instance before re-creating
  if (charts[deviceId]) {
    charts[deviceId].destroy();
    delete charts[deviceId];
  }

  charts[deviceId] = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Temperature (C)',
        data: temperatures,
        borderColor: '#d9534f',
        backgroundColor: 'rgba(217, 83, 79, 0.15)',
        borderWidth: 2,
        pointRadius: 3,
        pointBackgroundColor: '#d9534f',
        pointBorderColor: '#d9534f',
        pointHoverRadius: 5,
        pointHoverBackgroundColor: '#5bc0de',
        fill: true,
        lineTension: 0.4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      legend: {
        display: false
      },
      tooltips: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: function(tooltipItem) {
            var v = tooltipItem.yLabel;
            if (v === null || v === undefined) return '';
            return v.toFixed(1) + '\u00b0C';
          }
        }
      },
      scales: {
        xAxes: [{
          display: true,
          gridLines: {
            display: true,
            color: 'rgba(0, 0, 0, 0.05)'
          },
          ticks: {
            maxTicksLimit: 8,
            fontSize: 10,
            fontColor: '#777'
          }
        }],
        yAxes: [{
          display: true,
          gridLines: {
            display: true,
            color: 'rgba(0, 0, 0, 0.05)'
          },
          ticks: {
            fontSize: 10,
            fontColor: '#777',
            callback: function(value) {
              return value + '\u00b0';
            }
          }
        }]
      }
    }
  });
}

function destroyAllCharts() {
  for (var key in charts) {
    if (charts.hasOwnProperty(key) && charts[key]) {
      charts[key].destroy();
    }
  }
  charts = {};
}

// ============================================================
// Init
// ============================================================

$(document).ready(function() {
  fetchData();
  setInterval(fetchData, REFRESH_INTERVAL);

  $('#time-scale-select').change(function() {
    currentTimeScale = $(this).val();
    destroyAllCharts();
    renderCharts();
  });

  $('#btn-refresh').click(function() {
    var $btn = $(this);
    $btn.prop('disabled', true).text('Refreshing...');
    triggerRefresh(function(err) {
      if (err) {
        showError('Failed to refresh: ' + err);
      }
      fetchData();
      $btn.prop('disabled', false).text('Refresh Data');
    });
  });

  $('#btn-backup').click(function() {
    window.open(API_URL + '/api/backup', '_blank');
  });
});
