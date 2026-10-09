'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { MachineState } from '@/lib/machine/machineState';
import { BED, parseCutFile } from '@/lib/machine/cutProgram';
import styles from './CutPanel.module.css';
import theme from './Simulator.module.css';

const demo = `G21 G90
M5
G0 X0 Y0
M3 S800
G1 X160 Y0 F2400
G1 X160 Y100
G1 X0 Y100
G1 X0 Y0
M5
G0 X55 Y50
M3
G2 X105 Y50 I25 J0
G2 X55 Y50 I-25 J0
M5
M2`;
const names = { empty: 'Aguardando arquivo', ready: 'Pronto para cortar', running: 'Cortando', paused: 'Pausado', completed: 'Concluído' };
const buttonClass = theme.button;

export default function CutPanel({ machine, ready }: { machine: MachineState; ready: boolean }) {
  const [, refresh] = useState(0);
  const [error, setError] = useState('');
  const [reading, setReading] = useState(false);
  const request = useRef(0);
  useEffect(() => {
    let snapshot = "";
    const timer = setInterval(() => {
      if (document.hidden) return;
      const cut = machine.cutting;
      const next = [cut.status, Math.round(cut.elapsed * 5), cut.message, machine.en_marche].join("|");
      if (next !== snapshot) { snapshot = next; refresh(n => n + 1); }
    }, 200);
    return () => { clearInterval(timer); };
  }, [machine]);
  const cut = machine.cutting;
  const program = cut.program;
  const running = cut.status === 'running';
  const load = (text: string, name: string) => {
    machine.loadCutProgram(parseCutFile(text, name));
    setError(''); refresh(n => n + 1); window.dispatchEvent(new Event('cnc:invalidate'));
  };
  const readFile = async (file: File) => {
    const id = ++request.current;
    setReading(true); setError('');
    try {
      if (file.size > 2 * 1024 * 1024) throw new Error('Limite de 2 MB por arquivo.');
      const text = await file.text();
      if (id === request.current && machine.cutting.status !== 'running') load(text, file.name);
    } catch (e) {
      if (id === request.current) setError(e instanceof Error ? e.message : 'Não foi possível ler o arquivo.');
    } finally { if (id === request.current) setReading(false); }
  };
  const path = useMemo(() => program?.segments.filter(s => s.cutting)
    .map(s => `M${s.from.x},${s.from.y}L${s.to.x},${s.to.y}`).join(' '), [program]);

  return <section aria-label="Corte de desenhos" className={styles.panel}>
    <div className="flex items-center justify-between gap-2">
      <h2 className={styles.heading}>Corte de desenhos</h2>
      <span className={styles.status} role="status">{names[cut.status]}</span>
    </div>
    <p className={theme.muted}>MDF {BED.width} × {BED.height} × {BED.thickness} mm. Importe SVG ou G-code para simular o corte.</p>
    <label className="block text-xs font-semibold">
      Arquivo de corte
      <input aria-label="Arquivo de corte" type="file" accept=".svg,.gcode,.nc,.gc,.tap" disabled={!ready || running || reading}
        className="mt-1 block w-full text-xs file:mr-2 file:rounded file:border-0 file:bg-blue-100 file:px-2 file:py-2 file:text-blue-900"
        onChange={e => { const file = e.currentTarget.files?.[0]; if (file) void readFile(file); e.currentTarget.value = ''; }} />
    </label>
    <button className={buttonClass + ' w-full'} disabled={!ready || running || reading} onClick={() => {
      try { load(demo, 'exemplo-placa.gcode'); } catch (e) { setError(String(e)); }
    }}>Carregar desenho de exemplo</button>
    {reading && <p className="text-xs" role="status">Lendo arquivo…</p>}
    {program && <>
      <div className={styles.preview}>
        <p className="break-all text-xs font-bold">{program.name}</p>
        <p className={theme.muted}>{program.width.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} × {program.height.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} mm · tamanho original, centralizado</p>
        <svg viewBox={`0 0 ${BED.width} ${BED.height}`} role="img" aria-label="Prévia do desenho sobre o MDF" className="mt-2 h-28 w-full rounded bg-[#bb905b]">
          <path d={path} fill="none" stroke="#3b2412" strokeWidth="3" />
          <circle cx={cut.position.x} cy={cut.position.y} r="7" fill={cut.laserOn ? '#ef4444' : '#1d4ed8'} />
        </svg>
      </div>
      <div className="space-y-1">
        <div className="flex justify-between text-xs"><span>{Math.round(cut.progress * 100)}%</span><span>{Math.round(cut.elapsed)} / {Math.round(program.duration)} s</span></div>
        <progress aria-label="Progresso do corte" className={theme.progress} max={1} value={cut.progress} />
      </div>
    </>}
    <div className="grid grid-cols-2 gap-2">
      <button className={`${buttonClass} ${theme.primary}`} disabled={!ready || !program || running || reading || cut.status === 'completed'} onClick={() => {
        setError(machine.startCut() || ''); refresh(n => n + 1);
      }}>{cut.status === 'paused' ? 'Continuar corte' : 'Iniciar corte'}</button>
      <button className={buttonClass} disabled={!running} onClick={() => { machine.pauseCut(); refresh(n => n + 1); }}>Pausar</button>
      <button className={buttonClass + ' col-span-2'} disabled={!program || reading} onClick={() => { machine.resetCut(); setError(''); refresh(n => n + 1); }}>Reiniciar / nova chapa</button>
    </div>
    <label className="flex items-center justify-between text-xs">Velocidade da simulação
      <select aria-label="Velocidade da simulação" value={cut.speedMultiplier} onChange={e => { cut.setSpeed(Number(e.target.value)); refresh(n => n + 1); }} className={theme.select}>
        {[0.5, 1, 2, 5, 10].map(speed => <option key={speed} value={speed}>{speed.toLocaleString('pt-BR')}×</option>)}
      </select>
    </label>
    <label className="flex items-center justify-between gap-2 text-xs">Carcaça
      <select aria-label="Visualização da carcaça" className={theme.select} value={machine.shellHidden ? 'hidden' : machine.cutaway ? 'transparent' : 'solid'} onChange={e => { machine.setShellMode(e.target.value as 'hidden' | 'transparent' | 'solid'); refresh(n => n + 1); }}>
        <option value="hidden">Oculta (mais leve)</option><option value="transparent">Transparente</option><option value="solid">Sólida</option>
      </select>
    </label>
    {error && <p role="alert" className={styles.error}>{error}</p>}
    {cut.message && <p className={theme.muted}>{cut.message}</p>}
    <p className={theme.muted}>Ligue a máquina e mantenha a tampa fechada. A importação seleciona o modo automático. O SVG corta contornos; o G-code respeita M3/M4, M5, S e F. Apenas simulação visual.</p>
  </section>;
}

