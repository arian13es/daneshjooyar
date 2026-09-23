/**
 * ============================================================================
 * Project: دانشجویار دانشگاه تبریز (Tabriz University Student Assistant)
 * Directory: پایگاه داده وب‌سایت‌های رسمی دانشکده‌های دانشگاه تبریز
 * Author: Arian
 * Telegram: https://t.me/arian13es
 * ============================================================================
 */

export interface FacultyWebsiteItem {
  id: string;
  name: string;
  url: string;
  category: "engineering" | "basic_sciences" | "humanities" | "agriculture_veterinary" | "satellite";
  categoryLabel: string;
  buildingId?: string; // Links to campus GIS building when located on main campus
  description: string;
}

export const OFFICIAL_FACULTY_WEBSITES: FacultyWebsiteItem[] = [
  // --- فنی و مهندسی ---
  {
    id: "ece",
    name: "دانشکده مهندسی برق و کامپیوتر",
    url: "https://ece.tabrizu.ac.ir/fa",
    category: "engineering",
    categoryLabel: "فنی و مهندسی",
    buildingId: "bldg_435044515",
    description: "دپارتمان‌های مهندسی برق (قدرت، الکترونیک، مخابرات، کنترل، بیوالکتریک) و مهندسی کامپیوتر (نرم‌افزار، هوش مصنوعی، معماری سیستم‌ها)."
  },
  {
    id: "mechanic",
    name: "دانشکده مهندسی مکانیک",
    url: "https://mechanic.tabrizu.ac.ir/fa",
    category: "engineering",
    categoryLabel: "فنی و مهندسی",
    buildingId: "bldg_544158241",
    description: "گروه‌های آموزشی مهندسی مکانیک، طراحی کاربردی، تبدیل انرژی، دینامیک و کنترل، مهندسی صنایع، مهندسی مواد و هوافضا."
  },
  {
    id: "civil",
    name: "دانشکده مهندسی عمران",
    url: "https://civil.tabrizu.ac.ir/fa",
    category: "engineering",
    categoryLabel: "فنی و مهندسی",
    buildingId: "bldg_389834719",
    description: "قطب علمی سازه و مهندسی زلزله، ژئوتکنیک، مهندسی آب و سازه‌های هیدرولیکی، نقشه‌برداری، معماری و مهندسی محیط‌زیست."
  },
  {
    id: "chemeng",
    name: "دانشکده مهندسی شیمی و نفت",
    url: "https://chemeng.tabrizu.ac.ir/fa",
    category: "engineering",
    categoryLabel: "فنی و مهندسی",
    buildingId: "bldg_chemeng",
    description: "رشته‌های تخصصی مهندسی شیمی (طراحی فرآیند، پدیده‌های انتقال، محیط‌زیست)، مهندسی نفت، صنایع گاز و پلیمر."
  },

  // --- علوم پایه ---
  {
    id: "mathematic",
    name: "دانشکده ریاضی، آمار و علوم کامپیوتر",
    url: "https://mathematic.tabrizu.ac.ir/fa",
    category: "basic_sciences",
    categoryLabel: "علوم پایه",
    buildingId: "bldg_493530009",
    description: "قطب علمی ریاضیات، علوم کامپیوتر، آمار، هوش مصنوعی محاسباتی، بهینه‌سازی و ریاضیات مالی کشور."
  },
  {
    id: "physics",
    name: "دانشکده فیزیک",
    url: "https://physics.tabrizu.ac.ir/fa",
    category: "basic_sciences",
    categoryLabel: "علوم پایه",
    buildingId: "bldg_543920750",
    description: "آموزش و پژوهش فیزیک ماده چگال، اپتیک و لیزر، فیزیک هسته‌ای، نانوفیزیک، گرانش، نجوم و اخترفیزیک نظری."
  },
  {
    id: "chemistry",
    name: "دانشکده شیمی",
    url: "https://chemistry.tabrizu.ac.ir/fa",
    category: "basic_sciences",
    categoryLabel: "علوم پایه",
    buildingId: "bldg_401625785",
    description: "قطب علمی شیمی کشور در زمینه‌های شیمی آلی، تجزیه، شیمی فیزیک، شیمی معدنی، شیمی کاربردی، فیتوشیمی و نانوشیمی."
  },
  {
    id: "natural",
    name: "دانشکده علوم طبیعی",
    url: "https://natural.tabrizu.ac.ir/fa",
    category: "basic_sciences",
    categoryLabel: "علوم پایه",
    buildingId: "bldg_503196616",
    description: "گروه‌های تخصصی زیست‌شناسی (سلولی و مولکولی، ژنتیک، بیوشیمی، میکروبیولوژی) و زمین‌شناسی (تکتونیک، نفت، آب، فسیل‌شناسی)."
  },

  // --- علوم انسانی، اجتماعی و رفتاری ---
  {
    id: "literature",
    name: "دانشکده ادبیات فارسی و زبان‌های خارجی",
    url: "https://literature.tabrizu.ac.ir/fa",
    category: "humanities",
    categoryLabel: "علوم انسانی و زبان‌ها",
    buildingId: "bldg_389834721",
    description: "کهن‌ترین دانشکده دانشگاه تبریز با گروه‌های زبان و ادبیات فارسی، انگلیسی، فرانسه، ترکی استانبولی و فلسفه."
  },
  {
    id: "econ",
    name: "دانشکده اقتصاد و مدیریت",
    url: "https://econ.tabrizu.ac.ir/fa",
    category: "humanities",
    categoryLabel: "علوم انسانی و مدیریت",
    buildingId: "bldg_389834729",
    description: "دپارتمان‌های علوم اقتصادی، مدیریت بازرگانی، مدیریت صنعتی، حسابداری و اقتصاد مالی و بانکی."
  },
  {
    id: "law_social",
    name: "دانشکده حقوق و علوم اجتماعی",
    url: "https://law-social.tabrizu.ac.ir/fa",
    category: "humanities",
    categoryLabel: "علوم انسانی و حقوق",
    buildingId: "bldg_law_social",
    description: "آموزش تخصصی حقوق (خصوصی، عمومی، جزا و جرم‌شناسی)، علوم اجتماعی، جامعه‌شناسی، علوم سیاسی، تاریخ و مددکاری اجتماعی."
  },
  {
    id: "islamicscience",
    name: "دانشکده الهیات و علوم اسلامی",
    url: "https://islamicscience.tabrizu.ac.ir/fa",
    category: "humanities",
    categoryLabel: "علوم انسانی و معارف",
    buildingId: "bldg_509421874",
    description: "مرکز تخصصی فقه و مبانی حقوق اسلامی، فلسفه و کلام اسلامی، علوم قرآن و حدیث، و ادیان و عرفان تطبیقی."
  },
  {
    id: "geography",
    name: "دانشکده برنامه‌ریزی و علوم محیطی",
    url: "https://geography.tabrizu.ac.ir/fa",
    category: "humanities",
    categoryLabel: "علوم محیطی و جغرافیایی",
    buildingId: "bldg_493525329",
    description: "سامانه‌های اطلاعات جغرافیایی (GIS)، سنجش از دور (RS)، برنامه‌ریزی شهری و روستایی، اقلیم‌شناسی و ژئومورفولوژی."
  },
  {
    id: "psychology",
    name: "دانشکده علوم تربیتی و روانشناسی",
    url: "https://psychology.tabrizu.ac.ir/fa",
    category: "humanities",
    categoryLabel: "علوم رفتاری و روانشناسی",
    buildingId: "bldg_389834725",
    description: "روان‌شناسی بالینی و عمومی، علوم شناختی، علوم تربیتی، برنامه‌ریزی درسی، و علم اطلاعات و دانش‌شناسی با کلینیک تخصصی مشاوره."
  },
  {
    id: "sport",
    name: "دانشکده تربیت بدنی و علوم ورزشی",
    url: "https://sport.tabrizu.ac.ir/fa",
    category: "humanities",
    categoryLabel: "علوم ورزشی و تندرستی",
    buildingId: "bldg_sports_faculty",
    description: "فیزیولوژی ورزشی، بیومکانیک ورزشی، مدیریت ورزشی، رفتار حرکتی و روان‌شناسی ورزشی در مجاورت استادیوم و سالن‌های مرکزی."
  },

  // --- کشاورزی و دامپزشکی ---
  {
    id: "agricultur",
    name: "دانشکده کشاورزی",
    url: "https://agricultur.tabrizu.ac.ir/fa",
    category: "agriculture_veterinary",
    categoryLabel: "کشاورزی و منابع طبیعی",
    buildingId: "bldg_493540239",
    description: "قطب علمی کشاورزی با دپارتمان‌های گیاه‌پزشکی، علوم باغبانی، آب، خاک، زراعت، اصلاح نباتات، صنایع غذایی و علوم دامی."
  },
  {
    id: "veterinary",
    name: "دانشکده دامپزشکی",
    url: "https://veterinary.tabrizu.ac.ir/fa",
    category: "agriculture_veterinary",
    categoryLabel: "دامپزشکی و بهداشت",
    buildingId: "bldg_veterinary",
    description: "آموزش دوره دکترای عمومی دامپزشکی، بیمارستان تخصصی حیوانات، بهداشت مواد غذایی، پاتولوژی و علوم بالینی دامپزشکی."
  },

  // --- دانشکده‌های اقماری ---
  {
    id: "marandtech",
    name: "دانشکده فنی و مهندسی مرند",
    url: "https://marandtech.tabrizu.ac.ir/fa",
    category: "satellite",
    categoryLabel: "دانشکده‌های اقماری",
    description: "دانشکده اقماری دانشگاه تبریز در شهرستان مرند با رشته‌های مهندسی عمران، نقشه‌برداری، سازه و ریاضیات کاربردی."
  },
  {
    id: "miyanehtech",
    name: "دانشکده فنی و مهندسی میانه",
    url: "https://miyanehtech.tabrizu.ac.ir/fa",
    category: "satellite",
    categoryLabel: "دانشکده‌های اقماری",
    description: "دانشکده اقماری دانشگاه تبریز در شهرستان میانه با رشته‌های مهندسی کامپیوتر، مهندسی مکانیک و مهندسی صنایع."
  },
  {
    id: "ahar",
    name: "دانشکده کشاورزی و منابع طبیعی اهر",
    url: "https://ahar.tabrizu.ac.ir/fa",
    category: "satellite",
    categoryLabel: "دانشکده‌های اقماری",
    description: "دانشکده اقماری دانشگاه تبریز در منطقه ارسباران و شهرستان اهر متمرکز بر علوم دامی، صنایع غذایی، باغبانی و جنگل‌داری."
  }
];

export function getFacultyWebsiteByExactOrPartialName(name: string): string | undefined {
  if (!name) return undefined;
  const match = OFFICIAL_FACULTY_WEBSITES.find(f => 
    f.name === name || name.includes(f.name) || f.name.includes(name)
  );
  return match?.url;
}
