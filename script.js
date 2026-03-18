document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('node-network');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // High-DPI support
    const dpr = window.devicePixelRatio || 1;
    const W = 500;
    const H = 500;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.scale(dpr, dpr);

    // --- Configuration ---
    const NODE_COUNT = 70;
    const CONNECTION_DIST = 85;       // max distance to draw a line
    const SPRING_STRENGTH = 0.02;     // pull back to rest position
    const DAMPING = 0.92;             // velocity decay
    const MOUSE_ATTRACT_RADIUS = 350; // how far mouse attraction reaches
    const MOUSE_ATTRACT_STRENGTH = 0.004;
    const MOUSE_REPEL_RADIUS = 60;    // disruption radius
    const MOUSE_REPEL_STRENGTH = 2.5;
    const GLOBAL_PULL_STRENGTH = 0.012; // how strongly the whole cluster drifts toward far mouse
    const GLOBAL_PULL_MAX = 100;         // max pixels the cluster center can shift

    const CENTER_X = W / 2;
    const CENTER_Y = H / 2;
    const CLUSTER_RADIUS = 220; // radius of the circular cluster

    // --- Mouse state ---
    let mouse = { x: -9999, y: -9999 };

    canvas.closest('.left-column').addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        mouse.x = (e.clientX - rect.left) * (W / rect.width);
        mouse.y = (e.clientY - rect.top) * (H / rect.height);
    });

    canvas.closest('.left-column').addEventListener('mouseleave', () => {
        mouse.x = -9999;
        mouse.y = -9999;
    });

    // --- Create Nodes ---
    // Distribute nodes in a uniform circular pattern using sunflower/Fibonacci spiral
    const nodes = [];
    const goldenAngle = Math.PI * (3 - Math.sqrt(5)); // ~137.5 degrees

    for (let i = 0; i < NODE_COUNT; i++) {
        const r = CLUSTER_RADIUS * Math.sqrt((i + 0.5) / NODE_COUNT);
        const theta = i * goldenAngle;
        const restX = CENTER_X + r * Math.cos(theta);
        const restY = CENTER_Y + r * Math.sin(theta);

        nodes.push({
            x: restX,
            y: restY,
            restX: restX,
            restY: restY,
            vx: 0,
            vy: 0,
            radius: 2.5 + Math.random() * 5.5 // 2.5 — 8
        });
    }

    // --- Global pull offset (smoothed) ---
    let globalOffsetX = 0;
    let globalOffsetY = 0;

    // --- Animation Loop ---
    function animate() {
        ctx.clearRect(0, 0, W, H);

        // Compute global pull: if mouse is on-screen, shift the whole cluster toward it
        const mouseOnScreen = mouse.x > -1000 && mouse.y > -1000;
        let targetOffsetX = 0;
        let targetOffsetY = 0;

        if (mouseOnScreen) {
            const dxGlobal = mouse.x - CENTER_X;
            const dyGlobal = mouse.y - CENTER_Y;
            const distGlobal = Math.sqrt(dxGlobal * dxGlobal + dyGlobal * dyGlobal);
            if (distGlobal > 0) {
                const pullMag = Math.min(distGlobal * 0.08, GLOBAL_PULL_MAX);
                targetOffsetX = (dxGlobal / distGlobal) * pullMag;
                targetOffsetY = (dyGlobal / distGlobal) * pullMag;
            }
        }

        // Smoothly interpolate current offset toward target
        globalOffsetX += (targetOffsetX - globalOffsetX) * GLOBAL_PULL_STRENGTH;
        globalOffsetY += (targetOffsetY - globalOffsetY) * GLOBAL_PULL_STRENGTH;

        // Update physics
        for (let i = 0; i < nodes.length; i++) {
            const n = nodes[i];

            // Effective rest position includes global pull offset
            const effectiveRestX = n.restX + globalOffsetX;
            const effectiveRestY = n.restY + globalOffsetY;

            // Spring force back to (shifted) rest position
            const dx_rest = effectiveRestX - n.x;
            const dy_rest = effectiveRestY - n.y;
            n.vx += dx_rest * SPRING_STRENGTH;
            n.vy += dy_rest * SPRING_STRENGTH;

            // Mouse attraction (gentle pull toward cursor)
            const dx_mouse = mouse.x - n.x;
            const dy_mouse = mouse.y - n.y;
            const distMouse = Math.sqrt(dx_mouse * dx_mouse + dy_mouse * dy_mouse);

            if (distMouse < MOUSE_ATTRACT_RADIUS && distMouse > 0) {
                const attractFactor = (1 - distMouse / MOUSE_ATTRACT_RADIUS) * MOUSE_ATTRACT_STRENGTH;
                n.vx += dx_mouse * attractFactor;
                n.vy += dy_mouse * attractFactor;
            }

            // Mouse repulsion / disruption (strong push when very close)
            if (distMouse < MOUSE_REPEL_RADIUS && distMouse > 0) {
                const repelFactor = (1 - distMouse / MOUSE_REPEL_RADIUS) * MOUSE_REPEL_STRENGTH;
                n.vx -= (dx_mouse / distMouse) * repelFactor;
                n.vy -= (dy_mouse / distMouse) * repelFactor;
            }

            // Apply damping and update position
            n.vx *= DAMPING;
            n.vy *= DAMPING;
            n.x += n.vx;
            n.y += n.vy;
        }

        // Draw connections
        ctx.lineWidth = 1;
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const a = nodes[i];
                const b = nodes[j];
                const dx = a.x - b.x;
                const dy = a.y - b.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < CONNECTION_DIST) {
                    const opacity = 1 - dist / CONNECTION_DIST;
                    ctx.strokeStyle = `rgba(60, 60, 60, ${(opacity * 0.5).toFixed(3)})`;
                    ctx.beginPath();
                    ctx.moveTo(a.x, a.y);
                    ctx.lineTo(b.x, b.y);
                    ctx.stroke();
                }
            }
        }

        // Draw nodes
        for (let i = 0; i < nodes.length; i++) {
            const n = nodes[i];
            ctx.fillStyle = '#333333';
            ctx.beginPath();
            ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
            ctx.fill();
        }

        requestAnimationFrame(animate);
    }

    animate();
});
