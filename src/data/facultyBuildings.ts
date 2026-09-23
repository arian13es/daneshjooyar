/**
 * Lightweight mapping of university faculties to campus map building IDs
 * Used by Dashboard to avoid bundling the entire GIS dataset on initial page load.
 */

export interface FacultyBuildingSummary {
  id: string;
  name: string;
}

export const FACULTY_BUILDINGS: FacultyBuildingSummary[] = [
  { id: "bldg_435044515", name: "دانشکده مهندسی برق و کامپیوتر" },
  { id: "bldg_389834719", name: "دانشکده مهندسی عمران" },
  { id: "bldg_544158241", name: "دانشکده مهندسی مکانیک (ساختمان ۱۴)" },
  { id: "bldg_389834721", name: "دانشکده ادبیات فارسی و زبان‌های خارجی" },
  { id: "bldg_389834725", name: "دانشکده علوم تربیتی و روانشناسی" },
  { id: "bldg_389834729", name: "دانشکده اقتصاد، مدیریت و علوم اداری" },
  { id: "bldg_493525329", name: "دانشکده جغرافیا و برنامه‌ریزی محیطی (GIS)" },
  { id: "bldg_493530009", name: "دانشکده علوم ریاضی" },
  { id: "bldg_543920750", name: "دانشکده فیزیک" },
  { id: "bldg_493540239", name: "دانشکده کشاورزی و منابع طبیعی" },
  { id: "bldg_503196616", name: "دانشکده علوم طبیعی (زیست‌شناسی و زمین‌شناسی)" },
  { id: "bldg_509421874", name: "دانشکده الهیات و علوم اسلامی (ساختمان ۳۳)" },
  { id: "bldg_684385581", name: "دانشکده مهندسی فناوری‌های نوین و ساخت و تولید" },
  { id: "bldg_401625785", name: "دانشکده شیمی" },
  { id: "bldg_389834723", name: "دانشکده فناوری‌های نوین و کامپیوتر (ساختمان ۱۱)" },
  { id: "bldg_law_social", name: "دانشکده حقوق و علوم اجتماعی" },
  { id: "bldg_chemeng", name: "دانشکده مهندسی شیمی و نفت" },
  { id: "bldg_veterinary", name: "دانشکده دامپزشکی" },
  { id: "bldg_sports_faculty", name: "دانشکده تربیت بدنی و علوم ورزشی" }
];
