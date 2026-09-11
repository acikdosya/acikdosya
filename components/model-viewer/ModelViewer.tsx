'use client';

import {
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore
} from 'react';
import {Canvas, useFrame, useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {ContactShadows, Html, OrbitControls} from '@react-three/drei';
import type {SelectedDimensions} from '@/lib/geometry/measurements';
import {buildModel, modelBounds} from '@/lib/geometry/model';
import {
  annotationPosition,
  SCHEMATIC,
  type ModelDimensions
} from '@/lib/geometry/result';
import type {Confidence} from '@/lib/schema';

export interface ViewerAnnotation {
  id: string;
  /** Gövde boyunca oran, 0 = burun ucu, 1 = kuyruk. */
  t: number;
  /** Radyal açı, derece. */
  angle: number;
  /** Dile göre çözülmüş etiket — bu bileşen mesaj paketi taşımaz. */
  label: string;
  confidence: Confidence;
  /** "resmî" / "basın" / "tahmin" — sunucuda çevrildi. */
  confidenceLabel: string;
}

interface Props {
  systemSlug: string;
  /** Ortak ölçü seçiminden gelen boyutlar — geometri yalnızca bundan türer. */
  dimensions: SelectedDimensions;
  annotations: ViewerAnnotation[];
  /**
   * Odaklanilacak bolumun govde orani. null ise genel gorunum.
   * Deger annotation verisinden gelir; elle yazilmis kamera konumu yok.
   */
  focusT: number | null;
  /** WebGL yoksa gösterilecek içerik — sayfa ScaleSilhouette veriyor. */
  fallback: React.ReactNode;
  label: string;
  /**
   * Görüntüleyici kurulduğunda bir kez çağrılır. Parametre, WebGL2 bulunup
   * bulunmadığını söyler: false ise sahne değil silüet gösteriliyor.
   * Kararlı bir başvuru bekler — her render'da yeni işlev verilirse
   * yeniden çağrılır.
   */
  onReady?: (webgl: boolean) => void;
}

function Model({
  systemSlug,
  dimensions,
  annotations
}: Pick<Props, 'systemSlug' | 'dimensions' | 'annotations'>) {
  // CSS pikseli, cihaz pikseli degil: mobil 48, masaustu 72 segment.
  const width = useThree((state) => state.size.width);
  const invalidate = useThree((state) => state.invalidate);
  const isMobile = width < 700;

  // Olcu nesnesi her render'da yeniden kurulabilir; alan alan bagimlilik
  // verilmesi gerekirdi ama tur ayrimi bunu okunmaz yapardi. Sayfa ayni
  // secim sonucunu tasidigi icin basvuru kararli.
  const model = useMemo(
    () =>
      buildModel({
        systemSlug,
        dimensions,
        radialSegments: isMobile ? 48 : 72
      }),
    [systemSlug, dimensions, isMobile]
  );

  // Varyant degisince onceki geometri ve materyal bellekten duser.
  useEffect(() => model?.dispose, [model]);

  // frameloop="demand" halinde yeni geometri kendiliginden cizilmez;
  // hareket azaltilmis kullanici bos bir kutu gormesin.
  useEffect(() => {
    invalidate();
  }, [model, invalidate]);

  // Profili tanimsiz sistem buraya gelmemeli; bileseni cagiran sayfa
  // zaten eliyor. Gelirse bos sahne cizilir, varsayilan govde degil.
  if (!model) return null;

  const {group, dimensions: dims} = model;

  return (
    // uzun eksen ekranda yatay dursun
    <group rotation={[0, 0, Math.PI / 2]} position={[dims.L / 2, 0, 0]}>
      <primitive object={group} />
      {annotations.map((annotation) => (
        <Html
          key={annotation.id}
          position={annotationPosition(annotation.t, annotation.angle, dims)}
          center
          occlude
          style={{pointerEvents: 'none'}}
        >
          <span className="hotspot">
            {annotation.label}
            <span className={`chip conf-${annotation.confidence}`}>
              {annotation.confidenceLabel}
            </span>
          </span>
        </Html>
      ))}
    </group>
  );
}

type OrbitLike = {target: THREE.Vector3; update: () => void} | null;

interface Goal {
  target: THREE.Vector3;
  position: THREE.Vector3;
}

/**
 * Modelin yatay yariçapi: govde yarim uzunlugu ile kanat/kanatcik ucu.
 * Model kendi ekseninde dondugu icin kadraj bu yaricapi kullanmali —
 * yalniz uzunluga bakan bir kadraj, AKINCI gibi kanat acikligi
 * govdesinden uzun bir sistemde kanat ucunu keser.
 */
function horizontalRadius(dims: ModelDimensions): number {
  return Math.hypot(dims.L / 2, dims.reach);
}

/**
 * Kamera konumu da olcuden turer. Genel gorunumde model kareyi doldurur;
 * bir bolume odaklanildiginda cerceve capin katidir. Model yatay durdugu
 * icin t orani dunya ekseninde x = L * (0.5 - t) olur.
 *
 * Kamera yuksekligi sabit bir oran DEGIL: kameraya donuk kanat ucu
 * en yakin nokta ve yukseklik arttikca kadrajin altindan tasar. Bu
 * yuzden yukseklik, en yakin noktanin dikey gorus acisina gore
 * sinirlanir.
 */
function goalFor(
  dims: ModelDimensions,
  focusT: number | null,
  fov: number,
  aspect: number
): Goal {
  const tan = Math.tan(((fov * Math.PI) / 180) / 2);

  if (focusT === null) {
    const radius = horizontalRadius(dims);
    const distance = Math.max(radius / (tan * aspect * 0.85), radius * 1.2);
    const nearest = Math.max(distance - radius, radius * 0.2);
    const height = Math.min(radius * 0.3, tan * nearest * 0.8);

    return {
      target: new THREE.Vector3(0, 0, 0),
      position: new THREE.Vector3(0, height, distance)
    };
  }

  const x = dims.L * (0.5 - focusT);
  const distance = Math.max((dims.R * 7) / (2 * tan), dims.R * 3);
  return {
    target: new THREE.Vector3(x, 0, 0),
    position: new THREE.Vector3(x, dims.R * 1.2, distance)
  };
}

function Framing({
  dims,
  focusT,
  reduce
}: {
  dims: ModelDimensions;
  focusT: number | null;
  reduce: boolean;
}) {
  const camera = useThree((state) => state.camera);
  const width = useThree((state) => state.size.width);
  const height = useThree((state) => state.size.height);
  const invalidate = useThree((state) => state.invalidate);
  const controls = useThree((state) => state.controls) as unknown as OrbitLike;
  const moving = useRef(true);

  const goal = useMemo(() => {
    const fov = camera instanceof THREE.PerspectiveCamera ? camera.fov : 38;
    return goalFor(dims, focusT, fov, width / height);
  }, [camera, dims, focusT, width, height]);

  useEffect(() => {
    // Hedef degisti, yumusatma yeniden baslar.
    moving.current = true;

    if (!reduce) return;
    // Hareket azaltilmissa gecis yok: kamera dogrudan yerine gider.
    camera.position.copy(goal.position);
    controls?.target.copy(goal.target);
    controls?.update();
    moving.current = false;
    invalidate();
  }, [camera, controls, goal, reduce, invalidate]);

  useFrame(() => {
    if (reduce || !moving.current) return;

    camera.position.lerp(goal.position, 0.12);
    controls?.target.lerp(goal.target, 0.12);
    controls?.update();

    // Yeterince yaklasinca birak, aksi halde otomatik donus kilitlenir.
    if (camera.position.distanceTo(goal.position) < dims.L * 0.01) {
      moving.current = false;
    }
  });

  return null;
}

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

function subscribeMotion(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

/** Kullanici tercihini oturum ortasinda degistirse de yakalanir. */
function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeMotion,
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => false
  );
}

