# Image Processing Backend

Backend สำหรับงานทดลอง **Image Processing Client-Server** ด้วย Python + FastAPI + OpenCV  
โปรเจกต์นี้ทำเฉพาะฝั่ง **Backend** เท่านั้น ไม่มี Frontend, ไม่มี Database, ไม่มี Login และไม่เก็บรูปลง Disk

## API Contract สำคัญ

ห้ามเปลี่ยน endpoint/field/port เหล่านี้ เพราะ Frontend อีก Repository จะเรียกตามนี้แบบตายตัว

| Method | Endpoint | หน้าที่ |
|---|---|---|
| `GET` | `/health` | ตรวจว่า Backend ทำงานอยู่ |
| `POST` | `/process-image` | รับรูป 1 ไฟล์ แล้วส่งรูปที่ Gaussian Blur แล้วกลับไป |

ค่า Frontend ที่ใช้ร่วมกัน:

```js
API_BASE_URL = "http://BACKEND_IP:8000"
GET  `${API_BASE_URL}/health`
POST `${API_BASE_URL}/process-image`
multipart field name = "file"
```

## Requirements

เครื่อง Backend ต้องมี:

- Windows 11
- Python 3.10 หรือใหม่กว่า
- คอมพิวเตอร์ Frontend และ Backend อยู่ใน Wi-Fi/LAN เดียวกัน
- เปิด Private Network / Firewall rule สำหรับ TCP port `8000` ถ้าเครื่องอื่นเข้าไม่ได้

Python packages จะติดตั้งผ่าน `requirements.txt`:

- FastAPI
- Uvicorn
- OpenCV
- NumPy
- python-multipart
- pytest/httpx สำหรับ automated tests

## Project Structure

```text
backend/
│
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app, CORS, routes
│   ├── image_processor.py   # Decode image, Gaussian Blur, encode image
│   └── validators.py        # Validate extension/content type/empty file
│
├── tests/
│   └── test_api.py          # Automated API tests
│
├── requirements.txt
├── pytest.ini
├── setup_backend.bat
├── run_backend.bat
├── .gitignore
└── README.md
```

> หมายเหตุ: Python package ใช้ชื่อไฟล์ `__init__.py` ไม่ใช่ `init.py`

## First Installation

ทำครั้งแรกหลัง Clone หรือ Copy โปรเจกต์ไปเครื่อง Backend

1. เปิดโฟลเดอร์ `backend`
2. ดับเบิลคลิก:

```text
setup_backend.bat
```

หรือเปิด Command Prompt ในโฟลเดอร์ `backend` แล้วรัน:

```bat
setup_backend.bat
```

Script นี้จะ:

1. ตรวจว่า Python ใช้งานได้
2. สร้าง virtual environment ชื่อ `.venv` ถ้ายังไม่มี
3. Activate `.venv`
4. Upgrade pip
5. ติดตั้ง dependency จาก `requirements.txt`
6. แจ้งว่าสำเร็จหรือแสดง error ที่อ่านได้

Script นี้รันซ้ำได้ ไม่ทำให้โปรเจกต์เสีย

## Run Backend

หลัง setup สำเร็จ ให้เปิดโฟลเดอร์ `backend` แล้วดับเบิลคลิก:

```text
run_backend.bat
```

หรือรันใน Command Prompt:

```bat
run_backend.bat
```

คำสั่งหลักที่ script ใช้คือ:

