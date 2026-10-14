import { useEffect, useRef, useState, type CSSProperties } from "react";
import Matter from "matter-js";
import { Button } from "@/components/ui/button";
import { playGameSound } from "@/lib/game-audio";
import { HIT_PENALTY, KILL_POINTS, ROUND_SECONDS } from "@/lib/game-rules";
import germsImage from "@/assets/germs.png";
import { SpaceTravel } from "@/components/space-travel";

type Germ = { id: number; type: number; x: number; y: number; scale: number };
type Burst = Germ & { hit: boolean };
export type GameResult = { score: number; kills: number; hits: number };
// Germs pop in small and keep swelling until they reach the hero.
const GROW_FROM = 0.4;
const GROW_TO = 1.6;
export function germScale(progress: number): number {
  const clamped = Math.min(1, Math.max(0, progress));
  const eased = 1 - Math.pow(1 - clamped, 3);
  return GROW_FROM + (GROW_TO - GROW_FROM) * eased;
}
export function GermSprite({ type, className = "" }: { type: number; className?: string }) {
  return <span className={`germ-sprite germ-type-${type} ${className}`} style={{ backgroundImage: `url(${germsImage})` }} />;
}

export function GameArena({ character, sound, onFinish }: { character: string; sound: boolean; onFinish: (result: GameResult) => void }) {
  const arena = useRef<HTMLDivElement>(null);
  const [germs, setGerms] = useState<Germ[]>([]);
  const [bursts, setBursts] = useState<Burst[]>([]);
  const [time, setTime] = useState(ROUND_SECONDS);
  const [score, setScore] = useState(0);
  const [hitFlash, setHitFlash] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(3);
  const state = useRef({ score: 0, kills: 0, hits: 0 });
  const soundRef = useRef(sound);
  const killRef = useRef<(id: number) => void>(() => {});
  const finishRef = useRef(onFinish);
  soundRef.current = sound;
  finishRef.current = onFinish;

  useEffect(() => {
    let ticks = 3;
    const interval = window.setInterval(() => {
      ticks--;
      setCountdown(ticks > 0 ? ticks : null);
      playGameSound("start", soundRef.current);
      if (ticks === 0) window.clearInterval(interval);
    }, 750);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const element = arena.current;
    if (!element || countdown !== null) return;
    const engine = Matter.Engine.create({ gravity: { x: 0, y: 0, scale: 0 } });
    const bodies = new Map<number, { body: Matter.Body; type: number; startDist: number }>();
    let width = element.clientWidth;
    let height = element.clientHeight;
    const shield = Matter.Bodies.circle(width / 2, height / 2, Math.min(width, height) * 0.13, { isStatic: true, isSensor: true });
    Matter.Composite.add(engine.world, shield);
    let id = 0;
    let raf = 0;
    let active = true;
    let last = performance.now();
    const start = last;
    let nextSpawn = start + 300;
    let lastRender = 0;
    const pending = new Set<number>();
    const observer = new ResizeObserver(() => {
      const oldW = width, oldH = height;
      width = element.clientWidth; height = element.clientHeight;
      Matter.Body.setPosition(shield, { x: width / 2, y: height / 2 });
      const radius = Math.min(width, height) * 0.13;
      if (shield.circleRadius) Matter.Body.scale(shield, radius / shield.circleRadius, radius / shield.circleRadius);
      bodies.forEach(({ body }) => Matter.Body.setPosition(body, { x: body.position.x / oldW * width, y: body.position.y / oldH * height }));
    });
    observer.observe(element);
    const burst = (germ: Germ, hit: boolean) => {
      setBursts((prev) => [...prev.slice(-12), { ...germ, hit }]);
      const timer = window.setTimeout(() => { pending.delete(timer); if (active) setBursts((prev) => prev.filter((b) => b.id !== germ.id)); }, 700);
      pending.add(timer);
    };
    const remove = (germId: number, hit: boolean) => {
      const item = bodies.get(germId);
      if (!item || !active) return;
      bodies.delete(germId);
      Matter.Composite.remove(engine.world, item.body);
      const dx = item.body.position.x - width / 2, dy = item.body.position.y - height / 2;
      burst({ id: germId, type: item.type, x: item.body.position.x, y: item.body.position.y, scale: germScale(1 - Math.min(1, Math.hypot(dx, dy) / item.startDist)) }, hit);
      state.current.score += hit ? -HIT_PENALTY : KILL_POINTS;
      if (hit) state.current.hits++; else state.current.kills++;
      setScore(state.current.score);
      playGameSound(hit ? "hit" : "kill", soundRef.current);
      if (hit) {
        setHitFlash(true);
        const timer = window.setTimeout(() => { pending.delete(timer); if (active) setHitFlash(false); }, 300);
        pending.add(timer);
      }
      setGerms((prev) => prev.filter((g) => g.id !== germId));
    };
    killRef.current = (germId) => remove(germId, false);
    Matter.Events.on(engine, "collisionStart", (event: Matter.IEventCollision<Matter.Engine>) => {
      for (const pair of event.pairs) {
        const other = pair.bodyA === shield ? pair.bodyB : pair.bodyB === shield ? pair.bodyA : undefined;
        if (other) remove(Number(other.label), true);
      }
    });
    const frame = (now: number) => {
      if (!active) return;
      const elapsed = (now - start) / 1000;
      setTime(Math.max(0, Math.ceil(ROUND_SECONDS - elapsed)));
      if (elapsed >= ROUND_SECONDS) {
        active = false;
        playGameSound("end", soundRef.current);
        finishRef.current({ ...state.current });
        return;
      }
      if (now >= nextSpawn) {
        const angle = Math.random() * Math.PI * 2;
        const dx = Math.cos(angle), dy = Math.sin(angle);
        const radius = Math.min((width / 2 + 35) / Math.max(Math.abs(dx), 0.001), (height / 2 + 35) / Math.max(Math.abs(dy), 0.001));
        const body = Matter.Bodies.circle(width / 2 + dx * radius, height / 2 + dy * radius, Math.max(24, Math.min(width, height) * 0.038), { label: String(++id), isSensor: true, frictionAir: 0 });
        bodies.set(id, { body, type: Math.floor(Math.random() * 4), startDist: radius });
        Matter.Composite.add(engine.world, body);
        const stage = elapsed < ROUND_SECONDS / 3 ? 0 : elapsed < (ROUND_SECONDS * 2) / 3 ? 1 : 2;
        nextSpawn = now + Math.max(420, (1000 - elapsed * 18) / (stage + 1));
      }
      const stage = elapsed < ROUND_SECONDS / 3 ? 0 : elapsed < (ROUND_SECONDS * 2) / 3 ? 1 : 2;
      const speed = Math.min(width, height) * (0.00105 + elapsed * 0.000018) * (1 + stage * 0.5);
      bodies.forEach(({ body }) => {
        const dx = width / 2 - body.position.x, dy = height / 2 - body.position.y;
        const length = Math.hypot(dx, dy) || 1;
        Matter.Body.setVelocity(body, { x: dx / length * speed, y: dy / length * speed });
      });
      Matter.Engine.update(engine, Math.min(now - last, 33));
      last = now;
      if (now - lastRender > 25) {
        setGerms([...bodies].map(([germId, { body, type, startDist }]) => {
          const dx = body.position.x - width / 2, dy = body.position.y - height / 2;
          return { id: germId, type, x: body.position.x, y: body.position.y, scale: germScale(1 - Math.min(1, Math.hypot(dx, dy) / startDist)) };
        }));
        lastRender = now;
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      active = false;
      cancelAnimationFrame(raf);
      observer.disconnect();
      pending.forEach(window.clearTimeout);
      Matter.Events.off(engine, "collisionStart");
      Matter.Engine.clear(engine);
      Matter.Composite.clear(engine.world, false);
    };
  }, [countdown]);

  return <div className="live-arena" ref={arena}>
    <SpaceTravel />
    <div className="game-hud"><div className="score-readout"><span>SCORE</span><strong>{score.toLocaleString()}</strong></div><div className={`timer-readout ${time <= 5 ? "urgent" : ""}`}><span>TIME LEFT</span><strong>00:{String(time).padStart(2, "0")}</strong></div></div>
    <div className={`protected-character ${hitFlash ? "shield-hit" : ""}`}><div className="shield-ring"/><div className="shield-ring outer"/><img src={character} alt="Your protected character"/><span className="shield-label">{hitFlash ? "SHIELD HIT!" : "PROTECT YOUR HERO"}</span></div>
    {germs.map((germ) => <Button key={germ.id} variant="germ" className="enemy" aria-label={`Destroy germ ${germ.id}`} style={{ left: germ.x, top: germ.y, "--germ-scale": germ.scale } as CSSProperties} onPointerDown={(event) => { event.preventDefault(); killRef.current(germ.id); }}><GermSprite type={germ.type}/></Button>)}
    {bursts.map((b) => <div key={b.id} className={`burst ${b.hit ? "burst-hit" : ""}`} style={{ left: b.x, top: b.y }}><span className="burst-ring"/><span className="burst-sparks">✦</span><strong>{b.hit ? "−125" : "+250"}</strong></div>)}
    {countdown !== null && <div className="countdown"><span>GET READY</span><strong key={countdown}>{countdown}</strong><p>Keep the germs out.</p></div>}
    <div className="arena-bottom"><span><i/> SHIELD ACTIVE</span><span>TAP GERMS. SAVE YOUR HERO.</span><span>+250 KILL <b> / </b> −125 HIT</span></div>
  </div>;
}