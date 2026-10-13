"use client";

import { Grid, Line, OrbitControls, QuadraticBezierLine, RoundedBox } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Component, useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import * as THREE from "three";
import { AGENTS } from "@/lib/agents";
import type { AgentId } from "@/lib/types";
import { useLang } from "./lang";

export type NodeState = "idle" | "running" | "done" | "failed";
type NodeId = AgentId | "deal" | "docs";

interface SceneNode {
  id: NodeId;
  label: string;
  layer: number;
  calc?: boolean;
  hex?: boolean;
}

const NODES: SceneNode[] = [
  { id: "deal", label: "Deal inputs", layer: 0 },
  { id: "docs", label: "Documents", layer: 0 },
  // The five specialists are hexagons so the expert team reads as one unit.
  ...AGENTS.map((a) => ({ id: a.id, label: a.short, layer: a.layer, calc: a.kind === "calculation", hex: a.layer === 2 })),
];

const EDGES: [NodeId, NodeId][] = AGENTS.flatMap((a) =>
  a.parents.flatMap((p): [NodeId, NodeId][] => (p === "inputs" ? [["deal", a.id], ["docs", a.id]] : [[p, a.id]])),
);

const SPACING = 2.35;
// Gaps between labelled layers are wider than the gap between rows inside one.
const ROW_Z = [-5.4, -3.0, -0.4, 2.2, 4.2];

function positionsFor() {
  const byLayer = new Map<number, SceneNode[]>();
  NODES.forEach((n) => byLayer.set(n.layer, [...(byLayer.get(n.layer) ?? []), n]));
  const pos = {} as Record<NodeId, THREE.Vector3>;
  for (const [layer, nodes] of byLayer) {
    nodes.forEach((n, i) => {
      pos[n.id] = new THREE.Vector3((i - (nodes.length - 1) / 2) * SPACING, 0, ROW_Z[layer]);
    });
  }
  return pos;
}

interface Band {
  title: string;
  sub: string;
  layers: number[];
  ids: NodeId[];
  hw: number;
  z0: number;
  z1: number;
}

// The four labelled layers drawn as tinted plates under their rows.
const BANDS: Band[] = [
  { title: "Your deal", sub: "Deal details and documents", layers: [0] },
  { title: "Read & verify", sub: "Classify documents, pull facts with quotes", layers: [1] },
  { title: "Expert team", sub: "5 specialists review in parallel", layers: [2] },
  { title: "Scoring & decision", sub: "Rule checks, funding, final verdict", layers: [3, 4] },
].map((b) => {
  const nodes = NODES.filter((n) => b.layers.includes(n.layer));
  const widest = Math.max(...b.layers.map((l) => nodes.filter((n) => n.layer === l).length));
  return {
    ...b,
    ids: nodes.map((n) => n.id),
    hw: ((widest - 1) / 2) * SPACING + 1.275,
    z0: Math.min(...b.layers.map((l) => ROW_Z[l])) - 0.78,
    z1: Math.max(...b.layers.map((l) => ROW_Z[l])) + 0.78,
  };
});

// The scene shifts right to leave room for the layer labels: a full column in wide views,
// short one-line labels beside each plate in narrow ones.
const WIDE = 720;
const LABEL_W = 160;
const labelRoom = (width: number) => Math.min(width >= WIDE ? 220 : 130, width * 0.25);
const labelEdge = (width: number) => (width >= WIDE ? 16 + LABEL_W + 24 : labelRoom(width) + 8);

interface Palette {
  idle: string;
  running: string;
  done: string;
  failed: string;
  edge: string;
  grid: string;
  section: string;
  layers: string[];
}

function readPalette(): Palette {
  const css = getComputedStyle(document.documentElement);
  const v = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback;
  return {
    idle: v("--line-strong", "#cdc6b8"),
    running: v("--series-1", "#2a78d6"),
    done: v("--brand", "#1f4e8c"),
    failed: v("--critical", "#d03b3b"),
    edge: v("--line-strong", "#cdc6b8"),
    grid: v("--line", "#e3ded4"),
    section: v("--line-strong", "#cdc6b8"),
    layers: [v("--layer-0", "#6b7483"), v("--layer-1", "#17807a"), v("--layer-2", "#2a78d6"), v("--layer-3", "#5b4fc4")],
  };
}

