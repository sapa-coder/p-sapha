import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { SUPABASE_URL, SUPABASE_KEY } from './config.js';
const sb = createClient(SUPABASE_URL, SUPABASE_KEY);
if (window.pdfjsLib) pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
const SUBJECTS = ['ภาษาไทย','คณิตศาสตร์','สังคมศึกษา','วิทยาศาสตร์ทั่วไป','ชีววิทยา','ฟิสิกส์','เคมี'];
const GRADES = [1,2,3,4,5,6];
const S = { byId:{}, user:null, profile:null, tab:'home', grade:1, subject:'ทั้งหมด', favs:new Set(), mode:'login', sort:'new' };
const $ = (s,r=document) => r.querySelector(s);
const app = $('#app');
const esc = t => String(t??'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2500)}

if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js');

/* ---------- Auth ---------- */
function renderAuth(){
  const reg = S.mode==='register';
  app.innerHTML = `<div class="auth"><form class="auth-box" id="af">
    <h1 class="brand">พี่สภามีมาแจก</h1>
    <p class="sub">${reg?'สมัครสมาชิกเพื่อเริ่มใช้งาน':'เข้าสู่ระบบเพื่อดูสรุปทั้งหมด'}</p>
    ${reg?`<label>ชื่อ - นามสกุล</label><input name="name" required>
    <label>ห้องเรียน (เช่น ม.1/15)</label><input name="room" required pattern="ม\\.[1-6]/\\d{1,2}" placeholder="ม.1/15">`:''}
    <label>อีเมล</label><input name="email" type="email" required>
    <label>รหัสผ่าน</label><input name="pw" type="password" minlength="6" required>
    ${reg?`<label>ยืนยันรหัสผ่าน</label><input name="pw2" type="password" minlength="6" required>`:''}
    <div class="err" id="err"></div>
    <button class="btn full">${reg?'สมัครสมาชิก':'เข้าสู่ระบบ'}</button>
    <div class="switch">${reg?'มีบัญชีแล้ว?':'ยังไม่มีบัญชี?'} <button type="button" class="link" id="sw">${reg?'เข้าสู่ระบบ':'สมัครสมาชิก'}</button></div>
  </form></div>`;
  $('#sw').onclick = () => { S.mode = reg?'login':'register'; renderAuth(); };
  $('#af').onsubmit = async e => {
    e.preventDefault(); const f = Object.fromEntries(new FormData(e.target)); const err = $('#err'); err.textContent='';
    if (reg && f.pw !== f.pw2) return err.textContent='รหัสผ่านไม่ตรงกัน';
    const { data, error } = reg
      ? await sb.auth.signUp({ email:f.email, password:f.pw, options:{ data:{ full_name:f.name, classroom:f.room } } })
      : await sb.auth.signInWithPassword({ email:f.email, password:f.pw });
    if (error) err.textContent = error.message.includes('Invalid login') ? 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' : error.message;
    else if (reg && !data.session) renderOtp(f.email);
  };
}
function renderOtp(email){
  app.innerHTML = `<div class="auth"><form class="auth-box" id="of">
    <h1 class="brand">ยืนยันอีเมล</h1>
    <p class="sub">เราส่งรหัสยืนยันไปที่ ${esc(email)} กรอกรหัสที่ได้รับ</p>
    <label>รหัสยืนยัน</label><input name="code" inputmode="numeric" autocomplete="one-time-code" required autofocus>
    <div class="err" id="err"></div>
    <button class="btn full">ยืนยัน</button>
    <div class="switch">ไม่ได้รับรหัส? <button type="button" class="link" id="rs">ส่งอีกครั้ง</button></div>
  </form></div>`;
  $('#of').onsubmit = async e => {
    e.preventDefault();
    const { error } = await sb.auth.verifyOtp({ email, token: new FormData(e.target).get('code').trim(), type:'signup' });
    if (error) $('#err').textContent = 'รหัสไม่ถูกต้องหรือหมดอายุ';
  };
  $('#rs').onclick = async () => {
    const { error } = await sb.auth.resend({ type:'signup', email });
    toast(error ? 'ส่งซ้ำไม่ได้ กรุณารอสักครู่' : 'ส่งรหัสใหม่แล้ว');
  };
}

/* ---------- Layout ---------- */
let deferred=null; addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferred=e;});
const ic=p=>`<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
const ICON={home:ic('<path d="M4 4h12a2 2 0 0 1 2 2v14H6a2 2 0 0 1-2-2z"/><path d="M8 9h6M8 13h6"/>'),puffet:ic('<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>'),favs:ic('<path d="M20.8 5.6a5 5 0 0 0-7.1 0L12 7.3l-1.7-1.7a5 5 0 0 0-7.1 7.1L12 21l8.8-8.3a5 5 0 0 0 0-7.1z"/>'),me:ic('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'),out:ic('<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>')};
function shell(inner){
  app.innerHTML = `<header class="top"><div class="in"><div class="logo"><i></i>พี่สภามีมาแจก</div>
    ${deferred?'<button class="btn sm" id="inst">ติดตั้งแอป</button>':''}
    <button class="icon av" id="hav" aria-label="บัญชีของฉัน">${avatarHTML(S.profile)}</button></div></header>
    <main class="wrap view">${inner}</main>
    <div class="tabs">${[['home','สรุป'],['puffet','Puffet'],['favs','โปรด'],['me','ฉัน']].map(([k,l])=>`<button data-t="${k}" class="${S.tab===k?'on':''}">${ICON[k]}<span>${l}</span></button>`).join('')}</div>
    ${S.tab==='home'?'<button class="btn fab" id="add" aria-label="เพิ่มสรุป">+</button>':''}`;
  document.querySelectorAll('.tabs button').forEach(b => b.onclick = () => { S.tab=b.dataset.t; render(); scrollTo(0,0); });
  $('#hav').onclick = () => { S.tab='me'; render(); scrollTo(0,0); };
  const add = $('#add'); if (add) add.onclick = openUpload;
  const inst = $('#inst'); if (inst) inst.onclick = () => { deferred.prompt(); deferred=null; inst.remove(); };
}
async function render(){ ({home,puffet,favs:favsView,me})[S.tab](); }

/* ---------- Home ---------- */
async function home(){
  shell(`<section class="hero"><p class="hi">${greet()} ${esc((S.profile?.full_name||'').split(' ')[0])} 👋</p><h1>สรุป ม.${S.grade}<br>จากสภานักเรียน</h1></section>
    <div class="chips" id="g">${GRADES.map(g=>`<button class="chip ${g===S.grade?'on':''}" data-g="${g}">ม.${g}</button>`).join('')}</div>
    <div class="sb">${ICON.search}<input id="q" type="search" placeholder="ค้นหาชื่อเรื่องหรือเนื้อหา"></div>
    <div class="tools"><div class="seg" id="sg"><button data-o="new" class="${S.sort==='new'?'on':''}">ใหม่ล่าสุด</button><button data-o="pop" class="${S.sort==='pop'?'on':''}">🔥 ยอดนิยม</button></div><button class="btn ghost rnd" id="rnd" aria-label="สุ่มสรุป">🎲</button></div>
    <div class="chips" id="s">${['ทั้งหมด',...SUBJECTS].map(s=>`<button class="chip ${s===S.subject?'on':''}" data-s="${s}">${s}</button>`).join('')}</div>
    <div class="grid" id="list">${'<div class="sk"></div>'.repeat(6)}</div><div id="more"></div>`);
  $('#g').onclick = e => { const g=e.target.dataset.g; if(g){S.grade=+g;home()} };
  $('#s').onclick = e => { const s=e.target.dataset.s; if(s){S.subject=s;home()} };
  let q = sb.from('sheets').select('*').eq('grade',S.grade).order(S.sort==='pop'?'views':'created_at',{ascending:false});
  if (S.subject!=='ทั้งหมด') q = q.eq('subject',S.subject);
  const { data } = await q, rows = data||[];
  const draw = () => { const k = $('#q').value.trim().toLowerCase(); drawCards(rows.filter(r => !k || ((r.title||'')+r.author_name+r.description+r.subject).toLowerCase().includes(k)), k?'ไม่พบสรุปที่ค้นหา':'ยังไม่มีสรุปในหมวดนี้ มาเป็นคนแรกที่เพิ่มได้เลย'); };
  $('#q').oninput = draw; draw();
  $('#sg').onclick = e => { const o = e.target.dataset.o; if (o) { S.sort = o; home(); } };
  $('#rnd').onclick = () => { if (rows.length) { navigator.vibrate?.(20); openDetail(rows[Math.random()*rows.length|0]); } else toast('ยังไม่มีสรุปให้สุ่ม'); };
  homeExtras();
}
function drawCards(rows, emptyMsg){
  const el = $('#list'); if (!el) return;
  rows.forEach(r => S.byId[r.id] = r);
  el.innerHTML = rows.length ? rows.map((r,i) => `<article class="card" style="--i:${i}">
    <div class="thumb" data-open="${r.id}" style="${bg(r)}">${phi(r)}<span class="tag" data-s="${esc(r.subject)}">${esc(r.subject)}</span>${isNew(r)?'<span class="new">NEW</span>':''}</div>
    <button class="heart ${S.favs.has(r.id)?'on':''}" data-id="${r.id}" aria-label="รายการโปรด">♥</button>
    <div class="meta"><b>${esc(r.title||r.author_name)}</b><span>${r.title?esc(r.author_name)+' · ':''}${esc(r.classroom)}</span><p>${esc(r.description)}</p><small class="vc">👁 ${r.views||0}</small></div></article>`).join('')
    : `<div class="empty">${emptyMsg}</div>`;
  el.querySelectorAll('.heart').forEach(b => b.onclick = () => toggleFav(+b.dataset.id, b));
  el.querySelectorAll('[data-open]').forEach(t => { let lt = 0, tm; const r = S.byId[t.dataset.open];
    t.onclick = () => { const n = Date.now(); clearTimeout(tm);
      if (n - lt < 300) { lt = 0; if (!S.favs.has(r.id)) toggleFav(r.id, t.closest('.card').querySelector('.heart'));
        const h = document.createElement('span'); h.className = 'bigheart'; h.textContent = '❤️'; t.appendChild(h); setTimeout(() => h.remove(), 800); }
      else { lt = n; tm = setTimeout(() => openDetail(r), 260); } }; });
}
async function toggleFav(id, btn){
  if (S.favs.has(id)) { S.favs.delete(id); await sb.from('favorites').delete().match({user_id:S.user.id, sheet_id:id}); }
  else { S.favs.add(id); await sb.from('favorites').insert({user_id:S.user.id, sheet_id:id}); }
  navigator.vibrate?.(15); btn.classList.toggle('on'); if (S.favs.has(id)) burst(btn); if (S.tab==='favs') favsView();
}

/* ---------- Favorites ---------- */
async function favsView(){
  shell(`<section class="hero"><h1>รายการโปรดของฉัน</h1><p>ชีทที่กดหัวใจไว้</p></section><div class="grid" id="list"></div><div id="more"></div>`);
  const ids = [...S.favs];
  const { data } = ids.length ? await sb.from('sheets').select('*').in('id',ids) : { data:[] };
  drawCards(data||[], 'ยังไม่มีรายการโปรด กดหัวใจที่ชีทที่ชอบได้เลย');
  favsExtras(data||[]);
}

/* ---------- Puffet ---------- */
async function puffet(){
  shell(`<section class="hero"><h1>Puffet</h1><p>พอร์ตโฟลิโอพี่ ม.6</p></section><div class="pf" id="pf"><div class="empty">กำลังโหลด...</div></div><div id="more"></div>`);
  const { data } = await sb.from('puffet').select('*').order('created_at',{ascending:false});
  $('#pf').innerHTML = (data||[]).length ? data.map(p=>`<article class="card">
    <a class="thumb" ${p.link_url?`href="${esc(p.link_url)}" target="_blank" rel="noopener"`:''} style="background-image:url('${esc(p.image_url)}')"></a>
    <div class="meta"><b>${esc(p.title)}</b><p>${esc(p.description)}</p></div></article>`).join('') : '<div class="empty">ยังไม่มีพอร์ตโฟลิโอ</div>';
  puffetExtras(data||[]);
}

/* ---------- Upload (link) ---------- */
const EMO = {'ภาษาไทย':'📖','คณิตศาสตร์':'📐','สังคมศึกษา':'🌏','วิทยาศาสตร์ทั่วไป':'🔬','ชีววิทยา':'🧬','ฟิสิกส์':'⚡','เคมี':'🧪'};
const COL = {'ภาษาไทย':'#e11d48','คณิตศาสตร์':'#2563eb','สังคมศึกษา':'#d97706','วิทยาศาสตร์ทั่วไป':'#059669','ชีววิทยา':'#65a30d','ฟิสิกส์':'#7c3aed','เคมี':'#db2777'};
const KIND = {drive:['Google Drive','📁'],canva:['Canva','🎨'],youtube:['YouTube','▶️'],notion:['Notion','📝'],pdf:['ไฟล์ PDF','📄'],link:['ลิงก์','🔗']};
ICON.search = ic('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>');
const bg = r => `background-image:${r.thumb_url?`url('${esc(r.thumb_url)}'),`:''}linear-gradient(135deg,${COL[r.subject]||'#0f766e'},#0f172a)`;
const phi = r => r.thumb_url ? '' : `<i class="phi">${EMO[r.subject]||'📚'}</i>`;
const isNew = r => Date.now() - new Date(r.created_at) < 3*864e5;
const LV = [[0,'น้องใหม่','🌱'],[1,'นักแบ่งปัน','⭐'],[5,'ตัวท็อป','🔥'],[10,'ตำนานสภา','👑']];
function levelHTML(n){
  let i = LV.length-1; while (LV[i][0] > n) i--;
  const c = LV[i], nx = LV[i+1], pct = nx ? Math.round((n-c[0])/(nx[0]-c[0])*100) : 100;
  return `<div class="lv"><b>${c[2]} ${c[1]}</b><div class="bar"><i style="width:${pct}%"></i></div><small>${nx?`อีก ${nx[0]-n} สรุป เลื่อนเป็น ${nx[2]} ${nx[1]}`:'ระดับสูงสุดแล้ว!'}</small></div>`;
}
function linkInfo(u){
  let x; try { x = new URL(u); } catch { return null; }
  if (!/^https?:$/.test(x.protocol)) return null;
  const h = x.hostname.replace(/^www\./,''); let kind = 'link', thumb = '';
  if (/(^|\.)(drive|docs)\.google\.com$/.test(h)) { kind = 'drive'; const id = (u.match(/\/d\/([\w-]+)/)||u.match(/[?&]id=([\w-]+)/)||[])[1]; if (id) thumb = `https://drive.google.com/thumbnail?id=${id}&sz=w600`; }
  else if (h.includes('canva.com')) kind = 'canva';
  else if (h.includes('youtu')) { kind = 'youtube'; const id = (u.match(/youtu\.be\/([\w-]{11})/)||u.match(/[?&]v=([\w-]{11})/)||[])[1]; if (id) thumb = `https://img.youtube.com/vi/${id}/hqdefault.jpg`; }
  else if (h.includes('notion.')) kind = 'notion';
  else if (/\.pdf($|\?)/i.test(x.pathname)) kind = 'pdf';
  return { url:x.href, kind, thumb, host:h };
}
function openUpload(){
  const m = sheetModal(`<h2>แชร์สรุปของคุณ</h2><p class="sub">เลือกแชร์เป็นลิงก์หรือไฟล์ PDF อย่างใดอย่างหนึ่ง</p>
    <form id="uf"><div class="seg" id="md" style="margin-top:8px"><button type="button" data-m="link" class="on">🔗 ลิงก์</button><button type="button" data-m="file">📄 ไฟล์ PDF</button></div><div id="bl"><label>ลิงก์สรุป (Drive, Canva, Notion ฯลฯ)</label><div class="pr"><input name="url" type="url" inputmode="url" placeholder="https://..." required><button type="button" class="btn ghost sm" id="ps">วาง</button></div>
    <div class="lp" id="lp"></div><p class="mu">💡 ตั้งสิทธิ์แชร์เป็น "ทุกคนที่มีลิงก์" เพื่อนจะได้เปิดได้</p></div><div id="bf" hidden><label>ไฟล์ PDF (ไม่เกิน 50 MB)</label><input type="file" name="file" accept="application/pdf"></div>
    <label>ชื่อเรื่อง</label><input name="title" maxlength="60" placeholder="เช่น สรุปสมการเชิงเส้น" required>
    <label>ชื่อ - นามสกุล</label><input name="name" value="${esc(S.profile?.full_name)}" required>
    <label>ชั้น</label><select name="room">${GRADES.map(g=>`<option value="ม.${g}" ${'ม.'+g===(S.profile?.classroom||'').split('/')[0]?'selected':''}>ม.${g}</option>`).join('')}</select>
    <label>หมวดหมู่</label><div class="chips wrapc" id="sc">${SUBJECTS.map((x,i)=>`<button type="button" class="chip ${i?'':'on'}" data-v="${x}">${EMO[x]} ${x}</button>`).join('')}</div>
    <label>รายละเอียดของเนื้อหา</label><textarea name="desc" rows="3" required></textarea>
    <div class="err" id="uerr"></div><button class="btn full" id="ub">เผยแพร่ 🚀</button></form>`);
  const inp = $('[name=url]',m), lp = $('#lp',m); let li = null, subj = SUBJECTS[0];
  const upd = () => { const v = inp.value.trim(); li = v ? linkInfo(v) : null;
    lp.innerHTML = !v ? '' : li ? `<div class="lpc"><div class="lpi" style="${li.thumb?`background-image:url('${esc(li.thumb)}')`:''}">${li.thumb?'':KIND[li.kind][1]}</div><div><b>${KIND[li.kind][0]}</b><small>${esc(li.host)}</small></div><em>✓</em></div>` : '<div class="err">ลิงก์ไม่ถูกต้อง ต้องขึ้นต้นด้วย https://</div>'; };
  inp.oninput = upd; let mode = 'link';
  $('#md',m).onclick = e => { const b = e.target.closest('[data-m]'); if (!b) return; mode = b.dataset.m;
    m.querySelectorAll('#md button').forEach(x => x.classList.toggle('on', x===b));
    $('#bl',m).hidden = mode!=='link'; $('#bf',m).hidden = mode!=='file'; inp.required = mode==='link'; $('[name=file]',m).required = mode==='file'; };
  $('#ps',m).onclick = async () => { try { inp.value = (await navigator.clipboard.readText()).trim(); upd(); } catch { toast('วางอัตโนมัติไม่ได้ กดค้างที่ช่องแล้ววางได้เลย'); } };
  $('#sc',m).onclick = e => { const b = e.target.closest('[data-v]'); if (!b) return; subj = b.dataset.v; m.querySelectorAll('#sc .chip').forEach(c => c.classList.toggle('on', c===b)); };
  $('#uf',m).onsubmit = async e => {
    e.preventDefault(); const f = new FormData(e.target), btn = $('#ub',m), er = $('#uerr',m), file = f.get('file');
    if (mode==='link' && !li) return er.textContent = 'กรุณาวางลิงก์ที่ถูกต้อง';
    if (mode==='file' && (!file || !file.size)) return er.textContent = 'กรุณาเลือกไฟล์ PDF';
    if (mode==='file' && file.size > 50*1024*1024) return er.textContent = 'ไฟล์ใหญ่เกิน 50 MB (ไฟล์ใหญ่กว่านี้ใช้ลิงก์แทนได้)';
    btn.disabled = true; btn.textContent = mode==='file' ? 'กำลังอัปโหลด...' : 'กำลังเผยแพร่...'; er.textContent = '';
    try {
      let file_url, thumb_url = null;
      if (mode==='link') { file_url = li.url; thumb_url = li.thumb || null; }
      else {
        const thumb = await pdfThumb(file), key = `${S.user.id}/${Date.now()}`;
        const a = await sb.storage.from('files').upload(`pdf/${key}.pdf`, file, {contentType:'application/pdf'}); if (a.error) throw a.error;
        const c = await sb.storage.from('files').upload(`thumb/${key}.jpg`, thumb, {contentType:'image/jpeg'}); if (c.error) throw c.error;
        file_url = sb.storage.from('files').getPublicUrl(`pdf/${key}.pdf`).data.publicUrl;
        thumb_url = sb.storage.from('files').getPublicUrl(`thumb/${key}.jpg`).data.publicUrl;
      }
      const room = f.get('room'), grade = +(room.match(/ม\.(\d)/)?.[1] || S.grade);
      const { error } = await sb.from('sheets').insert({ user_id:S.user.id, author_name:f.get('name'), classroom:room, grade, subject:subj,
        title:f.get('title'), description:f.get('desc'), file_url, thumb_url });
      if (error) throw error;
      m.close(); S.grade = grade; S.subject = subj; toast('เพิ่มสรุปแล้ว 🎉'); burst(); home();
    } catch (x) { er.textContent = x.message; btn.disabled = false; btn.textContent = 'เผยแพร่ 🚀'; }
  };
}
async function pdfThumb(file){
  const pdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
  const page = await pdf.getPage(1), vp = page.getViewport({ scale: 600 / page.getViewport({scale:1}).width });
  const c = document.createElement('canvas'); c.width = vp.width; c.height = vp.height;
  await page.render({ canvasContext:c.getContext('2d'), viewport:vp }).promise;
  return new Promise(r => c.toBlob(r, 'image/jpeg', .8));
}

/* ---------- Session ---------- */
async function onSession(session){
  if (!session) { S.user = null; renderAuth(); return hideSplash(); }
  S.user = session.user;
  const [p, f] = await Promise.all([ sb.from('profiles').select('*').eq('id',S.user.id).single(), sb.from('favorites').select('sheet_id').eq('user_id',S.user.id) ]);
  S.profile = p.data; S.favs = new Set((f.data||[]).map(x=>x.sheet_id));
  render(); hideSplash();
}
const hideSplash = () => { const x = $('#splash'); if (x) { x.classList.add('out'); setTimeout(() => x.remove(), 600); } };
sb.auth.onAuthStateChange((ev, session) => { if (ev==='INITIAL_SESSION'||ev==='SIGNED_IN'||ev==='SIGNED_OUT') onSession(session); });

/* ---------- Detail / Profile / Fun ---------- */
function sheetModal(html){
  const m = document.createElement('div'); m.className = 'modal'; m.innerHTML = `<div class="sheet"><div class="grab"></div>${html}</div>`;
  const sh = $('.sheet',m), g = $('.grab',m); let y0 = null, dy = 0;
  m.close = () => { m.classList.add('out'); setTimeout(() => m.remove(), 230); };
  m.onclick = e => { if (e.target === m) m.close(); };
  g.style.touchAction = 'none';
  g.onpointerdown = e => { y0 = e.clientY; g.setPointerCapture(e.pointerId); };
  g.onpointermove = e => { if (y0 === null) return; dy = Math.max(0, e.clientY - y0); sh.style.transition = 'none'; sh.style.transform = `translateY(${dy}px)`; };
  g.onpointerup = () => { if (y0 === null) return; y0 = null; sh.style.transition = ''; dy > 110 ? m.close() : sh.style.transform = ''; dy = 0; };
  document.body.appendChild(m); return m;
}
function openDetail(r){
  const mine = r.user_id === S.user.id, fav = S.favs.has(r.id), k = KIND[linkInfo(r.file_url)?.kind || 'link'];
  const m = sheetModal(`<div class="cov" style="${bg(r)}">${phi(r)}<span class="kd">${k[1]} ${k[0]}</span></div>
    <h2>${esc(r.title||r.author_name)}</h2>
    <div class="by"><span class="av2">${esc((r.author_name||'?').trim()[0])}</span><div><b>${esc(r.author_name)}</b><span class="mu">${esc(r.classroom)} · ${esc(r.subject)}</span></div><span class="vw" id="vw">👁 ${r.views||0}</span></div>
    <p>${esc(r.description)}</p>
    <div class="row"><a class="btn" id="op" href="${esc(r.file_url)}" target="_blank" rel="noopener">เปิดสรุป ↗</a>
    <button class="btn ghost" id="sh">แชร์</button><button class="btn ghost ${fav?'favon':''}" id="fv">♥</button></div>
    ${mine?'<button class="link del" id="dl">ลบสรุปนี้</button>':''}`);
  $('#op',m).onclick = () => { sb.rpc('inc_view',{ sid:r.id }).then(()=>{}); r.views = (r.views||0)+1; $('#vw',m).textContent = '👁 '+r.views; };
  $('#sh',m).onclick = async () => { try { navigator.share ? await navigator.share({title:r.title||'สรุปจากพี่สภา',url:r.file_url}) : (await navigator.clipboard.writeText(r.file_url), toast('คัดลอกลิงก์แล้ว')); } catch {} };
  $('#fv',m).onclick = async e => { const b = e.currentTarget; await toggleFav(r.id, {classList:{toggle(){}}}); b.classList.toggle('favon'); };
  const dl = $('#dl',m); if (dl) dl.onclick = async () => {
    if (!confirm('ลบสรุปนี้ถาวร?')) return;
    const paths = [r.file_url, r.thumb_url].map(u => u?.split('/files/')[1]).filter(Boolean);
    if (paths.length) await sb.storage.from('files').remove(paths);
    await sb.from('sheets').delete().eq('id', r.id); m.close(); toast('ลบแล้ว'); render();
  };
}
const THEMES = ['auto','light','dark'], TL = {auto:'ตามเครื่อง',light:'สว่าง',dark:'มืด'};
const getTheme = () => { try { return localStorage.getItem('theme')||'auto'; } catch { return 'auto'; } };
function setTheme(t){ try { localStorage.setItem('theme',t); } catch {} t==='auto' ? document.documentElement.removeAttribute('data-theme') : document.documentElement.dataset.theme = t; }
setTheme(getTheme());
function countUp(el){ const n=+el.dataset.n; let i=0; const t=setInterval(()=>{ i++; el.textContent=Math.round(n*i/20); if(i>=20) clearInterval(t); },30); }
async function me(){
  const p = S.profile||{}, { data } = await sb.from('sheets').select('*').eq('user_id',S.user.id).order('created_at',{ascending:false}), mine = data||[];
  shell(`<section class="prof"><label class="ava">${avatarHTML(p)}<input type="file" accept="image/*" id="av" hidden><i class="cam">📷</i></label><h1>${esc(p.full_name)}</h1>
    <p class="mu">${esc(p.classroom)} · ${esc(S.user.email)}</p>${p.is_admin?'<span class="badge">แอดมิน</span>':''}${levelHTML(mine.length)}
    <div class="stats"><div><b data-n="${mine.length}">0</b><span>สรุปของฉัน</span></div><div><b data-n="${S.favs.size}">0</b><span>รายการโปรด</span></div></div>
    <div class="menu"><button id="ed">แก้ไขข้อมูลส่วนตัว<i>›</i></button><button id="th">ธีม<i>${TL[getTheme()]} ›</i></button>
    ${deferred?'<button id="in2">ติดตั้งแอป<i>›</i></button>':''}<button id="lo" class="red">ออกจากระบบ<i>›</i></button></div>
    <h3>สรุปที่ฉันเพิ่ม</h3></section><div class="grid" id="list"></div>`);
  document.querySelectorAll('[data-n]').forEach(countUp);
  drawCards(mine, 'คุณยังไม่ได้เพิ่มสรุป กดปุ่ม + ในหน้าสรุปได้เลย');
  $('#av').onchange = e => e.target.files[0] && changeAvatar(e.target.files[0]);
  $('#th').onclick = () => { setTheme(THEMES[(THEMES.indexOf(getTheme())+1)%3]); me(); };
  $('#lo').onclick = () => confirm('ออกจากระบบ?') && sb.auth.signOut();
  const i2 = $('#in2'); if (i2) i2.onclick = () => { deferred.prompt(); deferred=null; };
  $('#ed').onclick = () => {
    const m = sheetModal(`<h2>แก้ไขข้อมูล</h2><form id="pf2"><label>ชื่อ - นามสกุล</label><input name="n" value="${esc(p.full_name)}" required>
      <label>ห้อง</label><input name="r" value="${esc(p.classroom)}" pattern="ม\\.[1-6]/\\d{1,2}" required><div class="err" id="pe"></div><button class="btn full">บันทึก</button></form>`);
    $('#pf2',m).onsubmit = async e => { e.preventDefault(); const f=new FormData(e.target);
      const { error } = await sb.from('profiles').update({ full_name:f.get('n'), classroom:f.get('r') }).eq('id',S.user.id);
      if (error) return $('#pe',m).textContent = error.message;
      S.profile = { ...p, full_name:f.get('n'), classroom:f.get('r') }; m.remove(); toast('บันทึกแล้ว'); me(); };
  };
}
function burst(el){
  const r = el?.getBoundingClientRect?.(), cx = r ? r.left+r.width/2 : innerWidth/2, cy = r ? r.top+r.height/2 : innerHeight-90, set = r ? ['💚','✨','💖'] : ['🎉','✨','💚','⭐'];
  for (let i=0;i<14;i++){ const e=document.createElement('span'); e.className='cf'; e.textContent=set[i%set.length];
    e.style.cssText=`left:${cx}px;top:${cy}px;bottom:auto;--x:${(Math.random()-.5)*280}px;--y:${-100-Math.random()*200}px`;
    document.body.appendChild(e); setTimeout(()=>e.remove(),1100); }
}

/* ---------- Home: extra sections ---------- */
async function homeExtras(){
  const el = $('#more'); if (!el) return;
  const { data } = await sb.from('sheets').select('*').order('created_at',{ascending:false}).limit(300), rows = data||[];
  rows.forEach(r => S.byId[r.id] = r);
  const by = {}; rows.forEach(r => by[r.author_name] = (by[r.author_name]||0)+1);
  const top = Object.entries(by).sort((a,b)=>b[1]-a[1]).slice(0,5), medal = ['🥇','🥈','🥉','4','5'];
  const foot = `<footer class="foot"><b>พี่สภามีมาแจก</b><p>แบ่งปันความรู้ ช่วยกันเรียน<br>จัดทำโดยสภานักเรียน</p></footer>`;
  if (!rows.length) { el.innerHTML = foot; return; }
  el.innerHTML = `
  <div class="strip"><div><b data-n="${rows.length}">0</b><span>สรุปทั้งหมด</span></div><div><b data-n="${Object.keys(by).length}">0</b><span>ผู้แบ่งปัน</span></div><div><b data-n="${SUBJECTS.length}">0</b><span>หมวดวิชา</span></div></div>
  <h3 class="sec">มาใหม่ล่าสุด</h3>
  ${rail(rows.slice(0,10))}
  <h3 class="sec">เลือกตามวิชา</h3>
  <div class="tiles">${SUBJECTS.map(x=>`<button data-sub="${x}"><b>${esc(x)}</b><span>${rows.filter(r=>r.subject===x).length} ชิ้น</span></button>`).join('')}</div>
  <h3 class="sec">ผู้แบ่งปันยอดเยี่ยม</h3>
  <div class="rank">${top.map(([n,c],i)=>`<div style="--i:${i}"><em>${medal[i]}</em><b>${esc(n)}</b><span>${c} สรุป</span></div>`).join('')}</div>
  ${foot}`;
  el.querySelectorAll('[data-n]').forEach(countUp);
  el.querySelectorAll('[data-open]').forEach(t => t.onclick = () => openDetail(S.byId[t.dataset.open]));
  reveal(el);
  el.querySelectorAll('[data-sub]').forEach(t => t.onclick = () => { S.subject = t.dataset.sub; home(); scrollTo({top:0,behavior:'smooth'}); });
}

/* ---------- Extras: Puffet & Favorites ---------- */
const FOOT = `<footer class="foot"><b>พี่สภามีมาแจก</b><p>แบ่งปันความรู้ ช่วยกันเรียน<br>จัดทำโดยสภานักเรียน</p></footer>`;
const rail = rows => `<div class="rail">${rows.map(r=>`<div class="rit"><div class="rth" data-open="${r.id}" style="${bg(r)}">${phi(r)}<span data-s="${esc(r.subject)}">${esc(r.subject)}</span></div><b>${esc(r.title||r.author_name)}</b><small>${esc(r.author_name)} · ม.${r.grade}</small></div>`).join('')}</div>`;
function wireExtras(el){
  reveal(el);
  el.querySelectorAll('[data-n]').forEach(countUp);
  el.querySelectorAll('[data-open]').forEach(t => t.onclick = () => openDetail(S.byId[t.dataset.open]));
  const go = el.querySelector('[data-go]'); if (go) go.onclick = () => { S.tab = go.dataset.go; render(); scrollTo(0,0); };
}
function puffetExtras(rows){
  const el = $('#more'); if (!el) return;
  const tips = [['เล่าเรื่องของตัวเอง','เริ่มจากเป้าหมายและสิ่งที่สนใจ ให้คนอ่านเห็นว่าคุณเป็นใคร'],['คัดผลงานเด่น','เลือกเฉพาะผลงานที่ภูมิใจและตรงกับสาขาที่อยากเรียน ไม่ต้องใส่ทุกอย่าง'],['อธิบายบทบาทของคุณ','บอกว่าคุณทำอะไรในแต่ละผลงาน และเรียนรู้อะไรจากมัน'],['ใช้ภาพและตัวเลข','รูปกิจกรรม ผลลัพธ์ หรือรางวัล ช่วยให้ผลงานน่าเชื่อถือขึ้น'],['อ่านซ้ำก่อนส่ง','เช็กคำผิดและจัดหน้าให้อ่านง่ายทั้งบนมือถือและกระดาษ']];
  el.innerHTML = `<div class="strip two"><div><b data-n="${rows.length}">0</b><span>พอร์ตที่แสดงอยู่</span></div><div><b>ม.6</b><span>รุ่นพี่แชร์ประสบการณ์</span></div></div>
  <h3 class="sec">เคล็ดลับทำพอร์ตโฟลิโอ</h3>
  <div class="tips">${tips.map(([t,d],i)=>`<div style="--i:${i}"><em>${i+1}</em><section><b>${t}</b><p>${d}</p></section></div>`).join('')}</div>
  <div class="cta"><b>อยากให้ผลงานของคุณมาอยู่ที่นี่?</b><p>ติดต่อสภานักเรียนเพื่อส่งพอร์ตโฟลิโอของคุณ</p></div>${FOOT}`;
  wireExtras(el);
}
async function favsExtras(favRows){
  const el = $('#more'); if (!el) return;
  const myGrade = +(S.profile?.classroom?.match(/ม\.(\d)/)?.[1] || 0);
  const { data } = await sb.from('sheets').select('*').order('created_at',{ascending:false}).limit(80);
  const favSubs = new Set(favRows.map(r=>r.subject));
  const rec = (data||[]).filter(r=>!S.favs.has(r.id)).sort((a,b)=>((favSubs.has(b.subject)?2:0)+(b.grade===myGrade?1:0))-((favSubs.has(a.subject)?2:0)+(a.grade===myGrade?1:0))).slice(0,10);
  (data||[]).forEach(r=>S.byId[r.id]=r);
  const cnt = SUBJECTS.map(x=>[x,favRows.filter(r=>r.subject===x).length]).filter(([,c])=>c);
  el.innerHTML = `${favRows.length?`<h3 class="sec">โปรดแยกตามวิชา</h3><div class="chips2">${cnt.map(([x,c])=>`<span>${esc(x)} <b>${c}</b></span>`).join('')}</div>`
      :`<div class="cta"><b>ยังไม่มีรายการโปรด</b><p>กดหัวใจที่ชีทที่ชอบเพื่อเก็บไว้อ่านทีหลัง</p><button class="btn" data-go="home">ไปดูสรุป</button></div>`}
    ${rec.length?`<h3 class="sec">แนะนำสำหรับคุณ</h3>${rail(rec)}`:''}${FOOT}`;
  wireExtras(el);
}

/* ---------- Avatar & effects ---------- */
function avatarHTML(p){ return p?.avatar_url ? `<img src="${esc(p.avatar_url)}" alt="">` : esc((p?.full_name||'?').trim()[0]); }
async function squareThumb(file, size=400){
  const bmp = await createImageBitmap(file), m = Math.min(bmp.width, bmp.height), c = document.createElement('canvas');
  c.width = c.height = size; c.getContext('2d').drawImage(bmp,(bmp.width-m)/2,(bmp.height-m)/2,m,m,0,0,size,size);
  return new Promise(r => c.toBlob(r,'image/jpeg',.85));
}
async function changeAvatar(file){
  try {
    toast('กำลังอัปโหลดรูป...');
    const path = `avatar/${S.user.id}/${Date.now()}.jpg`, old = S.profile?.avatar_url;
    const up = await sb.storage.from('files').upload(path, await squareThumb(file), {contentType:'image/jpeg'}); if (up.error) throw up.error;
    const url = sb.storage.from('files').getPublicUrl(path).data.publicUrl;
    const { error } = await sb.from('profiles').update({ avatar_url:url }).eq('id',S.user.id); if (error) throw error;
    if (old) sb.storage.from('files').remove([old.split('/files/')[1]]);
    S.profile = { ...S.profile, avatar_url:url }; toast('เปลี่ยนรูปแล้ว'); burst(); me();
  } catch (e) { toast('อัปโหลดรูปไม่สำเร็จ'); console.error(e); }
}
const greet = () => { const h = new Date().getHours(); return h<12 ? 'อรุณสวัสดิ์' : h<17 ? 'สวัสดีตอนบ่าย' : 'สวัสดีตอนเย็น'; };
function reveal(root){
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } }), {threshold:.12});
  root.querySelectorAll('.sec,.strip,.tiles,.rank,.tips,.cta,.rail,.foot').forEach(x => { x.classList.add('rv'); io.observe(x); });
}
document.addEventListener('pointerdown', e => {
  const t = e.target.closest('.btn:not(.fab),.chip,.tabs button,.tiles button,.menu button'); if (!t) return;
  const r = t.getBoundingClientRect(), d = Math.max(r.width,r.height)*1.6, s = document.createElement('span'); s.className='rip';
  s.style.cssText = `width:${d}px;height:${d}px;left:${e.clientX-r.left-d/2}px;top:${e.clientY-r.top-d/2}px`;
  t.appendChild(s); setTimeout(() => s.remove(), 600);
});
let ly = 0, tick = false;
addEventListener('scroll', () => { if (tick) return; tick = true; requestAnimationFrame(() => {
  const y = scrollY, hide = y > ly && y > 120;
  document.documentElement.style.setProperty('--sy', y);
  $('header.top')?.classList.toggle('sc', y > 8);
  $('.tabs')?.classList.toggle('hide', hide); $('.fab')?.classList.toggle('hide', hide);
  ly = y; tick = false; }); }, { passive:true });
let ty = null;
addEventListener('touchstart', e => { ty = scrollY <= 0 ? e.touches[0].clientY : null; }, { passive:true });
addEventListener('touchend', e => { if (ty !== null && S.user && e.changedTouches[0].clientY - ty > 110) { toast('กำลังรีเฟรช...'); render(); } ty = null; }, { passive:true });
