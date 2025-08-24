import * as PIXI from 'pixi.js';

export interface TouchInput {
  id: number;
  position: { x: number; y: number };
  startPosition: { x: number; y: number };
  startTime: number;
  lastPosition: { x: number; y: number };
  velocity: { x: number; y: number };
}

export interface GestureEvent {
  type: 'tap' | 'double-tap' | 'long-press' | 'pan' | 'pinch' | 'swipe';
  position: { x: number; y: number };
  data?: Record<string, unknown>;
}

export class TouchControls extends PIXI.EventEmitter {
  private app: PIXI.Application;
  private activeTouches: Map<number, TouchInput> = new Map();
  private lastTapTime: number = 0;
  private tapDelay: number = 300;
  private longPressDelay: number = 500;
  private panThreshold: number = 10;
  private swipeThreshold: number = 50;
  private pinchThreshold: number = 10;
  private longPressTimer?: NodeJS.Timeout;
  private enabled: boolean = true;

  constructor(app: PIXI.Application) {
    super();
    this.app = app;
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    const canvas = this.app.canvas;

    canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    canvas.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    canvas.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
    canvas.addEventListener('touchcancel', this.handleTouchCancel.bind(this), { passive: false });

    canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));

    // Wheel events disabled to prevent zoom
    // canvas.addEventListener('wheel', this.handleWheel.bind(this), { passive: false });
  }

  private handleTouchStart(event: TouchEvent): void {
    if (!this.enabled) return;
    event.preventDefault();

    Array.from(event.changedTouches).forEach(touch => {
      const rect = this.app.canvas.getBoundingClientRect();
      const x = (touch.clientX - rect.left) * this.app.canvas.width / rect.width;
      const y = (touch.clientY - rect.top) * this.app.canvas.height / rect.height;

      const touchInput: TouchInput = {
        id: touch.identifier,
        position: { x, y },
        startPosition: { x, y },
        startTime: performance.now(),
        lastPosition: { x, y },
        velocity: { x: 0, y: 0 },
      };

      this.activeTouches.set(touch.identifier, touchInput);
    });

    if (this.activeTouches.size === 1) {
      this.startLongPressTimer();
    }

    if (this.activeTouches.size === 2) {
      this.clearLongPressTimer();
    }
  }

  private handleTouchMove(event: TouchEvent): void {
    if (!this.enabled) return;
    event.preventDefault();

    Array.from(event.changedTouches).forEach(touch => {
      const touchInput = this.activeTouches.get(touch.identifier);
      if (!touchInput) return;

      const rect = this.app.canvas.getBoundingClientRect();
      const x = (touch.clientX - rect.left) * this.app.canvas.width / rect.width;
      const y = (touch.clientY - rect.top) * this.app.canvas.height / rect.height;

      const deltaTime = performance.now() - touchInput.startTime;
      const deltaX = x - touchInput.lastPosition.x;
      const deltaY = y - touchInput.lastPosition.y;

      if (deltaTime > 0) {
        touchInput.velocity.x = deltaX / (deltaTime / 1000);
        touchInput.velocity.y = deltaY / (deltaTime / 1000);
      }

      touchInput.lastPosition = { x: touchInput.position.x, y: touchInput.position.y };
      touchInput.position = { x, y };
    });

    this.clearLongPressTimer();
    this.handleGestures();
  }

  private handleTouchEnd(event: TouchEvent): void {
    if (!this.enabled) return;
    event.preventDefault();

    Array.from(event.changedTouches).forEach(touch => {
      const touchInput = this.activeTouches.get(touch.identifier);
      if (!touchInput) return;

      const duration = performance.now() - touchInput.startTime;
      const distance = Math.sqrt(
        Math.pow(touchInput.position.x - touchInput.startPosition.x, 2) +
        Math.pow(touchInput.position.y - touchInput.startPosition.y, 2)
      );

      if (duration < this.tapDelay && distance < this.panThreshold) {
        this.handleTap(touchInput);
      } else if (distance > this.swipeThreshold) {
        this.handleSwipe(touchInput);
      }

      this.activeTouches.delete(touch.identifier);
    });

    this.clearLongPressTimer();
  }

  private handleTouchCancel(event: TouchEvent): void {
    if (!this.enabled) return;

    Array.from(event.changedTouches).forEach(touch => {
      this.activeTouches.delete(touch.identifier);
    });

    this.clearLongPressTimer();
  }

  private handleMouseDown(event: MouseEvent): void {
    if (!this.enabled || event.touches) return;

    const rect = this.app.canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) * this.app.canvas.width / rect.width;
    const y = (event.clientY - rect.top) * this.app.canvas.height / rect.height;

    const touchInput: TouchInput = {
      id: -1,
      position: { x, y },
      startPosition: { x, y },
      startTime: performance.now(),
      lastPosition: { x, y },
      velocity: { x: 0, y: 0 },
    };

    this.activeTouches.set(-1, touchInput);
    this.startLongPressTimer();
  }

  private handleMouseMove(event: MouseEvent): void {
    if (!this.enabled || event.touches) return;

    const touchInput = this.activeTouches.get(-1);
    if (!touchInput) return;

    const rect = this.app.canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) * this.app.canvas.width / rect.width;
    const y = (event.clientY - rect.top) * this.app.canvas.height / rect.height;

    const deltaTime = performance.now() - touchInput.startTime;
    const deltaX = x - touchInput.lastPosition.x;
    const deltaY = y - touchInput.lastPosition.y;

    if (deltaTime > 0) {
      touchInput.velocity.x = deltaX / (deltaTime / 1000);
      touchInput.velocity.y = deltaY / (deltaTime / 1000);
    }

    touchInput.lastPosition = { x: touchInput.position.x, y: touchInput.position.y };
    touchInput.position = { x, y };

    this.clearLongPressTimer();
    this.handleGestures();
  }

  private handleMouseUp(event: MouseEvent): void {
    if (!this.enabled || event.touches) return;

    const touchInput = this.activeTouches.get(-1);
    if (!touchInput) return;

    const duration = performance.now() - touchInput.startTime;
    const distance = Math.sqrt(
      Math.pow(touchInput.position.x - touchInput.startPosition.x, 2) +
      Math.pow(touchInput.position.y - touchInput.startPosition.y, 2)
    );

    if (duration < this.tapDelay && distance < this.panThreshold) {
      this.handleTap(touchInput);
    } else if (distance > this.swipeThreshold) {
      this.handleSwipe(touchInput);
    }

    this.activeTouches.delete(-1);
    this.clearLongPressTimer();
  }

  private handleWheel(event: WheelEvent): void {
    if (!this.enabled) return;
    event.preventDefault();

    const rect = this.app.canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) * this.app.canvas.width / rect.width;
    const y = (event.clientY - rect.top) * this.app.canvas.height / rect.height;

    this.emit('zoom', {
      type: 'zoom',
      position: { x, y },
      data: { delta: event.deltaY > 0 ? -0.1 : 0.1 }
    });
  }

  private handleTap(touchInput: TouchInput): void {
    const now = performance.now();
    const timeSinceLastTap = now - this.lastTapTime;

    if (timeSinceLastTap < this.tapDelay) {
      this.emit('gesture', {
        type: 'double-tap',
        position: touchInput.position,
      } as GestureEvent);
    } else {
      this.emit('gesture', {
        type: 'tap',
        position: touchInput.position,
      } as GestureEvent);
    }

    this.lastTapTime = now;
  }

  private handleSwipe(touchInput: TouchInput): void {
    const deltaX = touchInput.position.x - touchInput.startPosition.x;
    const deltaY = touchInput.position.y - touchInput.startPosition.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    if (distance < this.swipeThreshold) return;

    const angle = Math.atan2(deltaY, deltaX);
    let direction: string;

    if (Math.abs(angle) < Math.PI / 4) {
      direction = 'right';
    } else if (Math.abs(angle) > 3 * Math.PI / 4) {
      direction = 'left';
    } else if (angle > 0) {
      direction = 'down';
    } else {
      direction = 'up';
    }

    this.emit('gesture', {
      type: 'swipe',
      position: touchInput.position,
      data: { direction, distance, velocity: touchInput.velocity }
    } as GestureEvent);
  }

  private handleGestures(): void {
    if (this.activeTouches.size === 1) {
      const touch = Array.from(this.activeTouches.values())[0];
      const distance = Math.sqrt(
        Math.pow(touch.position.x - touch.startPosition.x, 2) +
        Math.pow(touch.position.y - touch.startPosition.y, 2)
      );

      if (distance > this.panThreshold) {
        this.emit('gesture', {
          type: 'pan',
          position: touch.position,
          data: {
            delta: {
              x: touch.position.x - touch.lastPosition.x,
              y: touch.position.y - touch.lastPosition.y,
            },
            velocity: touch.velocity,
          }
        } as GestureEvent);
      }
    } else if (this.activeTouches.size === 2) {
      const touches = Array.from(this.activeTouches.values());
      const distance = Math.sqrt(
        Math.pow(touches[0].position.x - touches[1].position.x, 2) +
        Math.pow(touches[0].position.y - touches[1].position.y, 2)
      );
      
      const startDistance = Math.sqrt(
        Math.pow(touches[0].startPosition.x - touches[1].startPosition.x, 2) +
        Math.pow(touches[0].startPosition.y - touches[1].startPosition.y, 2)
      );

      if (Math.abs(distance - startDistance) > this.pinchThreshold) {
        const center = {
          x: (touches[0].position.x + touches[1].position.x) / 2,
          y: (touches[0].position.y + touches[1].position.y) / 2,
        };

        this.emit('gesture', {
          type: 'pinch',
          position: center,
          data: {
            scale: distance / startDistance,
            distance,
            startDistance,
          }
        } as GestureEvent);
      }
    }
  }

  private startLongPressTimer(): void {
    this.clearLongPressTimer();
    
    this.longPressTimer = setTimeout(() => {
      const touch = Array.from(this.activeTouches.values())[0];
      if (touch) {
        this.emit('gesture', {
          type: 'long-press',
          position: touch.position,
        } as GestureEvent);
      }
    }, this.longPressDelay);
  }

  private clearLongPressTimer(): void {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = undefined;
    }
  }

  enable(): void {
    this.enabled = true;
  }

  disable(): void {
    this.enabled = false;
    this.activeTouches.clear();
    this.clearLongPressTimer();
  }

  getActiveTouches(): TouchInput[] {
    return Array.from(this.activeTouches.values());
  }

  destroy(): void {
    this.disable();
    this.removeAllListeners();
  }
}