function NodeMesh({ node, state, position, palette, reduced }: { node: SceneNode; state: NodeState; position: THREE.Vector3; palette: Palette; reduced: boolean }) {
  const mesh = useRef<THREE.Mesh>(null);
  const material = useRef<THREE.MeshStandardMaterial>(null);
  const color = state === "running" ? palette.running : state === "done" ? palette.done : state === "failed" ? palette.failed : palette.idle;

  useFrame(({ clock }, delta) => {
    if (!mesh.current || !material.current) return;
    const t = clock.elapsedTime;
    const lifted = state === "running" ? 0.32 : state === "done" ? 0.1 : 0;
    const bob = state === "running" && !reduced ? Math.sin(t * 4 + position.x) * 0.05 : 0;
    mesh.current.position.y = THREE.MathUtils.damp(mesh.current.position.y, lifted + bob, 8, delta);
    const glow = state === "running" ? (reduced ? 0.5 : 0.35 + 0.25 * Math.sin(t * 5)) : state === "done" ? 0.12 : 0;
    material.current.emissiveIntensity = glow;
  });

  const surface = (
    <meshStandardMaterial ref={material} color={color} emissive={color} roughness={0.55} metalness={0.05} transparent opacity={state === "idle" ? 0.55 : 1} />
  );
  return (
    <group position={position}>
      {node.hex ? (
        <mesh ref={mesh} rotation={[0, Math.PI / 6, 0]}>
          <cylinderGeometry args={[0.74, 0.74, 0.3, 6]} />
          {surface}
        </mesh>
      ) : (
        <RoundedBox ref={mesh} args={node.calc ? [1.5, 0.22, 0.8] : [1.75, 0.3, 0.95]} radius={0.07} smoothness={3}>
          {surface}
        </RoundedBox>
      )}
    </group>
  );
}

function LayerPlate({ band, color, active }: { band: Band; color: string; active: boolean }) {
  const { hw, z0, z1 } = band;
  const rim = useMemo(
    () => [new THREE.Vector3(-hw, -0.21, z0), new THREE.Vector3(hw, -0.21, z0), new THREE.Vector3(hw, -0.21, z1), new THREE.Vector3(-hw, -0.21, z1), new THREE.Vector3(-hw, -0.21, z0)],
    [hw, z0, z1],
  );
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.22, (z0 + z1) / 2]}>
        <planeGeometry args={[hw * 2, z1 - z0]} />
        <meshBasicMaterial color={color} transparent opacity={active ? 0.2 : 0.11} depthWrite={false} />
      </mesh>
      <Line points={rim} color={color} lineWidth={1} transparent opacity={active ? 0.95 : 0.45} />
    </group>
  );
}

function Packets({ from, to, color, reduced }: { from: THREE.Vector3; to: THREE.Vector3; color: string; reduced: boolean }) {
  const a = useRef<THREE.Mesh>(null);
  const b = useRef<THREE.Mesh>(null);
  const curve = useMemo(() => {
    const mid = from.clone().lerp(to, 0.5).add(new THREE.Vector3(0, 0.9, 0));
    return new THREE.QuadraticBezierCurve3(from.clone().setY(0.2), mid, to.clone().setY(0.2));
  }, [from, to]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime * 0.55;
    a.current?.position.copy(curve.getPoint(t % 1));
    b.current?.position.copy(curve.getPoint((t + 0.5) % 1));
  });
  if (reduced) return null;
  return (
    <>
      <mesh ref={a}>
        <sphereGeometry args={[0.07, 12, 12]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <mesh ref={b}>
        <sphereGeometry args={[0.07, 12, 12]} />
        <meshBasicMaterial color={color} />
      </mesh>
    </>
  );
}

