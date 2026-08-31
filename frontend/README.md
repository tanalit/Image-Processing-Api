# Image Processing Frontend

Frontend แบบ Static สำหรับงานทดลอง Image Processing Client-Server ใช้ HTML, CSS และ Vanilla JavaScript เท่านั้น ไม่มี Backend, ไม่มี Node/NPM และไม่มี Framework

## Requirements

- Windows 11
- Browser เช่น Chrome, Edge หรือ Firefox
- Python สำหรับ serve หน้าเว็บด้วย `py -m http.server 5500`
- เครื่อง Frontend และเครื่อง Backend ต้องอยู่ Wi-Fi/LAN เดียวกัน
- Backend ต้องเป็น FastAPI + OpenCV ที่เปิด port `8000`

## Project Structure

```text
frontend/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── config.js
│   └── app.js
├── run_frontend.bat
├── .gitignore
└── README.md
```

## Shared API Contract

Frontend นี้ใช้ API Contract ตามนี้เท่านั้น

| Method | Endpoint | ใช้ทำอะไร |
|---|---|---|
| GET | `{API_BASE_URL}/health` | ตรวจว่า Backend พร้อมใช้งาน |
| POST | `{API_BASE_URL}/process-image` | ส่งรูปไปประมวลผล |

รายละเอียดสำคัญ:

- Backend default port: `8000`
- Frontend port: `5500`
- POST ต้องส่ง `multipart/form-data`
- ชื่อ field ต้องเป็น `file`
- ส่งรูปครั้งละ 1 รูป
- รองรับ JPG, JPEG, PNG, WEBP
- Backend ส่งผลลัพธ์กลับเป็น Binary Image Blob ไม่ใช่ JSON และไม่ใช่ Base64

## Configuration

ก่อนรันบนเครื่องเพื่อน ให้ตั้งค่า IP ของเครื่อง Backend ก่อน

1. เปิดไฟล์นี้:

```text
js/config.js
```

2. แก้บรรทัดนี้ให้เป็น IPv4 Address ของเครื่อง Backend:

```javascript
const API_BASE_URL = "http://BACKEND_IP:8000";
```

ตัวอย่าง:

```javascript
const API_BASE_URL = "http://192.168.1.35:8000";
```

ถ้า Backend IP เปลี่ยน ให้แก้เฉพาะไฟล์ `js/config.js` จุดเดียวเท่านั้น ไม่ต้องแก้ `index.html`, `js/app.js` หรือไฟล์อื่น

## Run

วิธีง่ายที่สุดบน Windows 11:

1. เปิดโฟลเดอร์ `frontend`
2. Double-click ไฟล์นี้:

```text
run_frontend.bat
```

3. เปิด Browser ไปที่:

```text
http://localhost:5500
```

ถ้า Python พร้อมใช้งาน script จะเปิด static server ที่ port `5500`

ถ้า Python ไม่มีในเครื่อง script จะแสดงข้อความให้ติดตั้ง Python ก่อน

## Check Backend ก่อน

จากเครื่อง Frontend ให้เปิด Browser แล้วเข้า URL นี้:

```text
http://BACKEND_IP:8000/health
```

ตัวอย่าง:

```text
http://192.168.1.35:8000/health
```

ควรได้ผลลัพธ์ประมาณนี้:

```json
{
  "status": "ok",
  "service": "image-processing-backend"
}
```

ถ้าเปิด URL นี้จาก Browser ไม่ได้ แปลว่ายังไม่ใช่ปัญหา Frontend JavaScript ให้ตรวจ Backend, IP, network หรือ firewall ก่อน

## Usage

1. เปิด `http://localhost:5500`
2. รอให้หน้าเว็บแสดง `Backend Connected`
3. กดเลือกภาพ JPG, JPEG, PNG หรือ WEBP
4. ดู Original Image preview
5. กด `Process Image`
6. รอสถานะ `Uploading...` และ `Processing...`
7. เมื่อเสร็จจะเห็น `Completed`
8. ดู Processed Image
9. กด `Download Result`

ชื่อไฟล์ที่ download จะรักษานามสกุลเดิม เช่น:

| Input | Download |
|---|---|
| `photo.jpg` | `photo_blurred.jpg` |
| `photo.jpeg` | `photo_blurred.jpeg` |
| `photo.png` | `photo_blurred.png` |
| `photo.webp` | `photo_blurred.webp` |

## Error Handling

หน้าเว็บจะแสดงข้อความที่อ่านเข้าใจง่าย และ log รายละเอียดทางเทคนิคไว้ใน Console สำหรับ debug

| กรณี | ข้อความที่ผู้ใช้จะเห็น |
|---|---|
| ติดต่อ Backend ไม่ได้ | `Cannot connect to Backend Server` พร้อมคำแนะนำเรื่อง IP, firewall และ network |
| HTTP 400 | `Invalid or corrupted image` |
| HTTP 415 | `Unsupported image format` |
| HTTP 500 | `Image processing failed` |
| เลือกไฟล์ผิดประเภท | แจ้งให้เลือก JPG, JPEG, PNG หรือ WEBP |

## Network Troubleshooting

ถ้า Frontend ขึ้น `Backend Offline` หรือกด process แล้วติดต่อ Backend ไม่ได้ ให้ตรวจตามนี้:

1. Backend server ยังไม่ได้รัน
2. Backend IP ใน `js/config.js` ผิด
3. เครื่อง Frontend และ Backend ไม่ได้อยู่ Wi-Fi/LAN เดียวกัน
4. Windows Firewall ของเครื่อง Backend block port `8000`
5. ใช้ Guest Wi-Fi หรือ network มี AP isolation ทำให้เครื่องมองกันไม่เห็น
6. Backend bind อยู่ที่ `127.0.0.1` แทน `0.0.0.0`
7. ถ้าเปิด `/health` ผ่าน Browser ได้ แต่ JavaScript ยังเรียกไม่ได้ ให้ตรวจ CORS ในฝั่ง Backend

## Notes for Portability

โปรเจกต์นี้ตั้งใจให้ copy/clone ไปเครื่อง Windows 11 เครื่องอื่นได้ง่าย

- ไม่มี absolute path
- ไม่มี path ที่ผูกกับ username ของเครื่องพัฒนา
- ไม่ต้องใช้ VS Code extension
- ไม่ต้องใช้ Live Server
- ไม่ต้องใช้ Node/NPM
- ไม่ต้องใช้ Docker
- ใช้ Browser + Python ก็พอ
- เปลี่ยน Backend IP ได้จาก `js/config.js` จุดเดียว

## Quick Test Checklist

ก่อนส่งงานจริงควรทดสอบ:

- [ ] Page loads ที่ `http://localhost:5500`
- [ ] GET `/health` success แล้วเห็น `Backend Connected`
- [ ] GET `/health` fail แล้วเห็น `Backend Offline` และหน้าไม่พัง
- [ ] JPG preview ได้
- [ ] JPEG preview ได้
- [ ] PNG preview ได้
- [ ] WEBP preview ได้
- [ ] Invalid type ถูก reject
- [ ] POST ส่ง field ชื่อ `file`
- [ ] Binary Image Blob แสดงเป็น Processed Image ได้
- [ ] Download result ได้
- [ ] Filename รักษานามสกุลเดิม
- [ ] เลือกรูปที่สองแล้ว clear result เก่า
- [ ] Backend offline แล้วหน้าไม่ crash
- [ ] HTTP 400 แสดง `Invalid or corrupted image`
- [ ] HTTP 415 แสดง `Unsupported image format`
- [ ] HTTP 500 แสดง `Image processing failed`
