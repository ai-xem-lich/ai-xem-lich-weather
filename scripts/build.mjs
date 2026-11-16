// Lấy dự báo MET Norway cho 63 khu vực (points.json) → gộp theo NGÀY giờ Việt Nam → <out>/vn.json
// Chạy: node scripts/build.mjs <thư mục out>   (out chứa sẵn vn.json + state.json của lượt trước nếu có)
// Điều khoản MET (api.met.no/doc/TermsOfService): User-Agent định danh, ≤ 4 số lẻ toạ độ, tôn trọng If-Modified-Since,
// không quá 20 request/giây → ở đây gọi TUẦN TỰ, nghỉ 1 s giữa 2 lần.
import fs from 'fs';
import path from 'path';

const OUT = process.argv[2] || 'out';
const UA = 'ai-xem-lich-weather/1.0 github.com/ai-xem-lich/ai-xem-lich-weather';
const TZ = 7 * 3600e3;            // giờ Việt Nam
const GAP_MS = 1000;
const FULL_DAY_HOURS = 18;        // ngày (trừ hôm nay) phải có dữ liệu phủ ≥ 18 giờ mới xuất
const SRC = 'MET Norway Locationforecast — CC BY 4.0 (api.met.no)';

const points = JSON.parse(fs.readFileSync(new URL('../points.json', import.meta.url)));
const read = f => { try { return JSON.parse(fs.readFileSync(path.join(OUT, f), 'utf8')); } catch { return null; } };
const prev = read('vn.json');
const state = read('state.json') || { lastmod: {} };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const vnDate = ms => new Date(ms + TZ).toISOString().slice(0, 10);
const vnHour = ms => new Date(ms + TZ).getUTCHours();
const round1 = x => Math.round(x * 10) / 10;

// symbol_code của MET → 8 icon của app
function sky(code) {
    const c = code.replace(/_(day|night|polartwilight)$/, '');
    if (c === 'clearsky' || c === 'fair') return 'sun';
    if (c === 'partlycloudy') return 'pcloud';
    if (c === 'fog') return 'fog';
    return 'cloud';
}
function pickIcon(codes, mm) {
    if (codes.some(c => c.includes('thunder'))) return 'thunder';
    if (mm >= 10) return 'heavy';
    if (mm >= 1) {
        const wet = codes.filter(c => /rain|sleet|snow/.test(c));
        return wet.filter(c => c.includes('showers')).length * 2 >= wet.length && wet.length ? 'shower' : 'rain';
    }
    const n = { sun: 0, pcloud: 0, cloud: 0, fog: 0 };
    codes.forEach(c => n[sky(c)]++);
    // bằng nhau → nghiêng về nhiều mây (dự báo nắng mà trời âm u khó chịu hơn ngược lại)
    return ['cloud', 'pcloud', 'sun', 'fog'].reduce((a, b) => (n[b] > n[a] ? b : a), 'cloud');
}

// 1 bản tin MET (complete) → { 'YYYY-MM-DD': [icon, min, max, mm, giờ phủ] }
function daily(json) {
    const days = {};
    let last1h = -Infinity;
    for (const x of json.properties.timeseries) {
        const t = Date.parse(x.time), k = vnDate(t), h = vnHour(t);
        const d = days[k] ||= { mn: Infinity, mx: -Infinity, mm: 0, hours: 0, codes: [] };
        const T = x.data.instant.details.air_temperature;
        d.mn = Math.min(d.mn, T); d.mx = Math.max(d.mx, T);
        const n1 = x.data.next_1_hours, n6 = x.data.next_6_hours;
        if (n6) {
            const { air_temperature_min: a, air_temperature_max: b } = n6.details;
            if (a != null) d.mn = Math.min(d.mn, a);
            if (b != null) d.mx = Math.max(d.mx, b);
        }
        if (n1) {
            d.mm += n1.details.precipitation_amount || 0; d.hours += 1; last1h = t;
            if (h >= 6 && h <= 18) d.codes.push(n1.summary.symbol_code);
        } else if (n6 && t >= last1h + 3600e3) {
            // phần 6 giờ/mốc sau khi hết dữ liệu theo giờ (không cộng trùng phần đã có next_1_hours)
            d.mm += n6.details.precipitation_amount || 0; d.hours += 6;
            if (h >= 5 && h <= 14) d.codes.push(n6.summary.symbol_code); // khung bắt đầu 07h hoặc 13h giờ VN = ban ngày
        }
    }
    const out = {};
    for (const [k, d] of Object.entries(days)) {
        if (!d.codes.length && d.hours < FULL_DAY_HOURS) continue;
        out[k] = [pickIcon(d.codes, d.mm), Math.round(d.mn), Math.round(d.mx), round1(d.mm), d.hours];
    }
    return out;
}

