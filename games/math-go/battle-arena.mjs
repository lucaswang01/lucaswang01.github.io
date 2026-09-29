// Original 2.5D canvas scenery and combat choreography. No remote assets or GPU dependency.
const palettes = {
  fern: { sky: ['#081a30', '#244b5f'], mist: '#83edc4', ground: '#305855', rim: '#7fbca0', crystal: '#5effd4' },
  river: { sky: ['#102443', '#39709b'], mist: '#93e6ff', ground: '#365c79', rim: '#93cedb', crystal: '#73d7ff' },
  crystal: { sky: ['#191639', '#4a4382'], mist: '#c3a6fa', ground: '#56476d', rim: '#c4a9da', crystal: '#d4acff' },
  luna: { sky: ['#121530', '#665a91'], mist: '#d8caf9', ground: '#676388', rim: '#bbb0d3', crystal: '#b2eaff' },
  cinder: { sky: ['#2d152c', '#995555'], mist: '#ffcb92', ground: '#695064', rim: '#d5a393', crystal: '#ffb073' },
  zephyr: { sky: ['#193556', '#79a6c6'], mist: '#d0ffed', ground: '#60899d', rim: '#bfe3df', crystal: '#fff1ab' },
  summit: { sky: ['#27162f', '#925145'], mist: '#ffb989', ground: '#634951', rim: '#d4a089', crystal: '#ffca73' },
};
const colors = { neutral: '#c7a3ff', fire: '#ff9b45', water: '#61deff', leaf: '#9cf76a', stone: '#e6c094', air: '#c0eaff', sun: '#ffe68a' };
const rand = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const clamp = (n) => Math.max(0, Math.min(1, n));

