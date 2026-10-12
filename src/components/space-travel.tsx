import { useEffect, useRef } from "react";

// Decorative only: the star field never participates in game timing or input.
export function SpaceTravel() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const palette = getComputedStyle(canvas);
    const colors = ["--electric", "--foreground", "--accent"].map((token) => palette.getPropertyValue(token).trim());
    let width = 0;
    let height = 0;
    let frameId = 0;
    let last = performance.now();
    const stars = Array.from({ length: 170 }, (_, i) => ({
      angle: Math.random() * Math.PI * 2,
      depth: Math.random(),
      speed: 0.12 + Math.random() * 0.12,
      color: colors[i % colors.length] ?? colors[0] ?? "currentColor",
      size: 0.6 + Math.random() * 1.2,
    }));
    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };
    const draw = (now: number) => {
      const delta = Math.min((now - last) / 1000, 0.05);
      last = now;
      context.clearRect(0, 0, width, height);
      const radius = Math.hypot(width, height) / 2;
      for (const star of stars) {
        if (!motion.matches) star.depth += delta * star.speed;
        if (star.depth > 1) {
          star.depth = 0;
          star.angle = Math.random() * Math.PI * 2;
        }
        const distance = star.depth ** 2 * radius;
        const trail = motion.matches ? 1 : 2 + star.depth ** 4 * 95;
        const dx = Math.cos(star.angle);
        const dy = Math.sin(star.angle);
        context.globalAlpha = Math.min(0.8, star.depth * 1.1);
        context.strokeStyle = star.color;
        context.lineWidth = star.size * (0.3 + star.depth);
        context.lineCap = "round";
        context.beginPath();
        context.moveTo(width / 2 + dx * Math.max(0, distance - trail), height / 2 + dy * Math.max(0, distance - trail));
        context.lineTo(width / 2 + dx * distance, height / 2 + dy * distance);
        context.stroke();
      }
      if (!motion.matches) frameId = requestAnimationFrame(draw);
    };
    const restart = () => {
      cancelAnimationFrame(frameId);
      last = performance.now();
      draw(last);
    };
    const onResize = () => { resize(); restart(); };
    resize();
    restart();
    window.addEventListener("resize", onResize);
    motion.addEventListener("change", restart);
    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", onResize);
      motion.removeEventListener("change", restart);
    };
  }, []);

  return <canvas ref={canvasRef} className="space-travel" aria-hidden="true" />;
}