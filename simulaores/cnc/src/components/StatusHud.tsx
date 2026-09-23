'use client';

import styles from './Simulator.module.css';

type VibrationStatus = 'normal' | 'warning' | 'danger';
interface StatusHudProps {
  vibration: number;
  vibrationStatus: VibrationStatus;
  laserActive: boolean;
  doorOpen: boolean;
  temperature: number;
}

export default function StatusHud({ vibration, vibrationStatus, laserActive, doorOpen, temperature }: StatusHudProps) {
  const color = `var(--sim-${vibrationStatus === 'danger' ? 'bad' : vibrationStatus === 'warning' ? 'warn' : 'ok'})`;
  const decimal = (value: number) => value.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  return <details className={styles.hud} open>
    <summary>Telemetria da máquina</summary>
    <table className={styles.stats}><tbody>
      <tr><td>Vibração</td><td style={{ color }}>{decimal(vibration)} Hz</td></tr>
      <tr><td>Laser</td><td style={{ color: laserActive ? 'var(--sim-accent)' : undefined }}>{laserActive ? 'Ligado' : 'Desligado'}</td></tr>
      <tr><td>Tampa</td><td style={{ color: doorOpen ? 'var(--sim-warn)' : undefined }}>{doorOpen ? 'Aberta' : 'Fechada'}</td></tr>
      <tr><td>Temperatura</td><td>{decimal(temperature)} °C</td></tr>
      <tr><td>Montagem</td><td style={{ color: 'var(--sim-ok)' }}>OK</td></tr>
    </tbody></table>
  </details>;
}
