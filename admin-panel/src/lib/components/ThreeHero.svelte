<script lang="ts">
  import { onMount } from 'svelte';

  let canvas: HTMLCanvasElement;

  onMount(() => {
    let raf = 0;
    let cleanup = () => {};

    (async () => {
      const THREE = await import('three');
      const parent = canvas.parentElement!;
      const w = () => parent.clientWidth;
      const h = () => parent.clientHeight;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(60, w() / h(), 0.1, 100);
      camera.position.z = 6;

      const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(w(), h(), false);

      // A slowly rotating wireframe icosahedron + a teal point cloud — an
      // abstract "network of properties" motif.
      const geo = new THREE.IcosahedronGeometry(2.2, 1);
      const mesh = new THREE.Mesh(
        geo,
        new THREE.MeshBasicMaterial({ color: 0x0f766e, wireframe: true, transparent: true, opacity: 0.55 })
      );
      scene.add(mesh);

      const count = 600;
      const positions = new Float32Array(count * 3);
      for (let i = 0; i < count * 3; i++) positions[i] = (Math.random() - 0.5) * 16;
      const pg = new THREE.BufferGeometry();
      pg.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const points = new THREE.Points(
        pg,
        new THREE.PointsMaterial({ color: 0xd4a24c, size: 0.03, transparent: true, opacity: 0.7 })
      );
      scene.add(points);

      let mx = 0;
      let my = 0;
      const onMove = (e: MouseEvent) => {
        mx = (e.clientX / window.innerWidth - 0.5) * 0.6;
        my = (e.clientY / window.innerHeight - 0.5) * 0.6;
      };
      window.addEventListener('mousemove', onMove);

      const onResize = () => {
        camera.aspect = w() / h();
        camera.updateProjectionMatrix();
        renderer.setSize(w(), h(), false);
      };
      window.addEventListener('resize', onResize);

      const tick = () => {
        mesh.rotation.x += 0.0018;
        mesh.rotation.y += 0.0026;
        points.rotation.y -= 0.0009;
        camera.position.x += (mx * 2 - camera.position.x) * 0.04;
        camera.position.y += (-my * 2 - camera.position.y) * 0.04;
        camera.lookAt(0, 0, 0);
        renderer.render(scene, camera);
        raf = requestAnimationFrame(tick);
      };
      tick();

      cleanup = () => {
        cancelAnimationFrame(raf);
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('resize', onResize);
        geo.dispose();
        pg.dispose();
        renderer.dispose();
      };
    })();

    return () => cleanup();
  });
</script>

<canvas bind:this={canvas} class="h-full w-full"></canvas>
