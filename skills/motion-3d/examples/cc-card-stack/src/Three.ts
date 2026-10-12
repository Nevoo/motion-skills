// Canvas Commons bridge node; API and usage: references/assets.md. Needs experimentalDecorators.
import {Layout, LayoutProps, initial, signal} from '@canvas-commons/2d';
import {SignalValue, SimpleSignal} from '@canvas-commons/core';
import {Camera, Color, OrthographicCamera, PerspectiveCamera, Scene, WebGLRenderer} from 'three';

export interface ComposerLike {
  setSize(width: number, height: number): void;
  render(deltaTime?: number): void;
}

export interface ThreeProps extends LayoutProps {
  scene?: SignalValue<Scene | null>;
  camera?: SignalValue<Camera | null>;
  quality?: SignalValue<number>;
  background?: SignalValue<string | null>;
  zoom?: SignalValue<number>;
  composer?: SignalValue<ComposerLike | null>;
}

export class Three extends Layout {
  @initial(2)
  @signal()
  public declare readonly quality: SimpleSignal<number, this>;

  @initial(null)
  @signal()
  public declare readonly camera: SimpleSignal<Camera | null, this>;

  @initial(null)
  @signal()
  public declare readonly scene: SimpleSignal<Scene | null, this>;

  @initial(null)
  @signal()
  public declare readonly background: SimpleSignal<string | null, this>;

  @initial(1)
  @signal()
  public declare readonly zoom: SimpleSignal<number, this>;

  @initial(null)
  @signal()
  public declare readonly composer: SimpleSignal<ComposerLike | null, this>;

  public readonly renderer: WebGLRenderer;

  // Keyed only by current inputs, never by what an earlier frame showed.
  private composerFor: ComposerLike | null = null;
  private composerW = 0;
  private composerH = 0;
  private bgColor: Color | null = null;
  private bgKey: string | null = null;

  public constructor(props: ThreeProps) {
    super(props);
    this.renderer = new WebGLRenderer({
      canvas: document.createElement('canvas'),
      antialias: true,
      alpha: true,
      premultipliedAlpha: true,
    });
    this.renderer.setPixelRatio(1); // `quality` is the only supersample factor
    this.renderer.setClearColor(0x000000, 0);
  }

  protected override draw(context: CanvasRenderingContext2D) {
    const size = this.size();
    const width = size.x;
    const height = size.y;
    const quality = this.quality();
    const scene = this.scene();
    const camera = this.camera();

    if (width > 0 && height > 0 && scene && camera) {
      this.syncBackground(scene);

      // three.js setSize reassigns canvas.width/height on every call.
      const bw = Math.max(1, Math.round(width * quality));
      const bh = Math.max(1, Math.round(height * quality));
      const canvas = this.renderer.domElement;
      if (canvas.width !== bw || canvas.height !== bh) this.renderer.setSize(bw, bh, false);

      const ratio = width / height;
      if (camera instanceof PerspectiveCamera) {
        camera.aspect = ratio;
        camera.updateProjectionMatrix();
      } else if (camera instanceof OrthographicCamera) {
        const half = this.zoom() / 2;
        camera.left = -ratio * half;
        camera.right = ratio * half;
        camera.bottom = -half;
        camera.top = half;
        camera.updateProjectionMatrix();
      }

      const composer = this.composer();
      if (composer) {
        if (composer !== this.composerFor || bw !== this.composerW || bh !== this.composerH) {
          composer.setSize(bw, bh);
          this.composerFor = composer;
          this.composerW = bw;
          this.composerH = bh;
        }
        composer.render(0); // without a delta, EffectComposer reads a wall-clock timer
      } else {
        this.renderer.render(scene, camera);
      }

      context.save();
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = 'high';
      context.drawImage(this.renderer.domElement, 0, 0, bw, bh, -width / 2, -height / 2, width, height);
      context.restore();
    }

    super.draw(context);
  }

  // A background set on the scene by hand survives a null prop.
  private syncBackground(scene: Scene) {
    const bg = this.background();
    if (bg) {
      if (bg !== this.bgKey || !this.bgColor) {
        this.bgColor = new Color(bg);
        this.bgKey = bg;
      }
      if (scene.background !== this.bgColor) scene.background = this.bgColor;
    } else if (this.bgColor && scene.background === this.bgColor) {
      scene.background = null;
    }
  }

  public override dispose() {
    if (this.isDisposed) return;
    // Nodes are rebuilt on every scene reset; free the GL context now, not at GC.
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    super.dispose();
  }
}
