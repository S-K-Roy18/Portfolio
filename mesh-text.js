// WebGL Mesh Text Hover Animation for Desktop Hero
// Adapted from the provided React component to Vanilla JS

const GRID_W = 96;
const GRID_H = 40;
const DRAG = 3.2;
const SPRING_K = 0.08;
const DAMPING = 0.9;
const DT = 0.1;
const CHROMA = 0.005;

const VERT_SRC = `#version 300 es
in vec2 aPos;
in vec2 aUv;
in vec2 aDisp;
out vec2 vUv;
out float vMag;
void main() {
    gl_Position = vec4(aPos + aDisp, 0.0, 1.0);
    vUv = aUv;
    vMag = length(aDisp);
}`;

const FRAG_SRC = `#version 300 es
precision highp float;
in vec2 vUv;
in float vMag;
out vec4 outColor;
uniform sampler2D uTex;
uniform float uChroma;
uniform vec3 uColorA;
uniform vec3 uColorB;
void main() {
    vec4 base = texture(uTex, vUv);
    if (uChroma > 0.0) {
        float o = uChroma * ${CHROMA.toFixed(5)} * clamp(vMag * 8.0, 0.0, 1.0);
        float aOff = texture(uTex, vUv + vec2(o, 0.0)).a;
        float bOff = texture(uTex, vUv - vec2(o, 0.0)).a;
        vec3 col = base.rgb * base.a;
        col += uColorA * max(0.0, aOff - base.a);
        col += uColorB * max(0.0, bOff - base.a);
        float aMax = max(base.a, max(aOff, bOff));
        outColor = vec4(col, aMax);
    } else {
        outColor = base;
    }
}`;

function compile(gl, type, src) {
    const sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        console.error("Shader compile error:", gl.getShaderInfoLog(sh));
        gl.deleteShader(sh);
        return null;
    }
    return sh;
}

function linkProgram(gl, vs, fs) {
    const p = gl.createProgram();
    gl.attachShader(p, vs);
    gl.attachShader(p, fs);
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
        console.error("Program link error:", gl.getProgramInfoLog(p));
        gl.deleteProgram(p);
        return null;
    }
    return p;
}

function parseColor(v) {
    if (typeof v !== "string") return [1, 1, 1];
    const s = v.trim();
    if (s.startsWith("#") && s.length >= 7) {
        const r = parseInt(s.slice(1, 3), 16) / 255;
        const g = parseInt(s.slice(3, 5), 16) / 255;
        const b = parseInt(s.slice(5, 7), 16) / 255;
        if (isFinite(r) && isFinite(g) && isFinite(b)) return [r, g, b];
    }
    return [1, 1, 1];
}

class MeshTextHover {
    constructor(h1Element) {
        this.h1 = h1Element;
        this.canvas = document.createElement("canvas");
        this.canvas.id = "mesh-canvas";
        this.h1.appendChild(this.canvas);
        
        this.gl = this.canvas.getContext("webgl2", {
            alpha: true,
            premultipliedAlpha: true,
            antialias: true,
        });

        if (!this.gl) return;

        this.PADDING = 100;
        
        this.initGL();
        this.bindEvents();
        
        this.rafId = requestAnimationFrame(() => this.tick());
    }

