/* ============================================================
   ease.js —— 缓动函数库（由 motion-core 的曲线注册表构建）

   数据源：assets/core.js（window.MC）→ MC.registry
   原来的手写 EASE / EASE_LIST 已迁到 motion-core 的 vocab/curves.v1.json，
   这里只做「兼容层」：
     - 保留旧键名（customBezier / easeInSine / easeOutQuad …）供既有演示用
     - 补进 core 的全部曲线（k75 / longTail / appleOut / spring / settle …）
     - EASE_LIST 换成 core 的曲线清单，实验室直接消费

   依赖：assets/core.js（window.MC）
   ============================================================ */
(function () {
  'use strict';
  const MC = window.MC;
  if (!MC || !MC.registry) {
    /* core 没加载时不静默失败：演示里的 data-fn 会全部失效 */
    console.error('[ease] window.MC 未加载，请在 ease.js 之前引入 assets/core.js');
    window.EASE = { linear: function (t) { return t; }, easeOut: function (t) { return 1 - Math.pow(1 - t, 3); } };
    window.EASE_LIST = [];
    return;
  }

  const EASE = {};

  /* 1. core 的主名 + 别名 */
  for (const entry of MC.registry.curves()) {
    EASE[entry.name] = entry.fn;
    for (const a of entry.aliases || []) if (!(a in EASE)) EASE[a] = entry.fn;
  }

  /* 2. 旧键名兼容（原 ease.js 的 EASE 键） */
  const LEGACY = {
    customBezier: 'easeOutExpo',   // 原 bezierFn(0.16,1,0.3,1)
    easeInSine: 'sineIn',
    easeOutSine: 'sineOut',
    easeInOutSine: 'sineInOut',
    easeOutQuad: 'quadOut',
    easeOutQuart: 'quartOut',
    easeOutQuint: 'quintOut',
    easeInExpo: 'expoIn',
    easeInOutExpo: 'expoInOut',
    easeInOutBack: 'backInOut',
    easeInBounce: 'bounceIn',
    easeInElastic: 'elasticIn'
  };
  for (const key of Object.keys(LEGACY)) {
    if (!(key in EASE)) {
      try { EASE[key] = MC.registry.fn(LEGACY[key]); }
      catch (e) { /* core 没有这条曲线时跳过，不影响其余 */ }
    }
  }

  /* 3. 贝塞尔构造器（实验室拖控制点用） */
  EASE.bezier = function (x1, y1, x2, y2) {
    return MC.buildCurve({ fn: 'bezier', args: [x1, y1, x2, y2] });
  };

  /* 4. 实验室清单：直接用 core 的曲线表 */
  const LIST = MC.registry.curves().map(function (entry) {
    return {
      key: entry.name,
      label: entry.label.zh + ' / ' + entry.label.en,
      css: MC.cssEasing(entry),
      fn: entry.fn,
      note: entry.note || ''
    };
  });

  window.EASE = EASE;
  window.EASE_LIST = LIST;
})();
