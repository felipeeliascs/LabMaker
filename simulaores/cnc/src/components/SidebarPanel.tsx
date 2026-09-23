'use client';

import { useEffect, useState } from 'react';
import VibrationChart from '@/components/VibrationChart';
import styles from './Simulator.module.css';
type VibrationStatus = 'normal' | 'warning' | 'danger';
type MachineMode = 'MANUAL' | 'AUTOMATIC' | 'MAINTENANCE';
type LaserMode = 'ON' | 'OFF';

type SidebarTab = 'cnc' | 'ur5';

interface SidebarPanelProps {
  cutPanel?: React.ReactNode;
  axesLocked?: boolean;
  machineOn: boolean;
  mode: MachineMode;
  laserMode: LaserMode;
  positionX: number;
  positionY: number;
  laserPower: number;
  vibrationHistory: number[];
  vibrationStatus: VibrationStatus;
  onTogglePower: () => void;
  onEstop: () => void;
  onDoorOpen: () => void;
  onDoorClose: () => void;
  onResetView: () => void;
  onModeChange: (_mode: MachineMode) => void;
  onLaserModeChange: (_mode: LaserMode) => void;
  onPositionXChange: (_value: number) => void;
  onPositionYChange: (_value: number) => void;
  onLaserPowerChange: (_value: number) => void;
  isOpen?: boolean;
  onClose?: () => void;
  variant?: 'drawer' | 'dock';
  // UR5 robot props
  ur5Joints?: number[];
  ur5GripValue?: number;
  ur5TcpCoords?: { x: number; y: number; z: number };
  onUr5JointChange?: (_index: number, _value: number) => void;
  onUr5GripChange?: (_value: number) => void;
}

const modeLabels = { MANUAL: 'Manual', AUTOMATIC: 'Automático', MAINTENANCE: 'Manutenção' };
const vibrationLabels = { normal: 'Normal', warning: 'Atenção', danger: 'Perigo' };
const decimal = (value: number, digits = 1) => value.toLocaleString('pt-BR', { maximumFractionDigits: digits });

function RangeControl({ label, value, min, max, step = 1, unit = 'mm', displayScale = 1, onChange }: {
  label: string; value: number; min: number; max: number; step?: number; unit?: string;
  displayScale?: number; onChange: (_value: number) => void;
}) {
  return <label className={styles.sliderRow}>
    <span className={styles.row}><span className={styles.muted}>{label}</span><span className={styles.value}>{decimal(value * displayScale)} {unit}</span></span>
    <input className={styles.range} aria-label={label} type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))} />
    <span className={`${styles.row} ${styles.muted}`}><span>{decimal(min * displayScale)}</span><span>{decimal(max * displayScale)}</span></span>
  </label>;
}

