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
    const { error } = reg
      ? await sb.auth.signUp({ email:f.email, password:f.pw, options:{ data:{ full_name:f.name, classroom:f.room } } })
      : await sb.auth.signInWithPassword({ email:f.email, password:f.pw });
    if (error) err.textContent = error.message.includes('Invalid login') ? 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' : error.message;
  };
}

/* ---------- Layout ---------- */
function shell(inner){
  app.innerHTML = `<header class="top"><div class="in"><div class="logo">พี่สภามีมาแจก</div>
    <nav>${[['home','สรุป'],['puffet','Puffet'],['favs','โปรด']].map(([k,l])=>`<button data-t="${k}" class="${S.tab===k?'on':''}">${l}</button>`).join('')}</nav>
    <button class="btn ghost" id="out">ออก</button></div></header>
    <main class="wrap view">${inner}</main>
    ${S.tab==='home'?'<button class="btn fab" id="add">+ เพิ่มสรุป</button>':''}`;
  document.querySelectorAll('nav button').forEach(b => b.onclick = () => { S.tab=b.dataset.t; render(); });
  $('#out').onclick = () => sb.auth.signOut();
  const add = $('#add'); if (add) add.onclick = openUpload;
}
async function render(){ ({home,puffet,favs:favsView})[S.tab](); }

/* ---------- Home ---------- */
async function home(){
  shell(`<section class="hero"><h1>สรุปม.${S.grade}<br>จากสภานักเรียน</h1><p>เลือกระดับชั้นและวิชาที่ต้องการ</p></section>
    <div class="chips" id="g">${GRADES.map(g=>`<button class="chip ${g===S.grade?'on':''}" data-g="${g}">ม.${g}</button>`).join('')}</div>
    <div class="chips" id="s">${['ทั้งหมด',...SUBJECTS].map(s=>`<button class="chip ${s===S.subject?'on':''}" data-s="${s}">${s}</button>`).join('')}</div>
    <div class="grid" id="list"><div class="empty">กำลังโหลด...</div></div>`);
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
