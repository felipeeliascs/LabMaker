"use client";
import styles from './Simulator.module.css';

interface MobileTopBarProps {
  onOpenSidebar: () => void;
}

export default function MobileTopBar({ onOpenSidebar }: MobileTopBarProps) {
  return (
    <header className={styles.mobileBar}>
      <button
        aria-label="Abrir painel de controle"
        onClick={onOpenSidebar}
        className={styles.button}
      >
        ☰
      </button>
      <h1>Simulador CNC laser</h1>
    </header>
  );
}
