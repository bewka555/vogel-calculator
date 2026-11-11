const $=s=>document.querySelector(s);
const demo=()=>({lbl:{s:'อุปทาน',d:'ความต้องการ'},src:[{n:'โรงงาน A',v:0},{n:'โรงงาน B',v:0},{n:'โรงงาน C',v:0}],dst:[{n:'คลัง 1',v:0},{n:'คลัง 2',v:0},{n:'คลัง 3',v:0},{n:'คลัง 4',v:0}],c:[[0,0,0,0],[0,0,0,0],[0,0,0,0]]});
let S=demo(),cur=0,R=null,mode='min';
const MAX=()=>mode==='max';
const L=()=>MAX()?{w:'กำไร',tot:'กำไรรวมสูงสุด',ext:'สูงสุด'}:{w:'ต้นทุน',tot:'ต้นทุนรวมต่ำสุด',ext:'ต่ำสุด'};
const LS=()=>(S.lbl.s||'').trim()||'อุปทาน',LD=()=>(S.lbl.d||'').trim()||'ความต้องการ';
const rd=x=>Math.round(x*1e6)/1e6, esc=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

function editor(){
  let h='<table><tr><th></th>';
  S.dst.forEach((d,j)=>h+=`<th><input data-k="dn" data-j="${j}" value="${esc(d.n)}" aria-label="ชื่อปลายทาง"><button class="x" data-rd="${j}" title="ลบปลายทาง" aria-label="ลบปลายทาง">×</button></th>`);
  h+=`<th><input data-k="ls" value="${esc(S.lbl.s)}" aria-label="ชื่อหัวตารางอุปทาน"></th></tr>`;
  S.src.forEach((s,i)=>{
    h+=`<tr><th><input data-k="sn" data-i="${i}" value="${esc(s.n)}" aria-label="ชื่อต้นทาง"><button class="x" data-rs="${i}" title="ลบต้นทาง" aria-label="ลบต้นทาง">×</button></th>`;
    S.dst.forEach((d,j)=>h+=`<td><input type="number" min="0" step="any" data-k="c" data-i="${i}" data-j="${j}" value="${S.c[i][j]}" aria-label="${L().w}ต่อหน่วย"></td>`);
    h+=`<td><input type="number" min="0" step="any" data-k="sv" data-i="${i}" value="${s.v}" aria-label="${esc(LS())}"></td></tr>`;
  });
  h+=`<tr><th><input data-k="ld" value="${esc(S.lbl.d)}" aria-label="ชื่อหัวตารางความต้องการ"></th>`;
  S.dst.forEach((d,j)=>h+=`<td><input type="number" min="0" step="any" data-k="dv" data-j="${j}" value="${d.v}" aria-label="${esc(LD())}"></td>`);
  $('#ed').innerHTML=h+'<td></td></tr></table>';
}

function solve(){
  let src=S.src.map(x=>({n:x.n||'-',v:+x.v||0})),dst=S.dst.map(x=>({n:x.n||'-',v:+x.v||0})),c=S.c.map(r=>r.map(x=>+x||0));
  const ts=src.reduce((a,x)=>a+x.v,0),td=dst.reduce((a,x)=>a+x.v,0);let note='';
  if(ts>td){dst.push({n:'Dummy',v:rd(ts-td)});c.forEach(r=>r.push(0));note=`${LS()}รวม ${ts} มากกว่า${LD()}รวม ${td} จึงเพิ่มDummy รับส่วนเกิน ${rd(ts-td)} หน่วย (${L().w} 0)`}
  else if(td>ts){src.push({n:'Dummy',v:rd(td-ts)});c.push(dst.map(()=>0));note=`${LD()}รวม ${td} มากกว่า${LS()}รวม ${ts} จึงเพิ่มDummyเติมส่วนขาด ${rd(td-ts)} หน่วย (${L().w} 0)`}
  else note=`${LS()}รวมเท่ากับ${LD()}รวม (${ts} หน่วย) ตารางสมดุลแล้ว`;
  const m=src.length,n=dst.length,M=Math.max(0,...c.flat()),cw=c.map(r=>r.map(x=>MAX()?rd(M-x):x)),w=(i,j)=>cw[i][j];
  let s=src.map(x=>x.v),d=dst.map(x=>x.v),ra=Array(m).fill(1),ca=Array(n).fill(1);
  const A=src.map(()=>Array(n).fill(null)),steps=[];
  const pen=a=>{a=a.slice().sort((x,y)=>x-y);return a.length>1?a[1]-a[0]:a[0]};
  while(ra.includes(1)&&ca.includes(1)&&(ts>0||td>0)){
    const ri=[...Array(m).keys()].filter(i=>ra[i]),ci=[...Array(n).keys()].filter(j=>ca[j]);
    const rp=Array(m).fill(null),cp=Array(n).fill(null);
    ri.forEach(i=>rp[i]=pen(ci.map(j=>w(i,j))));
    ci.forEach(j=>cp[j]=pen(ri.map(i=>w(i,j))));
    let b=null;
    const test=k=>{if(!b||k.p>b.p||(k.p===b.p&&k.mc<b.mc))b=k};
    ri.forEach(i=>test({t:'r',i,p:rp[i],mc:Math.min(...ci.map(j=>w(i,j)))}));
    ci.forEach(j=>test({t:'c',j,p:cp[j],mc:Math.min(...ri.map(i=>w(i,j)))}));
    let bi,bj;
    if(b.t==='r'){bi=b.i;bj=ci.reduce((a,j)=>w(bi,j)<w(bi,a)?j:a,ci[0])}
    else{bj=b.j;bi=ri.reduce((a,i)=>w(i,bj)<w(a,bj)?i:a,ri[0])}
    const x=Math.min(s[bi],d[bj]),sb=s.slice(),db=d.slice(),rb=ra.slice(),cb=ca.slice();
    A[bi][bj]=rd((A[bi][bj]||0)+x);s[bi]=rd(s[bi]-x);d[bj]=rd(d[bj]-x);
    let closed;if(s[bi]===0){ra[bi]=0;closed='แถว '+src[bi].n}else{ca[bj]=0;closed='คอลัมน์ '+dst[bj].n}
    steps.push({ra:rb,ca:cb,s:sb,d:db,rp,cp,bi,bj,x,b,closed,A:A.map(r=>r.slice())});
  }
  let total=0;const parts=[];
  A.forEach((r,i)=>r.forEach((v,j)=>{if(v){total+=v*c[i][j];parts.push(`${v}×${c[i][j]}`)}}));
  R={src,dst,c,cw,M,A,steps,total:rd(total),parts,note};
  cur=Math.min(cur,Math.max(steps.length-1,0));
}

