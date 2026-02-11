/* ============================================
   APP.JS - Logic chính Quay Số Trúng Thưởng
   ============================================ */

const App = {
    // State
    employees: [],          // Danh sách mã nhân viên
    employeeNames: {},      // Map mã -> tên (nếu có)
    prizes: [],             // Cấu hình giải thưởng
    results: {},            // Kết quả: { prizeName: [mã NV] }
    currentPrizeIndex: 0,   // Giải đang quay
    wonEmployees: new Set(), // Nhân viên đã trúng
    spinner: null,
    isSpinning: false,

    // Default employee list
    defaultEmployees: [
        'N08-066', 'J18-132', 'P07-188', 'J25-189', 'J25-170',
        'P03-022', 'P13-093', 'J22-278', 'P14-294', 'J23-081',
        'P15-173', 'J15-152', 'P16-102', 'J17-092', 'G04-144',
        'P17-258', 'J07-190', 'J18-219', 'J19-261', 'P11-166',
        'P07-029', 'P15-179', 'P12-088', 'J05-042', 'P20-096',
        'P14-092', 'P92-001', 'G14-313'
    ],

    // Default employee names
    defaultEmployeeNames: {
        'N08-066': 'Nguyễn Thị Ngọc Diệu',
        'J18-132': 'Nguyễn Thị Mỹ Hạnh',
        'P07-188': 'Đỗ Hùng Cường',
        'J25-189': 'Dương Hữu Quang',
        'J25-170': 'Huỳnh Ngọc Thuỳ Trinh',
        'P03-022': 'Khương Phú Đức',
        'P13-093': 'Lê Đặng Thái Phong',
        'J22-278': 'Lê Thị Như Trang',
        'P14-294': 'Ngô Hoàng Xuyên',
        'J23-081': 'Nguyễn Đoàn Vĩnh',
        'P15-173': 'Nguyễn Hồ Đình Xuyên',
        'J15-152': 'Nguyễn Lương Bảo Châu',
        'P16-102': 'Nguyễn Ngọc Hải',
        'J17-092': 'Nguyễn Ngọc Linh Ân',
        'G04-144': 'Nguyễn Thanh Bình',
        'P17-258': 'Nguyễn Thành Trung',
        'J07-190': 'Nguyễn Thị Diệu Linh',
        'J18-219': 'Nguyễn Thị Thảo Trang',
        'J19-261': 'Nguyễn Thị Thu Thực',
        'P11-166': 'Nguyễn Tuấn Hùng',
        'P07-029': 'Nguyễn Văn Hùng',
        'P15-179': 'Nguyễn Văn Thảo',
        'P12-088': 'Phạm Hoàng Anh',
        'J05-042': 'Thái Nguyễn Giang Thanh',
        'P20-096': 'Trần Anh Dũng',
        'P14-092': 'Trần Anh Tuấn',
        'P92-001': 'Võ Thanh Dũng',
        'G14-313': 'Vũ Thị Bích Thảo',
    },

    // Default prizes
    defaultPrizes: [
        { name: 'Giải Nhất', count: 3, color: '#FFD700', colorLight: '#FFF2A8' },
        { name: 'Giải Nhì', count: 4, color: '#D4D4D4', colorLight: '#F0F0F0' },
        { name: 'Giải Ba', count: 2, color: '#DBA368', colorLight: '#F0CCA0' },
        { name: 'Giải Tư', count: 5, color: '#8FBF9F', colorLight: '#C2E8D0' },
        { name: 'Giải Khuyến Khích', count: 5, color: '#8BB8D9', colorLight: '#C0DDEF' },
    ],

    // ---- INITIALIZATION ----
    init() {
        this.prizes = JSON.parse(JSON.stringify(this.defaultPrizes));

        // Load default employees and names
        this.employees = [...this.defaultEmployees];
        this.employeeNames = { ...this.defaultEmployeeNames };
        const uploadArea = document.getElementById('uploadArea');
        uploadArea.classList.add('has-file');
        uploadArea.innerHTML = `
            <div class="upload-icon">✅</div>
            <p class="file-info">Danh sách mặc định</p>
            <p>Đã tải <strong>${this.employees.length}</strong> nhân viên</p>
            <p style="font-size:0.85rem; opacity:0.5; margin-top:8px;">Click để import danh sách khác từ Excel</p>
        `;

        this.renderPrizes();
        this.bindEvents();
        this.updateStartButton();

        // Init background particles
        const particlesContainer = document.querySelector('.particles');
        if (particlesContainer) {
            BackgroundParticles.init(particlesContainer);
        }

        // Init sound
        SoundManager.init();
    },

    // ---- EVENT BINDING ----
    bindEvents() {
        // File upload
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');

        uploadArea.addEventListener('click', () => fileInput.click());
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = 'var(--gold)';
        });
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.style.borderColor = '';
        });
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = '';
            if (e.dataTransfer.files.length) {
                fileInput.files = e.dataTransfer.files;
                this.handleFileUpload(e.dataTransfer.files[0]);
            }
        });
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length) {
                this.handleFileUpload(e.target.files[0]);
            }
        });

        // Start button
        document.getElementById('btnStart').addEventListener('click', () => this.startDrawing());

        // Spin button
        document.getElementById('btnSpin').addEventListener('click', () => this.spinOnce());
        document.getElementById('btnSpinAll').addEventListener('click', () => this.spinAllForPrize());

        // Add prize
        document.getElementById('btnAddPrize').addEventListener('click', () => this.addPrize());

        // Back button
        document.getElementById('btnBack').addEventListener('click', () => this.goBack());

        // Reset button
        document.getElementById('btnReset').addEventListener('click', () => this.resetResults());

        // Sound toggle
        document.getElementById('btnSound').addEventListener('click', () => {
            const enabled = SoundManager.toggle();
            document.getElementById('btnSound').textContent = enabled ? '🔊' : '🔇';
        });

        // Fullscreen on F11
        document.addEventListener('keydown', (e) => {
            if (e.key === 'F11') {
                e.preventDefault();
                this.toggleFullscreen();
            }
            // Space to spin
            if (e.code === 'Space' && document.querySelector('.main-stage.active')) {
                e.preventDefault();
                if (!this.isSpinning) {
                    this.spinOnce();
                }
            }
        });
    },

    // ---- FILE HANDLING ----
    handleFileUpload(file) {
        const ext = file.name.split('.').pop().toLowerCase();
        if (!['xlsx', 'xls', 'csv'].includes(ext)) {
            alert('Vui lòng chọn file Excel (.xlsx, .xls) hoặc CSV!');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

                this.parseEmployeeData(jsonData);

                // Update UI
                const uploadArea = document.getElementById('uploadArea');
                uploadArea.classList.add('has-file');
                uploadArea.innerHTML = `
                    <div class="upload-icon">✅</div>
                    <p class="file-info">${file.name}</p>
                    <p>Đã tải ${this.employees.length} nhân viên</p>
                `;

                this.updateStartButton();
            } catch (err) {
                alert('Lỗi đọc file: ' + err.message);
            }
        };
        reader.readAsArrayBuffer(file);
    },

    parseEmployeeData(data) {
        if (!data || data.length === 0) return;

        this.employees = [];
        this.employeeNames = {};

        // Try to detect header row
        const firstRow = data[0];
        let codeColIndex = 0;
        let nameColIndex = -1;
        let startRow = 0;

        // Check if first row is header
        if (firstRow && typeof firstRow[0] === 'string') {
            const headers = firstRow.map(h => String(h).toLowerCase().trim());
            const codeHeaders = ['mã nhân viên', 'ma nhan vien', 'mã nv', 'manv', 'ma_nv', 'code', 'employee_id', 'id', 'mã', 'ma', 'stt'];
            const nameHeaders = ['họ tên', 'ho ten', 'tên', 'ten', 'name', 'hoten', 'fullname', 'họ và tên'];

            headers.forEach((h, i) => {
                if (codeHeaders.some(ch => h.includes(ch))) codeColIndex = i;
                if (nameHeaders.some(nh => h.includes(nh))) nameColIndex = i;
            });
            startRow = 1;
        }

        for (let i = startRow; i < data.length; i++) {
            const row = data[i];
            if (!row || !row[codeColIndex]) continue;

            const code = String(row[codeColIndex]).trim();
            if (code && code !== '' && code !== 'undefined') {
                this.employees.push(code);
                if (nameColIndex >= 0 && row[nameColIndex]) {
                    this.employeeNames[code] = String(row[nameColIndex]).trim();
                }
            }
        }
    },

    // ---- PRIZES MANAGEMENT ----
    renderPrizes() {
        const container = document.getElementById('prizesList');
        container.innerHTML = '';

        this.prizes.forEach((prize, index) => {
            const row = document.createElement('div');
            row.className = 'prize-row';
            row.innerHTML = `
                <span class="prize-color" style="background:${prize.color}"></span>
                <input type="text" value="${prize.name}" placeholder="Tên giải"
                    onchange="App.updatePrize(${index}, 'name', this.value)">
                <input type="number" value="${prize.count}" min="1" max="100" title="Số lượng"
                    onchange="App.updatePrize(${index}, 'count', parseInt(this.value))">
                <button class="btn-remove-prize" onclick="App.removePrize(${index})" title="Xóa giải">×</button>
            `;
            container.appendChild(row);
        });
    },

    updatePrize(index, field, value) {
        if (this.prizes[index]) {
            this.prizes[index][field] = value;
        }
    },

    addPrize() {
        const colorPairs = [
            { color: '#FFD700', colorLight: '#FFF2A8' },
            { color: '#D4D4D4', colorLight: '#F0F0F0' },
            { color: '#DBA368', colorLight: '#F0CCA0' },
            { color: '#8FBF9F', colorLight: '#C2E8D0' },
            { color: '#8BB8D9', colorLight: '#C0DDEF' },
            { color: '#D4917A', colorLight: '#F0BCA8' },
            { color: '#B898C8', colorLight: '#D8C4E8' },
            { color: '#D4849A', colorLight: '#F0B0C0' },
        ];
        const pair = colorPairs[this.prizes.length % colorPairs.length];
        this.prizes.push({
            name: 'Giải mới',
            count: 1,
            ...pair
        });
        this.renderPrizes();
    },

    removePrize(index) {
        if (this.prizes.length <= 1) {
            alert('Cần ít nhất 1 giải thưởng!');
            return;
        }
        this.prizes.splice(index, 1);
        this.renderPrizes();
    },

    // ---- START DRAWING ----
    updateStartButton() {
        const btn = document.getElementById('btnStart');
        btn.disabled = this.employees.length === 0;
    },

    startDrawing() {
        if (this.employees.length === 0) return;

        // Validate prizes
        const totalPrizes = this.prizes.reduce((sum, p) => sum + p.count, 0);
        if (totalPrizes > this.employees.length) {
            alert(`Tổng giải thưởng (${totalPrizes}) nhiều hơn số nhân viên (${this.employees.length})!`);
            return;
        }

        // Init results
        this.results = {};
        this.wonEmployees.clear();
        this.currentPrizeIndex = 0;
        this.prizes.forEach(p => {
            this.results[p.name] = [];
        });

        // Switch to main stage
        document.querySelector('.header').style.display = 'none';
        document.querySelector('.setup-panel').style.display = 'none';
        document.querySelector('.main-stage').classList.add('active');

        // Init spinner
        const maxLen = Math.max(...this.employees.map(e => e.length));
        const spinnerContainer = document.getElementById('spinnerDisplay');
        this.spinner = new Spinner(spinnerContainer, maxLen);

        // Render tabs and results
        this.renderPrizeTabs();
        this.renderResults();
        this.selectPrize(0);

        // Init sound context on user interaction
        SoundManager._ensureContext();
    },

    goBack() {
        if (this.isSpinning) return;
        if (this.wonEmployees.size > 0) {
            if (!confirm('Quay lại sẽ mất kết quả hiện tại. Bạn chắc chắn?')) return;
        }
        document.querySelector('.header').style.display = '';
        document.querySelector('.setup-panel').style.display = '';
        document.querySelector('.main-stage').classList.remove('active');
        if (this.spinner) this.spinner.reset();
    },

    resetResults() {
        if (this.isSpinning) return;
        if (!confirm('Xóa toàn bộ kết quả và quay lại từ đầu?')) return;

        this.results = {};
        this.wonEmployees.clear();
        this.currentPrizeIndex = 0;
        this.prizes.forEach(p => {
            this.results[p.name] = [];
        });

        this.renderPrizeTabs();
        this.renderResults();
        this.selectPrize(0);
        if (this.spinner) this.spinner.reset();

        document.getElementById('winnerReveal').classList.remove('active');
        document.getElementById('winnerReveal').style.display = 'none';
    },

    // ---- PRIZE TABS ----
    renderPrizeTabs() {
        const container = document.getElementById('prizeTabs');
        container.innerHTML = '';

        this.prizes.forEach((prize, index) => {
            const tab = document.createElement('button');
            tab.className = 'prize-tab';
            tab.dataset.index = index;
            tab.style.setProperty('--tab-color', prize.color);
            tab.style.setProperty('--tab-color-light', prize.colorLight || prize.color);

            const remaining = prize.count - (this.results[prize.name] || []).length;
            tab.innerHTML = `${prize.name}`;
            if (remaining > 0) {
                tab.innerHTML += `<span class="badge">${remaining}</span>`;
            } else {
                tab.classList.add('completed');
            }

            tab.addEventListener('click', () => {
                if (!this.isSpinning) this.selectPrize(index);
            });

            container.appendChild(tab);
        });
    },

    selectPrize(index) {
        if (index < 0 || index >= this.prizes.length) return;
        this.currentPrizeIndex = index;

        // Update tab active state
        document.querySelectorAll('.prize-tab').forEach((tab, i) => {
            tab.classList.toggle('active', i === index);
        });

        // Update prize label
        const prize = this.prizes[index];
        const remaining = prize.count - (this.results[prize.name] || []).length;
        const label = document.getElementById('currentPrizeLabel');
        label.textContent = prize.name;
        label.style.setProperty('--prize-color', prize.color);
        label.style.setProperty('--prize-color-light', prize.colorLight || prize.color);

        // Update buttons
        const allDone = remaining <= 0;
        document.getElementById('btnSpin').disabled = allDone;
        document.getElementById('btnSpinAll').disabled = allDone;

        if (allDone) {
            document.getElementById('btnSpin').textContent = 'ĐÃ HOÀN TẤT';
        } else {
            document.getElementById('btnSpin').textContent = '🎰 QUAY';
        }

        // Update remaining count
        const availableCount = this.employees.length - this.wonEmployees.size;
        document.getElementById('remainingInfo').innerHTML = `
            <span class="remaining-count">Còn lại: ${availableCount} nhân viên</span>
        `;

        // Hide winner reveal
        document.getElementById('winnerReveal').classList.remove('active');
        document.getElementById('winnerReveal').style.display = 'none';

        // Reset spinner display
        if (this.spinner) this.spinner.reset();
    },

    // ---- SPINNING ----
    getRandomEmployee() {
        const available = this.employees.filter(e => !this.wonEmployees.has(e));
        if (available.length === 0) return null;
        return available[Math.floor(Math.random() * available.length)];
    },

    spinOnce() {
        if (this.isSpinning) return;

        const prize = this.prizes[this.currentPrizeIndex];
        const prizeResults = this.results[prize.name] || [];
        if (prizeResults.length >= prize.count) {
            // Auto move to next uncompleted prize
            this.moveToNextPrize();
            return;
        }

        const winner = this.getRandomEmployee();
        if (!winner) {
            alert('Không còn nhân viên để quay!');
            return;
        }

        this.isSpinning = true;
        document.getElementById('btnSpin').disabled = true;
        document.getElementById('btnSpinAll').disabled = true;
        document.getElementById('winnerReveal').classList.remove('active');
        document.getElementById('winnerReveal').style.display = 'none';

        // Play drumroll
        SoundManager.playDrumroll(3.2);

        // Spin!
        this.spinner.spin(winner, (result) => {
            this.isSpinning = false;

            // Record winner
            this.wonEmployees.add(winner);
            this.results[prize.name].push(winner);

            // Show code on screen (no name) + popup for single spin
            this.showWinnerCode(winner, prize);
            this.showCongratsPopup(winner, prize);

            // Update UI
            this.renderPrizeTabs();
            this.renderResults();

            // Check if prize is complete
            const remaining = prize.count - this.results[prize.name].length;
            document.getElementById('btnSpin').disabled = remaining <= 0;
            document.getElementById('btnSpinAll').disabled = remaining <= 0;
            if (remaining <= 0) {
                document.getElementById('btnSpin').textContent = 'ĐÃ HOÀN TẤT';
            }

            // Update remaining
            const availableCount = this.employees.length - this.wonEmployees.size;
            document.getElementById('remainingInfo').innerHTML = `
                <span class="remaining-count">Còn lại: ${availableCount} nhân viên</span>
            `;
        });
    },

    // Quay 1 lần (dùng cho spinAll) - chỉ hiện mã, không popup
    _spinOnceAsync() {
        return new Promise((resolve) => {
            const prize = this.prizes[this.currentPrizeIndex];
            const prizeResults = this.results[prize.name] || [];
            if (prizeResults.length >= prize.count) {
                resolve(null);
                return;
            }

            const winner = this.getRandomEmployee();
            if (!winner) {
                resolve(null);
                return;
            }

            this.isSpinning = true;
            document.getElementById('btnSpin').disabled = true;
            document.getElementById('btnSpinAll').disabled = true;
            document.getElementById('winnerReveal').classList.remove('active');
            document.getElementById('winnerReveal').style.display = 'none';

            SoundManager.playDrumroll(3.2);

            this.spinner.spin(winner, () => {
                this.isSpinning = false;
                this.wonEmployees.add(winner);
                this.results[prize.name].push(winner);

                // Chỉ hiện mã trên màn hình, KHÔNG popup
                this.showWinnerCode(winner, prize);
                this.renderPrizeTabs();
                this.renderResults();

                const remaining = prize.count - this.results[prize.name].length;
                document.getElementById('btnSpin').disabled = remaining <= 0;
                document.getElementById('btnSpinAll').disabled = remaining <= 0;
                if (remaining <= 0) {
                    document.getElementById('btnSpin').textContent = 'ĐÃ HOÀN TẤT';
                }

                const availableCount = this.employees.length - this.wonEmployees.size;
                document.getElementById('remainingInfo').innerHTML = `
                    <span class="remaining-count">Còn lại: ${availableCount} nhân viên</span>
                `;

                resolve(winner);
            });
        });
    },

    async spinAllForPrize() {
        if (this.isSpinning) return;

        const prize = this.prizes[this.currentPrizeIndex];
        const remaining = prize.count - (this.results[prize.name] || []).length;
        if (remaining <= 0) return;

        document.getElementById('btnSpinAll').disabled = true;

        const allWinners = [];
        for (let i = 0; i < remaining; i++) {
            const winner = await this._spinOnceAsync();
            if (!winner) break;
            allWinners.push(winner);
            // Pause ngắn giữa các lượt quay
            if (i < remaining - 1) {
                await new Promise(r => setTimeout(r, 1200));
            }
        }

        // Quay xong hết -> popup tất cả người trúng
        if (allWinners.length > 0) {
            await new Promise(r => setTimeout(r, 800));
            ConfettiManager.celebration();
            this.showCongratsPopupAll(allWinners, prize);
        }
    },

    // Hiển thị mã trên màn hình chính (chỉ mã, không tên)
    showWinnerCode(code, prize) {
        const reveal = document.getElementById('winnerReveal');
        document.getElementById('winnerCode').textContent = code;
        document.getElementById('winnerName').textContent = '';

        reveal.style.display = 'block';
        reveal.offsetHeight;
        reveal.classList.add('active');

        SoundManager.playWin();

        const prizeIndex = this.prizes.indexOf(prize);
        if (prizeIndex === 0) {
            ConfettiManager.celebration();
        } else if (prizeIndex <= 1) {
            ConfettiManager.fireworks();
        } else {
            ConfettiManager.launch('medium');
        }
    },

    // Popup chúc mừng cho 1 người (quay đơn) - layout lớn, nổi bật
    showCongratsPopup(code, prize) {
        const existing = document.getElementById('congratsPopup');
        if (existing) existing.remove();

        const name = this.employeeNames[code] || '';
        const popup = document.createElement('div');
        popup.id = 'congratsPopup';
        popup.className = 'congrats-popup';

        popup.innerHTML = `
            <div class="congrats-overlay"></div>
            <div class="congrats-card congrats-card-single">
                <div class="congrats-emoji">🎉</div>
                <div class="congrats-title">CHÚC MỪNG!</div>
                <div class="congrats-prize" style="--prize-color:${prize.color};--prize-color-light:${prize.colorLight || prize.color}">${prize.name}</div>
                <div class="congrats-single-winner">
                    <div class="congrats-single-code">${code}</div>
                    ${name ? `<div class="congrats-single-name">${name}</div>` : ''}
                </div>
                <button class="congrats-close" onclick="document.getElementById('congratsPopup').remove()">Đóng</button>
            </div>
        `;

        document.body.appendChild(popup);
    },

    // Popup chúc mừng cho nhiều người (quay hết giải) - layout danh sách
    showCongratsPopupAll(winners, prize) {
        const existing = document.getElementById('congratsPopup');
        if (existing) existing.remove();

        const popup = document.createElement('div');
        popup.id = 'congratsPopup';
        popup.className = 'congrats-popup';

        let winnersHtml = winners.map(code => {
            const name = this.employeeNames[code] || '';
            const nameDisplay = name ? `<span class="congrats-item-name">${name}</span>` : '';
            return `<div class="congrats-winner-item">
                <span class="congrats-item-code">${code}</span>
                ${nameDisplay}
            </div>`;
        }).join('');

        popup.innerHTML = `
            <div class="congrats-overlay"></div>
            <div class="congrats-card">
                <div class="congrats-emoji">🎉</div>
                <div class="congrats-title">CHÚC MỪNG!</div>
                <div class="congrats-prize" style="--prize-color:${prize.color};--prize-color-light:${prize.colorLight || prize.color}">${prize.name}</div>
                <div class="congrats-winners-list">${winnersHtml}</div>
                <button class="congrats-close" onclick="document.getElementById('congratsPopup').remove()">Đóng</button>
            </div>
        `;

        document.body.appendChild(popup);
    },

    moveToNextPrize() {
        for (let i = 0; i < this.prizes.length; i++) {
            const prize = this.prizes[i];
            const results = this.results[prize.name] || [];
            if (results.length < prize.count) {
                this.selectPrize(i);
                return;
            }
        }
        // All prizes done
        alert('Tất cả giải thưởng đã được quay xong! 🎉');
        ConfettiManager.celebration();
    },

    // ---- RESULTS ----
    renderResults() {
        const container = document.getElementById('resultsGrid');
        container.innerHTML = '';

        this.prizes.forEach(prize => {
            const winners = this.results[prize.name] || [];
            if (winners.length === 0) return;

            const group = document.createElement('div');
            group.className = 'result-group';

            let winnersHtml = winners.map((w, i) => {
                const name = this.employeeNames[w] ? ` - ${this.employeeNames[w]}` : '';
                return `<div class="winner-item">
                    <span class="winner-number">${i + 1}.</span>
                    <span class="winner-id">${w}${name}</span>
                </div>`;
            }).join('');

            group.innerHTML = `
                <h3 style="--prize-color:${prize.color};--prize-color-light:${prize.colorLight || prize.color}">${prize.name} (${winners.length}/${prize.count})</h3>
                ${winnersHtml}
            `;

            container.appendChild(group);
        });
    },

    // ---- UTILS ----
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
        } else {
            document.exitFullscreen().catch(() => {});
        }
    }
};

// Start app when DOM is ready
document.addEventListener('DOMContentLoaded', () => App.init());