export default function SidebarPanel({
  cutPanel, axesLocked = false, machineOn, mode, laserMode, positionX, positionY,
  laserPower, vibrationHistory, vibrationStatus, onTogglePower, onEstop, onDoorOpen,
  onDoorClose, onResetView, onModeChange, onLaserModeChange, onPositionXChange,
  onPositionYChange, onLaserPowerChange, isOpen = true, onClose, variant = 'dock',
  ur5Joints = [0, 0, 0, 0, 0, 0], ur5GripValue = 50, ur5TcpCoords = { x: 0, y: 0, z: 0 },
  onUr5JointChange, onUr5GripChange,
}: SidebarPanelProps) {
  const [activeTab, setActiveTab] = useState<SidebarTab>('cnc');
  const isDrawer = variant === 'drawer';
  useEffect(() => {
    if (!isDrawer || !isOpen) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isDrawer, isOpen, onClose]);
  if (isDrawer && !isOpen) return null;
  return <>
    {isDrawer && <div className={styles.backdrop} onClick={onClose} aria-hidden="true" />}
    <aside aria-label="Painel de controle" className={`${styles.sidebar} ${isDrawer ? styles.drawer : ''}`}>
      <header className={styles.header}>
        <div className={styles.titleRow}>
          <h1><span aria-hidden="true" className={styles.logo}>⬢</span>Simulador CNC laser</h1>
          {isDrawer && <button className={styles.button} onClick={onClose} aria-label="Fechar painel">×</button>}
        </div>
        <p className={styles.subtitle}>CNC + UR5 · Gêmeo digital</p>
        <div className={styles.row} style={{ marginTop: 12 }}>
          <span className={`${styles.status} ${machineOn ? styles.powered : ''}`}>{machineOn ? 'Ligada' : 'Desligada'}</span>
          <span className={styles.muted}>{modeLabels[mode]}</span>
        </div>
      </header>
      <nav aria-label="Equipamento" className={styles.tabs}>
        {(['cnc', 'ur5'] as const).map(tab => <button key={tab} aria-pressed={activeTab === tab} onClick={() => setActiveTab(tab)} className={`${styles.button} ${activeTab === tab ? styles.active : ''}`}>
          {tab === 'cnc' ? 'Máquina CNC' : 'Robô UR5'}
        </button>)}
      </nav>
      <div className={styles.scroll}>
        {activeTab === 'cnc' ? <>
          <section className={styles.section}>
            <button className={`${styles.button} ${styles.danger}`} onClick={onEstop}>■ Parada de emergência</button>
            <label className={styles.row} style={{ marginTop: 14 }}>
              <span>Alimentação da máquina</span>
              <input className={styles.checkbox} type="checkbox" role="switch" aria-label="Ligar máquina" checked={machineOn} onChange={onTogglePower} />
            </label>
          </section>
          {cutPanel}
          <section className={styles.section}>
            <h2>Modo de operação</h2>
            <label className={styles.row}><span className={styles.muted}>Modo</span>
              <select aria-label="Modo de operação" className={styles.select} value={mode} onChange={e => onModeChange(e.target.value as MachineMode)}>
                {Object.entries(modeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
          </section>
          <fieldset disabled={axesLocked} className={styles.section} aria-label="Posição dos eixos">
            <h2>Posição dos eixos</h2>
            <RangeControl label="Eixo X" value={positionX} min={-440} max={550} onChange={onPositionXChange} />
            <RangeControl label="Eixo Y" value={positionY} min={-750} max={0} onChange={onPositionYChange} />
            {axesLocked && <p className={styles.muted} style={{ marginTop: 10 }}>Movimento manual bloqueado durante o trabalho.</p>}
          </fieldset>
          <section className={styles.section}>
            <h2>Laser</h2>
            <RangeControl label="Potência" value={laserPower} min={10} max={60} unit="W" onChange={onLaserPowerChange} />
            <div className={styles.row} style={{ marginTop: 14 }}>
              <span className={styles.muted}>Emissão</span>
              <div className={styles.actions}>
                {(['OFF', 'ON'] as const).map(value => <button key={value} disabled={axesLocked} aria-pressed={laserMode === value} className={`${styles.button} ${laserMode === value ? styles.active : ''}`} onClick={() => onLaserModeChange(value)}>{value === 'ON' ? 'Ligado' : 'Desligado'}</button>)}
              </div>
            </div>
          </section>
          <section className={styles.section}>
            <h2>Monitor de vibração</h2>
            <p className={styles.muted} style={{ marginBottom: 10, color: `var(--sim-${vibrationStatus === 'danger' ? 'bad' : vibrationStatus === 'warning' ? 'warn' : 'ok'})` }}>{vibrationLabels[vibrationStatus]}</p>
            <VibrationChart data={vibrationHistory} status={vibrationStatus} />
          </section>
          <section className={styles.section}>
            <h2>Sistema</h2>
            <div className={styles.actions}>
              <button className={styles.button} onClick={onDoorOpen}>Abrir tampa</button>
              <button className={styles.button} onClick={onDoorClose}>Fechar tampa</button>
              <button className={`${styles.button} ${styles.wide}`} onClick={onResetView}>Restaurar vista</button>
            </div>
          </section>
        </> : <>
          <section className={styles.section}>
            <h2>Controle das juntas</h2>
            {ur5Joints.map((value, index) => <RangeControl key={index} label={`Junta ${index + 1} · rotação`} value={value} min={-Math.PI} max={Math.PI} step={0.01} unit="°" displayScale={180 / Math.PI} onChange={v => onUr5JointChange?.(index, v)} />)}
          </section>
          <section className={styles.section}>
            <h2>Garra</h2>
            <RangeControl label="Abertura RG6" value={ur5GripValue} min={0} max={100} unit="%" onChange={v => onUr5GripChange?.(v)} />
            <p className={styles.muted} style={{ marginTop: 8 }}>0% fechada · 100% aberta</p>
          </section>
          <section className={styles.section}>
            <h2>Posição da ferramenta (TCP)</h2>
            <table className={styles.stats}><tbody>{(['x', 'y', 'z'] as const).map(axis => <tr key={axis}><td>Eixo {axis.toUpperCase()}</td><td>{ur5TcpCoords[axis].toLocaleString('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 })} m</td></tr>)}</tbody></table>
          </section>
          <section className={styles.section}>
            <h2>Sistema</h2>
            <button className={styles.button} style={{ width: '100%' }} onClick={onResetView}>Restaurar vista</button>
          </section>
        </>}
      </div>
      <footer className={styles.footer}><span>Intertravamento de segurança</span><span>v1.0</span></footer>
    </aside>
  </>;
}
