<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="default">
    
    <title>Rian Ready - ระบบยืมร่มสภานักเรียน</title>

    <link rel="apple-touch-icon" sizes="180x180" href="https://lh3.googleusercontent.com/d/13lxchZUCJpK-zHG2lf56avQ87WFhhu6O">
    <link rel="icon" type="image/png" sizes="192x192" href="https://lh3.googleusercontent.com/d/13lxchZUCJpK-zHG2lf56avQ87WFhhu6O">
    <meta name="apple-mobile-web-app-title" content="Rian Ready">
    <meta name="theme-color" content="#22c55e"> <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;600&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Kanit', sans-serif;
            background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
            color: #1e293b;
            min-height: 100vh;
            -webkit-overflow-scrolling: touch;
        }

        .marquee-container {
            background: rgba(255, 255, 255, 0.9);
            backdrop-filter: blur(10px);
            border-bottom: 1px solid rgba(186, 230, 253, 0.5);
            padding: 14px 0;
            overflow: hidden;
            position: sticky;
            top: 0;
            z-index: 50;
        }
        .marquee-text {
            display: inline-block;
            white-space: nowrap;
            animation: marquee 20s linear infinite;
            color: #0369a1;
            font-weight: 600;
        }
        @keyframes marquee {
            0% { transform: translateX(100%); }
            100% { transform: translateX(-100%); }
        }

        .umbrella-card {
            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            background: white;
            border-radius: 24px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.7);
            position: relative;
            overflow: hidden;
            -webkit-tap-highlight-color: transparent;
        }
        
        .umbrella-card:hover { transform: translateY(-8px); box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); }
        .umbrella-card:active { transform: scale(0.95); }

        .status-available { border-bottom: 6px solid #22c55e; }
        .status-borrowed { border-bottom: 6px solid #ef4444; }
        .status-damaged { border-bottom: 6px solid #3b82f6; }

        .modal { display: none; backdrop-filter: blur(8px); }
        .modal.active { display: flex; animation: modalFadeIn 0.3s ease-out; }
        @keyframes modalFadeIn {
            from { opacity: 0; transform: scale(0.9); }
            to { opacity: 1; transform: scale(1); }
        }
        .btn-float { transition: all 0.2s; -webkit-tap-highlight-color: transparent; }
        .btn-float:active { transform: translateY(2px); }

        input { font-size: 16px !important; }
    </style>
</head>
<body>

    <div class="marquee-container">
        <div class="marquee-text">
            คณะกรรมการสภานักเรียนยินดีต้อนรับ — ยินดีต้อนรับสู่ระบบ Rian Ready ยืมร่มสภานักเรียน
        </div>
    </div>

    <div class="max-w-6xl mx-auto px-5 py-8">
        <header class="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
            <div class="text-center md:text-left">
                <h1 class="text-4xl font-black text-sky-900 tracking-tight">Rian Ready</h1>
                <p class="text-sky-600 font-medium">ระบบยืม-คืนร่มพี่สภา</p>
            </div>
            <div class="flex gap-2">
                <button onclick="openQuickReturn()" class="bg-red-500 text-white px-6 py-2.5 rounded-2xl font-semibold hover:bg-red-600 transition btn-float text-sm shadow-lg shadow-red-200">
                    คืนร่ม
                </button>
                <button onclick="openAdminModal()" class="bg-white/80 border border-sky-100 text-sky-700 px-6 py-2.5 rounded-2xl font-semibold hover:bg-sky-50 transition btn-float text-sm">
                    เข้าสู่ระบบจัดการ
                </button>
            </div>
        </header>

        <div id="umbrellaGrid" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6"></div>
    </div>

    <div id="borrowModal" class="modal fixed inset-0 bg-sky-900/20 z-[100] items-center justify-center p-5">
        <div class="bg-white p-8 rounded-[32px] shadow-2xl w-full max-w-sm border border-sky-50">
            <div class="w-12 h-1 bg-sky-100 rounded-full mx-auto mb-6"></div>
            <h2 class="text-2xl font-bold mb-2 text-sky-900 text-center" id="modalTitle">ร่มหมายเลข</h2>
            <p id="modalSubTitle" class="text-center text-sm text-gray-500 mb-6">กรุณากรอกข้อมูลเพื่อดำเนินการ</p>
            
            <div class="space-y-3">
                <div id="idInputGroup" class="hidden mb-3">
                    <label class="text-xs font-bold text-sky-700 ml-1 uppercase">ระบุหมายเลขร่ม (เช่น Umbrella 1)</label>
                    <input type="text" id="manualUmbrellaId" placeholder="ตัวอย่าง: Umbrella 5" class="w-full p-4 bg-sky-50 border border-sky-100 rounded-2xl outline-none focus:ring-2 ring-sky-400 transition">
                </div>
                
                <input type="hidden" id="selectedUmbrellaId">
                
                <div id="inputGroup" class="space-y-3">
                    <input type="text" id="studentName" placeholder="ชื่อ-นามสกุล" class="w-full p-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 ring-sky-400 transition">
                    <div class="grid grid-cols-2 gap-3">
                        <input type="text" id="studentClass" placeholder="ห้อง" class="p-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 ring-sky-400 transition">
                        <input type="text" id="studentNo" placeholder="เลขที่" class="p-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 ring-sky-400 transition">
                    </div>
                    <input type="text" id="studentId" placeholder="เลขประจำตัวนักเรียน" class="w-full p-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 ring-sky-400 transition">
                </div>

                <div class="flex flex-col gap-3 mt-6">
                    <button id="btnBorrow" onclick="submitAction('borrow')" class="w-full bg-green-500 text-white py-4 rounded-2xl font-bold text-lg btn-float">ยืนยันการยืม</button>
                    <button id="btnReturn" onclick="submitAction('return')" class="w-full bg-red-500 text-white py-4 rounded-2xl font-bold text-lg btn-float hidden">ยืนยันการคืนร่ม</button>
                </div>
                <button onclick="closeModal('borrowModal')" class="w-full text-gray-400 mt-4 text-sm font-medium">ยกเลิก</button>
            </div>
        </div>
    </div>

    <div id="adminPanel" class="hidden max-w-4xl mx-auto px-6 py-8 bg-white/80 backdrop-blur-md rounded-[32px] mt-10 shadow-xl border border-white">
        <div class="flex justify-between items-center mb-8">
            <h2 class="text-xl font-bold text-sky-900">แผงควบคุมสภานักเรียน</h2>
            <button onclick="addUmbrella()" class="bg-sky-600 text-white px-5 py-2 rounded-xl text-sm font-bold btn-float">+ เพิ่มร่ม</button>
        </div>
        <div id="adminList" class="space-y-3"></div>
    </div>

    <footer class="mt-20 py-12 text-center">
        <div class="inline-block p-6 bg-white/50 rounded-[24px] border border-white">
            <p class="font-bold text-sky-900 text-lg">นายฐนิต พุ่มพุทรา</p>
            <p class="text-sky-600 text-sm">ฝ่ายวิชาการ คณะกรรมการสภานักเรียน</p>
            <p class="text-sky-600 text-sm">©sapachainatpittayakhom</p>
        </div>
    </footer>

    <script>
        let umbrellas = [];

        window.onload = function() {
            refreshData();
        };

        function refreshData() {
            if (typeof google !== 'undefined') {
                google.script.run.withSuccessHandler(data => {
                    updateUmbrellasArray(data);
                    renderUmbrellas();
                }).getUmbrellaStatus();
            } else {
                if(umbrellas.length === 0) {
                   for(let i=1; i<=20; i++) umbrellas.push({ id: `Umbrella ${i}`, status: 'available' });
                }
                renderUmbrellas();
            }
        }

        function updateUmbrellasArray(data) {
            umbrellas = [];
            Object.keys(data).forEach(id => {
                umbrellas.push({ id: id, status: data[id] });
            });
            umbrellas.sort((a, b) => {
                const numA = parseInt(a.id.replace(/\D/g, '')) || 0;
                const numB = parseInt(b.id.replace(/\D/g, '')) || 0;
                return numA - numB;
            });
        }

        function renderUmbrellas() {
            const grid = document.getElementById('umbrellaGrid');
            grid.innerHTML = '';
            umbrellas.forEach(u => {
                const card = document.createElement('div');
                card.className = `umbrella-card p-6 flex flex-col items-center justify-center text-center cursor-pointer ${getStatusClass(u.status)}`;
                card.onclick = () => handleUmbrellaClick(u);
                
                card.innerHTML = `
                    <div class="w-10 h-10 bg-sky-50 rounded-full flex items-center justify-center mb-3">
                        <div class="w-2 h-2 rounded-full ${u.status === 'available' ? 'bg-green-500 animate-pulse' : (u.status === 'borrowed' ? 'bg-red-500' : 'bg-blue-500')}"></div>
                    </div>
                    <div class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Items</div>
                    <div class="text-lg font-black text-sky-900 mb-3">${u.id}</div>
                    <div class="px-3 py-1 rounded-full text-[10px] font-black uppercase ${getStatusBadge(u.status)}">
                        ${getStatusText(u.status)}
                    </div>
                `;
                grid.appendChild(card);
            });
        }

        function getStatusClass(status) {
            if(status === 'available') return 'status-available';
            if(status === 'borrowed') return 'status-borrowed';
            return 'status-damaged';
        }

        function getStatusBadge(status) {
            if(status === 'available') return 'bg-green-100 text-green-700';
            if(status === 'borrowed') return 'bg-red-100 text-red-700';
            return 'bg-blue-100 text-blue-700';
        }

        function getStatusText(status) {
            if(status === 'available') return 'ว่าง';
            if(status === 'borrowed') return 'ถูกยืม';
            return 'ชำรุด';
        }

        function openQuickReturn() {
            document.getElementById('selectedUmbrellaId').value = "";
            document.getElementById('manualUmbrellaId').value = "";
            document.getElementById('modalTitle').innerText = "คืนร่มสภานักเรียน";
            document.getElementById('modalSubTitle').innerText = "กรุณาระบุหมายเลขร่มและข้อมูลผู้คืน";
            document.getElementById('idInputGroup').classList.remove('hidden');
            document.getElementById('btnBorrow').classList.add('hidden');
            document.getElementById('btnReturn').classList.remove('hidden');
            document.getElementById('borrowModal').classList.add('active');
        }

        function handleUmbrellaClick(u) {
            if(u.status === 'damaged') { alert('ร่มนี้ชำรุด ไม่สามารถใช้งานได้'); return; }
            document.getElementById('idInputGroup').classList.add('hidden');
            document.getElementById('selectedUmbrellaId').value = u.id;
            document.getElementById('modalTitle').innerText = u.id;
            const btnBorrow = document.getElementById('btnBorrow');
            const btnReturn = document.getElementById('btnReturn');

            if(u.status === 'borrowed') {
                btnBorrow.classList.add('hidden');
                btnReturn.classList.remove('hidden');
                document.getElementById('modalSubTitle').innerText = "กรุณากรอกข้อมูลผู้คืนร่ม";
            } else {
                btnBorrow.classList.remove('hidden');
                btnReturn.classList.add('hidden');
                document.getElementById('modalSubTitle').innerText = "กรุณากรอกข้อมูลผู้ยืมร่ม";
            }
            document.getElementById('borrowModal').classList.add('active');
        }

        function submitAction(type) {
            let id = document.getElementById('selectedUmbrellaId').value || document.getElementById('manualUmbrellaId').value.trim();
            if(!id) { alert('กรุณาระบุหมายเลขร่ม'); return; }

            const data = {
                umbrellaId: id,
                name: document.getElementById('studentName').value,
                studentClass: document.getElementById('studentClass').value,
                no: document.getElementById('studentNo').value,
                studentId: document.getElementById('studentId').value,
                status: type === 'borrow' ? 'ยืม' : 'คืน'
            };

            if(!data.name) { alert('กรุณากรอกชื่อ-นามสกุล'); return; }

            const btn = (type === 'borrow') ? document.getElementById('btnBorrow') : document.getElementById('btnReturn');
            btn.innerText = "กำลังบันทึก...";
            btn.disabled = true;

            if (typeof google !== 'undefined') {
                google.script.run.withSuccessHandler((newStatuses) => {
                    btn.disabled = false;
                    btn.innerText = (type === 'borrow') ? "ยืนยันการยืม" : "ยืนยันการคืนร่ม";
                    alert(`ดำเนินการ ${data.status} ${id} สำเร็จ`);
                    updateUmbrellasArray(newStatuses);
                    resetAndClose();
                }).recordData(data);
            }
        }

        function resetAndClose() {
            ['studentName', 'studentClass', 'studentNo', 'studentId', 'manualUmbrellaId'].forEach(el => {
                document.getElementById(el).value = '';
            });
            renderUmbrellas();
            closeModal('borrowModal');
        }

        function openAdminModal() {
            const user = prompt("ชื่อผู้ใช้ (ขึ้นต้นด้วย Sapa):");
            const pass = prompt("รหัสผ่าน:");
            if(!user || !pass) return;
            google.script.run.withSuccessHandler(isValid => {
                if (isValid) {
                    document.getElementById('adminPanel').classList.remove('hidden');
                    document.getElementById('adminPanel').scrollIntoView({ behavior: 'smooth' });
                    renderAdminList();
                    alert("ยินดีต้อนรับคุณ " + user);
                } else { alert("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง"); }
            }).checkAdminLogin(user, pass);
        }

        function renderAdminList() {
            const list = document.getElementById('adminList');
            list.innerHTML = '';
            umbrellas.forEach(u => {
                const item = document.createElement('div');
                item.className = 'flex items-center justify-between p-4 bg-white rounded-2xl border border-sky-50 shadow-sm';
                item.innerHTML = `
                    <span class="font-bold text-sky-900">${u.id}</span>
                    <div class="flex gap-2">
                        <button onclick="setDamaged('${u.id}')" class="bg-blue-100 text-blue-600 px-3 py-1.5 rounded-xl text-xs font-bold">ชำรุด</button>
                        <button onclick="deleteUmbrella('${u.id}')" class="bg-red-50 text-red-500 px-3 py-1.5 rounded-xl text-xs font-bold">ลบ</button>
                    </div>
                `;
                list.appendChild(item);
            });
        }

        // ฟังก์ชันเพิ่มร่มตัวใหม่จริง
        function addUmbrella() {
            if (typeof google !== 'undefined') {
                const btn = event.target;
                btn.innerText = "กำลังเพิ่ม...";
                btn.disabled = true;
                google.script.run.withSuccessHandler(newStatuses => {
                    btn.innerText = "+ เพิ่มร่ม";
                    btn.disabled = false;
                    updateUmbrellasArray(newStatuses);
                    renderUmbrellas();
                    renderAdminList();
                    alert("เพิ่มร่มคันใหม่สำเร็จ!");
                }).addNewUmbrella();
            }
        }

        function setDamaged(id) {
            if(confirm(`ยืนยันการแจ้งชำรุด ${id}?`)) {
                google.script.run.withSuccessHandler(newStatuses => {
                    updateUmbrellasArray(newStatuses);
                    renderUmbrellas(); renderAdminList();
                }).updateUmbrellaAdmin(id, 'damaged');
            }
        }

        function deleteUmbrella(id) {
            if(confirm(`ต้องการลบ ${id} ออกจากระบบถาวร?`)) {
                google.script.run.withSuccessHandler(newStatuses => {
                    updateUmbrellasArray(newStatuses);
                    renderUmbrellas(); renderAdminList();
                }).updateUmbrellaAdmin(id, 'delete');
            }
        }

        function closeModal(id) { document.getElementById(id).classList.remove('active'); }
    </script>
</body>
</html>
