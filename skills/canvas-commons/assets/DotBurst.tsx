import {Node, NodeProps, initial, signal} from '@canvas-commons/2d';
import {BBox, SimpleSignal, SignalValue, clampRemap} from '@canvas-commons/core';

export interface DotBurstProps extends NodeProps {
  progress?: SignalValue<number>;
  rays?: SignalValue<number>;
  ringRadius?: SignalValue<number>;
  rayLength?: SignalValue<number>;
  dotRadius?: SignalValue<number>;
  color?: SignalValue<string>;
  lineWidth?: SignalValue<number>;
}

export class DotBurst extends Node {
  @initial(0) @signal() declare public readonly progress: SimpleSignal<number, this>;
  @initial(48) @signal() declare public readonly rays: SimpleSignal<number, this>;
  @initial(90) @signal() declare public readonly ringRadius: SimpleSignal<number, this>;
  @initial(220) @signal() declare public readonly rayLength: SimpleSignal<number, this>;
  @initial(3) @signal() declare public readonly dotRadius: SimpleSignal<number, this>;
  @initial('#E0306E') @signal() declare public readonly color: SimpleSignal<string, this>;
  @initial(2) @signal() declare public readonly lineWidth: SimpleSignal<number, this>;

  public constructor(props: DotBurstProps) {
    super(props);
  }

  // Without this, `cache`, filters or shadows clip the drawing away.
  protected override getCacheBBox(): BBox {
    const rays = this.ringRadius() * 0.25 + this.rayLength() + this.lineWidth();
    const R = Math.max(rays, this.ringRadius()) + this.dotRadius();
    return new BBox(-R, -R, R * 2, R * 2);
  }

  protected override draw(context: CanvasRenderingContext2D) {
    const p = this.progress();
    const n = Math.max(1, Math.round(this.rays()));
    const R = this.ringRadius();
    const L = this.rayLength();
    const col = this.color();

    const contract = clampRemap(0, 0.4, 0, 1, p);
    const burst = clampRemap(0.45, 1, 0, 1, p);
    const dotAlpha = clampRemap(0.4, 0.6, 1, 0, p);

    context.save();
    context.fillStyle = col;
    context.strokeStyle = col;
    context.lineWidth = this.lineWidth();
    context.lineCap = 'round';

    const dr = R * (1 - contract);
    const inner = R * 0.25;
    const outer = inner + L * burst;

    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const cos = Math.cos(a);
      const sin = Math.sin(a);

      if (burst > 0) {
        context.globalAlpha = burst;
        context.beginPath();
        context.moveTo(cos * inner, sin * inner);
        context.lineTo(cos * outer, sin * outer);
        context.stroke();
      }

      if (dotAlpha > 0) {
        context.globalAlpha = dotAlpha;
        context.beginPath();
        context.arc(cos * dr, sin * dr, this.dotRadius(), 0, Math.PI * 2);
        context.fill();
      }
    }

    context.restore();
    super.draw(context);
  }
}