function grid(k){
  const st=R.steps[k],{src,dst,c,cw}=R;let h='<table><tr><th></th>';
  dst.forEach((d,j)=>h+=`<th>${esc(d.n)}</th>`);
  h+=`<th>${esc(LS())}คงเหลือ</th><th>Penalty แถว</th></tr>`;
  src.forEach((s,i)=>{
    h+=`<tr><th>${esc(s.n)}</th>`;
    dst.forEach((d,j)=>{
      const dead=!st.ra[i]||!st.ca[j],hi=i===st.bi&&j===st.bj,a=st.A[i][j];
      h+=`<td class="gc ${hi?'hi':dead?'dead':''}${a==null?' empty':''}"><span class="cb">${cw[i][j]}</span>${a!=null?`<span class="al" title="จำนวนที่จัดสรร">${a}</span>`:''}</td>`;
    });
    const top=st.b.t==='r'&&st.b.i===i;
    h+=`<td>${st.s[i]}</td><td class="pn${top?' top':''}">${st.rp[i]==null?'–':st.rp[i]}</td></tr>`;
  });
  h+=`<tr><th>${esc(LD())}คงเหลือ</th>`;
  dst.forEach((d,j)=>h+=`<td>${st.d[j]}</td>`);
  h+='<td></td><td></td></tr><tr><th>Penalty คอลัมน์</th>';
  dst.forEach((d,j)=>{const top=st.b.t==='c'&&st.b.j===j;h+=`<td class="pn${top?' top':''}">${st.cp[j]==null?'–':st.cp[j]}</td>`});
  return h+'<td></td><td></td></tr></table>';
}

