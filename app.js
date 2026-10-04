import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { SUPABASE_URL, SUPABASE_KEY } from './config.js';
const sb = createClient(SUPABASE_URL, SUPABASE_KEY);
const SUBJECTS = ['ภาษาไทย','คณิตศาสตร์','สังคมศึกษา','วิทยาศาสตร์ทั่วไป','ชีววิทยา','ฟิสิกส์','เคมี'];
const GRADES = [1,2,3,4,5,6];
const S = { user:null, profile:null, tab:'home', grade:1, subject:'ทั้งหมด', favs:new Set(), mode:'login' };
const $ = (s,r=document) => r.querySelector(s);
const app = $('#app');
const esc = t => String(t??'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2500)}

if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js');
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

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
const ICON={home:ic('<path d="M4 4h12a2 2 0 0 1 2 2v14H6a2 2 0 0 1-2-2z"/><path d="M8 9h6M8 13h6"/>'),puffet:ic('<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>'),favs:ic('<path d="M20.8 5.6a5 5 0 0 0-7.1 0L12 7.3l-1.7-1.7a5 5 0 0 0-7.1 7.1L12 21l8.8-8.3a5 5 0 0 0 0-7.1z"/>'),out:ic('<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>')};
function shell(inner){
  app.innerHTML = `<header class="top"><div class="in"><div class="logo"><i></i>พี่สภามีมาแจก</div>
    ${deferred?'<button class="btn sm" id="inst">ติดตั้งแอป</button>':''}
    <button class="icon" id="out" aria-label="ออกจากระบบ">${ICON.out}</button></div></header>
    <main class="wrap view">${inner}</main>
    <div class="tabs">${[['home','สรุป'],['puffet','Puffet'],['favs','โปรด']].map(([k,l])=>`<button data-t="${k}" class="${S.tab===k?'on':''}">${ICON[k]}<span>${l}</span></button>`).join('')}</div>
    ${S.tab==='home'?'<button class="btn fab" id="add" aria-label="เพิ่มสรุป">+</button>':''}`;
  document.querySelectorAll('.tabs button').forEach(b => b.onclick = () => { S.tab=b.dataset.t; render(); scrollTo(0,0); });
  $('#out').onclick = () => confirm('ออกจากระบบ?') && sb.auth.signOut();
  const add = $('#add'); if (add) add.onclick = openUpload;
  const inst = $('#inst'); if (inst) inst.onclick = () => { deferred.prompt(); deferred=null; inst.remove(); };
}
async function render(){ ({home,puffet,favs:favsView})[S.tab](); }

/* ---------- Home ---------- */
async function home(){
  shell(`<section class="hero"><p class="hi">สวัสดี ${esc((S.profile?.full_name||'').split(' ')[0])} 👋</p><h1>สรุป ม.${S.grade}<br>จากสภานักเรียน</h1></section>
    <div class="chips" id="g">${GRADES.map(g=>`<button class="chip ${g===S.grade?'on':''}" data-g="${g}">ม.${g}</button>`).join('')}</div>
    <div class="chips" id="s">${['ทั้งหมด',...SUBJECTS].map(s=>`<button class="chip ${s===S.subject?'on':''}" data-s="${s}">${s}</button>`).join('')}</div>
    <div class="grid" id="list">${'<div class="sk"></div>'.repeat(6)}</div>`);
  $('#g').onclick = e => { const g=e.target.dataset.g; if(g){S.grade=+g;home()} };
  $('#s').onclick = e => { const s=e.target.dataset.s; if(s){S.subject=s;home()} };
  let q = sb.from('sheets').select('*').eq('grade',S.grade).order('created_at',{ascending:false});
  if (S.subject!=='ทั้งหมด') q = q.eq('subject',S.subject);
  const { data } = await q; drawCards(data||[], 'ยังไม่มีสรุปในหมวดนี้ มาเป็นคนแรกที่เพิ่มได้เลย');
}
function drawCards(rows, emptyMsg){
  const el = $('#list'); if(!el) return;
  el.innerHTML = rows.length ? rows.map(r=>`<article class="card">
    <a class="thumb" href="${esc(r.file_url)}" target="_blank" rel="noopener" style="background-image:url('${esc(r.thumb_url)}')">
      <span class="tag">${esc(r.subject)}</span></a>
    <button class="heart ${S.favs.has(r.id)?'on':''}" data-id="${r.id}" aria-label="รายการโปรด">♥</button>
    <div class="meta"><b>${esc(r.author_name)}</b><span>${esc(r.classroom)}</span><p>${esc(r.description)}</p></div></article>`).join('')
    : `<div class="empty">${emptyMsg}</div>`;
  el.querySelectorAll('.heart').forEach(b => b.onclick = () => toggleFav(+b.dataset.id, b));
}
async function toggleFav(id, btn){
  if (S.favs.has(id)) { S.favs.delete(id); await sb.from('favorites').delete().match({user_id:S.user.id, sheet_id:id}); }
  else { S.favs.add(id); await sb.from('favorites').insert({user_id:S.user.id, sheet_id:id}); }
  btn.classList.toggle('on'); if (S.tab==='favs') favsView();
}

/* ---------- Favorites ---------- */
async function favsView(){
  shell(`<section class="hero"><h1>รายการโปรดของฉัน</h1><p>ชีทที่กดหัวใจไว้</p></section><div class="grid" id="list"></div>`);
  const ids = [...S.favs];
  const { data } = ids.length ? await sb.from('sheets').select('*').in('id',ids) : { data:[] };
  drawCards(data||[], 'ยังไม่มีรายการโปรด กดหัวใจที่ชีทที่ชอบได้เลย');
}

/* ---------- Puffet ---------- */
async function puffet(){
  shell(`<section class="hero"><h1>Puffet</h1><p>พอร์ตโฟลิโอพี่ ม.6</p></section><div class="pf" id="pf"><div class="empty">กำลังโหลด...</div></div>`);
  const { data } = await sb.from('puffet').select('*').order('created_at',{ascending:false});
  $('#pf').innerHTML = (data||[]).length ? data.map(p=>`<article class="card">
    <a class="thumb" ${p.link_url?`href="${esc(p.link_url)}" target="_blank" rel="noopener"`:''} style="background-image:url('${esc(p.image_url)}')"></a>
    <div class="meta"><b>${esc(p.title)}</b><p>${esc(p.description)}</p></div></article>`).join('') : '<div class="empty">ยังไม่มีพอร์ตโฟลิโอ</div>';
}

/* ---------- Upload ---------- */
function openUpload(){
  const m = document.createElement('div'); m.className='modal';
  m.innerHTML = `<form class="sheet"><h2>เพิ่มสรุปของคุณ</h2><p class="sub">ไฟล์ PDF เท่านั้น</p>
    <label>ไฟล์ PDF</label><input type="file" name="file" accept="application/pdf" required>
    <label>ชื่อ - นามสกุล</label><input name="name" value="${esc(S.profile?.full_name)}" required>
    <label>ห้อง</label><input name="room" value="${esc(S.profile?.classroom)}" pattern="ม\\.[1-6]/\\d{1,2}" required>
    <label>หมวดหมู่</label><select name="subject">${SUBJECTS.map(s=>`<option>${s}</option>`).join('')}</select>
    <label>รายละเอียดของเนื้อหา</label><textarea name="desc" rows="3" required></textarea>
    <div class="err" id="uerr"></div>
    <button class="btn full" id="ub">อัปโหลด</button><button type="button" class="btn ghost full" id="uc">ยกเลิก</button></form>`;
  document.body.appendChild(m);
  $('#uc',m).onclick = () => m.remove();
  $('form',m).onsubmit = async e => {
    e.preventDefault(); const f = new FormData(e.target), file = f.get('file'), btn = $('#ub',m);
    if (file.size > 20*1024*1024) return $('#uerr',m).textContent='ไฟล์ใหญ่เกิน 20 MB';
    btn.disabled = true; btn.textContent = 'กำลังอัปโหลด...';
    try {
      const thumb = await pdfThumb(file), key = `${S.user.id}/${Date.now()}`;
      const a = await sb.storage.from('files').upload(`pdf/${key}.pdf`, file, {contentType:'application/pdf'}); if(a.error) throw a.error;
      const b = await sb.storage.from('files').upload(`thumb/${key}.jpg`, thumb, {contentType:'image/jpeg'}); if(b.error) throw b.error;
      const room = f.get('room'), grade = +(room.match(/ม\.(\d)/)?.[1] || S.grade);
      const { error } = await sb.from('sheets').insert({ user_id:S.user.id, author_name:f.get('name'), classroom:room, grade,
        subject:f.get('subject'), description:f.get('desc'),
        file_url: sb.storage.from('files').getPublicUrl(`pdf/${key}.pdf`).data.publicUrl,
        thumb_url: sb.storage.from('files').getPublicUrl(`thumb/${key}.jpg`).data.publicUrl });
      if (error) throw error;
      m.remove(); S.grade = grade; S.subject = f.get('subject'); toast('เพิ่มสรุปแล้ว'); home();
    } catch (er) { $('#uerr',m).textContent = er.message; btn.disabled=false; btn.textContent='อัปโหลด'; }
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
  if (!session) { S.user = null; return renderAuth(); }
  S.user = session.user;
  const [p, f] = await Promise.all([ sb.from('profiles').select('*').eq('id',S.user.id).single(), sb.from('favorites').select('sheet_id').eq('user_id',S.user.id) ]);
  S.profile = p.data; S.favs = new Set((f.data||[]).map(x=>x.sheet_id));
  render();
}
sb.auth.onAuthStateChange((ev, session) => { if (ev==='INITIAL_SESSION'||ev==='SIGNED_IN'||ev==='SIGNED_OUT') onSession(session); });