function placeLabel(el: HTMLDivElement | null | undefined, x: number, y: number, visible: boolean) {
  if (!el) return;
  el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -100%)`;
  el.style.visibility = visible ? "visible" : "hidden";
}

type LabelRefs = RefObject<Partial<Record<NodeId, HTMLDivElement | null>>>;
type BandRefs = RefObject<{ labels: (HTMLDivElement | null)[]; leaders: (SVGLineElement | null)[] }>;

function Scene({
  states,
  interactive,
  reduced,
  palette,
  labels,
  bands,
}: {
  states: Record<NodeId, NodeState>;
  interactive: boolean;
  reduced: boolean;
  palette: Palette;
  labels: LabelRefs;
  bands: BandRefs;
}) {
  const group = useRef<THREE.Group>(null);
  const pos = useMemo(() => positionsFor(), []);
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const get = useThree((s) => s.get);
  const probe = useRef(new THREE.Vector3());

  // Render as if the canvas were wider, keeping the left part: the scene moves right
  // without distortion and the label column gets clear space.
  useEffect(() => {
    const cam = get().camera;
    if (!(cam instanceof THREE.PerspectiveCamera)) return;
    const { width: w, height: h } = size;
    const room = labelRoom(w);
    cam.aspect = (w + room) / h;
    cam.setViewOffset(w + room, h, 0, 0, w, h);

    // Fit the layers to the frame: as large as possible without a plate spilling past an edge
    // or under the label column, centred vertically. Zoom scales about the full frame's centre,
    // which lands at x = room / w in this view; a vertical view offset moves the scene without scaling it.
    cam.zoom = 1;
    cam.updateProjectionMatrix();
    cam.updateMatrixWorld();
    const cx = room / w;
    const left = (2 * labelEdge(w)) / w - 1;
    const p = new THREE.Vector3();
    let zoom = 3;
    let top = -Infinity;
    let bottom = Infinity;
    for (const b of BANDS) {
      for (const x of [-b.hw - 0.3, b.hw + 0.3]) {
        for (const z of [b.z0, b.z1]) {
          for (const y of [-0.22, 0.9]) {
            p.set(x, y, z).project(cam);
            const dx = p.x - cx;
            if (dx > 0) zoom = Math.min(zoom, (0.92 - cx) / dx);
            if (dx < 0) zoom = Math.min(zoom, (left - cx) / dx);
            top = Math.max(top, p.y);
            bottom = Math.min(bottom, p.y);
          }
        }
      }
    }
    zoom = Math.min(zoom, 1.72 / (top - bottom));
    cam.zoom = zoom;
    cam.setViewOffset(w + room, h, 0, (-zoom * (top + bottom) * h) / 4, w, h);
    cam.updateProjectionMatrix();
  }, [get, camera, size]);

  useFrame(({ clock }) => {
    if (!group.current) return;
    if (!interactive && !reduced) group.current.rotation.y = Math.sin(clock.elapsedTime * 0.18) * 0.035;
    // Labels are plain DOM in an overlay; project each node to screen space.
    const project = (v: THREE.Vector3) => {
      const p = group.current!.localToWorld(v).project(camera);
      return [(p.x * 0.5 + 0.5) * size.width, (-p.y * 0.5 + 0.5) * size.height, p.z < 1] as const;
    };
    for (const n of NODES) {
      const [x, y, vis] = project(probe.current.copy(pos[n.id]).setY(0.72));
      placeLabel(labels.current?.[n.id], x, y, vis);
    }
    // Layer labels sit beside the left edge of their plate, stacked so far layers
    // (squeezed together by perspective) never overlap.
    const wide = size.width >= WIDE;
    let floor = -Infinity;
    BANDS.forEach((b, i) => {
      const el = bands.current?.labels[i];
      const leader = bands.current?.leaders[i];
      if (!el) return;
      const [x, y, vis] = project(probe.current.set(-b.hw, -0.22, (b.z0 + b.z1) / 2));
      const h = el.offsetHeight;
      const ly = Math.max(y, floor + h / 2 + 8);
      floor = ly + h / 2;
      const lx = wide ? 16 : Math.max(8, x - 10 - el.offsetWidth);
      el.dataset.compact = wide ? "0" : "1";
      el.style.transform = `translate(${lx.toFixed(1)}px, ${ly.toFixed(1)}px) translate(0, -50%)`;
      el.style.visibility = vis ? "visible" : "hidden";
      if (leader) {
        const x1 = 16 + LABEL_W + 8;
        leader.setAttribute("x1", String(x1));
        leader.setAttribute("y1", ly.toFixed(1));
        leader.setAttribute("x2", Math.max(x1, x - 6).toFixed(1));
        leader.setAttribute("y2", y.toFixed(1));
        leader.style.visibility = wide && vis && x - 6 > x1 ? "visible" : "hidden";
      }
    });
  });

  return (
    <>
      <ambientLight intensity={0.9} />
      <directionalLight position={[4, 10, 6]} intensity={1.2} />
      <group ref={group}>
        <Grid
          position={[0, -0.25, 0]}
          args={[30, 30]}
          cellSize={0.5}
          cellThickness={0.6}
          cellColor={palette.grid}
          sectionSize={2.5}
          sectionThickness={1}
          sectionColor={palette.section}
          fadeDistance={22}
          fadeStrength={1.5}
          infiniteGrid
        />
        {BANDS.map((b, i) => (
          <LayerPlate key={b.title} band={b} color={palette.layers[i]} active={b.ids.some((id) => states[id] === "running")} />
        ))}
        {EDGES.map(([a, b]) => {
          const active = states[b] === "running";
          const lit = states[b] === "done" || active;
          const from = pos[a];
          const to = pos[b];
          const mid = from.clone().lerp(to, 0.5).add(new THREE.Vector3(0, 0.9, 0));
          return (
            <group key={`${a}-${b}`}>
              <QuadraticBezierLine
                start={from.clone().setY(0.2)}
                end={to.clone().setY(0.2)}
                mid={mid}
                color={active ? palette.running : lit ? palette.done : palette.edge}
                lineWidth={active ? 2 : 1.2}
                transparent
                opacity={lit ? 0.9 : 0.45}
              />
              {active ? <Packets from={from} to={to} color={palette.running} reduced={reduced} /> : null}
            </group>
          );
        })}
        {NODES.map((n) => (
          <NodeMesh key={n.id} node={n} state={states[n.id] ?? "idle"} position={pos[n.id]} palette={palette} reduced={reduced} />
        ))}
      </group>
      {interactive ? <OrbitControls enablePan={false} minDistance={7} maxDistance={18} maxPolarAngle={Math.PI / 2.2} /> : null}
    </>
  );
}

class SceneBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export default function PipelineScene({
  status,
  interactive = false,
  className,
}: {
  status: Partial<Record<AgentId, NodeState>>;
  interactive?: boolean;
  className?: string;
}) {
  // Client-only component (loaded with ssr: false), so window is available here.
  const [palette, setPalette] = useState<Palette>(readPalette);
  const { t } = useLang();
  const [reduced, setReduced] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const scheme = window.matchMedia("(prefers-color-scheme: dark)");
    const onMotion = () => setReduced(motion.matches);
    const onScheme = () => setPalette(readPalette());
    motion.addEventListener("change", onMotion);
    scheme.addEventListener("change", onScheme);
    return () => {
      motion.removeEventListener("change", onMotion);
      scheme.removeEventListener("change", onScheme);
    };
  }, []);

  const started = Object.values(status).some((s) => s && s !== "idle");
  const states = {
    deal: started ? "done" : "idle",
    docs: started ? "done" : "idle",
    ...status,
  } as Record<NodeId, NodeState>;
  const labels: LabelRefs = useRef({});
  const bands: BandRefs = useRef({ labels: [], leaders: [] });

  return (
    <div className={`relative ${className ?? ""}`} aria-hidden>
      <SceneBoundary fallback={<div className="grid h-full place-items-center text-sm text-ink-3">{t("3D view unavailable on this device.")}</div>}>
        <Canvas camera={{ position: [0, 16, 8], fov: 30 }} dpr={[1, 2]} gl={{ antialias: true, alpha: true }}>
          <Scene states={states} interactive={interactive} reduced={reduced} palette={palette} labels={labels} bands={bands} />
        </Canvas>
        <div className="pointer-events-none absolute inset-0 overflow-hidden select-none">
          <svg className="absolute inset-0 h-full w-full overflow-visible">
            {BANDS.map((b, i) => (
              <line
                key={b.title}
                ref={(el) => {
                  bands.current.leaders[i] = el;
                }}
                stroke={palette.layers[i]}
                strokeWidth={1.2}
                strokeDasharray="3 4"
                style={{ visibility: "hidden" }}
              />
            ))}
          </svg>
          {BANDS.map((b, i) => {
            const active = b.ids.some((id) => states[id] === "running");
            return (
              <div
                key={b.title}
                ref={(el) => {
                  bands.current.labels[i] = el;
                }}
                className="group absolute left-0 top-0 w-[160px] border-l-2 pl-2 data-[compact=1]:w-auto data-[compact=1]:pl-1.5 data-[compact=1]:whitespace-nowrap"
                style={{ visibility: "hidden", borderColor: palette.layers[i] }}
              >
                <p className="font-mono text-[9.5px] font-semibold uppercase leading-tight tracking-[0.12em] group-data-[compact=1]:hidden" style={{ color: palette.layers[i] }}>
                  {i ? t("Layer {n}", { n: i }) : t("Input")}
                </p>
                <p className={`font-serif text-[15px] font-semibold leading-tight group-data-[compact=1]:font-sans group-data-[compact=1]:text-[11px] ${active ? "text-ink" : "text-ink-2"}`}>
                  <span className="hidden group-data-[compact=1]:inline">{i ? `${i} · ` : ""}</span>
                  {t(b.title)}
                </p>
                <p className="text-[10.5px] leading-snug text-ink-3 group-data-[compact=1]:hidden">{t(b.sub)}</p>
              </div>
            );
          })}
          {NODES.map((n) => {
            const state = states[n.id] ?? "idle";
            return (
              <div
                key={n.id}
                ref={(el) => {
                  labels.current[n.id] = el;
                }}
                className="absolute left-0 top-0 whitespace-nowrap rounded-md border px-2 py-0.5 text-[12px] font-medium shadow-sm"
                style={{
                  visibility: "hidden",
                  background: "var(--surface)",
                  borderColor: state === "running" ? "var(--series-1)" : "var(--line)",
                  color: state === "idle" ? "var(--ink-3)" : "var(--ink)",
                }}
              >
                {t(n.label)}
                {state === "failed" ? " ⚠" : ""}
              </div>
            );
          })}
        </div>
      </SceneBoundary>
    </div>
  );
}
