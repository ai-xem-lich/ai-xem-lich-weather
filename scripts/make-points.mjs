// Sinh points.json: 34 tỉnh/thành (sau sáp nhập 1/7/2025) › 63 khu vực (tỉnh cũ), toạ độ = khu hành chính tỉnh cũ
// (đối chiếu 2026-11-16: Wikidata P625 + OSM trụ sở UBND; 63/63 nằm trong đúng thành phố tỉnh lỵ cũ, lệch ≤ 2,9 km sau khi sửa 4 điểm).
// Chạy lại khi sửa bảng dưới: node scripts/make-points.mjs
import fs from 'fs';
const T = [
  ['Hà Nội', [['Hà Nội', 21.0285, 105.8542]]],
  ['Huế', [['Huế', 16.4637, 107.5909]]],
  ['Lai Châu', [['Lai Châu', 22.3964, 103.4582]]],
  ['Điện Biên', [['Điện Biên', 21.3860, 103.0230]]],
  ['Sơn La', [['Sơn La', 21.3256, 103.9188]]],
  ['Lạng Sơn', [['Lạng Sơn', 21.8537, 106.7615]]],
  ['Quảng Ninh', [['Quảng Ninh', 20.9422, 107.1193]]],
  ['Thanh Hóa', [['Thanh Hóa', 19.8067, 105.7852]]],
  ['Nghệ An', [['Nghệ An', 18.6796, 105.6813]]],
  ['Hà Tĩnh', [['Hà Tĩnh', 18.3428, 105.9057]]],
  ['Cao Bằng', [['Cao Bằng', 22.6657, 106.2577]]],
  ['Tuyên Quang', [['Tuyên Quang', 21.8236, 105.2140], ['Hà Giang', 22.8233, 104.9836]]],
  ['Lào Cai', [['Lào Cai', 22.4585, 103.9894], ['Yên Bái', 21.7229, 104.9113]]],
  ['Thái Nguyên', [['Thái Nguyên', 21.5942, 105.8482], ['Bắc Kạn', 22.1470, 105.8348]]],
  ['Phú Thọ', [['Phú Thọ', 21.3227, 105.4019], ['Vĩnh Phúc', 21.3089, 105.6049], ['Hòa Bình', 20.8171, 105.3376]]],
  ['Bắc Ninh', [['Bắc Ninh', 21.1861, 106.0763], ['Bắc Giang', 21.2731, 106.1946]]],
  ['Hưng Yên', [['Hưng Yên', 20.6464, 106.0511], ['Thái Bình', 20.4463, 106.3366]]],
  ['Hải Phòng', [['Hải Phòng', 20.8449, 106.6881], ['Hải Dương', 20.9373, 106.3146]]],
  ['Ninh Bình', [['Ninh Bình', 20.2506, 105.9745], ['Hà Nam', 20.5411, 105.9139], ['Nam Định', 20.4388, 106.1621]]],
  ['Quảng Trị', [['Quảng Trị', 16.8163, 107.1003], ['Quảng Bình', 17.4689, 106.6223]]],
  ['Đà Nẵng', [['Đà Nẵng', 16.0769, 108.2228], ['Quảng Nam', 15.5736, 108.4740]]],
  ['Quảng Ngãi', [['Quảng Ngãi', 15.1205, 108.7923], ['Kon Tum', 14.3497, 108.0005]]],
  ['Gia Lai', [['Gia Lai', 13.9833, 108.0000], ['Bình Định', 13.7820, 109.2197]]],
  ['Khánh Hòa', [['Khánh Hòa', 12.2388, 109.1967], ['Ninh Thuận', 11.5643, 108.9886]]],
  ['Lâm Đồng', [['Lâm Đồng', 11.9404, 108.4583], ['Đắk Nông', 11.9983, 107.6918], ['Bình Thuận', 10.9289, 108.1021]]],
  ['Đắk Lắk', [['Đắk Lắk', 12.6667, 108.0500], ['Phú Yên', 13.0955, 109.3209]]],
  ['TP. Hồ Chí Minh', [['TP. Hồ Chí Minh', 10.7769, 106.7009], ['Bình Dương', 10.9804, 106.6519], ['Bà Rịa – Vũng Tàu', 10.3450, 107.0760]]],
  ['Đồng Nai', [['Đồng Nai', 10.9574, 106.8427], ['Bình Phước', 11.5349, 106.8832]]],
  ['Tây Ninh', [['Tây Ninh', 11.3101, 106.0983], ['Long An', 10.5359, 106.4137]]],
  ['Cần Thơ', [['Cần Thơ', 10.0372, 105.7883], ['Sóc Trăng', 9.6025, 105.9739], ['Hậu Giang', 9.7845, 105.4701]]],
  ['Vĩnh Long', [['Vĩnh Long', 10.2537, 105.9722], ['Bến Tre', 10.2415, 106.3759], ['Trà Vinh', 9.9347, 106.3453]]],
  ['Đồng Tháp', [['Đồng Tháp', 10.4600, 105.6324], ['Tiền Giang', 10.3600, 106.3600]]],
  ['Cà Mau', [['Cà Mau', 9.1769, 105.1500], ['Bạc Liêu', 9.2941, 105.7278]]],
  ['An Giang', [['An Giang', 10.3864, 105.4352], ['Kiên Giang', 10.0125, 105.0809]]],
];
// Toạ độ điểm du lịch đối chiếu 2026-11-16 (Wikidata + OSM, độ cao SRTM): Mẫu Sơn = khu nghỉ ~1.150 m (không phải sườn 860 m),
// Pù Luông = thung lũng Bản Đôn ~340 m (homestay), Mũi Né = giữa dải resort (không phải làng chài). Bà Rịa – Vũng Tàu đặt ở Bãi Trước.
// Điểm du lịch (user duyệt 2026-11-16, thứ tự = thứ tự hiện trong app): [tên, tỉnh mới, lat, lon] = điểm riêng (gọi MET riêng);
// [tên, tỉnh mới, '=khu vực'] = dùng chung dữ liệu khu vực đã có. Đo 16/11: Bà Nà lệch Đà Nẵng 8°, Bạch Mã lệch Huế 6–8°, Tam Đảo 6°, Mũi Né 5°…
const DESTS = [
  ['TP. Hồ Chí Minh', 'TP. Hồ Chí Minh', '=TP. Hồ Chí Minh'],
  ['Hà Nội', 'Hà Nội', '=Hà Nội'],
  ['Đà Nẵng', 'Đà Nẵng', '=Đà Nẵng'],
  ['Phú Quốc', 'An Giang', 10.2180, 103.9595],
  ['Hạ Long', 'Quảng Ninh', '=Quảng Ninh'],
  ['Đà Lạt', 'Lâm Đồng', '=Lâm Đồng'],
  ['Nha Trang', 'Khánh Hòa', '=Khánh Hòa'],
  ['Hội An', 'Đà Nẵng', 15.8775, 108.3280],
  ['Sa Pa', 'Lào Cai', 22.3360, 103.8430],
  ['Ninh Bình – Tràng An', 'Ninh Bình', '=Ninh Bình'],
  ['Huế', 'Huế', '=Huế'],
  ['Mũi Né', 'Lâm Đồng', 10.9480, 108.2300],
  ['Vũng Tàu', 'TP. Hồ Chí Minh', '=Bà Rịa – Vũng Tàu'],
  ['Bà Nà', 'Đà Nẵng', 15.9959, 107.9891],
  ['Quy Nhơn', 'Gia Lai', '=Bình Định'],
  ['Côn Đảo', 'TP. Hồ Chí Minh', 8.6850, 106.6080],
  ['Tam Đảo', 'Phú Thọ', 21.4560, 105.6445],
  ['Mộc Châu', 'Sơn La', 20.8486, 104.6420],
  ['Đồng Văn – Hà Giang', 'Tuyên Quang', 23.2797, 105.3608],
  ['Cát Bà', 'Hải Phòng', 20.7240, 107.0520],
  ['Phong Nha', 'Quảng Trị', 17.6100, 106.3070],
  ['Măng Đen', 'Quảng Ngãi', 14.6030, 108.2890],
  ['Sầm Sơn', 'Thanh Hóa', 19.7420, 105.9050],
  ['Châu Đốc – Núi Sam', 'An Giang', 10.6821, 105.0802],
  ['Mẫu Sơn', 'Lạng Sơn', 21.8495, 106.9175],
  ['Bạch Mã', 'Huế', 16.1950, 107.8550],
  ['Bảo Lộc', 'Lâm Đồng', 11.5480, 107.8077],
  ['Mù Cang Chải', 'Lào Cai', 21.8516, 104.0896],
  ['Pù Luông', 'Thanh Hóa', 20.4451, 105.1525],
  ['Lý Sơn', 'Quảng Ngãi', 15.3809, 109.1175],
  ['Cô Tô', 'Quảng Ninh', 20.9703, 107.7638],
];
const slug = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const out = T.map(([name, areas]) => ({ id: slug(name), name, areas: areas.map(([n, lat, lon]) => ({ id: slug(n), name: n, lat, lon })) }));
const ids = out.flatMap(p => p.areas.map(a => a.id));
if (out.length !== 34 || ids.length !== 63 || new Set(ids).size !== 63) throw new Error(`sai số lượng: ${out.length} tỉnh, ${ids.length} khu vực`);
// điểm du lịch: id riêng; điểm riêng có lat/lon (build.mjs gọi MET, dữ liệu nằm trong areas[id]); điểm chung trỏ "point" = id khu vực
const dests = DESTS.map(([name, pn, a, b]) => {
    const prov = out.find(p => p.name === pn);
    if (!prov) throw new Error('không có tỉnh ' + pn);
    if (typeof a === 'string') {
        const area = prov.areas.find(x => x.name === a.slice(1));
        if (!area) throw new Error(`${name}: tỉnh ${pn} không có khu vực ${a.slice(1)}`);
        return { id: slug(name), name, prov: prov.id, point: area.id };
    }
    return { id: slug(name), name, prov: prov.id, point: slug(name), lat: a, lon: b };
});
const all = [...ids, ...dests.filter(d => d.lat != null).map(d => d.id)];
if (new Set(all).size !== all.length || new Set(dests.map(d => d.id)).size !== dests.length) throw new Error('trùng mã điểm');
fs.writeFileSync(new URL('../points.json', import.meta.url), JSON.stringify({ country: 'vn', provinces: out, dests }, null, 1) + '\n');
console.log(`${out.length} tỉnh, ${ids.length} khu vực, ${dests.length} điểm du lịch (${dests.filter(d => d.lat != null).length} điểm riêng)`);
