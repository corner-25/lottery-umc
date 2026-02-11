/* ============================================
   CONFETTI & EFFECTS - Hiệu ứng pháo hoa
   Phiên bản NÂNG CẤP - rực rỡ hơn
   ============================================ */

class ConfettiManager {
    static canvas = null;
    static ctx = null;
    static particles = [];
    static animating = false;
    static animId = null;

    static init() {
        if (ConfettiManager.canvas) return;

        ConfettiManager.canvas = document.createElement('canvas');
        ConfettiManager.canvas.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            z-index: 9999; pointer-events: none;
        `;
        ConfettiManager.canvas.width = window.innerWidth;
        ConfettiManager.canvas.height = window.innerHeight;
        document.body.appendChild(ConfettiManager.canvas);
        ConfettiManager.ctx = ConfettiManager.canvas.getContext('2d');

        window.addEventListener('resize', () => {
            if (ConfettiManager.canvas) {
                ConfettiManager.canvas.width = window.innerWidth;
                ConfettiManager.canvas.height = window.innerHeight;
            }
        });
    }

    static _drawStar(ctx, x, y, size, color, opacity) {
        ctx.save();
        ctx.translate(x, y);
        ctx.globalAlpha = opacity;
        ctx.fillStyle = color;
        ctx.beginPath();
        const spikes = 5;
        const outerR = size;
        const innerR = size * 0.4;
        for (let i = 0; i < spikes * 2; i++) {
            const r = i % 2 === 0 ? outerR : innerR;
            const angle = (Math.PI * i) / spikes - Math.PI / 2;
            if (i === 0) ctx.moveTo(Math.cos(angle) * r, Math.sin(angle) * r);
            else ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    static launch(intensity = 'medium') {
        ConfettiManager.init();

        const counts = { light: 150, medium: 300, heavy: 500 };
        const count = counts[intensity] || 300;
        const colors = [
            '#FFD700', '#FF6347', '#FF4500', '#FF1493', '#00FF7F',
            '#1E90FF', '#FFD700', '#FFA500', '#FF69B4', '#7FFF00',
            '#FF0000', '#FFFF00', '#00FFFF', '#FF00FF', '#FFFFFF',
            '#FFC107', '#E91E63', '#9C27B0', '#00E676', '#F44336'
        ];
        const shapes = ['rect', 'circle', 'star', 'rect', 'circle'];

        // Launch from multiple spread-out points
        for (let i = 0; i < count; i++) {
            const startX = window.innerWidth * (0.1 + Math.random() * 0.8);
            const startY = window.innerHeight * (0.6 + Math.random() * 0.2);

            ConfettiManager.particles.push({
                x: startX,
                y: startY,
                vx: (Math.random() - 0.5) * 20,
                vy: -10 - Math.random() * 20,
                color: colors[Math.floor(Math.random() * colors.length)],
                size: 5 + Math.random() * 10,
                rotation: Math.random() * 360,
                rotationSpeed: (Math.random() - 0.5) * 15,
                gravity: 0.10 + Math.random() * 0.08,
                drag: 0.97 + Math.random() * 0.02,
                opacity: 1,
                shape: shapes[Math.floor(Math.random() * shapes.length)],
                lifetime: 200 + Math.random() * 150,
                age: 0
            });
        }

        if (!ConfettiManager.animating) {
            ConfettiManager.animating = true;
            ConfettiManager._animate();
        }
    }

    static fireworks() {
        ConfettiManager.init();

        const colors = [
            '#FFD700', '#FF0000', '#FF4500', '#FFD700', '#FFFFFF',
            '#FF69B4', '#00FF7F', '#1E90FF', '#FFA500', '#FF1493'
        ];

        // More explosion points spread across the screen
        const centerPoints = [
            { x: window.innerWidth * 0.15, y: window.innerHeight * 0.25 },
            { x: window.innerWidth * 0.4, y: window.innerHeight * 0.15 },
            { x: window.innerWidth * 0.65, y: window.innerHeight * 0.2 },
            { x: window.innerWidth * 0.85, y: window.innerHeight * 0.28 },
            { x: window.innerWidth * 0.5, y: window.innerHeight * 0.35 },
            { x: window.innerWidth * 0.25, y: window.innerHeight * 0.4 },
            { x: window.innerWidth * 0.75, y: window.innerHeight * 0.38 },
        ];

        centerPoints.forEach((center, batchIdx) => {
            setTimeout(() => {
                const particleCount = 100 + Math.floor(Math.random() * 40);
                for (let i = 0; i < particleCount; i++) {
                    const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.3;
                    const speed = 4 + Math.random() * 10;

                    ConfettiManager.particles.push({
                        x: center.x,
                        y: center.y,
                        vx: Math.cos(angle) * speed,
                        vy: Math.sin(angle) * speed,
                        color: colors[Math.floor(Math.random() * colors.length)],
                        size: 3 + Math.random() * 6,
                        rotation: Math.random() * 360,
                        rotationSpeed: (Math.random() - 0.5) * 5,
                        gravity: 0.06,
                        drag: 0.97,
                        opacity: 1,
                        shape: Math.random() > 0.6 ? 'star' : 'circle',
                        lifetime: 100 + Math.random() * 80,
                        age: 0,
                        trail: true,
                        glow: true
                    });
                }

                if (!ConfettiManager.animating) {
                    ConfettiManager.animating = true;
                    ConfettiManager._animate();
                }
            }, batchIdx * 250);
        });
    }

    static celebration() {
        // Mega celebration - confetti rain + fireworks waves
        ConfettiManager.launch('heavy');
        setTimeout(() => ConfettiManager.fireworks(), 300);
        setTimeout(() => ConfettiManager.launch('heavy'), 1200);
        setTimeout(() => ConfettiManager.fireworks(), 2000);
        setTimeout(() => ConfettiManager.launch('medium'), 3000);
    }

    static _animate() {
        const ctx = ConfettiManager.ctx;
        const canvas = ConfettiManager.canvas;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ConfettiManager.particles = ConfettiManager.particles.filter(p => {
            p.age++;
            if (p.age > p.lifetime) return false;

            p.vy += p.gravity;
            p.vx *= p.drag;
            p.vy *= p.drag;
            p.x += p.vx;
            p.y += p.vy;
            p.rotation += p.rotationSpeed;

            const lifeProgress = p.age / p.lifetime;
            p.opacity = lifeProgress > 0.6 ? 1 - (lifeProgress - 0.6) / 0.4 : 1;

            // Draw glow behind particle
            if (p.glow && p.opacity > 0.4) {
                ctx.save();
                ctx.globalAlpha = p.opacity * 0.3;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.fill();
                ctx.restore();
            }

            // Draw trail
            if (p.trail && p.opacity > 0.3) {
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(p.x - p.vx * 3, p.y - p.vy * 3);
                const alpha = Math.max(0, Math.min(255, Math.floor(p.opacity * 120)));
                ctx.strokeStyle = p.color + alpha.toString(16).padStart(2, '0');
                ctx.lineWidth = p.size * 0.6;
                ctx.lineCap = 'round';
                ctx.stroke();
            }

            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation * Math.PI / 180);
            ctx.globalAlpha = p.opacity;

            if (p.shape === 'star') {
                ConfettiManager._drawStar(ctx, 0, 0, p.size, p.color, p.opacity);
                ctx.restore();
                return true;
            } else if (p.shape === 'rect') {
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
            } else {
                ctx.beginPath();
                ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.fill();
            }

            ctx.restore();
            return true;
        });

        if (ConfettiManager.particles.length > 0) {
            ConfettiManager.animId = requestAnimationFrame(() => ConfettiManager._animate());
        } else {
            ConfettiManager.animating = false;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }

    static stop() {
        ConfettiManager.particles = [];
        ConfettiManager.animating = false;
        if (ConfettiManager.animId) {
            cancelAnimationFrame(ConfettiManager.animId);
        }
        if (ConfettiManager.ctx && ConfettiManager.canvas) {
            ConfettiManager.ctx.clearRect(0, 0, ConfettiManager.canvas.width, ConfettiManager.canvas.height);
        }
    }
}

/* ============================================
   BACKGROUND PARTICLES - Hạt bay nền
   ============================================ */

class BackgroundParticles {
    static init(container) {
        // Gold particles (giữ lại)
        for (let i = 0; i < 15; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.animationDelay = Math.random() * 6 + 's';
            particle.style.animationDuration = (4 + Math.random() * 4) + 's';
            particle.style.width = (2 + Math.random() * 4) + 'px';
            particle.style.height = particle.style.width;
            container.appendChild(particle);
        }

        // Hoa mai + hoa đào rơi
        const petalTypes = ['petal-mai', 'petal-dao', 'petal-mai', 'petal-dao', 'petal-mai-full'];
        for (let i = 0; i < 25; i++) {
            const petal = document.createElement('div');
            const type = petalTypes[Math.floor(Math.random() * petalTypes.length)];
            petal.className = 'petal ' + type;
            petal.style.left = Math.random() * 100 + '%';
            petal.style.animationDelay = Math.random() * 12 + 's';
            petal.style.animationDuration = (8 + Math.random() * 8) + 's';

            const scale = 0.6 + Math.random() * 0.8;
            petal.style.setProperty('--scale', scale);
            if (type !== 'petal-mai-full') {
                petal.style.width = (8 + Math.random() * 6) * scale + 'px';
                petal.style.height = (10 + Math.random() * 6) * scale + 'px';
            } else {
                const s = (14 + Math.random() * 8) * scale;
                petal.style.width = s + 'px';
                petal.style.height = s + 'px';
            }

            container.appendChild(petal);
        }
    }
}
