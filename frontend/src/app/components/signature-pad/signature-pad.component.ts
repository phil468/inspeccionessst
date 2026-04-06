import {
  Component,
  ViewChild,
  ElementRef,
  AfterViewInit,
  Input,
  Output,
  EventEmitter,
  OnDestroy,
  CUSTOM_ELEMENTS_SCHEMA,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonButton, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { trashOutline, colorWandOutline } from 'ionicons/icons';
import SignaturePad from 'signature_pad';

@Component({
  selector: 'app-signature-pad',
  standalone: true,
  imports: [CommonModule, IonButton, IonIcon],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="signature-container">
      <canvas
        #signatureCanvas
        class="signature-canvas"
        (touchstart)="onTouchStart($event)"
      ></canvas>
      <div class="signature-actions">
        <ion-button fill="clear" size="small" color="primary" (click)="smooth()" [disabled]="isEmpty">
          <ion-icon slot="start" name="color-wand-outline"></ion-icon>
          Suavizar
        </ion-button>
        <ion-button fill="clear" size="small" color="danger" (click)="clear()">
          <ion-icon slot="start" name="trash-outline"></ion-icon>
          Limpiar
        </ion-button>
      </div>
    </div>
  `,
  styles: [
    `
      .signature-container {
        border: 1px solid var(--ion-color-medium);
        border-radius: 8px;
        overflow: hidden;
        background: #fff;
      }
      .signature-canvas {
        width: 100%;
        height: 150px;
        display: block;
        touch-action: none;
      }
      .signature-actions {
        display: flex;
        justify-content: flex-end;
        padding: 4px;
        border-top: 1px solid var(--ion-color-light);
      }
    `,
  ],
})
export class SignaturePadComponent implements AfterViewInit, OnDestroy {
  @ViewChild('signatureCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  @Input() initialData?: string;
  @Output() signatureChange = new EventEmitter<string | undefined>();

  private signaturePad!: SignaturePad;
  private resizeObserver?: ResizeObserver;
  isEmpty = true;

  constructor() {
    addIcons({ trashOutline, colorWandOutline });
  }

  ngAfterViewInit() {
    const canvas = this.canvasRef.nativeElement;
    this.signaturePad = new SignaturePad(canvas, {
      backgroundColor: 'rgb(0,0,0,0)',
      minWidth: 0.8,
      maxWidth: 1.2,
      penColor: 'rgb(0, 0, 0)',
      velocityFilterWeight: 0.7,
      throttle: 16,
    });

    this.signaturePad.addEventListener('endStroke', () => {
      this.isEmpty = this.signaturePad.isEmpty();
      this.signatureChange.emit(this.signaturePad.toDataURL('image/png'));
    });

    this.resizeObserver = new ResizeObserver(() => this.resizeCanvas());
    this.resizeObserver.observe(canvas.parentElement!);

    setTimeout(() => {
      this.resizeCanvas();
      if (this.initialData) {
        this.signaturePad.fromDataURL(this.initialData);
        this.isEmpty = false;
      }
    }, 100);
  }

  ngOnDestroy() {
    this.resizeObserver?.disconnect();
  }

  onTouchStart(event: TouchEvent) {
    // Prevent page scroll while signing
    event.preventDefault();
  }

  clear() {
    this.signaturePad.clear();
    this.isEmpty = true;
    this.signatureChange.emit(undefined);
  }

  /**
   * Suaviza los trazos aplicando un filtro de media móvil a los puntos
   * y re-renderiza con grosor fino y uniforme.
   */
  smooth() {
    if (this.signaturePad.isEmpty()) return;

    const data = this.signaturePad.toData();

    const smoothedData = data.map((group: any) => {
      const points = group.points;
      if (points.length < 3) return group;
      return { ...group, points: this.applySmoothing(points, 1) };
    });

    // Re-renderizar con trazo más fino y uniforme
    const origMin = this.signaturePad.minWidth;
    const origMax = this.signaturePad.maxWidth;
    this.signaturePad.minWidth = 0.8;
    this.signaturePad.maxWidth = 1.2;

    this.signaturePad.clear();
    this.signaturePad.fromData(smoothedData);

    this.signaturePad.minWidth = origMin;
    this.signaturePad.maxWidth = origMax;

    this.signatureChange.emit(this.signaturePad.toDataURL('image/png'));
  }

  /**
   * Filtro de media móvil: promedia cada punto con sus vecinos.
   */
  private applySmoothing(points: any[], passes: number): any[] {
    let result = [...points];

    for (let pass = 0; pass < passes; pass++) {
      const smoothed = [result[0]];
      for (let i = 1; i < result.length - 1; i++) {
        const prev = result[i - 1];
        const curr = result[i];
        const next = result[i + 1];
        smoothed.push({
          ...curr,
          x: prev.x * 0.25 + curr.x * 0.5 + next.x * 0.25,
          y: prev.y * 0.25 + curr.y * 0.5 + next.y * 0.25,
        });
      }
      smoothed.push(result[result.length - 1]);
      result = smoothed;
    }

    return result;
  }

  private resizeCanvas() {
    const canvas = this.canvasRef.nativeElement;
    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.parentElement!.getBoundingClientRect();
    canvas.width = rect.width * ratio;
    canvas.height = 150 * ratio;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = '150px';
    canvas.getContext('2d')!.scale(ratio, ratio);
    this.signaturePad.clear();
  }
}
