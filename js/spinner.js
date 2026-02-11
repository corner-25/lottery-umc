/* ============================================
   SPINNER - Hiệu ứng quay số Slot Machine
   Hỗ trợ cả chữ và số (alphanumeric)
   ============================================ */

class Spinner {
    constructor(container, digitCount = 6) {
        this.container = container;
        this.digitCount = digitCount;
        this.slots = [];
        this.isSpinning = false;
        this.result = '';
        this.onComplete = null;
        this.spinIntervals = [];
        // Full character set for reels — '-' ở vị trí đầu (mặc định)
        this.chars = '-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        this.init();
    }

    init() {
        this.container.innerHTML = '';
        this.container.className = 'spinner-display';
        this.slots = [];

        for (let i = 0; i < this.digitCount; i++) {
            const slot = document.createElement('div');
            slot.className = 'digit-slot';

            const reel = document.createElement('div');
            reel.className = 'digit-reel';

            // Create character reel
            for (let round = 0; round < 2; round++) {
                for (let c = 0; c < this.chars.length; c++) {
                    const digit = document.createElement('div');
                    digit.className = 'digit';
                    digit.textContent = this.chars[c];
                    reel.appendChild(digit);
                }
            }

            slot.appendChild(reel);
            this.container.appendChild(slot);
            this.slots.push({ element: slot, reel: reel, currentPos: 0 });
        }
    }

    setDigitCount(count) {
        if (count !== this.digitCount) {
            this.digitCount = count;
            this.init();
        }
    }

    _charIndex(ch) {
        const idx = this.chars.indexOf(ch.toUpperCase());
        return idx >= 0 ? idx : 0;
    }

    spin(targetCode, onComplete) {
        if (this.isSpinning) return;
        this.isSpinning = true;
        this.onComplete = onComplete;
        this.result = String(targetCode).toUpperCase();

        // Adjust digit count if needed
        if (this.result.length !== this.digitCount) {
            this.setDigitCount(this.result.length);
        }

        // Reset all slots
        this.slots.forEach(slot => {
            slot.element.classList.remove('stopped');
        });

        // Start spinning all reels
        this.slots.forEach((slot, index) => {
            this._startReel(slot, index);
        });

        // Stop reels one by one with delay
        this.slots.forEach((slot, index) => {
            const targetCharIdx = this._charIndex(this.result[index]);
            const delay = 2000 + (index * 640); // Nhanh hơn 20%

            setTimeout(() => {
                this._stopReel(slot, index, targetCharIdx);
            }, delay);
        });
    }

    _startReel(slot, index) {
        const reel = slot.reel;
        const slotHeight = slot.element.offsetHeight || 110;
        let position = 0;
        let speed = 15 + Math.random() * 10;
        const totalChars = this.chars.length;

        const interval = setInterval(() => {
            position -= speed;
            if (position <= -slotHeight * totalChars) {
                position += slotHeight * totalChars;
            }
            reel.style.transform = `translateY(${position}px)`;
        }, 30);

        this.spinIntervals[index] = { interval, position, speed };
    }

    _stopReel(slot, index, targetCharIdx) {
        const spinData = this.spinIntervals[index];
        if (!spinData) return;

        clearInterval(spinData.interval);

        const slotHeight = slot.element.offsetHeight || 110;
        const targetPosition = -targetCharIdx * slotHeight;
        const totalChars = this.chars.length;

        let currentPos = spinData.position;
        let speed = spinData.speed;
        const decelerate = () => {
            speed *= 0.93; // Giảm tốc nhanh hơn 20%
            currentPos -= speed;

            if (speed < 1) {
                this._animateToPosition(slot.reel, currentPos, targetPosition, () => {
                    slot.element.classList.add('stopped');

                    const allStopped = this.slots.every(s => s.element.classList.contains('stopped'));
                    if (allStopped) {
                        this.isSpinning = false;
                        if (this.onComplete) {
                            setTimeout(() => this.onComplete(this.result), 300);
                        }
                    }
                });
                return;
            }

            if (currentPos <= -slotHeight * totalChars) {
                currentPos += slotHeight * totalChars;
            }
            slot.reel.style.transform = `translateY(${currentPos}px)`;
            requestAnimationFrame(decelerate);
        };

        requestAnimationFrame(decelerate);
        SoundManager.playTick();
    }

