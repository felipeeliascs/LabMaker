/** Mantém no máximo um frame pendente e não acumula tempo em segundo plano. */
export function createRenderScheduler(
  render: (_dt: number) => boolean,
  request: (_callback: FrameRequestCallback) => number = requestAnimationFrame,
  cancel: (_id: number) => void = cancelAnimationFrame,
) {
  let pending = 0, last = 0, active = true, disposed = false;
  const invalidate = () => {
    if (!pending && active && !disposed) pending = request(frame);
  };
  const frame = (time: number) => {
    pending = 0;
    if (!active || disposed) return;
    const dt = last ? Math.min((time-last)/1000, 0.1) : 0;
    last = time;
    if (render(dt)) invalidate();
    else last = 0;
  };
  return {
    invalidate,
    setActive(value: boolean) {
      active = value; last = 0;
      if (!active) { cancel(pending); pending = 0; }
      else invalidate();
    },
    dispose() { disposed = true; cancel(pending); pending = 0; },
  };
}
