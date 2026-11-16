// ─────────────────────────────────────────────────────────────
//  ตั้งค่าการเชื่อมต่อ Firebase Realtime Database
//
//  • ถ้า databaseURL ว่าง  → "โหมดทดลอง" ใช้ได้ในเครื่องเดียว (เปิดหลายแท็บ)
//  • ใส่ databaseURL แล้ว   → เล่นจริงข้ามเครื่อง (มือถือนักเรียนทุกเครื่อง)
//
//  ค่า databaseURL ดูได้ที่ Firebase Console → Build → Realtime Database
//  (หน้าตา: https://<project>-default-rtdb.<region>.firebasedatabase.app)
//  และต้องเปิด Authentication → Anonymous ไว้ด้วย
// ─────────────────────────────────────────────────────────────
export const FIREBASE = {
  apiKey: 'AIzaSyAtzOh4utxj9-ry2PNWH7YrqMb_UjuaNOs',
  authDomain: 'quizlive-wcw.firebaseapp.com',
  projectId: 'quizlive-wcw',
  storageBucket: 'quizlive-wcw.firebasestorage.app',
  messagingSenderId: '898045012173',
  appId: '1:898045012173:web:06a1ac1c42db1128d52184',
  databaseURL: 'https://quizlive-wcw-default-rtdb.asia-southeast1.firebasedatabase.app',
};

// อีเมลครูที่เข้าหน้าจอครูได้ (คนอื่นเข้าไม่ได้ — ตรวจทั้งในหน้าเว็บและในกฎฐานข้อมูล)
export const TEACHER_EMAILS = ['tanaphon@wangchan.ac.th'];

// สมุดคะแนน (Apps Script) — ใช้บันทึกคะแนนพิเศษอันดับ 1–3 หลังจบเกม (ใช้การล็อกอินครูชุดเดียวกัน)
export const SCOREBOOK_API = 'https://script.google.com/macros/s/AKfycbwJsr4hqB6Xq5RRTQFFeWZ3KxaTmpXQcNg52Vn5kjouwKiX9LO9OI3TxuRU-c18e8PDuA/exec';
