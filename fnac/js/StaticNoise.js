// 静态噪点效果
class StaticNoise {
    constructor() {
        this.canvas = document.getElementById('static-canvas');
        if (!this.canvas) {
            console.error('Static canvas not found');
            return;
        }
        
        this.ctx = this.canvas.getContext('2d');
        this.offscreenCanvas = document.createElement('canvas');
        this.offscreenCtx = this.offscreenCanvas.getContext('2d');
        this.isRunning = false;
        this.animationId = null;
        this.lastFrameTime = 0;
        this.performanceProfile = this.getPerformanceProfile();
        this.renderScale = this.performanceProfile.renderScale;
        this.targetFrameInterval = 1000 / this.performanceProfile.targetFps;
        this.imageData = null;
        this.noiseBuffer = null;
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    getPerformanceProfile() {
        const memory = navigator.deviceMemory || 8;
        const cores = navigator.hardwareConcurrency || 8;

        if (memory <= 4 || cores <= 4) {
            return { renderScale: 0.3, targetFps: 18, alpha: 140 };
        }

        if (memory <= 8 || cores <= 8) {
            return { renderScale: 0.4, targetFps: 24, alpha: 160 };
        }

        return { renderScale: 0.5, targetFps: 30, alpha: 180 };
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.noiseWidth = Math.max(1, Math.floor(window.innerWidth * this.renderScale));
        this.noiseHeight = Math.max(1, Math.floor(window.innerHeight * this.renderScale));
        this.offscreenCanvas.width = this.noiseWidth;
        this.offscreenCanvas.height = this.noiseHeight;
        this.imageData = this.offscreenCtx.createImageData(this.noiseWidth, this.noiseHeight);
        this.noiseBuffer = this.imageData.data;
        this.ctx.imageSmoothingEnabled = false;
        this.offscreenCtx.imageSmoothingEnabled = false;
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.canvas.style.display = 'block';
        this.lastFrameTime = 0;
        this.animationId = requestAnimationFrame((timestamp) => this.animate(timestamp));
    }

    stop() {
        this.isRunning = false;
        this.canvas.style.display = 'none';
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    animate(timestamp) {
        if (!this.ctx || !this.isRunning) return;

        if (!this.lastFrameTime) {
            this.lastFrameTime = timestamp;
        }

        if (timestamp - this.lastFrameTime < this.targetFrameInterval) {
            this.animationId = requestAnimationFrame((nextTimestamp) => this.animate(nextTimestamp));
            return;
        }

        this.lastFrameTime = timestamp;

        // 以更低分辨率和受控刷新率生成噪点，降低低端设备压力
        for (let i = 0; i < this.noiseBuffer.length; i += 4) {
            const value = Math.random() > 0.5 ? 255 : 0;
            this.noiseBuffer[i] = value;
            this.noiseBuffer[i + 1] = value;
            this.noiseBuffer[i + 2] = value;
            this.noiseBuffer[i + 3] = Math.random() * this.performanceProfile.alpha;
        }

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.offscreenCtx.putImageData(this.imageData, 0, 0);
        this.ctx.drawImage(
            this.offscreenCanvas,
            0,
            0,
            this.noiseWidth,
            this.noiseHeight,
            0,
            0,
            this.canvas.width,
            this.canvas.height
        );

        this.animationId = requestAnimationFrame((nextTimestamp) => this.animate(nextTimestamp));
    }
}
