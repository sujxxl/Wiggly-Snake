import { Component, ElementRef, ViewChild, signal, inject, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AudioService } from './services/audio.service';

interface Point {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.component.html',
  styleUrls: []
})
export class AppComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  private audioService = inject(AudioService);

  // State
  hasInteracted = signal(false);
  warningDismissed = signal(false);
  showWarningModal = signal(false);
  private ctx: CanvasRenderingContext2D | null = null;
  private animationFrameId: number = 0;

  // Physics Constants
  private readonly NUM_SEGMENTS = 30; // Reduced slightly for tighter simulation
  private readonly SPRING_STRENGTH = 0.8 // Stronger springs
  private readonly FRICTION = 0.9; // Standard friction
  private readonly BASE_GRAVITY = 0; // Removed gravity/buoyancy completely for stability
  private readonly MAX_VELOCITY = 40; // Higher clamp

  // Dynamic Physics State
  private restLength = 20; // Will be calculated based on screen height

  // State Variables
  private segments: Point[] = [];

  // Input State
  private mouseX = 0;
  private mouseY = 0;
  private lastMouseX = 0;
  private lastMouseY = 0;
  private velocity = 0;

  // Interaction State
  private lastInteractionTime = 0;

  // Chaos Mode
  private chaosLevel = 0; 
  private chaosReleaseTime = 0; 
  private sustainedChaos = 0; 
  private readonly CHAOS_THRESHOLD = 0.9; 
  
  private backgroundColor = 'rgba(0, 0, 0, 1)';

  // Screen Shake
  private shakeX = 0;
  private shakeY = 0;

constructor() {
  this.initSegments();
}

  private initSegments() {
  this.segments = [];
  for (let i = 0; i < this.NUM_SEGMENTS; i++) {
    this.segments.push({ x: 0, y: 0, vx: 0, vy: 0 });
  }
}

ngAfterViewInit() {
  const canvas = this.canvasRef.nativeElement;
  this.ctx = canvas.getContext('2d', { alpha: false });

  // Initial Setup
  this.resizeCanvas();
  this.initInputListeners();

  // Initial positions (Center screen)
  const cx = canvas.width / 2;
  const cy = canvas.height / 3;

  this.mouseX = cx;
  this.mouseY = cy / 3; // Start higher up
  this.lastMouseX = this.mouseX;
  this.lastMouseY = this.mouseY;
  this.lastInteractionTime = Date.now();

  this.resetSnakePositions(cx, canvas.height);
  this.draw();
}

  private resetSnakePositions(cx: number, height: number) {
  // Reset velocities
  for (let i = 0; i < this.NUM_SEGMENTS; i++) {
    this.segments[i].x = cx;
    // Distribute from top (mouse) to bottom (fixed)
    // Actually, let's just stack them from bottom up
    this.segments[i].y = height - ((this.NUM_SEGMENTS - 1 - i) * this.restLength);
    this.segments[i].vx = 0;
    this.segments[i].vy = 0;
  }
}

ngOnDestroy() {
  if (this.animationFrameId) {
    cancelAnimationFrame(this.animationFrameId);
  }
  window.removeEventListener('resize', this.resizeCanvas);
  window.removeEventListener('mousemove', this.handleMouseMove);
  window.removeEventListener('touchmove', this.handleTouchMove);
  window.removeEventListener('touchstart', this.handleTouchStart);
  window.removeEventListener('click', this.activateAudio);
}

dismissWarning() {
  this.warningDismissed.set(true);
  this.animate(); // Start animation after warning is dismissed
}

