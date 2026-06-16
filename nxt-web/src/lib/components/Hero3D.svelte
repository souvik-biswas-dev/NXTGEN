<script lang="ts">
	import { onMount } from 'svelte';
	import * as THREE from 'three';

	let canvas: HTMLCanvasElement;

	onMount(() => {
		const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

		const renderer = new THREE.WebGLRenderer({
			canvas,
			antialias: true,
			alpha: true,
			powerPreference: 'high-performance'
		});
		renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
		renderer.toneMapping = THREE.ACESFilmicToneMapping;
		renderer.toneMappingExposure = 1.12;

		const scene = new THREE.Scene();
		// Fade the far towers into the navy background — gives depth + a horizon.
		scene.fog = new THREE.Fog(0x0d1726, 22, 46);

		const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 120);
		camera.position.set(0.5, 10, 20);
		camera.lookAt(0, 3, -1.5);

		// ── Lights — soft dusk key + teal/gold rim accents ──────────────
		scene.add(new THREE.HemisphereLight(0x1e3a4a, 0x070d16, 0.85));
		const key = new THREE.DirectionalLight(0xfff4e2, 1.15);
		key.position.set(7, 16, 9);
		scene.add(key);
		const goldRim = new THREE.PointLight(0xd4a24c, 90, 60, 1.6);
		goldRim.position.set(-12, 7, 5);
		scene.add(goldRim);
		const tealRim = new THREE.PointLight(0x2dd4bf, 70, 60, 1.6);
		tealRim.position.set(12, 5, -8);
		scene.add(tealRim);

		// ── Lit-window emissive texture (procedural, shared base) ───────
		function makeWindowTexture() {
			const c = document.createElement('canvas');
			c.width = 64;
			c.height = 64;
			const ctx = c.getContext('2d')!;
			ctx.fillStyle = '#000000';
			ctx.fillRect(0, 0, 64, 64);
			const cols = 4;
			const rows = 4;
			const pad = 4;
			const cw = (64 - pad * (cols + 1)) / cols;
			const ch = (64 - pad * (rows + 1)) / rows;
			const lights = ['#ffe6b8', '#ffd089', '#bdf3ec', '#7fe9da', '#fff3df'];
			for (let r = 0; r < rows; r++) {
				for (let col = 0; col < cols; col++) {
					if (Math.random() < 0.32) continue; // some windows dark
					ctx.fillStyle = lights[(Math.random() * lights.length) | 0];
					ctx.globalAlpha = 0.55 + Math.random() * 0.45;
					ctx.fillRect(pad + col * (cw + pad), pad + r * (ch + pad), cw, ch);
				}
			}
			ctx.globalAlpha = 1;
			const tex = new THREE.CanvasTexture(c);
			tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
			tex.colorSpace = THREE.SRGBColorSpace;
			tex.magFilter = THREE.NearestFilter;
			return tex;
		}
		const winTexBase = makeWindowTexture();

		// ── City of buildings on a street grid ──────────────────────────
		const city = new THREE.Group();
		const geo = new THREE.BoxGeometry(1, 1, 1);
		const navy = new THREE.Color(0x16314a);
		const teal = new THREE.Color(0x0f766e);
		const cyan = new THREE.Color(0x2dd4bf);
		const gold = new THREE.Color(0xd4a24c);

		const GRID = 8;
		const SPACING = 1.9;
		const FOOT = 1.18; // footprint < spacing → streets between towers
		const MAXH = 7.2;
		const disposables: { dispose(): void }[] = [geo, winTexBase];
		const towers: { mat: THREE.MeshStandardMaterial; base: number; phase: number }[] = [];

		for (let ix = 0; ix < GRID; ix++) {
			for (let iz = 0; iz < GRID; iz++) {
				const dx = ix - (GRID - 1) / 2;
				const dz = iz - (GRID - 1) / 2;
				const dist = Math.sqrt(dx * dx + dz * dz);

				// Smooth skyline: downtown core tallest, layered waves, gentle jitter.
				const core = Math.max(0, 1 - dist / 5.2);
				const wave =
					0.5 + 0.5 * Math.sin(dx * 0.85 + 0.6) * Math.cos(dz * 0.7 - 0.3) + 0.25 * Math.sin(dx * 0.4 + dz * 0.5);
				const h = Math.max(1, (core * 0.7 + wave * 0.4) * MAXH * (0.7 + Math.random() * 0.5));

				const t = THREE.MathUtils.clamp(h / MAXH, 0, 1);
				const isGold = Math.random() < 0.05 && t > 0.45; // rare landmark towers
				const color = new THREE.Color();
				if (isGold) {
					color.copy(gold);
				} else {
					color.copy(navy).lerp(teal, THREE.MathUtils.smoothstep(t, 0, 0.85));
					if (t > 0.72) color.lerp(cyan, (t - 0.72) / 0.28 * 0.55);
				}

				const winTex = winTexBase.clone();
				winTex.needsUpdate = true;
				winTex.repeat.set(Math.max(1, Math.round(FOOT * 1.4)), Math.max(2, Math.round(h * 1.15)));
				disposables.push(winTex);

				// Side faces get lit windows; roof/floor stay plain.
				const sideMat = new THREE.MeshStandardMaterial({
					color,
					metalness: 0.35,
					roughness: 0.55,
					emissive: 0xffffff,
					emissiveMap: winTex,
					emissiveIntensity: isGold ? 1.15 : 0.85
				});
				const capMat = new THREE.MeshStandardMaterial({
					color: color.clone().multiplyScalar(0.82),
					metalness: 0.4,
					roughness: 0.5,
					emissive: isGold ? gold : teal,
					emissiveIntensity: isGold ? 0.4 : 0.12
				});
				disposables.push(sideMat, capMat);

				const mesh = new THREE.Mesh(geo, [sideMat, sideMat, capMat, capMat, sideMat, sideMat]);
				mesh.scale.set(FOOT, h, FOOT);
				mesh.position.set(dx * SPACING, h / 2, dz * SPACING);
				towers.push({ mat: sideMat, base: sideMat.emissiveIntensity, phase: Math.random() * Math.PI * 2 });
				city.add(mesh);
			}
		}
		city.rotation.y = -0.62;
		scene.add(city);

		// ── Drifting "firefly" embers ───────────────────────────────────
		const COUNT = 260;
		const positions = new Float32Array(COUNT * 3);
		for (let i = 0; i < COUNT; i++) {
			positions[i * 3] = (Math.random() - 0.5) * 30;
			positions[i * 3 + 1] = Math.random() * 16;
			positions[i * 3 + 2] = (Math.random() - 0.5) * 30;
		}
		const pGeo = new THREE.BufferGeometry();
		pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
		const pMat = new THREE.PointsMaterial({
			color: 0xd4a24c,
			size: 0.05,
			transparent: true,
			opacity: 0.6,
			depthWrite: false,
			blending: THREE.AdditiveBlending
		});
		const particles = new THREE.Points(pGeo, pMat);
		scene.add(particles);
		disposables.push(pGeo, pMat);

		// ── Pointer parallax ────────────────────────────────────────────
		const target = { x: 0, y: 0 };
		const current = { x: 0, y: 0 };
		function onPointer(e: PointerEvent) {
			target.x = (e.clientX / window.innerWidth - 0.5) * 2;
			target.y = (e.clientY / window.innerHeight - 0.5) * 2;
		}
		window.addEventListener('pointermove', onPointer);

		// ── Resize ──────────────────────────────────────────────────────
		function resize() {
			const parent = canvas.parentElement;
			if (!parent) return;
			const w = parent.clientWidth;
			const h = parent.clientHeight;
			renderer.setSize(w, h, false);
			camera.aspect = w / h;
			camera.updateProjectionMatrix();
		}
		resize();
		const ro = new ResizeObserver(resize);
		if (canvas.parentElement) ro.observe(canvas.parentElement);

		// ── Animation loop ──────────────────────────────────────────────
		const clock = new THREE.Clock();
		let raf = 0;
		function frame() {
			const t = clock.getElapsedTime();

			current.x += (target.x - current.x) * 0.045;
			current.y += (target.y - current.y) * 0.045;

			city.rotation.y = -0.62 + t * 0.035 + current.x * 0.28;
			city.rotation.x = current.y * 0.06;

			// Gentle window-glow "breathing" so the skyline feels alive.
			for (const tw of towers) {
				tw.mat.emissiveIntensity = tw.base * (0.82 + 0.18 * Math.sin(t * 0.8 + tw.phase));
			}

			const pp = pGeo.attributes.position as THREE.BufferAttribute;
			for (let i = 0; i < COUNT; i++) {
				let y = pp.getY(i) + 0.01;
				if (y > 16) y = 0;
				pp.setY(i, y);
			}
			pp.needsUpdate = true;
			particles.rotation.y = t * 0.018;

			camera.position.x = 0.5 + current.x * 1.1;
			camera.position.y = 10 - current.y * 0.6;
			camera.lookAt(0, 3, -1.5);

			renderer.render(scene, camera);
			if (!reduce) raf = requestAnimationFrame(frame);
		}
		if (reduce) {
			renderer.render(scene, camera);
		} else {
			raf = requestAnimationFrame(frame);
		}

		return () => {
			cancelAnimationFrame(raf);
			ro.disconnect();
			window.removeEventListener('pointermove', onPointer);
			disposables.forEach((d) => d.dispose());
			renderer.dispose();
		};
	});
</script>

<canvas bind:this={canvas} class="block size-full" aria-hidden="true"></canvas>
