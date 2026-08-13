const WRAP_STYLE = 'font-family:Segoe UI,Tahoma,sans-serif;background:#fef0d6;padding:30px;';
const CARD_STYLE = 'max-width:480px;margin:0 auto;background:#fff;border-radius:16px;padding:30px;';
const HEADER_STYLE = 'color:#c91a5c;margin:0 0 12px;';

function wrap(innerHtml) {
  return `<div style="${WRAP_STYLE}"><div style="${CARD_STYLE}">${innerHtml}</div></div>`;
}

function welcomeEmail({ username }) {
  return {
    subject: 'ยินดีต้อนรับสู่ วันนี้กินอะไรดีนะ? 🎉',
    html: wrap(`
      <h1 style="${HEADER_STYLE}">ยินดีต้อนรับ, ${username}! 🍽️</h1>
      <p>สมัครสมาชิกสำเร็จแล้ว ตอนนี้คุณสามารถ:</p>
      <ul>
        <li>❤️ บันทึกเมนูโปรดของคุณ</li>
        <li>📖 ดูสูตรอาหารแบบเต็มสำหรับเมนูที่มีสูตร</li>
        <li>✏️ เพิ่มหรือแก้ไขเมนูอาหารของคุณเอง</li>
      </ul>
      <p style="color:#777;font-size:0.85rem;margin-top:24px;">
        หากคุณไม่ได้สมัครสมาชิกนี้ด้วยตัวเอง กรุณาละเว้นอีเมลฉบับนี้
      </p>
    `),
  };
}

function loginAlertEmail({ username, time, ip, location, device }) {
  return {
    subject: 'มีการเข้าสู่ระบบใหม่ในบัญชีของคุณ 🔐',
    html: wrap(`
      <h1 style="${HEADER_STYLE}">สวัสดี, ${username}</h1>
      <p>บัญชีของคุณเพิ่งมีการเข้าสู่ระบบ:</p>
      <div style="background:#fef0d6;border-radius:10px;padding:14px 16px;margin:14px 0;">
        <div><b>เวลา:</b> ${time}</div>
        <div><b>อุปกรณ์:</b> ${device}</div>
        <div><b>IP:</b> ${ip}</div>
        <div><b>ตำแหน่งโดยประมาณ:</b> ${location}</div>
      </div>
      <p style="color:#777;font-size:0.85rem;">
        ตำแหน่งเป็นค่าประมาณจากที่อยู่ IP เท่านั้น ไม่ใช่ตำแหน่ง GPS ที่แม่นยำ
      </p>
      <p style="margin-top:20px;">
        <b>นี่ไม่ใช่คุณ?</b> เปลี่ยนรหัสผ่านทันทีและติดต่อทีมงานผ่านหน้าเว็บไซต์
      </p>
    `),
  };
}

function passwordChangedEmail({ username, time }) {
  return {
    subject: 'รหัสผ่านของคุณถูกเปลี่ยน 🔑',
    html: wrap(`
      <h1 style="${HEADER_STYLE}">สวัสดี, ${username}</h1>
      <p>รหัสผ่านของบัญชีคุณถูกเปลี่ยนเมื่อ <b>${time}</b></p>
      <p style="margin-top:20px;">
        <b>นี่ไม่ใช่คุณ?</b> บัญชีของคุณอาจถูกเข้าถึงโดยไม่ได้รับอนุญาต กรุณาติดต่อทีมงานผ่านหน้าเว็บไซต์ทันที
      </p>
    `),
  };
}

function accountDeletedEmail({ username }) {
  return {
    subject: 'บัญชีของคุณถูกลบแล้ว',
    html: wrap(`
      <h1 style="${HEADER_STYLE}">ลาก่อน, ${username} 👋</h1>
      <p>บัญชีและข้อมูลทั้งหมดของคุณ (เมนูโปรด ประวัติการเข้าสู่ระบบ) ถูกลบออกจากระบบเรียบร้อยแล้วตามคำขอของคุณ</p>
      <p style="color:#777;font-size:0.85rem;margin-top:24px;">
        หากนี่ไม่ใช่สิ่งที่คุณต้องการ คุณสามารถสมัครสมาชิกใหม่ได้ทุกเมื่อ แต่ข้อมูลเดิมจะไม่สามารถกู้คืนได้
      </p>
    `),
  };
}

module.exports = { welcomeEmail, loginAlertEmail, passwordChangedEmail, accountDeletedEmail };
