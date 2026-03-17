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
import { trashOutline } from 'ionicons/icons';
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

  constructor() {
    addIcons({ trashOutline });
  }

  ngAfterViewInit() {
    const canvas = this.canvasRef.nativeElement;
    this.signaturePad = new SignaturePad(canvas, {
      backgroundColor: 'rgb(255, 255, 255)',
      penColor: 'rgb(0, 0, 0)',
    });

    this.signaturePad.addEventListener('endStroke', () => {
      this.signatureChange.emit(this.signaturePad.toDataURL('image/png'));
    });

    this.resizeObserver = new ResizeObserver(() => this.resizeCanvas());
    this.resizeObserver.observe(canvas.parentElement!);

    setTimeout(() => {
      this.resizeCanvas();
      if (this.initialData) {
        this.signaturePad.fromDataURL(this.initialData);
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
    this.signatureChange.emit(undefined);
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