export function mountBattleArena({ root, regionId, reducedMotion = false, animation = null, duration = 1100 }) {
  const background = root.querySelector('.arena-canvas');
  const effects = root.querySelector('.effects-canvas');
  const bg = background?.getContext('2d');
  const fx = effects?.getContext('2d');
  if (!bg || !fx) return { destroy() {} };
  const palette = palettes[regionId] || palettes.fern;
  let width = 1, height = 1, raf = 0, stopped = false, lastPaint = 0;
  const start = performance.now();
  let source, targets;
  function locate(id) {
    const node = root.querySelector(`[data-action="target"][data-id="${id}"] .unit-art`);
    if (!node) return { x: width / 2, y: height / 2 };
    const bounds = node.getBoundingClientRect(), arena = root.getBoundingClientRect();
    return { x: bounds.x - arena.x + bounds.width * .5, y: bounds.y - arena.y + bounds.height * .52 };
  }
  function size() {
    const rect = root.getBoundingClientRect(); width = rect.width; height = rect.height;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    for (const canvas of [background, effects]) { canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr); canvas.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0); }
    if (animation) { source = locate(animation.casterId); targets = animation.targets.map(locate); }
    paint(performance.now());
  }
  function ellipse(ctx, x, y, rx, ry, fill) { ctx.beginPath(); ctx.ellipse(x, y, Math.max(0, rx), Math.max(0, ry), 0, 0, Math.PI * 2); ctx.fillStyle = fill; ctx.fill(); }
  function line(ctx, points, color, thickness = 1) { ctx.beginPath(); points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.strokeStyle = color; ctx.lineWidth = thickness; ctx.stroke(); }
  function glow(ctx, x, y, r, color, strength = .6) {
    ctx.save(); ctx.globalAlpha *= strength;
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, r); gradient.addColorStop(0, color); gradient.addColorStop(1, `${color}00`);
    ellipse(ctx, x, y, r, r, gradient); ctx.restore();
  }
  function crystal(x, y, s, color) {
    bg.fillStyle = color; bg.beginPath(); bg.moveTo(x, y - s); bg.lineTo(x + s * .25, y - s * .3); bg.lineTo(x + s * .12, y + s * .13); bg.lineTo(x - s * .24, y); bg.lineTo(x - s * .3, y - s * .45); bg.closePath(); bg.fill();
    bg.fillStyle = '#ffffff55'; bg.beginPath(); bg.moveTo(x, y - s); bg.lineTo(x, y); bg.lineTo(x - s * .3, y - s * .45); bg.fill();
  }
  function scenery(time) {
    const t = reducedMotion ? 0 : time / 1000;
    const sky = bg.createLinearGradient(0, 0, 0, height); sky.addColorStop(0, palette.sky[0]); sky.addColorStop(.65, palette.sky[1]); sky.addColorStop(1, '#0a172b');
    bg.fillStyle = sky; bg.fillRect(0, 0, width, height);
    for (let i = 0; i < 65; i++) { bg.globalAlpha = .25 + .45 * (Math.sin(t + i) + 1) / 2; ellipse(bg, rand(i) * width, rand(i + 99) * height * .5, i % 4 ? 1 : 2, i % 4 ? 1 : 2, '#d6f8ff'); } bg.globalAlpha = 1;
    glow(bg, width * .53, height * .26, width * .4, palette.mist, .17);
    if (['luna', 'cinder', 'zephyr'].includes(regionId)) {
      const x = width * .77, y = height * .2, r = Math.min(width * .085, 90);
      glow(bg, x, y, r * 1.6, palette.mist, .12);
      ellipse(bg, x, y, r, r, regionId === 'cinder' ? '#db926a' : regionId === 'luna' ? '#82a2c4' : '#c6c1d9');
      for (let i = 0; i < 6; i++) ellipse(bg, x + (rand(i) - .5) * r, y + (rand(i + 30) - .5) * r, 8 + rand(i) * 12, 5 + rand(i) * 8, '#ffffff28');
      bg.save(); bg.translate(x, y); bg.rotate(-.3); bg.strokeStyle = '#c5deee66'; bg.lineWidth = 6; bg.beginPath(); bg.ellipse(0, 0, r * 1.5, r * .29, 0, 0, Math.PI * 2); bg.stroke(); bg.restore();
    }
    // Distant floating islets, mountains and translucent aurora ribbons.
    for (let layer = 0; layer < 3; layer++) {
      bg.fillStyle = ['#172e47', '#1c3a4f', '#254959'][layer]; bg.globalAlpha = .6;
      bg.beginPath(); bg.moveTo(0, height * .65);
      for (let i = 0; i <= 16; i++) bg.lineTo(width * i / 16, height * (.32 + layer * .08 - rand(i + layer * 25) * .14));
      bg.lineTo(width, height); bg.lineTo(0, height); bg.fill();
    } bg.globalAlpha = 1;
    for (let i = 0; i < 3; i++) {
      bg.beginPath(); bg.moveTo(0, height * (.23 + i * .04)); bg.bezierCurveTo(width * .35, height * (.04 + Math.sin(t * .14 + i) * .03), width * .6, height * .48, width, height * (.2 + i * .05));
      bg.strokeStyle = `${palette.mist}15`; bg.lineWidth = 22 + i * 17; bg.stroke();
    }
    // Ancient portal; an ellipse in perspective with orbiting runes.
    const px = width * .5, py = height * .32, pr = Math.min(width * .095, 100);
    glow(bg, px, py, pr * 2, palette.crystal, .2);
    bg.save(); bg.translate(px, py); bg.scale(.83, 1);
    bg.strokeStyle = '#90b8b069'; bg.lineWidth = 16; bg.beginPath(); bg.arc(0, 0, pr, 0, Math.PI * 2); bg.stroke();
    bg.strokeStyle = palette.crystal; bg.lineWidth = 2; bg.beginPath(); bg.arc(0, 0, pr - 10, 0, Math.PI * 2); bg.stroke();
    for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6 + t * .08; bg.save(); bg.translate(Math.cos(a) * pr, Math.sin(a) * pr); bg.rotate(a); bg.fillStyle = palette.crystal; bg.fillRect(-3, -3, 6, 6); bg.restore(); } bg.restore();
    // A raised, elliptical stone arena: rim, vertical rock faces, concentric tiles.
    const cx = width * .5, cy = height * .61, rx = width * .58, ry = height * .28;
    ellipse(bg, cx, cy + height * .095, rx, ry, '#071522');
    ellipse(bg, cx, cy + height * .048, rx, ry, '#1a3040');
    for (let i = 0; i < 22; i++) { const a = Math.PI * i / 21; line(bg, [[cx + Math.cos(a) * rx, cy + Math.sin(a) * ry], [cx + Math.cos(a) * rx * .98, cy + Math.sin(a) * ry + height * .07]], '#324958', 2); }
    ellipse(bg, cx, cy, rx, ry, palette.rim); ellipse(bg, cx, cy - 5, rx * .976, ry * .97, palette.ground);
    for (let i = 1; i < 5; i++) { bg.beginPath(); bg.ellipse(cx, cy, rx * i / 5, ry * i / 5, 0, 0, Math.PI * 2); bg.strokeStyle = `${palette.rim}32`; bg.lineWidth = 1.4; bg.stroke(); }
    for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2; line(bg, [[cx + Math.cos(a) * rx * .2, cy + Math.sin(a) * ry * .2], [cx + Math.cos(a) * rx * .97, cy + Math.sin(a) * ry * .97]], `${palette.rim}26`); }
    ellipse(bg, cx, cy, width * .063, height * .032, '#122e4166');
    bg.strokeStyle = `${palette.crystal}70`; bg.lineWidth = 2; bg.beginPath(); bg.ellipse(cx, cy, width * .06, height * .03, 0, 0, Math.PI * 2); bg.stroke();
    // Foreground silhouettes and crystals anchor the depth at either side.
    for (const direction of [-1, 1]) {
      const x = direction < 0 ? width * .035 : width * .965;
      for (let i = 0; i < 4; i++) { const xx = x + direction * i * 22, yy = height * (.43 + rand(i + 8) * .11); glow(bg, xx, yy, 60, palette.crystal, .14); crystal(xx, yy, 45 + i * 17, palette.crystal); }
      if (regionId === 'fern') {
        line(bg, [[x - direction * 45, -20], [x, height * .17], [x - direction * 20, height * .45]], '#0a2231', 34);
        for (let i = 0; i < 10; i++) ellipse(bg, x + Math.sin(i * 3) * width * .09, height * .06 + Math.cos(i * 3) * height * .08, width * .073, height * .047, i % 2 ? '#19433f' : '#245451');
      }
    }
    for (let i = 0; i < 32; i++) { const x = (rand(i + 30) * width + Math.sin(t * .3 + i) * 22), y = height * (.23 + rand(i + 200) * .5) + Math.sin(t * .55 + i) * 13; glow(bg, x, y, 5, palette.crystal, .35); ellipse(bg, x, y, 1.3, 1.3, palette.crystal); }
    const shade = bg.createLinearGradient(0, height * .68, 0, height); shade.addColorStop(0, '#0a162500'); shade.addColorStop(1, '#0a1625'); bg.fillStyle = shade; bg.fillRect(0, height * .68, width, height * .32);
  }
  function star(ctx, x, y, r, color, rotation = 0) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rotation); ctx.beginPath();
    for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5 - Math.PI / 2, radius = i % 2 ? r * .4 : r; const xx = Math.cos(a) * radius, yy = Math.sin(a) * radius; i ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); }
    ctx.closePath(); ctx.fillStyle = color; ctx.fill(); ctx.restore();
  }
  function ring(x, y, r, color, flat = .45) { fx.beginPath(); fx.ellipse(x, y, Math.max(1, r), Math.max(1, r * flat), 0, 0, Math.PI * 2); fx.strokeStyle = color; fx.lineWidth = 3; fx.stroke(); }
  function spellEffects(progress) {
    if (!animation || progress >= 1) return;
    const p = clamp(progress), kind = animation.kind, element = animation.element;
    const color = colors[element] || colors.neutral;
    const support = ['heal', 'regen', 'shield'].includes(kind);
    if (reducedMotion) { for (const target of targets) { ring(target.x, target.y + 20, 38, color); star(fx, target.x, target.y - 28, 12, color); } return; }
    fx.save(); fx.lineCap = 'round';
    const charge = clamp(p / .3), travel = clamp((p - .23) / .34), burst = clamp((p - .54) / .46);
    if (p < .56) {
      fx.globalAlpha = 1 - travel * .6;
      glow(fx, source.x, source.y, 65 * charge + 10, color, .5);
      ring(source.x, source.y + 40, 18 + charge * 37, color);
      for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2 + p * 12; star(fx, source.x + Math.cos(a) * (55 - charge * 25), source.y + Math.sin(a) * (55 - charge * 25), 4, color, a); }
    }
    fx.globalAlpha = 1;
    if (kind === 'ultimate') { fx.globalAlpha = Math.sin(p * Math.PI) * .14; fx.fillStyle = '#7554c9'; fx.fillRect(0, 0, width, height); fx.globalAlpha = 1; }
    for (let targetIndex = 0; targetIndex < targets.length; targetIndex++) {
      const target = targets[targetIndex];
      if (kind === 'capture') {
        const orb = clamp((p - .12) / .38), x = source.x + (target.x - source.x) * orb, y = source.y + (target.y - source.y) * orb - Math.sin(orb * Math.PI) * 80;
        if (p < .52) { glow(fx, x, y, 42, '#b9ffed'); ellipse(fx, x, y, 14, 14, '#f6e1ae'); ring(x, y, 15, '#94ffdc', 1); star(fx, x, y, 8, '#7c62a4', p * 9); }
        else { const wobble = Math.sin(p * 45) * (1 - p) * 12; glow(fx, target.x, target.y, 82, '#b9ffed', .3); ring(target.x + wobble, target.y, 45 + Math.sin(p * 20) * 5, animation.success ? '#b9ffed' : '#e4c6ff', 1); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 + p * 4; star(fx, target.x + Math.cos(a) * 65, target.y + Math.sin(a) * 55, 7, '#ffe8a4', a); } }
      } else if (kind === 'ultimate') {
        for (let i = 0; i < 5; i++) {
          const fall = clamp((p - .15 - i * .035) / .48), x = target.x - 170 * (1 - fall) + (i - 2) * 18, y = target.y - height * .65 * (1 - fall);
          if (fall > 0 && fall < 1) { line(fx, [[x - 32, y - 90], [x, y]], ['#a9eaff', '#fbd6ff', '#ffdf72'][i % 3], 7); glow(fx, x, y, 34, '#ffdf72'); star(fx, x, y, 16, '#fff1a7', p * 9); }
        }
      } else if (support) {
        fx.globalAlpha = Math.sin(p * Math.PI);
        if (kind === 'shield') { glow(fx, target.x, target.y, 82, color, .3); ring(target.x, target.y, 60 * charge, '#bbfaff', 1.18); ring(target.x, target.y, 53 * charge, color, 1.18); }
        else { for (let i = 0; i < 12; i++) { const a = i * 2.4 + p * 7, x = target.x + Math.cos(a) * 44, y = target.y + 60 - ((p * 140 + i * 12) % 140); fx.fillStyle = '#9effbb'; fx.fillRect(x - 2, y - 7, 4, 14); fx.fillRect(x - 7, y - 2, 14, 4); } ring(target.x, target.y + 45, 58, '#91ffc7'); }
        fx.globalAlpha = 1;
      } else if (kind === 'roar') {
        if (p > .2) for (let i = 0; i < 4; i++) { fx.globalAlpha = (1 - p) * .8; ring(source.x, source.y, Math.max(1, (p - .2) * width - i * 40), color, .7); } fx.globalAlpha = 1;
      } else if (travel > 0 && p < .67) {
        const tx = source.x + (target.x - source.x) * travel, ty = source.y + (target.y - source.y) * travel - Math.sin(travel * Math.PI) * 62;
        if (['saber-comet', 'phoenix-cut'].includes(animation.spellId)) {
          fx.save(); fx.translate(tx, ty); fx.rotate(-.9 + travel * 1.3);
          for (let i=0;i<3;i++) {
            fx.beginPath(); fx.arc(0, 0, 25+i*10, -.9, 1.3); fx.strokeStyle=i===1 ? '#fff6c7' : color; fx.lineWidth=9-i*2; fx.stroke();
          }
          fx.restore(); glow(fx,tx,ty,55,color,.35);
        } else if (['thunder-arrow', 'meteor-volley'].includes(animation.spellId)) {
          const volley = animation.spellId === 'meteor-volley';
          for (let i=0;i<(volley ? 3 : 1);i++) {
            const x=tx-i*22, y=ty+(i-1)*19*(volley ? 1 : 0);
            fx.save(); fx.translate(x,y); fx.rotate(Math.atan2(target.y-source.y, target.x-source.x));
            line(fx,[[-64,0],[-42,-8],[-30,5],[-12,0]],`${color}99`,3);
            line(fx,[[-28,0],[16,0],[5,-9],[16,0],[5,9]],'#fff6d4',4);
            line(fx,[[-26,-8],[-18,0],[-26,8]],color,4); fx.restore(); glow(fx,x,y,25,color,.35);
          }
        } else if (animation.spellId === 'crater-crash') {
          fx.save(); fx.translate(target.x,target.y-120*(1-travel)); fx.rotate(-1.2+travel*1.2);
          line(fx,[[0,40],[0,-16]],'#cfbcf0',9);
          fx.fillStyle='#897aaf'; fx.fillRect(-31,-32,62,30); fx.strokeStyle='#eee0b5'; fx.lineWidth=3; fx.strokeRect(-31,-32,62,30);
          star(fx,0,-17,10,'#e5fbff',p*5); fx.restore();
        } else if (element === 'leaf') {
          const points = Array.from({ length: 26 }, (_, i) => { const f = i / 25 * travel; return [source.x + (target.x - source.x) * f, source.y + (target.y - source.y) * f + Math.sin(f * 20 - p * 9) * 17 * Math.sin(f * Math.PI)]; });
          line(fx, points, '#3a9648', 9); line(fx, points, color, 3);
          for (let i = 3; i < points.length; i += 4) { fx.save(); fx.translate(...points[i]); fx.rotate(i); ellipse(fx, 0, 0, 11, 4, color); fx.restore(); }
        } else if (element === 'water' || element === 'air') {
          for (let i = 0; i < 6; i++) { const x = tx - Math.sign(target.x - source.x || 1) * i * 10; ring(x, ty + Math.sin(i + p * 15) * 9, 22 - i * 2, i % 2 ? '#e2faff' : color, element === 'air' ? .25 : .7); }
          glow(fx, tx, ty, 38, color, .4);
        } else if (element === 'stone') {
          fx.save(); fx.translate(tx, ty); fx.rotate(p * 11); fx.fillStyle = '#8d718b'; fx.beginPath(); for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; fx.lineTo(Math.cos(a) * 24, Math.sin(a) * 22); } fx.fill(); line(fx, [[-20, -9], [0, -19], [17, -5], [0, 2], [-20, -9]], color, 3); fx.restore();
        } else if (element === 'sun') {
          line(fx, [[source.x, source.y], [tx, ty]], '#ffde7766', 20); line(fx, [[source.x, source.y], [tx, ty]], '#fff6c7', 4); star(fx, tx, ty, 25, color, p * 10);
        } else {
          for (let i = 15; i >= 0; i--) { const f = Math.max(0, travel - i * .013), x = source.x + (target.x - source.x) * f, y = source.y + (target.y - source.y) * f - Math.sin(f * Math.PI) * 62; fx.globalAlpha = (1 - i / 17) * .8; ellipse(fx, x, y, 19 - i * .8, 19 - i * .8, element === 'fire' ? ['#ff653c', '#ffa53e', '#ffe290'][i % 3] : color); } fx.globalAlpha = 1;
          glow(fx, tx, ty, 50, color); ellipse(fx, tx, ty, 10, 10, '#fff6e0');
        }
      }
      if (burst > 0 && !support) {
        fx.globalAlpha = (1 - burst);
        glow(fx, target.x, target.y, 95 * (1 - burst) + 20, color, .5);
        ring(target.x, target.y + 35, 20 + burst * 100, color);
        ring(target.x, target.y, 10 + burst * 68, '#fff3d0', .9);
        for (let i = 0; i < 22; i++) {
          const a = i * 2.399, distance = (25 + rand(i) * 80) * burst;
          const x = target.x + Math.cos(a) * distance, y = target.y + Math.sin(a) * distance + burst * burst * 30;
          if (element === 'stone') { fx.fillStyle = color; fx.fillRect(x, y, 7, 7); }
          else if (element === 'water') ellipse(fx, x, y, 3, 7, color);
          else star(fx, x, y, 3 + rand(i) * 5, i % 3 ? color : '#fff9dc', a + p * 5);
        } fx.globalAlpha = 1;
      }
    }
    fx.restore();
  }
  function paint(now) { scenery(now); fx.clearRect(0, 0, width, height); spellEffects((now - start) / duration); }
  function loop(now) {
    if (stopped) return;
    if (!document.hidden && now - lastPaint > 30) { paint(now); lastPaint = now; }
    raf = requestAnimationFrame(loop);
  }
  const observer = new ResizeObserver(size); observer.observe(root); size();
  if (!reducedMotion) raf = requestAnimationFrame(loop);
  return { destroy() { stopped = true; cancelAnimationFrame(raf); observer.disconnect(); } };
}