async function fetchArea(a) {
    const url = `https://api.met.no/weatherapi/locationforecast/2.0/complete?lat=${a.lat.toFixed(4)}&lon=${a.lon.toFixed(4)}`;
    const headers = { 'User-Agent': UA };
    if (state.lastmod[a.id]) headers['If-Modified-Since'] = state.lastmod[a.id];
    const r = await fetch(url, { headers, signal: AbortSignal.timeout(20000) });
    if (r.status === 304) return { status: 304 };
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const json = await r.json();
    state.lastmod[a.id] = r.headers.get('last-modified') || state.lastmod[a.id];
    return { status: 200, days: daily(json) };
}

// dữ liệu lượt trước của 1 khu vực → { date: [icon, mn, mx, mm] }
function prevDays(id) {
    const p = prev?.areas?.[id];
    if (!p) return {};
    const out = {};
    p.d.forEach((v, i) => { out[vnDate(Date.parse(p.s) + i * 864e5 - TZ)] = v; });
    return out;
}

const now = Date.now(), today = vnDate(now);
const areas = {}, stat = { 200: 0, 304: 0, err: 0 };
const t0 = Date.now();
for (const p of points.provinces) for (const a of p.areas) {
    const old = prevDays(a.id);
    let days, ok = prev?.areas?.[a.id]?.t;
    try {
        const r = await fetchArea(a);
        stat[r.status]++;
        if (r.status === 304) days = old;
        else {
            ok = new Date(now).toISOString();
            days = {};
            for (const [k, v] of Object.entries(r.days)) {
                // ngày đã đi qua (dù ngày cuối chưa đủ 18 giờ dữ liệu) → bỏ ngày cuối thiếu
                if (k !== today && v[4] < FULL_DAY_HOURS) continue;
                days[k] = v.slice(0, 4);
            }
            // HÔM NAY: MET chỉ có từ giờ hiện tại trở đi → giữ cao nhất/thấp nhất/lượng mưa đã thấy trong ngày
            const o = old[today], n = days[today];
            if (o && n) days[today] = [n[0], Math.min(o[1], n[1]), Math.max(o[2], n[2]), Math.max(o[3], n[3])];
            else if (o && !n) days[today] = o;
        }
    } catch (e) {
        stat.err++;
        console.error(`✗ ${a.id}: ${e.message}`);
        days = old;
    }
    const keys = Object.keys(days).filter(k => k >= today).sort();
    if (keys.length) {
        // dãy liên tục từ ngày đầu; thiếu ngày giữa chừng thì dừng ở đó
        const d = [];
        for (let i = 0; i < keys.length; i++) {
            const k = vnDate(Date.parse(keys[0]) + i * 864e5 - TZ + 12 * 3600e3);
            if (!days[k]) break;
            d.push(days[k]);
        }
        areas[a.id] = { t: ok, s: keys[0], d };
    }
    await sleep(GAP_MS);
}

const total = points.provinces.reduce((n, p) => n + p.areas.length, 0);
if (stat.err > total / 2) { console.error(`Lỗi ${stat.err}/${total} khu vực — giữ nguyên dữ liệu cũ`); process.exit(1); }
fs.mkdirSync(OUT, { recursive: true });
const vn = { v: 1, src: SRC, generated: new Date(now).toISOString(), areas };
fs.writeFileSync(path.join(OUT, 'vn.json'), JSON.stringify(vn));
fs.writeFileSync(path.join(OUT, 'state.json'), JSON.stringify(state));
fs.writeFileSync(path.join(OUT, '.nojekyll'), '');
const size = fs.statSync(path.join(OUT, 'vn.json')).size;
console.log(`200: ${stat[200]} · 304: ${stat[304]} · lỗi: ${stat.err} · ${((Date.now() - t0) / 1000).toFixed(0)} s · vn.json ${size} B`);
