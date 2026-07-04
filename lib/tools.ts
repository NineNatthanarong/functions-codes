import {
  FileText, Image as ImageIcon, Scissors, QrCode, Lock, Palette, Braces,
  Type, ArrowRightLeft, Minimize2, Mic, Edit, ShieldCheck,
  Crop, Pipette, Stamp, Shuffle, Disc3, Languages,
  Binary, Link2, KeyRound, Hash, Fingerprint, Regex, CaseSensitive, Sigma, Clock, Table,
} from 'lucide-react';

export type ToolCategory = 'file' | 'image' | 'dev' | 'write' | 'audio' | 'fun';

/**
 * Single source of truth for every tool on the site.
 * Homepage grid, command palette, related-tools, and sitemap all derive from this list.
 * Card titles/descriptions live in lib/i18n/translations.ts under tools.<slug>.
 */
export const TOOLS = [
  {
    slug: 'file-converter',
    category: 'file',
    icon: FileText,
    aliases: ['convert', 'converter', 'pdf', 'png', 'jpg', 'jpeg', 'webp', 'heic', 'document', 'แปลง', 'แปลงไฟล์', 'แปลงรูป', 'แปลงเอกสาร', 'เอกสาร', 'ไฟล์', 'รูป', 'พีดีเอฟ'],
  },
  {
    slug: 'bgrm',
    category: 'image',
    icon: Scissors,
    aliases: ['background', 'remover', 'remove bg', 'transparent', 'cutout', 'ลบ', 'ลบพื้นหลัง', 'ตัดพื้นหลัง', 'พื้นหลัง', 'พื้นหลังโปร่ง', 'โปร่งใส'],
  },
  {
    slug: 'image-cropper',
    category: 'image',
    icon: Crop,
    aliases: ['crop', 'cropper', 'resize', 'rotate', 'flip', 'trim image', 'ครอบรูป', 'ครอบ', 'ตัดรูป', 'ปรับขนาด', 'ปรับขนาดรูป', 'หมุน', 'หมุนรูป', 'พลิก'],
  },
  {
    slug: 'image-compressor',
    category: 'image',
    icon: ImageIcon,
    aliases: ['compress', 'compressor', 'shrink', 'smaller', 'reduce', 'optimize', 'บีบ', 'บีบอัด', 'ย่อ', 'ย่อรูป', 'ลดขนาด', 'ลดขนาดรูป', 'ลดน้ำหนัก'],
  },
  {
    slug: 'exif-stripper',
    category: 'image',
    icon: ShieldCheck,
    aliases: ['exif', 'metadata', 'gps', 'privacy', 'strip', 'clean', 'ลบเมตา', 'เมตา', 'เมตาดาต้า', 'ลบจีพีเอส', 'จีพีเอส', 'ข้อมูลแฝง', 'ข้อมูลไฟล์', 'ความเป็นส่วนตัว'],
  },
  {
    slug: 'watermark',
    category: 'image',
    icon: Stamp,
    aliases: ['watermark', 'stamp', 'logo', 'overlay', 'sign image', 'ลายน้ำ', 'ติดลายน้ำ', 'ใส่ลายน้ำ', 'โลโก้', 'แสตมป์'],
  },
  {
    slug: 'color-picker',
    category: 'image',
    icon: Pipette,
    aliases: ['picker', 'pick color', 'eyedropper', 'dropper', 'color from screen', 'หยดสี', 'เลือกสี', 'อายดรอปเปอร์', 'ดูดสี', 'ดูดเฉดสี'],
  },
  {
    slug: 'color-tools',
    category: 'image',
    icon: Palette,
    aliases: ['color converter', 'gradient', 'hex', 'rgb', 'hsl', 'oklch', 'css gradient', 'แปลงสี', 'ไล่สี', 'ไล่ระดับ', 'ไล่ระดับสี', 'เกรเดียนต์', 'เฮ็กซ์', 'อาร์จีบี'],
  },
  {
    slug: 'color-palette',
    category: 'image',
    icon: Palette,
    aliases: ['palette', 'theme', 'colors', 'extract', 'พาเลตต์', 'พาเลท', 'สี', 'สีจากรูป', 'ดึงสี', 'สกัดสี'],
  },
  {
    slug: 'qr-generator',
    category: 'dev',
    icon: QrCode,
    aliases: ['qr', 'qrcode', 'qr code', 'barcode', 'generate qr', 'คิวอาร์', 'คิวอาร์โค้ด', 'สร้างคิวอาร์', 'สร้างqr', 'qrโค้ด'],
  },
  {
    slug: 'json-formatter',
    category: 'dev',
    icon: Braces,
    aliases: ['json', 'pretty', 'minify', 'beautify', 'validate', 'format', 'จัดรูปแบบ', 'จัดเจสัน', 'จัดjson', 'jsonสวย', 'เจสัน'],
  },
  {
    slug: 'csv-json',
    category: 'dev',
    icon: Table,
    isNew: true,
    aliases: ['csv', 'json', 'csv to json', 'json to csv', 'converter', 'excel', 'spreadsheet', 'tsv', 'delimiter', 'แปลง csv', 'ซีเอสวี', 'เจสัน', 'ตาราง', 'เอ็กเซล'],
  },
  {
    slug: 'base64-tool',
    category: 'dev',
    icon: Binary,
    isNew: true,
    aliases: ['base64', 'base64 encode', 'base64 decode', 'base64 converter', 'data url', 'data uri', 'file to base64', 'base64 to file', 'url-safe base64', 'btoa', 'atob', 'เข้ารหัส base64', 'ถอดรหัส base64', 'แปลงไฟล์เป็น base64'],
  },
  {
    slug: 'url-tools',
    category: 'dev',
    icon: Link2,
    isNew: true,
    aliases: ['url encoder', 'url decoder', 'url parser', 'url inspector', 'encodeURIComponent', 'percent encoding', 'query string editor', 'utm link', 'utm builder', 'decode url', 'เข้ารหัส url', 'ถอดรหัส url', 'แกะลิงก์', 'ลิงก์ utm', 'พารามิเตอร์ url'],
  },
  {
    slug: 'jwt-decoder',
    category: 'dev',
    icon: KeyRound,
    isNew: true,
    aliases: ['jwt', 'jwt decoder', 'decode jwt', 'json web token', 'token', 'jwt debugger', 'jwt parser', 'bearer token', 'access token', 'jwt expiry', 'ถอดรหัส jwt', 'โทเคน', 'ถอดโทเคน', 'เช็คโทเคน'],
  },
  {
    slug: 'hash-generator',
    category: 'dev',
    icon: Hash,
    isNew: true,
    aliases: ['hash generator', 'hash', 'md5', 'sha1', 'sha256', 'sha 256', 'sha512', 'checksum', 'verify checksum', 'file hash', 'digest', 'แฮช', 'สร้างแฮช', 'เช็คซัม', 'ตรวจสอบไฟล์'],
  },
  {
    slug: 'uuid-generator',
    category: 'dev',
    icon: Fingerprint,
    isNew: true,
    aliases: ['uuid', 'uuid generator', 'guid', 'uuid v4', 'uuid v7', 'random id', 'unique id', 'bulk uuid', 'gen uuid', 'rfc 9562', 'สร้าง uuid', 'สุ่ม uuid', 'ไอดีไม่ซ้ำ', 'รหัสสุ่ม'],
  },
  {
    slug: 'regex-tester',
    category: 'dev',
    icon: Regex,
    isNew: true,
    aliases: ['regex', 'regexp', 'regular expression', 'regex tester', 'pattern', 'match', 'test regex', 'capture group', 'replace', 'เรกเอ็กซ์', 'ทดสอบ regex', 'นิพจน์ปกติ', 'จับคู่ข้อความ'],
  },
  {
    slug: 'timestamp-converter',
    category: 'dev',
    icon: Clock,
    isNew: true,
    aliases: ['timestamp', 'unix', 'epoch', 'unix time', 'epoch converter', 'timestamp to date', 'date to timestamp', 'iso 8601', 'utc', 'แปลงเวลา', 'ไทม์สแตมป์', 'ยูนิกซ์', 'พ.ศ.', 'แปลงวันที่'],
  },
  {
    slug: 'password-generator',
    category: 'dev',
    icon: Lock,
    aliases: ['password', 'pass', 'pwd', 'random password', 'secure', 'รหัส', 'รหัสผ่าน', 'พาส', 'พาสเวิร์ด', 'สร้างรหัส', 'รหัสปลอดภัย'],
  },
  {
    slug: 'pdf-tools',
    category: 'file',
    icon: FileText,
    aliases: ['pdf', 'merge', 'split', 'compress pdf', 'combine', 'พีดีเอฟ', 'รวม', 'รวมpdf', 'รวมไฟล์', 'แยก', 'แยกหน้า', 'บีบpdf', 'รวมเอกสาร'],
  },
  {
    slug: 'markdown-editor',
    category: 'write',
    icon: Edit,
    aliases: ['markdown', 'md', 'note', 'editor', 'docs', 'มาร์กดาวน์', 'เขียนโน้ต', 'เขียนเอกสาร', 'มาร์คดาวน์'],
  },
  {
    slug: 'thai-keyboard',
    category: 'write',
    icon: Languages,
    aliases: ['kedmanee', 'layout', 'keyboard', 'mistype', 'wrong layout', 'thai keyboard', 'แป้นพิมพ์', 'แป้น', 'คีย์บอร์ด', 'พิมพ์ผิด', 'พิมพ์ภาษาผิด', 'แก้ภาษา', 'พิมพ์ไทย', 'l;ylfu', 'สวัสดี', 'เกษมณี'],
  },
  {
    slug: 'text-case',
    category: 'write',
    icon: CaseSensitive,
    isNew: true,
    aliases: ['text case', 'case converter', 'uppercase', 'lowercase', 'title case', 'sentence case', 'camelCase', 'PascalCase', 'snake_case', 'kebab-case', 'แปลงตัวพิมพ์', 'ตัวพิมพ์ใหญ่', 'ตัวพิมพ์เล็ก'],
  },
  {
    slug: 'word-counter',
    category: 'write',
    icon: Sigma,
    isNew: true,
    aliases: ['word counter', 'character counter', 'count words', 'letter count', 'text length', 'reading time', 'speaking time', 'keyword density', 'caption length', 'นับคำ', 'นับตัวอักษร', 'นับประโยค', 'นับคำไทย', 'ความยาวข้อความ', 'แคปชั่น'],
  },
  {
    slug: 'diff-viewer',
    category: 'dev',
    icon: ArrowRightLeft,
    aliases: ['diff', 'compare', 'changes', 'เปรียบเทียบ', 'เทียบ', 'ความต่าง', 'หาต่าง', 'เทียบข้อความ'],
  },
  {
    slug: 'unit-converter',
    category: 'dev',
    icon: Minimize2,
    aliases: ['css', 'unit', 'px', 'rem', 'em', 'percent', '%', 'แปลงหน่วย', 'หน่วย', 'หน่วยซีเอสเอส', 'พิกเซล'],
  },
  {
    slug: 'audio-editor',
    category: 'audio',
    icon: Mic,
    aliases: ['audio', 'mp3', 'wav', 'sound', 'trim', 'cut audio', 'เสียง', 'ตัดเสียง', 'ตัดต่อเสียง', 'ไฟล์เสียง', 'เพลง', 'คลื่นเสียง', 'wave'],
  },
  {
    slug: 'lorem-ipsum',
    category: 'write',
    icon: Type,
    aliases: ['lorem', 'ipsum', 'placeholder', 'dummy', 'dummy text', 'fake', 'ตัวอย่าง', 'ข้อความตัวอย่าง', 'lorem ipsum', 'ข้อความหลอก'],
  },
  {
    slug: 'random-picker',
    category: 'fun',
    icon: Shuffle,
    aliases: ['random', 'pick', 'lottery', 'name picker', 'shuffle', 'draw', 'สุ่ม', 'สุ่มชื่อ', 'สุ่มรายการ', 'จับฉลาก', 'จับสลาก', 'แรนดอม'],
  },
  {
    slug: 'spin-wheel',
    category: 'fun',
    icon: Disc3,
    aliases: ['wheel', 'spin', 'lucky draw', 'roulette', 'fortune wheel', 'วงล้อ', 'หมุนวงล้อ', 'หมุน', 'ล้อสุ่ม', 'จับฉลาก', 'จับสลาก'],
  },
] as const;

export type ToolKey = (typeof TOOLS)[number]['slug'];
export type ToolDef = (typeof TOOLS)[number];

export const TOOL_KEYS = TOOLS.map((t) => t.slug) as ToolKey[];

export function getTool(slug: string): ToolDef | undefined {
  return TOOLS.find((t) => t.slug === slug);
}

/** Same-category neighbours, used for the "related tools" strip on tool pages. */
export function getRelatedTools(slug: string, max = 3): ToolDef[] {
  const current = getTool(slug);
  if (!current) return [];
  const sameCategory = TOOLS.filter((t) => t.slug !== slug && t.category === current.category);
  const others = TOOLS.filter((t) => t.slug !== slug && t.category !== current.category);
  return [...sameCategory, ...others].slice(0, max);
}
