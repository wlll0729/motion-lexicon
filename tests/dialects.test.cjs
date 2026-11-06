const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const context = {window:{ENGINE:{onMotion(){}}, MOTION:{KINDS:{}}}, document:{documentElement:{},addEventListener(){}}, MutationObserver:class{observe(){}}};
vm.createContext(context);
for (const file of ['core','ease','data1','data2','runtime','compound','params','dialects']) vm.runInContext(fs.readFileSync('assets/'+file+'.js','utf8'),context);
const D=context.window.DIALECTS, terms=context.window.TERMS, byId=id=>terms.find(t=>t.id===id);
assert.equal(terms.length,244);
assert.ok(context.window.MC, 'motion-core 应已加载');

/* 影片目标是新增的导出目标；它们产出 JS，不是独立 HTML 文档 */
const FILM = new Set(['film-mo','film-rk']);
const MC = context.window.MC;
const legacyOf = id => {
  const t = (MC && MC.termsVocab ? MC.termsVocab.terms : []).find(x => x.id === id);
  return (t && t._legacyCode) || '';
};

/* 这些术语的 term.code 是源码伪代码（含注释、缺失资源），任何目标都不许内联它。
   CSS / WAAPI 走词典自己的严格校验，仍然应当完全拒绝。 */
for(const id of ['page-curl','morphing-dot-sphere','scramble-decode','spring','confetti','glitch-in','mask','unmount']) {
  for(const format of D.list){
    D.set(format.key);
    const out = D.codeFor(byId(id));
    if (FILM.has(format.key)) {
      if (out) {
        new vm.Script(out);
        const legacy = legacyOf(id);
        if (legacy) assert.ok(!out.includes(legacy.slice(0, 30)), id + ' 不应内联源码伪代码');
      }
    } else {
      assert.equal(out,'',id+' must not export source pseudocode');
      assert.equal(D.panelHTML(byId(id)),'');
    }
  }
}
D.set('css');D.set('swift');assert.equal(D.current,'css');
let exported=0;const pages=[];
for(const term of terms){
  for(const {key} of D.list){
    D.set(key);
    if(!D.compilable(term)) continue;
    exported++;
    const out=D.codeFor(term);
    if (FILM.has(key)) {
      /* 影片目标：产出可解析的 JS，不含资源引用与 NaN */
      assert.ok(out.length>0, `${term.id} → ${key} 应有代码`);
      assert.doesNotMatch(out,/<!/);
      assert.doesNotMatch(out,/assets\/|undefined|NaN/);
      new vm.Script(out);
    } else {
      assert.match(out,/<!doctype html>/);
      assert.doesNotMatch(out,/assets\/|var\(--accent|undefined|NaN/);
      new vm.Script(out.match(/<script>\n([\s\S]*)\n<\/script>/)[1]);
      pages.push({id:term.id,format:key,html:out});
    }
  }
}
D.set('css');assert.match(D.codeFor(byId('stagger'),{dur:810,st:75,loop:true}),/810ms.*infinite alternate both/);
assert.match(D.codeFor(byId('stagger'),{st:75}),/var\(--i\) \* 75ms/);
assert.match(D.codeFor(byId('iteration')),/ 3 normal both/);
assert.match(D.codeFor(byId('asymmetric')),/@keyframes motion1/);
assert.match(D.codeFor(byId('duration'),{dur:240}),/motion0 240ms/);
assert.match(D.codeFor(byId('duration'),{dur:240}),/motion1 1800ms/);
D.set('waapi');
const sequence=D.codeFor(byId('orchestration'));assert.match(sequence,/"offset": 0.6/);assert.match(sequence,/translateY\(-4px\) rotate\(2deg\)/);assert.match(sequence,/easing: "linear"/);assert.match(sequence,/"easing": "cubic-bezier/);
assert.match(D.codeFor(byId('iteration')),/iterations: 3/);

/* 影片目标：术语名 → MO.byName，错峰展开成循环 */
D.set('film-mo');
const film=D.codeFor(byId('stagger'));
assert.match(film,/MO\.byName\('easeOutExpo'\)/);
assert.match(film,/for \(let i = 0; i < 5; i\+\+\)/);
assert.match(film,/el\[i\]\.y = 16 - 16 \* k;/);
/* 别名与主名解析到同一条曲线 */
assert.equal(context.window.MC.registry.canonical('expo-out'),'easeOutExpo');

console.log(`${terms.length} terms audited; ${exported} complete native implementations / ${pages.length} syntax-checked HTML exports.`);
if(process.argv.includes('--fixture')) {
  fs.writeFileSync('/tmp/motion-code-302/pages.json',JSON.stringify(pages));
  for(const page of pages.filter(p=>['stagger','hover-lift','orchestration','asymmetric'].includes(p.id)))fs.writeFileSync('/tmp/motion-code-302/'+page.id+'-'+page.format+'.html',page.html);
}