toggleWarningModal() {
  this.showWarningModal.set(!this.showWarningModal());
}

  private resizeCanvas = () => {
  if (!this.canvasRef) return;
  const canvas = this.canvasRef.nativeElement;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  // Calculate dynamic rest length so the snake fits exactly from bottom to top
  // We leave a little slack (0.9) so it's not perfectly taut
  this.restLength = (canvas.height * 0) / this.NUM_SEGMENTS;

  // Don't full reset positions on resize, just update constraints
};

  private initInputListeners() {
  window.addEventListener('resize', this.resizeCanvas);
  window.addEventListener('mousemove', this.handleMouseMove);
  window.addEventListener('touchmove', this.handleTouchMove, { passive: false });
  window.addEventListener('touchstart', this.handleTouchStart, { passive: false });
  window.addEventListener('click', this.activateAudio);
}

  private activateAudio = () => {
  if (!this.hasInteracted()) {
    this.hasInteracted.set(true);
    this.audioService.init();
  }
};

  private handleMouseMove = (e: MouseEvent) => {
  this.activateAudio();
  this.mouseX = e.clientX;
  this.mouseY = e.clientY;
  this.lastInteractionTime = Date.now();
};

  private handleTouchMove = (e: TouchEvent) => {
  e.preventDefault();
  this.activateAudio();
  if (e.touches.length > 0) {
    this.mouseX = e.touches[0].clientX;
    this.mouseY = e.touches[0].clientY;
    this.lastInteractionTime = Date.now();
  }
};

  private handleTouchStart = (e: TouchEvent) => {
  this.activateAudio();
  if (e.touches.length > 0) {
    this.mouseX = e.touches[0].clientX;
    this.mouseY = e.touches[0].clientY;
    this.lastInteractionTime = Date.now();
  }
};