```bat
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

สำคัญ:

- ต้อง bind ที่ `0.0.0.0` เพื่อให้เครื่องอื่นใน LAN เรียกได้
- Default port คือ `8000`
- อย่าปิดหน้าต่าง Backend ระหว่าง Demo
- กด `Ctrl+C` เพื่อหยุด server

## Find Backend IP

บนเครื่อง Backend ให้เปิด Command Prompt แล้วรัน:

```bat
ipconfig
```

มองหา network adapter ที่กำลังใช้ Wi-Fi/LAN เดียวกับเครื่อง Frontend แล้วดูบรรทัด:

```text
IPv4 Address . . . . . . . . . . . : 192.168.1.35
```

ตัวอย่างนี้ Backend IP คือ:

```text
192.168.1.35
```

ดังนั้น Frontend ต้องเรียก:

```text
http://192.168.1.35:8000
```

## Test Locally บนเครื่อง Backend

หลังรัน `run_backend.bat` แล้ว เปิด Browser บนเครื่อง Backend:

```text
http://127.0.0.1:8000/health
```

ควรได้ JSON:

```json
{
  "status": "ok",
  "service": "image-processing-backend"
}
```

เปิด Swagger ได้ที่:

```text
http://127.0.0.1:8000/docs
```

## Test via LAN IP

บนเครื่อง Backend หรือเครื่อง Frontend ที่อยู่ Wi-Fi/LAN เดียวกัน ให้เปิด:

```text
http://192.168.1.35:8000/health
```

ให้เปลี่ยน `192.168.1.35` เป็น IPv4 Address จริงจาก `ipconfig`

ถ้าเปิดจากเครื่อง Backend ได้ แต่เปิดจากเครื่อง Frontend ไม่ได้ ให้ตรวจหัวข้อ Windows Firewall / Troubleshooting ด้านล่าง

## Process Image API

Endpoint:

```text
POST http://BACKEND_IP:8000/process-image
```

Request:

- `multipart/form-data`
- field name ต้องเป็น `file`
- อัปโหลดครั้งละ 1 รูปเท่านั้น

รองรับไฟล์:

| Extension | Content-Type ที่ตอบกลับ |
|---|---|
| `.jpg` | `image/jpeg` |
| `.jpeg` | `image/jpeg` |
| `.png` | `image/png` |
| `.webp` | `image/webp` |

Backend จะ process ใน memory เท่านั้น:

1. รับ binary image
2. Validate file
3. Decode ด้วย OpenCV
4. Gaussian Blur ด้วย `kernel = (15, 15)`, `sigma = 0`
5. Encode กลับตาม format เดิม
6. ส่ง binary image กลับใน HTTP response โดยตรง

ไม่มีการ save input/output ลง disk และไม่ return base64

## Error Handling

| กรณี | HTTP Status | Response |
|---|---:|---|
| Unsupported extension/content type | `415` | `{ "detail": "Unsupported image format" }` |
| ไฟล์ว่าง/อ่านไม่ได้/corrupted | `400` | `{ "detail": "Invalid or corrupted image" }` |
| Internal processing error | `500` | `{ "detail": "Internal processing error" }` |

Backend ไม่ expose stack trace เป็น HTTP response

## CORS

ระบบนี้เป็น Local LAN Demo ไม่มี Login/Cookie/Auth  
Backend ตั้ง CORS ไว้ให้ Browser Frontend ติดต่อได้ โดยรองรับ application methods เฉพาะ:

- `GET`
- `POST`

ถ้า Browser มี `OPTIONS` preflight เกิดขึ้น นั่นเป็น infrastructure behavior ของ CORS ไม่ใช่ application endpoint ที่เราออกแบบเอง

## Windows Firewall

ถ้าเครื่อง Frontend เข้า `http://BACKEND_IP:8000/health` ไม่ได้ ให้ Allow TCP port `8000` สำหรับ **Private Network**

วิธีผ่าน GUI:

1. เปิด Start Menu แล้วค้นหา `Windows Defender Firewall with Advanced Security`
2. เลือก `Inbound Rules`
3. กด `New Rule...`
4. เลือก `Port`
5. เลือก `TCP`
6. ใส่ `Specific local ports` เป็น `8000`
7. เลือก `Allow the connection`
8. Tick เฉพาะ `Private` เป็นหลัก
9. ตั้งชื่อ เช่น `Image Processing Backend Port 8000`
10. กด Finish

> ไม่แนะนำให้ปิด Firewall ทั้งหมดเป็นทางเลือกแรก ให้เปิดเฉพาะ port ที่ต้องใช้แทน

คำสั่งทางเลือก ถ้าต้องการเพิ่ม rule ด้วยสิทธิ์ Administrator:

```bat
netsh advfirewall firewall add rule name="Image Processing Backend Port 8000" dir=in action=allow protocol=TCP localport=8000 profile=private
```

## Automated Tests

หลัง setup แล้ว สามารถรัน test ได้จากโฟลเดอร์ `backend`:

```bat
.venv\Scripts\python -m pytest -q
```

Automated tests ตรวจ:

- `GET /health` ได้ `200` และ JSON contract ตรง
- JPG/JPEG/PNG/WEBP process ได้
- response เป็น binary image format ตรงกับ input
- PNG output เท่ากับ Gaussian Blur ด้วยค่า `(15, 15), sigma=0`
- TXT ได้ `415`
- content type ผิดได้ `415`
- empty file ได้ `400`
- corrupted image ได้ `400`
- field name ต้องเป็น `file`

## Manual LAN Test ที่ควรทำบนเครื่องจริง

Automated tests ตรวจ logic ได้ แต่การ Demo ผ่าน Wi-Fi/LAN ต้องทดสอบกับเครื่องจริง

1. บนเครื่อง Backend:
   - รัน `run_backend.bat`
   - ตรวจว่า console แสดง server ที่ `0.0.0.0:8000`
2. บนเครื่อง Backend:
   - เปิด `http://127.0.0.1:8000/health`
   - ต้องได้ status `ok`
3. หา Backend IP ด้วย `ipconfig`
4. บนเครื่อง Frontend:
   - เปิด `http://BACKEND_IP:8000/health`
   - ต้องได้ status `ok`
