# ai-xem-lich-weather

Dự báo thời tiết theo ngày cho app **AI Xem Lịch** — 34 tỉnh/thành Việt Nam (sau sáp nhập 1/7/2025), chia 63 khu vực theo tỉnh cũ.

- Nguồn: [MET Norway Locationforecast](https://api.met.no/weatherapi/locationforecast/2.0/documentation) — dữ liệu © MET Norway, giấy phép [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Dữ liệu trong repo này được gộp theo ngày từ nguồn trên, cùng giấy phép CC BY 4.0.
- GitHub Actions gọi MET mỗi giờ (tuần tự, 1 request/giây, `If-Modified-Since`), ghi `vn.json` vào nhánh `data`.
- Kích hoạt: cron-job.org gọi API `workflow_dispatch` mỗi giờ (phút 17, giờ Việt Nam) — lịch `schedule` của GitHub chỉ chạy ~15–20% số lượt nên giữ làm dự phòng. Khoá (fine-grained, chỉ quyền Actions của repo này) hết hạn 19/11/2027.
- Đọc dữ liệu:
  - `https://ai-xem-lich.github.io/ai-xem-lich-weather/vn.json`
  - dự phòng: `https://cdn.jsdelivr.net/gh/ai-xem-lich/ai-xem-lich-weather@data/vn.json`

## Định dạng `vn.json`

```json
{ "v": 1, "src": "…", "generated": "2026-11-16T07:17:00.000Z",
  "areas": { "binh-thuan": { "t": "<lần lấy được gần nhất>", "s": "2026-11-16",
                             "d": [["pcloud", 25, 33, 0], ["shower", 24, 35, 1.3], …] } } }
```

`d[i]` = ngày `s + i` (giờ Việt Nam): `[icon, thấp nhất °C, cao nhất °C, lượng mưa mm]`.
Icon: `sun` `pcloud` `cloud` `fog` `shower` `rain` `heavy` (≥ 10 mm) `thunder`.
Danh sách tỉnh/khu vực + toạ độ: `points.json` (sinh bằng `node scripts/make-points.mjs`).

Mã nguồn: MIT.
