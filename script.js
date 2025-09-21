document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('compareBtn').addEventListener('click', compareDates);
    document.getElementById('checkBtn').addEventListener('click', checkSingleDate);
    document.getElementById('leapBtn').addEventListener('click', checkLeapYear);
});

function selectedFormat() {
    const el = document.querySelector('input[name="fmt"]:checked');
    return el ? el.value : 'ddmmyyyy';
}

function parseInputDate(inputStr, fmt = 'auto') {
    if (!inputStr || !inputStr.trim()) throw 'Please enter a date.';
    const s = inputStr.trim().replace(/\s+/g, '').replace(/[\/\.]/g, '-');
    const parts = s.split('-');
    if (parts.length !== 3) throw 'Use a 3-part date like dd-mm-yyyy';
    let a = Number(parts[0]), b = Number(parts[1]), c = Number(parts[2]);
    if ([a, b, c].some(x => Number.isNaN(x))) throw 'Date parts must be numbers';

    let day, month, year, assumedFormat = '', ambiguous = false, warning = '';

    if (c >= 0 && c < 100) {
        year = c < 50 ? 2000 + c : 1900 + c;
    } else {
        year = c;
    }

    if (fmt === 'ddmmyyyy') {
        day = a; month = b; assumedFormat = 'dd-mm-yyyy';
    } else if (fmt === 'mmddyyyy') {
        day = b; month = a; assumedFormat = 'mm-dd-yyyy';
    } else {
        if (a > 31 || b > 31) throw 'Day/month value out of range';
        if (a > 12 && b <= 12) {
            day = a; month = b; assumedFormat = 'dd-mm-yyyy';
        } else if (b > 12 && a <= 12) {
            day = b; month = a; assumedFormat = 'mm-dd-yyyy';
        } else {
            day = a; month = b; assumedFormat = 'dd-mm-yyyy';
            ambiguous = true;
            warning = 'Ambiguous input assumed dd-mm-yyyy. If wrong, switch format.';
        }
    }

    if (month < 1 || month > 12) throw 'Month must be 1..12';
    if (year < 1 || year > 9999) throw 'Year out of range';

    const dt = new Date(year, month - 1, day);

    if (dt.getFullYear() !== year || dt.getMonth() + 1 !== month || dt.getDate() !== day) {
        throw `Invalid calendar date (${day}-${month}-${year} does not exist).`;
    }

    return { day, month, year, date: dt, assumedFormat, ambiguous, warning };
}

function pad(n) { return String(n).padStart(2, '0'); }
function weekdayName(d) { return d.toLocaleDateString('en-IN', { weekday: 'long' }); }
function formatDMY(day, month, year) { return `${pad(day)}-${pad(month)}-${year}`; }

/** Compare dates */
function compareDates() {
    document.getElementById('outputCheck').style.display = "none";
    document.getElementById('outputLeap').style.display = "none";
    document.getElementById('outputCompare').style.display = "block";

    const out = document.getElementById('outputCompare');
    out.innerHTML = '';

    const input = document.getElementById('dateInput').value;
    const fmt = selectedFormat();
    let info;
    try {
        info = parseInputDate(input, fmt);
    } catch (err) {
        out.innerHTML = `<div style="color:red;font-weight:bold;">⚠ ${err}</div>`;
        return;
    }

    const range = Number(document.getElementById('rangeInput').value) || 50;
    if (range < 1 || range > 500) {
        out.innerHTML = `<div style="color:red;">⚠ Range must be 1–500</div>`;
        return;
    }

    const origDay = info.date.getDay();
    const dayName = weekdayName(info.date);

    let header = `<div><strong>All years where ${formatDMY(info.day, info.month, info.year)} falls on a <u>${dayName}</u>:</strong></div>`;
    if (info.ambiguous) header += `<div style="color:orange;margin-top:6px;">⚠ ${info.warning}</div>`;
    header += `<div style="margin-top:8px">Searching ${range} years each side (${info.year - range} → ${info.year + range})</div>`;

    let html = header + `<table><thead><tr><th>Year</th><th>Date</th><th>Day</th></tr></thead><tbody>`;
    for (let y = info.year - range; y <= info.year + range; y++) {
        if (y < 1 || y > 9999) continue;
        const cand = new Date(y, info.month - 1, info.day);
        if (cand.getFullYear() !== y || cand.getMonth() + 1 !== info.month || cand.getDate() !== info.day) {
            continue;
        }
        if (cand.getDay() === origDay) {
            html += `<tr><td>${y}</td><td>${formatDMY(info.day, info.month, y)}</td><td>${weekdayName(cand)}</td></tr>`;
        }
    }
    html += '</tbody></table>';
    out.innerHTML = html;
}