    initGL() {
        const gl = this.gl;
        
        const vertCount = (GRID_W + 1) * (GRID_H + 1);
        this.positions = new Float32Array(vertCount * 2);
        this.uvs = new Float32Array(vertCount * 2);
        for (let y = 0; y <= GRID_H; y++) {
            for (let x = 0; x <= GRID_W; x++) {
                const i = y * (GRID_W + 1) + x;
                const u = x / GRID_W;
                const v = y / GRID_H;
                this.positions[i * 2] = u * 2 - 1;
                this.positions[i * 2 + 1] = 1 - v * 2;
                this.uvs[i * 2] = u;
                this.uvs[i * 2 + 1] = v;
            }
        }
        
        const indexCount = GRID_W * GRID_H * 6;
        this.indices = new Uint32Array(indexCount);
        let idx = 0;
        for (let y = 0; y < GRID_H; y++) {
            for (let x = 0; x < GRID_W; x++) {
                const a = y * (GRID_W + 1) + x;
                const b = a + 1;
                const c = a + (GRID_W + 1);
                const d = c + 1;
                this.indices[idx++] = a;
                this.indices[idx++] = c;
                this.indices[idx++] = b;
                this.indices[idx++] = b;
                this.indices[idx++] = c;
                this.indices[idx++] = d;
            }
        }

        this.disp = new Float32Array(vertCount * 2);
        this.vel = new Float32Array(vertCount * 2);

        this.vs = compile(gl, gl.VERTEX_SHADER, VERT_SRC);
        this.fs = compile(gl, gl.FRAGMENT_SHADER, FRAG_SRC);
        this.program = linkProgram(gl, this.vs, this.fs);

        this.aPos = gl.getAttribLocation(this.program, "aPos");
        this.aUv = gl.getAttribLocation(this.program, "aUv");
        this.aDisp = gl.getAttribLocation(this.program, "aDisp");
        this.uTex = gl.getUniformLocation(this.program, "uTex");
        this.uChroma = gl.getUniformLocation(this.program, "uChroma");
        this.uColorA = gl.getUniformLocation(this.program, "uColorA");
        this.uColorB = gl.getUniformLocation(this.program, "uColorB");

        this.vao = gl.createVertexArray();
        gl.bindVertexArray(this.vao);

        this.posBuf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.posBuf);
        gl.bufferData(gl.ARRAY_BUFFER, this.positions, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(this.aPos);
        gl.vertexAttribPointer(this.aPos, 2, gl.FLOAT, false, 0, 0);

        this.uvBuf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuf);
        gl.bufferData(gl.ARRAY_BUFFER, this.uvs, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(this.aUv);
        gl.vertexAttribPointer(this.aUv, 2, gl.FLOAT, false, 0, 0);

        this.dispBuf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.dispBuf);
        gl.bufferData(gl.ARRAY_BUFFER, this.disp, gl.DYNAMIC_DRAW);
        gl.enableVertexAttribArray(this.aDisp);
        gl.vertexAttribPointer(this.aDisp, 2, gl.FLOAT, false, 0, 0);