    _animateToPosition(reel, fromPos, toPos, callback) {
        const duration = 480; // Nhanh hơn 20%
        const startTime = performance.now();

        const easeOutBounce = (t) => {
            if (t < 1 / 2.75) {
                return 7.5625 * t * t;
            } else if (t < 2 / 2.75) {
                t -= 1.5 / 2.75;
                return 7.5625 * t * t + 0.75;
            } else if (t < 2.5 / 2.75) {
                t -= 2.25 / 2.75;
                return 7.5625 * t * t + 0.9375;
            } else {
                t -= 2.625 / 2.75;
                return 7.5625 * t * t + 0.984375;
            }
        };

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = easeOutBounce(progress);
            const current = fromPos + (toPos - fromPos) * eased;
            reel.style.transform = `translateY(${current}px)`;

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                reel.style.transform = `translateY(${toPos}px)`;
                if (callback) callback();
            }
        };

        requestAnimationFrame(animate);
    }

    reset() {
        this.isSpinning = false;
        this.spinIntervals.forEach(data => {
            if (data && data.interval) clearInterval(data.interval);
        });
        this.spinIntervals = [];
        this.slots.forEach(slot => {
            slot.element.classList.remove('stopped');
            slot.reel.style.transform = 'translateY(0)';
        });
    }

    displayCode(code) {
        const display = String(code).toUpperCase();
        if (display.length !== this.digitCount) {
            this.setDigitCount(display.length);
        }
        this.slots.forEach((slot, index) => {
            const charIdx = this._charIndex(display[index]);
            const slotHeight = slot.element.offsetHeight || 110;
            slot.reel.style.transform = `translateY(${-charIdx * slotHeight}px)`;
            slot.element.classList.add('stopped');
        });
    }
}

/* ============================================
   SOUND MANAGER - Âm thanh
   ============================================ */

class SoundManager {
    static audioCtx = null;
    static enabled = true;

    static init() {
        try {
            SoundManager.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            SoundManager.enabled = false;
        }
    }

    static toggle() {
        SoundManager.enabled = !SoundManager.enabled;
        return SoundManager.enabled;
    }

    static _ensureContext() {
        if (!SoundManager.audioCtx) SoundManager.init();
        if (SoundManager.audioCtx && SoundManager.audioCtx.state === 'suspended') {
            SoundManager.audioCtx.resume();
        }
    }

    static playTick() {
        if (!SoundManager.enabled) return;
        SoundManager._ensureContext();
        const ctx = SoundManager.audioCtx;
        if (!ctx) return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.1);
    }

    static playDrumroll(duration = 2) {
        if (!SoundManager.enabled) return;
        SoundManager._ensureContext();
        const ctx = SoundManager.audioCtx;
        if (!ctx) return;

        const bufferSize = ctx.sampleRate * duration;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            const t = i / ctx.sampleRate;
            const freq = 8 + t * 4;
            const amp = Math.sin(t * freq * Math.PI * 2) > 0 ? 0.15 : 0;
            data[i] = (Math.random() * 2 - 1) * amp * (1 - t / duration * 0.5);
        }

        const source = ctx.createBufferSource();
        source.buffer = buffer;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.4, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + duration);

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, ctx.currentTime);

        source.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        source.start();
        return source;
    }

    static playWin() {
        if (!SoundManager.enabled) return;
        SoundManager._ensureContext();
        const ctx = SoundManager.audioCtx;
        if (!ctx) return;

        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.15);
            gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.15);
            gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + i * 0.15 + 0.05);
            gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + i * 0.15 + 0.3);
            gain.gain.linearRampToValueAtTime(0, ctx.currentTime + i * 0.15 + 0.6);

            osc.start(ctx.currentTime + i * 0.15);
            osc.stop(ctx.currentTime + i * 0.15 + 0.6);
        });
    }
}