/** Single-date weekday check */
function checkSingleDate() {
    document.getElementById('outputCompare').style.display = "none";
    document.getElementById('outputLeap').style.display = "none";
    document.getElementById('outputCheck').style.display = "block";

    const out = document.getElementById('outputCheck');
    out.innerHTML = '';

    const input = document.getElementById('dateInput').value;
    const fmt = selectedFormat();
    let info;
    try {
        info = parseInputDate(input, fmt);
    } catch (err) {
        out.innerHTML = `<div style="color:red;font-weight:bold;">⚠ ${err}</div>`;
        return;
    }
    const dayName = weekdayName(info.date);
    let html = `<div><strong>${formatDMY(info.day, info.month, info.year)} — ${dayName}</strong></div>`;
    if (info.ambiguous) html += `<div style="color:orange;">⚠ ${info.warning}</div>`;
    out.innerHTML = html;
}

/** Leap-year checker */
function checkLeapYear() {
    document.getElementById('outputCompare').style.display = "none";
    document.getElementById('outputCheck').style.display = "none";
    document.getElementById('outputLeap').style.display = "block";

    const out = document.getElementById('outputLeap');
    out.innerHTML = '';

    const yearVal = Number(document.getElementById('yearInput').value);
    if (!Number.isFinite(yearVal) || yearVal < 1 || yearVal > 9999) {
        out.innerHTML = `<div style="color:red;">⚠ Please enter a valid year (1–9999).</div>`;
        return;
    }
    const y = Math.floor(yearVal);
    const isLeap = (n => (n % 4 === 0 && n % 100 !== 0) || (n % 400 === 0))(y);

    let prevLeap = null, nextLeap = null, prevNonLeap = null, nextNonLeap = null;
    for (let i = y - 1; i >= 1 && i >= y - 5000; i--) 
        if (!prevLeap && ((i % 4 === 0 && i % 100 !== 0) || (i % 400 === 0))) prevLeap = i;
    for (let i = y + 1; i <= 9999 && i <= y + 5000; i++) 
        if (!nextLeap && ((i % 4 === 0 && i % 100 !== 0) || (i % 400 === 0))) nextLeap = i;

    for (let i = y - 1; i >= 1 && i >= y - 5000; i--) 
        if (!prevNonLeap && !((i % 4 === 0 && i % 100 !== 0) || (i % 400 === 0))) prevNonLeap = i;
    for (let i = y + 1; i <= 9999 && i <= y + 5000; i++) 
        if (!nextNonLeap && !((i % 4 === 0 && i % 100 !== 0) || (i % 400 === 0))) nextNonLeap = i;

    const status = isLeap ? '✅ Leap Year' : '❌ Not a Leap Year';
    out.innerHTML = `
    <div><strong>Year ${y} — ${status}</strong></div>
    <div style="margin-top:10px; display:flex; gap:12px; flex-wrap:wrap;">
      <div style="padding:10px; border-radius:8px; background:#e8f5e8;">
        <strong>Leap</strong><div>Prev: ${prevLeap ?? '—'}</div><div>Next: ${nextLeap ?? '—'}</div>
      </div>
      <div style="padding:10px; border-radius:8px; background:#ffe8e8;">
        <strong>Non-leap</strong><div>Prev: ${prevNonLeap ?? '—'}</div><div>Next: ${nextNonLeap ?? '—'}</div>
      </div>
    </div>
  `;
}
