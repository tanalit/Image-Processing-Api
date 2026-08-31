// แก้ IP ตรงนี้ให้เป็น IPv4 Address ของเครื่อง Backend
// ตัวอย่าง: ถ้า Backend อยู่ที่เครื่อง 192.168.1.35 และรัน port 8000 ให้ใช้ URL ด้านล่าง
const API_BASE_URL = "http://192.168.1.35:8000";

// Keep the value easy to inspect from browser DevTools without creating another source of truth.
window.API_BASE_URL = API_BASE_URL;
