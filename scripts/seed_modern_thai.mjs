import Database from 'better-sqlite3';
import { neon } from '@neondatabase/serverless';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import fs from 'fs';

const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
}

const isPostgres = !!(process.env.POSTGRES_URL || process.env.DATABASE_URL);
let sqliteDb, sql;
if (isPostgres) {
  const url = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  sql = neon(url);
} else {
  const dbPath = path.resolve(process.cwd(), 'democracy_engine.db');
  sqliteDb = new Database(dbPath);
}

const toPgQuery = (query) => {
  let i = 1;
  return query.replace(/\?/g, () => `$${i++}`);
};

async function dbRun(query, params = []) {
  if (isPostgres) {
    await sql.query(toPgQuery(query), params);
    return { success: true };
  } else {
    return sqliteDb.prepare(query).run(...params);
  }
}

// 25 Crisis Cards + 5 Game Changer (Resolution) Cards = 30 Cards total
const modernThaiCards = [
  // --- CRISIS CARDS (25 ใบ) ---
  {
    "title": "ดราม่าโซเชียล",
    "description": "โฆษกรัฐบาลเผลอพูดจาเหยียดคนรากหญ้าในรายการทีวี โซเชียลเดือดจัดเรียกร้องให้ปลด!",
    "card_type": "crisis",
    "choice_a_text": "ปลดโฆษกออกทันที", "choice_a_1": -5, "choice_a_2": 0, "choice_a_3": 0, "choice_a_4": 5,
    "choice_b_text": "อุ้มไว้ อ้างว่าเข้าใจผิด", "choice_b_1": 5, "choice_b_2": 0, "choice_b_3": 0, "choice_b_4": -5
  },
  {
    "title": "ค่าแรงขั้นต่ำ",
    "description": "สหภาพแรงงานประท้วงขอขึ้นค่าแรงขั้นต่ำ แต่นายทุนบอกว่าถ้าขึ้น ธุรกิจพังแน่!",
    "card_type": "crisis",
    "choice_a_text": "ขึ้นค่าแรงทันที", "choice_a_1": 5, "choice_a_2": 0, "choice_a_3": -10, "choice_a_4": 10,
    "choice_b_text": "ชะลอไว้ก่อน", "choice_b_1": -5, "choice_b_2": 0, "choice_b_3": 10, "choice_b_4": -10
  },
  {
    "title": "ซอฟต์พาวเวอร์ไทย",
    "description": "กางเกงช้างฮิตระเบิด! เราจะผลักดันงบประมาณนี้ไปทางไหน?",
    "card_type": "crisis",
    "choice_a_text": "อัดงบให้เอกชนยักษ์ใหญ่", "choice_a_1": 5, "choice_a_2": 0, "choice_a_3": 10, "choice_a_4": -5,
    "choice_b_text": "อัดงบลงชุมชน", "choice_b_1": 0, "choice_b_2": 0, "choice_b_3": -5, "choice_b_4": 10
  },
  {
    "title": "เกณฑ์ทหาร",
    "description": "มีกระแสเรียกร้องให้ยกเลิกการเกณฑ์ทหารบังคับ เปลี่ยนเป็นระบบสมัครใจ",
    "card_type": "crisis",
    "choice_a_text": "ผลักดันระบบสมัครใจ", "choice_a_1": 5, "choice_a_2": -10, "choice_a_3": 0, "choice_a_4": 10,
    "choice_b_text": "คงระบบเดิมไว้", "choice_b_1": -5, "choice_b_2": 10, "choice_b_3": 0, "choice_b_4": -10
  },
  {
    "title": "ภาษีคริปโต",
    "description": "ตลาดคริปโตบูมมาก รัฐบาลต้องการเก็บภาษีนักลงทุนรายย่อย",
    "card_type": "crisis",
    "choice_a_text": "เก็บภาษีหาเงินเข้าคลัง", "choice_a_1": 10, "choice_a_2": 0, "choice_a_3": -5, "choice_a_4": -10,
    "choice_b_text": "งดเว้นภาษีดึงดูดการลงทุน", "choice_b_1": -10, "choice_b_2": 0, "choice_b_3": 10, "choice_b_4": 10
  },
  {
    "title": "สัมปทานรถไฟฟ้า",
    "description": "สัมปทานรถไฟฟ้ากำลังจะหมดอายุ นายทุนขอต่อสัญญาแลกการสนับสนุน",
    "card_type": "crisis",
    "choice_a_text": "ต่อสัญญาให้นายทุน", "choice_a_1": 10, "choice_a_2": 0, "choice_a_3": 10, "choice_a_4": -10,
    "choice_b_text": "ให้รัฐทำเองลดค่าตั๋ว", "choice_b_1": -10, "choice_b_2": 0, "choice_b_3": -10, "choice_b_4": 10
  },
  {
    "title": "ข่าวฉาวกองทัพ",
    "description": "หลุดคลิปนายทหารใช้ทหารเกณฑ์ไปรับใช้ส่วนตัว ประชาชนด่าทอทั้งประเทศ!",
    "card_type": "crisis",
    "choice_a_text": "สั่งสอบสวนลงโทษ", "choice_a_1": 5, "choice_a_2": -10, "choice_a_3": 0, "choice_a_4": 10,
    "choice_b_text": "ปกป้องกองทัพ", "choice_b_1": -5, "choice_b_2": 10, "choice_b_3": 0, "choice_b_4": -10
  },
  {
    "title": "แจกเงินดิจิทัล",
    "description": "พรรคร่วมทวงสัญญานโยบายแจกเงิน แต่ธนาคารแห่งชาติเตือนว่าวินัยการคลังจะพัง",
    "card_type": "crisis",
    "choice_a_text": "กู้เงินมาแจก", "choice_a_1": 10, "choice_a_2": -5, "choice_a_3": -10, "choice_a_4": 10,
    "choice_b_text": "ยกเลิกนโยบาย", "choice_b_1": -10, "choice_b_2": 0, "choice_b_3": 10, "choice_b_4": -10
  },
  {
    "title": "แก้รัฐธรรมนูญ",
    "description": "สภาเสนอแก้รัฐธรรมนูญลดอำนาจ สว. กองทัพขู่จะไม่รับประกันความสงบ",
    "card_type": "crisis",
    "choice_a_text": "เดินหน้าแก้กฎหมาย", "choice_a_1": 0, "choice_a_2": -10, "choice_a_3": 0, "choice_a_4": 10,
    "choice_b_text": "ถอยดีกว่า", "choice_b_1": 5, "choice_b_2": 10, "choice_b_3": 0, "choice_b_4": -10
  },
  {
    "title": "วิกฤตฝุ่น PM 2.5",
    "description": "ฝุ่นควันปกคลุมเมือง ต้นเหตุมาจากการเผาไร่ของบริษัทยักษ์ใหญ่",
    "card_type": "crisis",
    "choice_a_text": "จับปรับนายทุนเด็ดขาด", "choice_a_1": 5, "choice_a_2": 0, "choice_a_3": -10, "choice_a_4": 10,
    "choice_b_text": "อ้างว่าเป็นฝุ่นเพื่อนบ้าน", "choice_b_1": -5, "choice_b_2": 0, "choice_b_3": 10, "choice_b_4": -10
  },
  {
    "title": "ดีลจัดซื้ออาวุธ",
    "description": "กองทัพขอซื้ออาวุธยุทโธปกรณ์ ท่ามกลางภาวะเศรษฐกิจตกต่ำ",
    "card_type": "crisis",
    "choice_a_text": "อนุมัติงบเงียบๆ", "choice_a_1": -5, "choice_a_2": 10, "choice_a_3": 0, "choice_a_4": -10,
    "choice_b_text": "ระงับการจัดซื้อ", "choice_b_1": 5, "choice_b_2": -10, "choice_b_3": 0, "choice_b_4": 10
  },
  {
    "title": "ภาษีเศรษฐี",
    "description": "รัฐบาลขาดดุล เสนอเก็บภาษีมรดกและที่ดินจากกลุ่มเศรษฐี",
    "card_type": "crisis",
    "choice_a_text": "ดันกฎหมายลดเหลื่อมล้ำ", "choice_a_1": 5, "choice_a_2": 0, "choice_a_3": -10, "choice_a_4": 10,
    "choice_b_text": "ปัดตกเพื่อรักษานายทุน", "choice_b_1": 5, "choice_b_2": 0, "choice_b_3": 10, "choice_b_4": -10
  },
  {
    "title": "ม็อบชนม็อบ",
    "description": "เกิดการปะทะกันรุนแรงระหว่างม็อบต่างขั้ว ประเทศเสี่ยงจลาจล!",
    "card_type": "crisis",
    "choice_a_text": "ปราบปรามเด็ดขาด", "choice_a_1": 5, "choice_a_2": 10, "choice_a_3": -5, "choice_a_4": -10,
    "choice_b_text": "ปล่อยชุมนุมเสรี", "choice_b_1": -5, "choice_b_2": -10, "choice_b_3": -5, "choice_b_4": 5
  },
  {
    "title": "คำเตือนจาก IMF",
    "description": "หนี้พุ่ง IMF สั่งลดสวัสดิการประชาชน ไม่งั้นเศรษฐกิจล้ม",
    "card_type": "crisis",
    "choice_a_text": "ตัดสวัสดิการประชาชน", "choice_a_1": -5, "choice_a_2": 5, "choice_a_3": 10, "choice_a_4": -10,
    "choice_b_text": "พิมพ์เงินเพิ่มอุ้มประชาชน", "choice_b_1": -5, "choice_b_2": -5, "choice_b_3": -10, "choice_b_4": 10
  },
  {
    "title": "พรรคร่วมตีรวน",
    "description": "พรรคร่วมขู่ถอนตัว หากนายกฯ ไม่ยอมยกโควต้ากระทรวงให้",
    "card_type": "crisis",
    "choice_a_text": "ยอมยกให้เพื่อเสถียรภาพ", "choice_a_1": 10, "choice_a_2": 0, "choice_a_3": 5, "choice_a_4": -5,
    "choice_b_text": "สั่งปลดรัฐมนตรีพรรคร่วม", "choice_b_1": -10, "choice_b_2": 0, "choice_b_3": -5, "choice_b_4": 5
  },
  {
    "title": "สมรสเท่าเทียม",
    "description": "ประชาชนเรียกร้องกฎหมายสมรสเท่าเทียม กลุ่มอนุรักษ์นิยมบางส่วนต่อต้าน",
    "card_type": "crisis",
    "choice_a_text": "ผลักดันให้ผ่าน", "choice_a_1": 5, "choice_a_2": -5, "choice_a_3": 0, "choice_a_4": 10,
    "choice_b_text": "ปัดตกร่างกฎหมาย", "choice_b_1": -5, "choice_b_2": 5, "choice_b_3": 0, "choice_b_4": -10
  },
  {
    "title": "ทุนผูกขาดค้าปลีก",
    "description": "นายทุนควบรวมกิจการร้านสะดวกซื้อ จนโชห่วยท้องถิ่นตายเรียบ",
    "card_type": "crisis",
    "choice_a_text": "เบรกการควบรวมกิจการ", "choice_a_1": 0, "choice_a_2": 0, "choice_a_3": -10, "choice_a_4": 10,
    "choice_b_text": "ปล่อยควบรวมเสรี", "choice_b_1": 5, "choice_b_2": 0, "choice_b_3": 10, "choice_b_4": -10
  },
  {
    "title": "กัญชาเสรี",
    "description": "กัญชาเริ่มกระทบเยาวชน สังคมเรียกร้องให้นำกลับไปเป็นยาเสพติด",
    "card_type": "crisis",
    "choice_a_text": "เอากลับไปเป็นยาเสพติด", "choice_a_1": -5, "choice_a_2": 5, "choice_a_3": -5, "choice_a_4": 5,
    "choice_b_text": "เสรีต่อไปเพื่อเศรษฐกิจ", "choice_b_1": 5, "choice_b_2": -5, "choice_b_3": 5, "choice_b_4": -5
  },
  {
    "title": "ข้อพิพาทพรมแดน",
    "description": "ปะทะที่ชายแดน กองทัพขอไฟเขียวตอบโต้ แต่นักลงทุนกลัวสงคราม",
    "card_type": "crisis",
    "choice_a_text": "ไฟเขียวทหารลุย", "choice_a_1": 0, "choice_a_2": 10, "choice_a_3": -10, "choice_a_4": 0,
    "choice_b_text": "เจรจาทางการทูต", "choice_b_1": -5, "choice_b_2": -10, "choice_b_3": 10, "choice_b_4": 5
  },
  {
    "title": "สไตรค์บุคลากรแพทย์",
    "description": "หมอและพยาบาลทำงานหนักทนไม่ไหว ขู่สไตรค์ทั่วประเทศ",
    "card_type": "crisis",
    "choice_a_text": "เพิ่มงบหมอ ลดงบทหาร", "choice_a_1": 0, "choice_a_2": -10, "choice_a_3": 0, "choice_a_4": 10,
    "choice_b_text": "ขอร้องให้เสียสละ", "choice_b_1": 0, "choice_b_2": 5, "choice_b_3": 0, "choice_b_4": -10
  },
  {
    "title": "น้ำท่วมใหญ่",
    "description": "พายุเข้า น้ำท่วมหนัก จะสั่งผันน้ำไปทางไหนดี?",
    "card_type": "crisis",
    "choice_a_text": "ผันลงหมู่บ้าน รักษานิคม", "choice_a_1": -5, "choice_a_2": 0, "choice_a_3": 10, "choice_a_4": -10,
    "choice_b_text": "ปล่อยท่วมนิคม อุ้มชาวบ้าน", "choice_b_1": 5, "choice_b_2": 0, "choice_b_3": -10, "choice_b_4": 10
  },
  {
    "title": "คุมสื่อโซเชียล",
    "description": "รัฐบาลอยากออกกฎหมายคุมสื่อ แต่วิจารณ์ว่าเป็นเผด็จการ",
    "card_type": "crisis",
    "choice_a_text": "ดันกฎหมายคุมสื่อ", "choice_a_1": 10, "choice_a_2": 10, "choice_a_3": -5, "choice_a_4": -10,
    "choice_b_text": "ปล่อยเสรี", "choice_b_1": -5, "choice_b_2": -5, "choice_b_3": 5, "choice_b_4": 10
  },
  {
    "title": "คดีลูกนายทุนชนคน",
    "description": "ทายาทนายทุนชนคนตายแล้วหนี ตำรวจทำท่าจะปล่อยคดีหลุด!",
    "card_type": "crisis",
    "choice_a_text": "สั่งรื้อคดีเอาผิด", "choice_a_1": 5, "choice_a_2": -5, "choice_a_3": -10, "choice_a_4": 10,
    "choice_b_text": "เงียบไว้ ปล่อยผ่าน", "choice_b_1": -5, "choice_b_2": 5, "choice_b_3": 10, "choice_b_4": -10
  },
  {
    "title": "หนี้เกษตรกร",
    "description": "เกษตรกรประท้วงเรียกร้องให้พักหนี้และอุ้มราคาสินค้า",
    "card_type": "crisis",
    "choice_a_text": "พักหนี้แจกเงิน", "choice_a_1": 5, "choice_a_2": -5, "choice_a_3": -10, "choice_a_4": 10,
    "choice_b_text": "ให้กลไกตลาดทำงาน", "choice_b_1": -5, "choice_b_2": 5, "choice_b_3": 10, "choice_b_4": -10
  },
  {
    "title": "เงินฝืดขั้นวิกฤต",
    "description": "เงินฝืดเคือง รัฐบาลต้องกระตุ้นเศรษฐกิจด่วน",
    "card_type": "crisis",
    "choice_a_text": "ลดดอกเบี้ยบีบแบงก์ชาติ", "choice_a_1": 10, "choice_a_2": 0, "choice_a_3": 10, "choice_a_4": -5,
    "choice_b_text": "เคารพอิสระแบงก์ชาติ", "choice_b_1": -10, "choice_b_2": 0, "choice_b_3": -10, "choice_b_4": 5
  },
  {
    "title": "บ่อนการพนันออนไลน์",
    "description": "เครือข่ายบ่อนออนไลน์ระบาดหนัก ตำรวจขอไฟเขียวทลายเครือข่าย!",
    "card_type": "crisis",
    "choice_a_text": "กวาดล้างจริงจัง", "choice_a_1": -5, "choice_a_2": -5, "choice_a_3": -10, "choice_a_4": 10,
    "choice_b_text": "เก็บภาษีเข้าระบบ", "choice_b_1": 10, "choice_b_2": 0, "choice_b_3": 5, "choice_b_4": -10
  },
  {
    "title": "ภัยแล้งรุนแรง",
    "description": "ฝนแล้งหนัก เขื่อนหลักน้ำแห้งขอด เกษตรกรขาดน้ำทำนาปรัง",
    "card_type": "crisis",
    "choice_a_text": "แจกจ่ายน้ำช่วยเหลือ", "choice_a_1": -10, "choice_a_2": 0, "choice_a_3": -5, "choice_a_4": 10,
    "choice_b_text": "บังคับงดทำนาปรัง", "choice_b_1": 5, "choice_b_2": 0, "choice_b_3": 5, "choice_b_4": -10
  },
  {
    "title": "สวัสดิการข้าราชการ",
    "description": "สหภาพข้าราชการเรียกร้องขอเพิ่มเบี้ยเลี้ยงและสวัสดิการรักษาพยาบาล",
    "card_type": "crisis",
    "choice_a_text": "เพิ่มสวัสดิการเอาใจ", "choice_a_1": -10, "choice_a_2": 10, "choice_a_3": 0, "choice_a_4": -5,
    "choice_b_text": "ระงับไว้เพื่อรักษาวินัย", "choice_b_1": 10, "choice_b_2": -10, "choice_b_3": 5, "choice_b_4": 5
  },
  {
    "title": "รัฐวิสาหกิจขาดทุน",
    "description": "รัฐวิสาหกิจยักษ์ใหญ่ขาดทุนสะสมมหาศาล เสี่ยงต่อการล้มละลาย",
    "card_type": "crisis",
    "choice_a_text": "แปรรูปให้เอกชน", "choice_a_1": 10, "choice_a_2": -5, "choice_a_3": 10, "choice_a_4": -10,
    "choice_b_text": "อุ้มไว้ด้วยเงินภาษี", "choice_b_1": -10, "choice_b_2": 5, "choice_b_3": -5, "choice_b_4": 5
  },
  {
    "title": "การศึกษาเหลื่อมล้ำ",
    "description": "โรงเรียนขนาดเล็กในชนบทกำลังจะถูกยุบทิ้งเพราะงบประมาณไม่พอ",
    "card_type": "crisis",
    "choice_a_text": "ทุ่มงบอุ้มโรงเรียนเล็ก", "choice_a_1": -10, "choice_a_2": 0, "choice_a_3": -5, "choice_a_4": 10,
    "choice_b_text": "ยุบแล้วไปรวมโรงเรียนใหญ่", "choice_b_1": 5, "choice_b_2": 0, "choice_b_3": 10, "choice_b_4": -10
  },
  {
    "title": "รถบรรทุกน้ำหนักเกิน",
    "description": "ส่วยสติ๊กเกอร์รถบรรทุกระบาดหนัก ทำถนนพังเสียหายทั่วประเทศ",
    "card_type": "crisis",
    "choice_a_text": "สั่งจับจริงไม่เว้นหน้า", "choice_a_1": 5, "choice_a_2": 0, "choice_a_3": -10, "choice_a_4": 10,
    "choice_b_text": "อะลุ่มอล่วยเพื่อการขนส่ง", "choice_b_1": -5, "choice_b_2": 0, "choice_b_3": 10, "choice_b_4": -10
  },
  {
    "title": "Soft Power ล้มเหลว",
    "description": "คณะกรรมการซอฟต์พาวเวอร์ผลาญงบประมาณไปฟรีๆ โดยไม่ได้ผลงาน",
    "card_type": "crisis",
    "choice_a_text": "ปลดทีมบริหารทิ้ง", "choice_a_1": -5, "choice_a_2": 0, "choice_a_3": 5, "choice_a_4": 5,
    "choice_b_text": "ดันทุรังทำแคมเปญต่อ", "choice_b_1": 5, "choice_b_2": 0, "choice_b_3": -5, "choice_b_4": -10
  },
  {
    "title": "ยาเสพติดระบาด",
    "description": "ยาเสพติดราคาถูกระบาดหนักในชุมชน พ่อแม่ผู้ปกครองร้องเรียนรัฐบาล",
    "card_type": "crisis",
    "choice_a_text": "ประกาศสงครามยาเสพติด", "choice_a_1": 5, "choice_a_2": 10, "choice_a_3": 0, "choice_a_4": -10,
    "choice_b_text": "เน้นบำบัดผู้เสพแทน", "choice_b_1": -10, "choice_b_2": -5, "choice_b_3": 0, "choice_b_4": 10
  },
  {
    "title": "แจกแท็บเล็ตนักเรียน",
    "description": "นโยบายแจกแท็บเล็ตมีเสียงวิจารณ์ว่าสเปกต่ำและเอื้อนายทุน",
    "card_type": "crisis",
    "choice_a_text": "เดินหน้าประมูลต่อ", "choice_a_1": -5, "choice_a_2": 0, "choice_a_3": 10, "choice_a_4": 5,
    "choice_b_text": "ยกเลิกเป็นงบอาหารกลางวัน", "choice_b_1": 5, "choice_b_2": 5, "choice_b_3": -10, "choice_b_4": 10
  },
  {
    "title": "ลดภาษีรถยนต์ไฟฟ้า (EV)",
    "description": "กลุ่มอุตสาหกรรมชิ้นส่วนยานยนต์ประท้วงนโยบายลดภาษีนำเข้ารถ EV",
    "card_type": "crisis",
    "choice_a_text": "ลดภาษีเพื่อผู้บริโภค", "choice_a_1": -10, "choice_a_2": 0, "choice_a_3": 10, "choice_a_4": 5,
    "choice_b_text": "ปกป้องค่ายรถยนต์ในประเทศ", "choice_b_1": 5, "choice_b_2": 0, "choice_b_3": -10, "choice_b_4": -5
  },

  // --- GAME CHANGER (RESOLUTION) CARDS (5 ใบ) ---
  {
    "title": "อภิปรายไม่ไว้วางใจ",
    "description": "ฝ่ายค้านแฉนายกฯ ทุจริต! สภาเดือด มวลชนล้อมทำเนียบ!",
    "card_type": "resolution",
    "choice_a_text": "ปรับคณะรัฐมนตรีครั้งใหญ่", "choice_a_1": -15, "choice_a_2": -5, "choice_a_3": 5, "choice_a_4": 15,
    "choice_b_text": "ใช้เงินทุนล็อบบี้ซื้องูเห่า", "choice_b_1": 15, "choice_b_2": 5, "choice_b_3": -15, "choice_b_4": -15
  },
  {
    "title": "ยุบพรรคฝ่ายค้าน!",
    "description": "ศาลสั่งยุบพรรคฝ่ายค้าน มวลชนโกรธแค้นลงถนน!",
    "card_type": "resolution",
    "choice_a_text": "ทหารเข้าควบคุมพื้นที่", "choice_a_1": 5, "choice_a_2": 15, "choice_a_3": -5, "choice_a_4": -15,
    "choice_b_text": "เจรจาหาทางออก", "choice_b_1": -10, "choice_b_2": -10, "choice_b_3": 5, "choice_b_4": 15
  },
  {
    "title": "วิกฤตโรคระบาดใหม่!",
    "description": "ไวรัสสายพันธุ์ใหม่ระบาดหนัก จะล็อกดาวน์ประเทศหรือไม่?",
    "card_type": "resolution",
    "choice_a_text": "ล็อกดาวน์ทันที", "choice_a_1": 10, "choice_a_2": 10, "choice_a_3": -15, "choice_a_4": 5,
    "choice_b_text": "เปิดประเทศต่อ", "choice_b_1": -10, "choice_b_2": -5, "choice_b_3": 15, "choice_b_4": -15
  },
  {
    "title": "บริษัทยักษ์ใหญ่ล้ม!",
    "description": "เครือบริษัทใหญ่ล้มละลาย คนตกงานนับล้าน!",
    "card_type": "resolution",
    "choice_a_text": "เอาเงินภาษีไปอุ้มบริษัท", "choice_a_1": -10, "choice_a_2": 0, "choice_a_3": 15, "choice_a_4": -15,
    "choice_b_text": "เยียวยาคนตกงาน", "choice_b_1": 5, "choice_b_2": 0, "choice_b_3": -15, "choice_b_4": 15
  },
  {
    "title": "ลอบสังหารผู้นำฝ่ายค้าน!",
    "description": "เกิดเหตุลอบยิงผู้นำฝ่ายค้าน ประชาชนชี้เป้ากองทัพ!",
    "card_type": "resolution",
    "choice_a_text": "สอบสวนทหารเด็ดขาด", "choice_a_1": 5, "choice_a_2": -15, "choice_a_3": 0, "choice_a_4": 15,
    "choice_b_text": "ปิดข่าวฉุกเฉิน", "choice_b_1": -5, "choice_b_2": 15, "choice_b_3": -5, "choice_b_4": -15
  }
];