function show(){
  const N=R.steps.length;
  let cv='';
  if(MAX()){cv=`<p class="note">แปลงตารางกำไร: ค่าเสียโอกาส = ${R.M} (กำไรสูงสุดในตาราง) − กำไรแต่ละช่อง แล้วใช้ VAM แบบหาค่าต่ำสุดกับตารางที่แปลงแล้ว</p><div class="sc"><table><tr><th>ค่าเสียโอกาส</th>${R.dst.map(d=>`<th>${esc(d.n)}</th>`).join('')}</tr>${R.src.map((s,i)=>`<tr><th>${esc(s.n)}</th>${R.dst.map((d,j)=>`<td>${R.cw[i][j]}</td>`).join('')}</tr>`).join('')}</table></div><p></p>`}
  $('#nt').innerHTML=`<p class="note">${R.note}<br>Penalty = ผลต่างระหว่าง${MAX()?'ค่าเสียโอกาส':'ต้นทุน'}ต่ำสุดสองอันดับแรกในแถวหรือคอลัมน์นั้น</p>${cv}`;
  if(!N){$('#gr').innerHTML='';$('#ex').textContent=`ยังไม่มีข้อมูลให้คำนวณ กรอก${LS()}และ${LD()}ก่อน`;$('#sn').textContent='';$('#sl').max=0;$('#pv').disabled=$('#nx').disabled=true}
  else{
    const st=R.steps[cur],{src,dst,c}=R,w=st.b.t==='r'?'แถว '+src[st.b.i].n:'คอลัมน์ '+dst[st.b.j].n;
    $('#sl').max=N-1;$('#sl').value=cur;$('#sn').textContent=`ขั้นที่ ${cur+1} จาก ${N}`;
    $('#pv').disabled=cur===0;$('#nx').disabled=cur===N-1;
    $('#ex').innerHTML=`Penalty สูงสุดคือ <b>${st.b.p}</b> ที่${w} จึงเลือกช่องที่${MAX()?'ค่าเสียโอกาส':'ต้นทุน'}ต่ำสุดในเส้นนั้น คือ ${esc(src[st.bi].n)} → ${esc(dst[st.bj].n)} (${MAX()?`ค่าเสียโอกาส ${R.cw[st.bi][st.bj]} = กำไรเดิม ${c[st.bi][st.bj]}`:`ต้นทุน ${c[st.bi][st.bj]}`}) ส่งได้ <b>${st.x}</b> หน่วย แล้วปิด${st.closed}`;
    $('#gr').innerHTML=grid(cur);
  }
  let h='<table><tr><th>จำนวนที่ส่ง</th>';
  R.dst.forEach(d=>h+=`<th>${esc(d.n)}</th>`);h+='</tr>';
  R.src.forEach((s,i)=>{h+=`<tr><th>${esc(s.n)}</th>`;R.dst.forEach((d,j)=>{const a=R.A[i][j];h+=`<td class="${a?'hi':''}">${a||'–'}</td>`});h+='</tr>'});
  $('#rt').innerHTML=h+'</table>';
  $('#tt').textContent=R.total.toLocaleString('th-TH');
  $('#rl').textContent=L().tot+'ที่ได้จาก VAM';
  $('#fm').textContent=R.parts.length?R.parts.join(' + ')+' = '+R.total:'';
}
const upd=()=>{solve();show()};
function labels(){
  const l=L();
  $('#ld').textContent=`แก้ตัวเลขในตารางได้ทันที ระบบจะคำนวณใหม่และแสดงทุกขั้นตอนของ Vogel’s Approximation Method (VAM) พร้อม${l.tot}`;
  $('#hn').textContent=MAX()?'ตัวเลขในช่องตารางคือ กำไรต่อหน่วย (ยิ่งมากยิ่งดี) ระบบจะแปลงเป็นค่าเสียโอกาสก่อนคำนวณ แล้วหากำไรรวมจากตารางกำไรเดิม':'ตัวเลขในช่องตารางคือ ต้นทุนขนส่งต่อหน่วย (ยิ่งน้อยยิ่งดี) ระบบจะเลือกช่องที่ต้นทุนต่ำสุดก่อน';
  $('#mMin').className=MAX()?'':'p';$('#mMax').className=MAX()?'p':'';
  $('#mMin').setAttribute('aria-pressed',!MAX());$('#mMax').setAttribute('aria-pressed',MAX());
}
const setMode=m=>{if(mode===m)return;mode=m;cur=0;labels();editor();upd()};
$('#mMin').onclick=()=>setMode('min');
$('#mMax').onclick=()=>setMode('max');

$('#ed').addEventListener('input',e=>{
  const t=e.target,k=t.dataset.k,i=+t.dataset.i,j=+t.dataset.j,v=t.value;
  if(k==='ls')S.lbl.s=v;else if(k==='ld')S.lbl.d=v;else if(k==='dn')S.dst[j].n=v;else if(k==='sn')S.src[i].n=v;
  else if(k==='c')S.c[i][j]=v;else if(k==='sv')S.src[i].v=v;else if(k==='dv')S.dst[j].v=v;
  upd();
});
$('#ed').addEventListener('click',e=>{
  const t=e.target;
  if(t.dataset.rs!==undefined&&S.src.length>1){const i=+t.dataset.rs;S.src.splice(i,1);S.c.splice(i,1)}
  else if(t.dataset.rd!==undefined&&S.dst.length>1){const j=+t.dataset.rd;S.dst.splice(j,1);S.c.forEach(r=>r.splice(j,1))}
  else return;
  cur=0;editor();upd();
});
$('#aS').onclick=()=>{S.src.push({n:'ต้นทาง '+(S.src.length+1),v:0});S.c.push(S.dst.map(()=>0));editor();upd()};
$('#aD').onclick=()=>{S.dst.push({n:'ปลายทาง '+(S.dst.length+1),v:0});S.c.forEach(r=>r.push(0));editor();upd()};
$('#rs').onclick=()=>{S.src.forEach(x=>x.v=0);S.dst.forEach(x=>x.v=0);S.c=S.c.map(r=>r.map(()=>0));cur=0;editor();upd()};
$('#pv').onclick=()=>{cur--;show()};
$('#nx').onclick=()=>{cur++;show()};
$('#sl').oninput=e=>{cur=+e.target.value;show()};
labels();editor();upd();