5. ใน Frontend Repository:
   - ตั้ง `API_BASE_URL = "http://BACKEND_IP:8000"`
   - ทดสอบ upload JPG/PNG/WEBP
   - ต้องได้รูปที่ถูก blur กลับมา

ถ้าข้อ 2 ผ่าน แต่ข้อ 4 ไม่ผ่าน มักเป็น Firewall, ไม่ได้อยู่ Wi-Fi เดียวกัน, หรือ Router/AP เปิด client isolation

## Troubleshooting

### 1. Python not found

อาการ:

```text
ERROR: Python was not found.
```

วิธีแก้:

1. ติดตั้ง Python จาก https://www.python.org/downloads/
2. ระหว่างติดตั้งให้ tick `Add python.exe to PATH`
3. ปิด/เปิด Command Prompt ใหม่
4. รัน `setup_backend.bat` อีกครั้ง

### 2. Port 8000 already in use

อาการ:

```text
error while attempting to bind on address ('0.0.0.0', 8000)
```

วิธีแก้:

1. ปิดโปรแกรมหรือ backend ตัวอื่นที่ใช้ port 8000
2. หรือเปิด Command Prompt แล้วหา process:

```bat
netstat -ano | findstr :8000
```

3. ปิด process นั้นจาก Task Manager หรือใช้ PID อย่างระวัง

> Shared Frontend Contract ใช้ port `8000` ดังนั้นอย่าเปลี่ยน port ใน source code เพื่อส่งงาน เว้นแต่ใช้ debug ชั่วคราวเท่านั้น

### 3. Frontend cannot connect

ตรวจตามลำดับ:

1. Backend ยังรันอยู่หรือไม่
2. URL ใช้ IP จริงหรือไม่ เช่น `http://192.168.1.35:8000`
3. เครื่อง Frontend และ Backend อยู่ Wi-Fi/LAN เดียวกันหรือไม่
4. เปิด `http://BACKEND_IP:8000/health` จาก Browser ของเครื่อง Frontend ได้หรือไม่
5. Firewall เปิด TCP port 8000 สำหรับ Private Network แล้วหรือยัง
6. Frontend ใช้ endpoint `/health` และ `/process-image` ถูกต้องหรือไม่
7. multipart field name เป็น `file` หรือไม่

### 4. Firewall

ถ้า local test ผ่าน แต่เครื่องอื่นใน LAN เข้าไม่ได้ ให้เพิ่ม Inbound Rule TCP port `8000` เฉพาะ Private Network  
ไม่ควรปิด Firewall ทั้งหมดถ้าไม่จำเป็น

### 5. PCs not on same Wi-Fi/LAN

เครื่อง Frontend และ Backend ต้องอยู่ network เดียวกัน เช่น IP ใกล้กัน:

```text
Backend:  192.168.1.35
Frontend: 192.168.1.42
```

ถ้าเครื่องหนึ่งอยู่ Hotspot อีกเครื่องอยู่ Wi-Fi บ้าน อาจเรียกกันไม่ได้

### 6. Router/AP client isolation

บาง Wi-Fi โดยเฉพาะ Guest Wi-Fi จะเปิด client isolation ทำให้อุปกรณ์ใน Wi-Fi เดียวกันมองไม่เห็นกัน

วิธีแก้:

- เปลี่ยนไปใช้ Wi-Fi หลักที่ไม่ใช่ Guest
- ปิด AP/client isolation ใน router ถ้ามีสิทธิ์ตั้งค่า
- ใช้ mobile hotspot เดียวกันสำหรับทั้งสองเครื่องเพื่อทดสอบเร็ว ๆ

### 7. Invalid image

ถ้าได้:

```json
{ "detail": "Invalid or corrupted image" }
```

แปลว่าไฟล์ว่าง อ่านไม่ได้ หรือ binary ไม่ใช่รูปจริง ให้ลอง export/save รูปใหม่แล้วอัปโหลดอีกครั้ง

### 8. Unsupported image format

ถ้าได้:

```json
{ "detail": "Unsupported image format" }
```

ตรวจว่าไฟล์เป็นหนึ่งในนี้เท่านั้น:

- `.jpg`
- `.jpeg`
- `.png`
- `.webp`

และ Frontend ส่ง multipart field ชื่อ `file` พร้อม content type ที่ตรงกับรูป

## Development Notes

- ไม่มี absolute path ใน source code
- ไม่มี hardcoded username หรือ IP address
- dependency ทั้งหมดอยู่ใน `requirements.txt`
- virtual environment อยู่ใน project ที่ `.venv`
- source code ไม่ save image ลง disk
- routes/validation/image processing ถูกแยกไฟล์เพื่อให้อ่านง่ายสำหรับนักศึกษา