const gameData = {
  id: uuidv4(),
  name: 'modern_thai_politics_2026',
  game_title: 'Thai Politics: The Balance of Power',
  is_published: 1,
  pillar_1_name: 'รัฐบาล', pillar_1_icon: '💼', pillar_1_color: '#f97316',
  pillar_2_name: 'กองทัพ', pillar_2_icon: '🎖️', pillar_2_color: '#84cc16',
  pillar_3_name: 'กลุ่มทุน', pillar_3_icon: '💰', pillar_3_color: '#3b82f6',
  pillar_4_name: 'ประชาชน', pillar_4_icon: '✊', pillar_4_color: '#ef4444',
  intro_title: 'The New Prime Minister',
  intro_desc: 'คุณคือนายกรัฐมนตรีคนใหม่ คุณต้องรักษาอำนาจและแก้ปัญหาระหว่างรัฐสภา กองทัพ นายทุน และมวลชนให้ได้',
  intro_choice_a: 'เริ่มบริหารประเทศ', intro_choice_b: 'ฉันพร้อมรับแรงกระแทก',
  end_leg_0: 'พรรคร่วมถอนตัว รัฐบาลล้ม รัฐสภาถูกยุบ!', end_leg_100: 'รัฐบาลมีอำนาจเบ็ดเสร็จ กลายเป็นเผด็จการรัฐสภา!',
  end_exe_0: 'กองทัพแตกแยก เกิดกบฏซ้อนกบฏ!', end_exe_100: 'ผบ.ทบ. ยึดอำนาจเบ็ดเสร็จ กลายเป็นรัฐทหาร!',
  end_jud_0: 'เศรษฐกิจชาติพังทลาย นักลงทุนหนี!', end_jud_100: 'ทุนผูกขาดครอบงำประเทศ คนจนไร้ที่ยืน!',
  end_mil_0: 'มวลชนลุกฮือยึดทำเนียบ เกิดจลาจลทั่วประเทศ!', end_mil_100: 'รัฐแจกสวัสดิการจนประเทศล้มละลายหนี้ท่วม!',
  end_victory: 'คุณสามารถบริหารครบวาระ 4 ปี ประเทศเดินหน้าต่อไปได้!',
  bg_image_url: 'https://images.unsplash.com/photo-1541872526845-8c73200ffcc3?q=80&w=1920&auto=format&fit=crop',
  cards: modernThaiCards
};