private draw() {
  if (!this.ctx || !this.canvasRef) return;

  const canvas = this.canvasRef.nativeElement;
  const width = canvas.width;
  const height = canvas.height;

  // Static draw with no chaos
  const isChaotic = false;
  const chaosLevel = 0;
  this.shakeX = 0;
  this.shakeY = 0;
  this.backgroundColor = '#000';

  this.ctx.save();
  this.ctx.translate(this.shakeX, this.shakeY);

  this.ctx.fillStyle = this.backgroundColor;
  this.ctx.fillRect(-50, -50, width + 100, height + 100);

  // Snake Visuals
  this.ctx.lineCap = 'round';
  this.ctx.lineJoin = 'round';

  this.ctx.shadowBlur = 0;

  this.ctx.beginPath();

  const startX = this.segments[0].x;
  const startY = this.segments[0].y;

  this.ctx.moveTo(startX, startY);

  for (let i = 1; i < this.NUM_SEGMENTS; i++) {
    const segment = this.segments[i];
    this.ctx.lineTo(segment.x, segment.y);
  }

  this.ctx.strokeStyle = '#f0f0f0';
  let baseWidth = 8;

  this.ctx.lineWidth = baseWidth;

  this.ctx.stroke();

  this.drawFace(startX, startY, isChaotic);

  this.ctx.restore();
}

  private animate = () => {
  if (!this.ctx || !this.canvasRef) return;

  const canvas = this.canvasRef.nativeElement;
  const width = canvas.width;
  const height = canvas.height;
  const cx = width / 2;
  const cy = height / 2;

  // --- 1. IDLE & TARGET LOGIC ---
  let targetX = this.mouseX;
  let targetY = this.mouseY;

  // If idle for > 1s, drift proxy to center-top area
  // This creates the "standing up" behavior without negative gravity
  const isIdle = Date.now() - this.lastInteractionTime > 1000;

  if (isIdle) {
    // Return to center x, and 20% from top y
    const idleTargetX = cx;
    const idleTargetY = height * 0.2;

    this.mouseX += (idleTargetX - this.mouseX) * 0.05;
    this.mouseY += (idleTargetY - this.mouseY) * 0.05;

    targetX = this.mouseX;
    targetY = this.mouseY;
    this.velocity *= 0.9;
  }

  // --- 2. CHAOS CALCULATION ---
  const dx = this.mouseX - this.lastMouseX;
  const dy = this.mouseY - this.lastMouseY;
  const instantVelocity = Math.sqrt(dx * dx + dy * dy);

  this.velocity = this.velocity * 0.9 + instantVelocity * 0.1;
  this.lastMouseX = this.mouseX;
  this.lastMouseY = this.mouseY;

  const inputChaos = Math.min(this.velocity / 70, 1);

  if (inputChaos > 0.3) {
    this.chaosReleaseTime = Date.now() + 1500;
    this.sustainedChaos = Math.max(this.sustainedChaos, inputChaos);
  }

  let targetChaos = inputChaos;
  if (Date.now() < this.chaosReleaseTime) {
    targetChaos = Math.max(targetChaos, this.sustainedChaos);
  } else {
    this.sustainedChaos = 0;
  }

  if (targetChaos > this.chaosLevel) {
    this.chaosLevel = targetChaos;
  } else {
    this.chaosLevel *= 0.96;
  }

  if (this.chaosLevel < 0.01) this.chaosLevel = 0;

  this.audioService.update(this.chaosLevel);

  // --- 3. PHYSICS SOLVER ---
  const head = this.segments[0];

  // Head follows mouse directly but with spring-like ease
  const headPull = isIdle ? 0.1 : 0.15;
  head.vx += (targetX - head.x) * headPull;
  head.vy += (targetY - head.y) * headPull;

  // Spring Physics
  for (let i = 0; i < this.NUM_SEGMENTS - 1; i++) {
    const p1 = this.segments[i];
    const p2 = this.segments[i + 1];

    const segDx = p2.x - p1.x;
    const segDy = p2.y - p1.y;
    const dist = Math.sqrt(segDx * segDx + segDy * segDy);

    if (dist > 0) {
      // Hooke's Law
      const displacement = dist - this.restLength;

      // Normalize
      const nx = segDx / dist;
      const ny = segDy / dist;

      // Spring Force
      const force = displacement * this.SPRING_STRENGTH;

      const fx = nx * force;
      const fy = ny * force;

      p1.vx += fx;
      p1.vy += fy;
      p2.vx -= fx;
      p2.vy -= fy;
    }

    // Zero Gravity - Pure structural physics
    p1.vy += this.BASE_GRAVITY;
  }

  // Update Positions
  for (let i = 0; i < this.NUM_SEGMENTS; i++) {
    const p = this.segments[i];

    p.vx *= this.FRICTION;
    p.vy *= this.FRICTION;

    // Hard Clamp
    p.vx = Math.max(-this.MAX_VELOCITY, Math.min(this.MAX_VELOCITY, p.vx));
    p.vy = Math.max(-this.MAX_VELOCITY, Math.min(this.MAX_VELOCITY, p.vy));

    p.x += p.vx;
    p.y += p.vy;
  }

  // --- 4. HARD CONSTRAINTS ---
  const tail = this.segments[this.NUM_SEGMENTS - 1];
  tail.x = cx;
  tail.y = height;
  tail.vx = 0;
  tail.vy = 0;

  // --- 5. RENDER ---
  const isChaotic = this.chaosLevel > this.CHAOS_THRESHOLD;

  if (isChaotic) {
    const shakeAmt = this.chaosLevel * 25;
    this.shakeX = (Math.random() - 0.5) * shakeAmt;
    this.shakeY = (Math.random() - 0.5) * shakeAmt;

    if (Math.random() > 0.85) {
      this.backgroundColor = `hsl(${Math.random() * 360}, 100%, 50%)`;
    } else if (Math.random() > 0.95) {
      this.backgroundColor = '#fff';
    } else {
      this.backgroundColor = '#000';
    }
  } else {
    this.shakeX = 0;
    this.shakeY = 0;
    this.backgroundColor = 'rgba(0, 0, 0, 0.25)';
  }

  this.ctx.save();
  this.ctx.translate(this.shakeX, this.shakeY);

  this.ctx.fillStyle = this.backgroundColor;
  this.ctx.fillRect(-50, -50, width + 100, height + 100);

  if (isChaotic) {
    this.drawChaosGraphics(width, height);
  }

  // Snake Visuals
  this.ctx.lineCap = 'round';
  this.ctx.lineJoin = 'round';

  if (isChaotic) {
    this.ctx.shadowBlur = 50 * this.chaosLevel;
    this.ctx.shadowColor = `hsl(${Math.random() * 360}, 100%, 50%)`;
  } else {
    this.ctx.shadowBlur = 0;
  }

  this.ctx.beginPath();

  // Head Position with Chaos Jitter
  let startX = this.segments[0].x;
  let startY = this.segments[0].y;

  if (isChaotic) {
    startX += (Math.random() - 0.5) * this.chaosLevel * 20;
    startY += (Math.random() - 0.5) * this.chaosLevel * 20;
  }

  this.ctx.moveTo(startX, startY);

  // Dynamic Width Calculation
  // Base width changes with Chaos
  const baseWidth = isChaotic ? 60 + (this.chaosLevel * 40) : 70;

  for (let i = 1; i < this.NUM_SEGMENTS; i++) {
    let p = this.segments[i];
    let px = p.x;
    let py = p.y;

    if (isChaotic) {
      px += (Math.random() - 0.5) * this.chaosLevel * 15;
    }

    if (i < this.NUM_SEGMENTS - 1) {
      let nextP = this.segments[i + 1];
      let mx = (px + nextP.x) / 2;
      let my = (py + nextP.y) / 2;
      this.ctx.quadraticCurveTo(px, py, mx, my);
    } else {
      this.ctx.lineTo(px, py);
    }
  }

  if (isChaotic) {
    this.ctx.strokeStyle = `hsl(${Date.now() % 360}, 100%, 60%)`;
    this.ctx.lineWidth = baseWidth + (Math.sin(Date.now() / 40) * 20);
  } else {
    this.ctx.strokeStyle = 'hsl(25, 80%, 65%)';
    this.ctx.lineWidth = baseWidth;
  }

  this.ctx.stroke();

  this.drawFace(startX, startY, isChaotic);

  this.ctx.restore();

  this.animationFrameId = requestAnimationFrame(this.animate);
}

  private drawChaosGraphics(width: number, height: number) {
  if (!this.ctx) return;
  const numShapes = Math.floor(this.chaosLevel * 4) + 1;
  this.ctx.save();

  this.ctx.beginPath();
  for (let i = 0; i < numShapes; i++) {
    if (Math.random() > 0.5) {
      this.ctx.moveTo(Math.random() * width, 0);
      this.ctx.lineTo(Math.random() * width, height);
    } else {
      this.ctx.moveTo(0, Math.random() * height);
      this.ctx.lineTo(width, Math.random() * height);
    }
  }
  this.ctx.strokeStyle = `rgba(255, 255, 255, ${Math.random() * 0.5})`;
  this.ctx.lineWidth = Math.random() * 60;
  this.ctx.globalCompositeOperation = 'overlay';
  this.ctx.stroke();
  this.ctx.restore();
}

  private drawFace(x: number, y: number, isChaotic: boolean) {
  if (!this.ctx) return;

  const neck = this.segments[Math.min(2, this.NUM_SEGMENTS - 1)];
  const angle = Math.atan2(y - neck.y, x - neck.x);

  this.ctx.save();
  this.ctx.translate(x, y);
  this.ctx.rotate(angle);

  const scale = 1 + (isChaotic ? this.chaosLevel * 0.6 : 0);

  // Adjusted face sizing
  const eyeOffset = 30 * scale;
  const eyeSize = (22 + (isChaotic ? Math.random() * 15 : 0)) * scale;

  this.ctx.fillStyle = 'white';
  this.ctx.beginPath();
  this.ctx.arc(0, -eyeOffset, eyeSize, 0, Math.PI * 2);
  this.ctx.arc(0, eyeOffset, eyeSize, 0, Math.PI * 2);
  this.ctx.fill();

  this.ctx.fillStyle = 'black';
  this.ctx.beginPath();
  let px = 8 * scale;
  let py = 0;

  if (isChaotic) {
    px += (Math.random() - 0.5) * 20;
    py += (Math.random() - 0.5) * 20;
  }

  this.ctx.arc(px, -eyeOffset + py, eyeSize * 0.4, 0, Math.PI * 2);
  this.ctx.arc(px, eyeOffset + py, eyeSize * 0.4, 0, Math.PI * 2);
  this.ctx.fill();

  this.ctx.restore();
}
}