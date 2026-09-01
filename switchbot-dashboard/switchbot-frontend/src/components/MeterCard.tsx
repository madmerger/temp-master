import type { MeterDevice, TimeScale } from '../api/types';
import { getDisplayName } from '../constants';
import type { Theme } from '../hooks/useTheme';
import { useMeterHistory } from '../hooks/useMeterHistory';
import { TemperatureChart } from './TemperatureChart';

interface Props {
  meter: MeterDevice;
  timeScale: TimeScale;
  dataVersion: number;
  theme: Theme;
  stale?: boolean;
}

export function MeterCard({ meter, timeScale, dataVersion, theme, stale = false }: Props) {
  // 未更新メーターは履歴を取得しない
  const history = useMeterHistory(meter.device_id, timeScale, dataVersion, !stale);

  return (
    <div className="panel">
      <div className="panel-heading flex items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <strong className="text-slate-900 dark:text-white">
            {getDisplayName(meter.device_name)}
          </strong>
          {stale && <span className="badge-base bg-amber-500 text-xs">7日以上未更新</span>}
        </div>
        <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] text-slate-600 dark:bg-slate-700 dark:text-slate-300">
          {meter.device_type}
        </span>
      </div>
      <div className="panel-body">
        <div className="mb-3 flex flex-wrap gap-1.5">
          {meter.current_temperature !== null && (
            <span className="badge-base bg-red-600">{meter.current_temperature}&deg;C</span>
          )}
          {meter.current_humidity !== null && (
            <span className="badge-base bg-sky-600">{meter.current_humidity}%</span>
          )}
          {meter.battery !== null && (
            <span className="badge-base bg-green-600">{meter.battery}%</span>
          )}
        </div>

        {stale ? (
          <p className="m-0 text-sm text-amber-700 dark:text-amber-300">履歴データの取得対象外</p>
        ) : (
          <TemperatureChart history={history} timeScale={timeScale} theme={theme} />
        )}

        {meter.last_updated ? (
          <p className="mb-0 mt-2 text-xs text-slate-500 dark:text-slate-400">
            {`Last updated: ${new Date(meter.last_updated).toLocaleString()}`}
          </p>
        ) : (
          stale && (
            <p className="m-0 mt-2 text-sm text-amber-700 dark:text-amber-300">
              値がありません（データ未受信）
            </p>
          )
        )}
      </div>
    </div>
  );
}