        this.idxBuf = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.idxBuf);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);

        this.tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.tex);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        
        this.colorA = parseColor("#ff40c0");
        this.colorB = parseColor("#40ff80");
        this.indexCount = indexCount;
        this.vertCount = vertCount;
    }

    async rebuildTex() {
        if (!this.gl) return;
        const dpr = window.devicePixelRatio || 1;
        const w = Math.max(2, this.canvas.width);
        const h = Math.max(2, this.canvas.height);
        
        const comp = window.getComputedStyle(this.h1);
        const fs = parseFloat(comp.fontSize) || 150;
        const fontFam = comp.fontFamily || '"Risque", serif';
        const fontW = comp.fontWeight || '400';
        
        const fontSize = fs; // Using unscaled CSS value
        const padding = this.PADDING; // Using unscaled CSS value
        const fontStr = `${fontW} ${fontSize}px ${fontFam}`;
        
        try {
            if (document.fonts?.load) await document.fonts.load(fontStr);
            if (document.fonts?.ready) await document.fonts.ready;
        } catch(e) {}

        const c2 = document.createElement("canvas");
        c2.width = w;
        c2.height = h;
        const ctx = c2.getContext("2d");
        
        const scaleX = 1.60;
        const scaleY = 1.55;
        ctx.scale(dpr * scaleX, dpr * scaleY);
        
        const unscaledCssW = w / (dpr * scaleX);
        const unscaledCssH = h / (dpr * scaleY);
        
        ctx.clearRect(0, 0, unscaledCssW, unscaledCssH);
        ctx.font = fontStr;
        ctx.textBaseline = "middle";
        ctx.textAlign = "left";
        
        const wordSurya = document.getElementById("word-surya");
        const wordKanta = document.getElementById("word-kanta");
        const wordRoy = document.getElementById("word-roy");
        
        if (wordSurya && wordKanta && wordRoy) {
            const getPos = (el) => {
                return {
                    x: el.offsetLeft,
                    y: el.offsetTop + el.offsetHeight / 2
                };
            };
            
            const p1 = getPos(wordSurya);
            const p2 = getPos(wordKanta);
            const p3 = getPos(wordRoy);
            
            ctx.fillStyle = "#ff004f";
            ctx.fillText(wordSurya.innerText, padding + p1.x, padding + p1.y);
            
            ctx.fillStyle = "#ffffff";
            ctx.fillText(wordKanta.innerText, padding + p2.x, padding + p2.y);
            ctx.fillText(wordRoy.innerText, padding + p3.x, padding + p3.y);
        } else {
            // Fallback if spans are missing
            const text1 = "Surya";
            const text2 = " Kanta Roy";
            ctx.fillStyle = "#ff004f";
            ctx.fillText(text1, padding, h / 2);
            const offset = ctx.measureText(text1).width;
            ctx.fillStyle = "#ffffff";
            ctx.fillText(text2, padding + offset, h / 2);
        }
        
        const gl = this.gl;
        gl.bindTexture(gl.TEXTURE_2D, this.tex);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c2);
    }

    resize() {
        if (!this.gl || !this.h1) return;
        const dpr = window.devicePixelRatio || 1;
        const unscaledW = this.h1.offsetWidth;
        const unscaledH = this.h1.offsetHeight;
        
        const cssW = unscaledW + (this.PADDING * 2);
        const cssH = unscaledH + (this.PADDING * 2);
        
        this.canvas.style.width = cssW + "px";
        this.canvas.style.height = cssH + "px";
        this.canvas.style.top = -this.PADDING + "px";
        this.canvas.style.left = -this.PADDING + "px";

        const scaleX = 1.60;
        const scaleY = 1.55;
        
        const w = Math.max(2, Math.round(cssW * dpr * scaleX));
        const h = Math.max(2, Math.round(cssH * dpr * scaleY));
        
        if (this.canvas.width !== w || this.canvas.height !== h) {
            this.canvas.width = w;
            this.canvas.height = h;
            this.gl.viewport(0, 0, w, h);
            this.rebuildTex();
        }
    }

    bindEvents() {
        this.cursor = { x: 99, y: 99, px: 99, py: 99, vx: 0, vy: 0, inside: false };
        
        this.onMove = (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const nx = (e.clientX - rect.left) / rect.width;
            const ny = (e.clientY - rect.top) / rect.height;
            const x = nx * 2 - 1;
            const y = 1 - ny * 2;
            if (!this.cursor.inside) {
                this.cursor.px = x;
                this.cursor.py = y;
                this.cursor.inside = true;
            }
            this.cursor.x = x;
            this.cursor.y = y;
        };
        
        this.onLeave = () => {
            this.cursor.inside = false;
            this.cursor.x = 99;
            this.cursor.y = 99;
            this.cursor.vx = 0;
            this.cursor.vy = 0;
        };

        this.h1.addEventListener("pointermove", this.onMove);
        this.h1.addEventListener("pointerleave", this.onLeave);

        this.ro = new ResizeObserver(() => this.resize());
        this.ro.observe(this.h1);
        this.resize();
    }

    tick() {
        if (!this.gl) return;
        
        const c = this.cursor;
        c.vx = c.x - c.px;
        c.vy = c.y - c.py;
        const vmag = Math.hypot(c.vx, c.vy);
        if (vmag > 0.3) {
            c.vx = 0;
            c.vy = 0;
        }
        c.px = c.x;
        c.py = c.y;

        const fpull = DRAG / 10;
        
        for (let i = 0; i < this.vertCount; i++) {
            const i2 = i * 2;
            const px = this.positions[i2];
            const py = this.positions[i2 + 1];
            const dx = this.disp[i2];
            const dy = this.disp[i2 + 1];

            const cx = c.x - (px + dx);
            const cy = c.y - (py + dy);
            const cd = Math.hypot(cx, cy);
            const proximity = Math.max(0, 1 / (1 + cd / 0.05) - 0.1);

            let vx = this.vel[i2];
            let vy = this.vel[i2 + 1];

            vx += c.vx * fpull * proximity;
            vy += c.vy * fpull * proximity;

            vx -= dx * SPRING_K;
            vy -= dy * SPRING_K;

            vx *= DAMPING;
            vy *= DAMPING;

            this.vel[i2] = vx;
            this.vel[i2 + 1] = vy;

            let ndx = dx + vx * DT;
            let ndy = dy + vy * DT;
            if (ndx > 1) ndx = 1; else if (ndx < -1) ndx = -1;
            if (ndy > 1) ndy = 1; else if (ndy < -1) ndy = -1;
            
            this.disp[i2] = ndx;
            this.disp[i2 + 1] = ndy;
        }

        const gl = this.gl;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.dispBuf);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.disp);

        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.useProgram(this.program);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.tex);
        gl.uniform1i(this.uTex, 0);
        gl.uniform1f(this.uChroma, 1.0); 
        
        gl.uniform3f(this.uColorA, this.colorA[0], this.colorA[1], this.colorA[2]);
        gl.uniform3f(this.uColorB, this.colorB[0], this.colorB[1], this.colorB[2]);

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

        gl.bindVertexArray(this.vao);
        gl.drawElements(gl.TRIANGLES, this.indexCount, gl.UNSIGNED_INT, 0);

        this.rafId = requestAnimationFrame(() => this.tick());
    }

    destroy() {
        cancelAnimationFrame(this.rafId);
        this.ro.disconnect();
        this.h1.removeEventListener("pointermove", this.onMove);
        this.h1.removeEventListener("pointerleave", this.onLeave);
        if (this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
        
        const gl = this.gl;
        if (gl) {
            gl.deleteBuffer(this.posBuf);
            gl.deleteBuffer(this.uvBuf);
            gl.deleteBuffer(this.dispBuf);
            gl.deleteBuffer(this.idxBuf);
            gl.deleteTexture(this.tex);
            gl.deleteVertexArray(this.vao);
            gl.deleteProgram(this.program);
            gl.deleteShader(this.vs);
            gl.deleteShader(this.fs);
        }
    }
}

let activeMesh = null;

function initMeshText() {
    const isDesktop = window.innerWidth > 1024;
    const h1 = document.getElementById("hero-name");
    
    if (!h1) return;

    if (isDesktop) {
        let content = document.getElementById("hero-text-content");
        if (!content) {
            h1.innerHTML = `<span id="hero-text-content"><span class="name-red" id="word-surya">Surya</span> <span id="word-kanta">Kanta</span> <span id="word-roy">Roy</span></span>`;
            content = document.getElementById("hero-text-content");
        }
        
        if (!activeMesh) {
            content.style.opacity = '0';
            activeMesh = new MeshTextHover(h1);
        } else {
            activeMesh.rebuildTex();
        }
    } else {
        let content = document.getElementById("hero-text-content");
        if (content) {
            h1.innerHTML = `<span class="name-red">Surya</span> Kanta<br class="mobile-break"> Roy`;
        }
        if (activeMesh) {
            activeMesh.destroy();
            activeMesh = null;
        }
    }
}

document.addEventListener("DOMContentLoaded", () => {
    setTimeout(initMeshText, 100);
    window.addEventListener("resize", initMeshText);
});
