"use client";
import styles from './Simulator.module.css';

interface LoadingOverlayProps {
  visible: boolean;
  progress: number;
}

export default function LoadingOverlay({ visible, progress }: LoadingOverlayProps) {
  if (!visible) return null;

  return (
    <div className={styles.loading}>
      <div className={styles.loadingBox}>
        <h1>Carregando simulador… {Math.round(progress * 100)}%</h1>
        <progress className={styles.progress} aria-label="Carregamento do simulador" max={1} value={progress} />
      </div>
    </div>
  );
}