async function seed() {
  console.log('Starting seed modern_thai_politics_2026...');
  await dbRun(`DELETE FROM cards WHERE group_id IN (SELECT id FROM groups WHERE name = ?)`, [gameData.name]);
  await dbRun(`DELETE FROM groups WHERE name = ?`, [gameData.name]);
  
  await dbRun(`
    INSERT INTO groups (
      id, name, game_title, is_published,
      pillar_1_name, pillar_1_icon, pillar_1_color,
      pillar_2_name, pillar_2_icon, pillar_2_color,
      pillar_3_name, pillar_3_icon, pillar_3_color,
      pillar_4_name, pillar_4_icon, pillar_4_color,
      intro_title, intro_desc, intro_choice_a, intro_choice_b,
      end_leg_0, end_leg_100, end_exe_0, end_exe_100,
      end_jud_0, end_jud_100, end_mil_0, end_mil_100,
      end_victory, bg_image_url, max_crisis_val, max_resolution_val
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 25, 35)
  `, [
    gameData.id, gameData.name, gameData.game_title, gameData.is_published,
    gameData.pillar_1_name, gameData.pillar_1_icon, gameData.pillar_1_color,
    gameData.pillar_2_name, gameData.pillar_2_icon, gameData.pillar_2_color,
    gameData.pillar_3_name, gameData.pillar_3_icon, gameData.pillar_3_color,
    gameData.pillar_4_name, gameData.pillar_4_icon, gameData.pillar_4_color,
    gameData.intro_title, gameData.intro_desc, gameData.intro_choice_a, gameData.intro_choice_b,
    gameData.end_leg_0, gameData.end_leg_100, gameData.end_exe_0, gameData.end_exe_100,
    gameData.end_jud_0, gameData.end_jud_100, gameData.end_mil_0, gameData.end_mil_100,
    gameData.end_victory, gameData.bg_image_url
  ]);
  
  console.log('Group created.');

  for (const card of gameData.cards) {
    await dbRun(`
      INSERT INTO cards (
        id, group_id, card_type, title, description,
        choice_a_text, choice_a_legislative, choice_a_executive, choice_a_judiciary, choice_a_military,
        choice_b_text, choice_b_legislative, choice_b_executive, choice_b_judiciary, choice_b_military
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      uuidv4(), gameData.id, card.card_type, card.title, card.description,
      card.choice_a_text, card.choice_a_1, card.choice_a_2, card.choice_a_3, card.choice_a_4,
      card.choice_b_text, card.choice_b_1, card.choice_b_2, card.choice_b_3, card.choice_b_4
    ]);
  }
  
  console.log('Inserted ' + gameData.cards.length + ' cards.');
  console.log('Done!');
}

seed().catch(console.error);