let webgl2: boolean | undefined;

/**
 * WebGL2 destegi. R3F v9 WebGL1 ile calismaz; destek yoksa siluete duseriz.
 * Sonuc modul duzeyinde onbelleklenir — her render'da context acilmasin.
 */
function supportsWebGL2(): boolean {
  if (webgl2 === undefined) {
    try {
      webgl2 = !!document.createElement('canvas').getContext('webgl2');
    } catch {
      webgl2 = false;
    }
  }
  return webgl2;
}

/**
 * Sematik model — CLAUDE.md §9.
 * Geometri icerikteki olcu alanlarindan turer, hazir model yok.
 * Model dekoratiftir: buradaki her bilgi spec tablosunda da vardir.
 */
export default function ModelViewer({
  systemSlug,
  dimensions,
  annotations,
  focusT,
  fallback,
  label,
  onReady
}: Props) {
  const reduce = usePrefersReducedMotion();
  const [grabbed, setGrabbed] = useState(false);

  // ssr:false ile yuklendigi icin burasi yalnizca tarayicida calisir.
  const webgl = supportsWebGL2();

  // Sahne kurulmadan once olculer: kadraj, golge ve zoom sinirlari.
  const dims = useMemo(
    () => modelBounds({systemSlug, dimensions}),
    [systemSlug, dimensions]
  );

  useEffect(() => {
    onReady?.(webgl);
  }, [onReady, webgl]);

  // Kendi kendine donus yalnizca genel gorunumde, kullanici dokunana kadar.
  const autoRotate = !reduce && !grabbed && focusT === null;

  // WebGL yoksa ya da sistemin dis profili tanimsizsa sahne kurulmaz.
  if (!webgl || !dims) return <>{fallback}</>;

  const radius = horizontalRadius(dims);

  return (
    <div
      className="viewer"
      role="img"
      aria-label={label}
      onPointerDown={() => setGrabbed(true)}
    >
      <Canvas
        // flat: ton esleme kapali. ACES sinematik bir yuzey verirdi;
        // bizim yuzeyimiz mat ve sematik kalmali (CLAUDE.md §9).
        flat
        dpr={[1, 2]}
        camera={{
          fov: 38,
          near: 0.1,
          far: 200,
          // Ilk kare; Framing ilk turda dogru mesafeye yumusatiyor.
          position: [0, radius * 0.25, radius * 2.2]
        }}
        gl={{antialias: true, alpha: true}}
        // Hareket azaltilmissa kare yalnizca kullanici etkilesiminde uretilir.
        frameloop={reduce ? 'demand' : 'always'}
      >
        <hemisphereLight args={[0xffffff, 0xb9bdb8, 1.5]} />
        <directionalLight position={[3, 6, 5]} intensity={1.5} />
        <directionalLight position={[-4, -2, -3]} intensity={0.5} />
        <Framing dims={dims} focusT={focusT} reduce={reduce} />
        <Suspense fallback={null}>
          <Model
            systemSlug={systemSlug}
            dimensions={dimensions}
            annotations={annotations}
          />
          {/* Govdeyi zemine oturtan yumusak golge: isik kurgusu degil,
              derinlik ipucu. Yuzey mat kalir, yansima yok. */}
          <ContactShadows
            position={[0, -dims.R * 1.9, 0]}
            scale={radius * 2.6}
            resolution={256}
            far={dims.R * 4}
            blur={2.6}
            opacity={0.26}
            color={`#${SCHEMATIC.edge.toString(16).padStart(6, '0')}`}
          />
        </Suspense>
        <OrbitControls
          enablePan={false}
          enableDamping
          autoRotate={autoRotate}
          autoRotateSpeed={0.5}
          minDistance={dims.R * 2.5}
          maxDistance={radius * 8}
          makeDefault
        />
      </Canvas>
    </div>
  );
}
