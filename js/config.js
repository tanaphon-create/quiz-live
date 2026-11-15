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
