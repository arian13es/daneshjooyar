/**
 * ============================================================================
 * Project: دانشجویار دانشگاه تبریز (Tabriz University Student Assistant)
 * Component: ScheduleExportModal (موتور تولید و دانلود تصویر باکیفیت برنامه هفتگی)
 * Author: Arian
 * Telegram: https://t.me/arian13es
 * ============================================================================
 */

import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, 
  Download, 
  Share2, 
  Image as ImageIcon, 
  Palette,
  Check,
  Loader2
} from "lucide-react";
import { ClassItem, StudentProfile } from "../types";
import { LOGO_TABRIZ_BASE64 } from "../assets/logo_base64";
import { getCourseColor } from "../utils/courseColors";
import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { FileOpener } from "@capacitor-community/file-opener";
import { Share } from "@capacitor/share";
import { NativeHelper } from "../services/NotificationService";

const FONT_FAMILY = '"Vazirmatn Variable", Vazirmatn, "Vazir", sans-serif';

const SHARE_TITLE = "برنامه هفتگی دانشگاه تبریز";
const SHARE_TEXT = `📅 برنامه هفتگی کلاسی دانشگاه تبریز

✨ ایجاد شده در سامانه هوشمند دانشجویار دانشگاه تبریز
🤖 دریافت و نصب اپلیکیشن از ربات تلگرام:
@Daneshjooyardmbot (https://t.me/Daneshjooyardmbot)

📢 کانال رسمی:
@daneshjooyartbz (https://t.me/daneshjooyartbz)`;

interface ScheduleExportModalProps {
  classes: ClassItem[];
  profile?: StudentProfile | null;
  onClose: () => void;
}

interface TimeSlotDef {
  id: string;
  label: string;
  subLabel: string;
  startHour: number;
  endHour: number;
}

const TIME_SLOTS: TimeSlotDef[] = [
  { id: "slot_8_10", label: "۰۸:۰۰ - ۱۰:۰۰", subLabel: "۸ تا ۱۰", startHour: 8, endHour: 10 },
  { id: "slot_10_12", label: "۱۰:۰۰ - ۱۲:۰۰", subLabel: "۱۰ تا ۱۲", startHour: 10, endHour: 12 },
  { id: "slot_12_14", label: "۱۲:۰۰ - ۱۴:۰۰", subLabel: "۱۲ تا ۱۴", startHour: 12, endHour: 14 },
  { id: "slot_14_16", label: "۱۴:۰۰ - ۱۶:۰۰", subLabel: "۱۴ تا ۱۶", startHour: 14, endHour: 16 },
  { id: "slot_16_18", label: "۱۶:۰۰ - ۱۸:۰۰", subLabel: "۱۶ تا ۱۸", startHour: 16, endHour: 18 }
];

type ThemeStyle = "light" | "dark";

interface ThemeColors {
  bg: string;
  headerBg: string;
  headerText: string;
  headerSubText: string;
  gridLine: string;
  colHeaderBg: string;
  colHeaderText: string;
  rowHeaderBg: string;
  rowHeaderText: string;
  cardBg: string;
  cardBorder: string;
  cardText: string;
  cardSub: string;
  badgeBg: string;
  badgeText: string;
  watermark: string;
}

const THEME_CONFIG: Record<ThemeStyle, { name: string; colors: ThemeColors }> = {
  light: {
    name: "روشن",
    colors: {
      bg: "#ffffff",
      headerBg: "#f8fafc",
      headerText: "#0f172a",
      headerSubText: "#0284c7",
      gridLine: "#e2e8f0",
      colHeaderBg: "#f1f5f9",
      colHeaderText: "#1e293b",
      rowHeaderBg: "#f8fafc",
      rowHeaderText: "#334155",
      cardBg: "#f8fafc",
      cardBorder: "#0284c7",
      cardText: "#0f172a",
      cardSub: "#64748b",
      badgeBg: "#e0f2fe",
      badgeText: "#0369a1",
      watermark: "rgba(100, 116, 139, 0.6)"
    }
  },
  dark: {
    name: "تیره",
    colors: {
      bg: "#0b1528",
      headerBg: "#0f2347",
      headerText: "#ffffff",
      headerSubText: "#38bdf8",
      gridLine: "#1e3a6d",
      colHeaderBg: "#132c57",
      colHeaderText: "#e0f2fe",
      rowHeaderBg: "#10264c",
      rowHeaderText: "#bae6fd",
      cardBg: "#16376c",
      cardBorder: "#38bdf8",
      cardText: "#ffffff",
      cardSub: "#93c5fd",
      badgeBg: "#0284c7",
      badgeText: "#ffffff",
      watermark: "rgba(56, 189, 248, 0.4)"
    }
  }
};

const normalizeDay = (s: string) => (s || "").replace(/[\s‌]/g, "");

/**
 * Wraps a string into at most maxLines lines that fit within maxWidth (px),
 * using the current ctx font. Falls back to ellipsis on the last line if the
 * text is still too long. Returns the array of lines to draw top-to-bottom.
 */
function wrapTextToLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number
): string[] {
  const words = (text || "").split(" ").filter(Boolean);
  if (words.length === 0) return [""];
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width <= maxWidth || !current) {
      current = test;
    } else {
      lines.push(current);
      current = word;
      if (lines.length === maxLines) break;
    }
  }
  if (lines.length < maxLines && current) lines.push(current);

  // If line budget exceeded, combine tail into last line
  let resultLines = lines;
  if (resultLines.length > maxLines) {
    const kept = resultLines.slice(0, maxLines - 1);
    const rest = resultLines.slice(maxLines - 1).join(" ");
    kept.push(rest);
    resultLines = kept;
  }

  // Ensure every line strictly obeys maxWidth (truncate with ellipsis if needed)
  return resultLines.map((line) => {
    if (ctx.measureText(line).width <= maxWidth) {
      return line;
    }
    let trimmed = line;
    while (trimmed && ctx.measureText(trimmed + "…").width > maxWidth && trimmed.length > 1) {
      trimmed = trimmed.slice(0, -1);
    }
    return trimmed + "…";
  });
}

interface ScheduleExportSession {
  courseName: string;
  professor?: string;
  location?: string;
  startTime: string;
  endTime: string;
  weekType?: "all" | "even" | "odd";
  isSecond?: boolean;
  color?: string;
}

function getTimeSlotIdForTime(timeStr?: string): string {
  if (!timeStr) return "slot_8_10";
  const parts = timeStr.split(":");
  const h = parseInt(parts[0], 10) || 8;
  const m = parseInt(parts[1], 10) || 0;
  const totalMinutes = h * 60 + m;

  if (totalMinutes < 600) return "slot_8_10";
  if (totalMinutes < 720) return "slot_10_12";
  if (totalMinutes < 840) return "slot_12_14";
  if (totalMinutes < 960) return "slot_14_16";
  return "slot_16_18";
}

export default function ScheduleExportModal({ classes, profile, onClose }: ScheduleExportModalProps) {
  const [theme, setTheme] = useState<ThemeStyle>("light");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState<boolean>(true);
  const [shareToast, setShareToast] = useState<string | null>(null);

  const previewBlobUrlRef = useRef<string | null>(null);
  const cachedLogoRef = useRef<HTMLImageElement | null>(null);

  // Check if student has Thursday classes
  const hasThursday = useMemo(() => {
    return classes.some(c => 
      normalizeDay(c.weekday).includes("پنج") || 
      (c.hasSecondSession && c.secondWeekday && normalizeDay(c.secondWeekday).includes("پنج"))
    );
  }, [classes]);

  const activeDays = useMemo(() => {
    const base = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه"];
    return hasThursday ? [...base, "پنجشنبه"] : base;
  }, [hasThursday]);

  // Matrix: [day][slotId] -> ScheduleExportSession[]
  const scheduleMatrix = useMemo(() => {
    const matrix: Record<string, Record<string, ScheduleExportSession[]>> = {};
    activeDays.forEach(day => {
      matrix[day] = {};
      TIME_SLOTS.forEach(slot => {
        matrix[day][slot.id] = [];
      });
    });

    classes.forEach(cls => {
      // Session 1
      const dayMatch1 = activeDays.find(d => normalizeDay(d) === normalizeDay(cls.weekday));
      if (dayMatch1) {
        const slotId = getTimeSlotIdForTime(cls.startTime);
        if (matrix[dayMatch1]?.[slotId]) {
          matrix[dayMatch1][slotId].push({
            courseName: cls.courseName,
            professor: cls.professor,
            location: cls.location,
            startTime: cls.startTime,
            endTime: cls.endTime,
            weekType: cls.weekType,
            isSecond: false,
            color: cls.color
          });
        }
      }

      // Session 2
      if (cls.hasSecondSession && cls.secondWeekday) {
        const dayMatch2 = activeDays.find(d => normalizeDay(d) === normalizeDay(cls.secondWeekday!));
        if (dayMatch2) {
          const sTime = cls.secondStartTime || cls.startTime;
          const slotId = getTimeSlotIdForTime(sTime);
          if (matrix[dayMatch2]?.[slotId]) {
            matrix[dayMatch2][slotId].push({
              courseName: cls.courseName,
              professor: cls.professor,
              location: cls.secondLocation || cls.location,
              startTime: sTime,
              endTime: cls.secondEndTime || cls.endTime,
              weekType: cls.secondWeekType || "even",
              isSecond: true,
              color: cls.color
            });
          }
        }
      }
    });

    return matrix;
  }, [classes, activeDays]);

  // Pre-load font and logo assets with permanent image caching
  const ensureCanvasAssetsReady = useCallback(async (): Promise<HTMLImageElement | null> => {
    if (typeof document !== "undefined" && document.fonts) {
      try {
        await document.fonts.ready;
        await Promise.allSettled([
          document.fonts.load('bold 48px "Vazirmatn Variable"'),
          document.fonts.load('normal 24px "Vazirmatn Variable"'),
          document.fonts.load('bold 24px "Vazirmatn Variable"')
        ]);
      } catch (e) {
        console.warn("Font pre-loading fallback", e);
      }
    }

    if (cachedLogoRef.current && cachedLogoRef.current.complete && cachedLogoRef.current.naturalWidth > 0) {
      return cachedLogoRef.current;
    }

    try {
      const img = new Image();
      await new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => resolve();
        img.src = LOGO_TABRIZ_BASE64;
      });
      if (img.complete && img.naturalWidth > 0) {
        cachedLogoRef.current = img;
        return img;
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  // Renders the timetable onto canvas (scale 1 for fast preview, scale 2 for retina export)
  const renderScheduleToCanvas = useCallback(async (scale: number = 2): Promise<HTMLCanvasElement> => {
    const logoImg = await ensureCanvasAssetsReady();
    const width = 1920 * scale;
    const headerHeight = 170 * scale;
    const colHeaderHeight = 62 * scale;
    const rowHeight = 230 * scale; // taller rows and 47% wider columns so long course names fit completely
    const tableTop = headerHeight + (28 * scale);
    const totalTableHeight = colHeaderHeight + (activeDays.length * rowHeight);
    const height = tableTop + totalTableHeight + (48 * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return canvas;

    // High-DPI anti-aliasing configuration
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    const colors = THEME_CONFIG[theme].colors;

    // Background
    ctx.fillStyle = colors.bg;
    ctx.fillRect(0, 0, width, height);

    // 1. Header Banner
    ctx.fillStyle = colors.headerBg;
    ctx.fillRect(0, 0, width, headerHeight);

    // Header divider line
    ctx.fillStyle = colors.gridLine;
    ctx.fillRect(0, headerHeight - 2 * scale, width, 2 * scale);

    // Header Right Side (RTL) - University Logo & Title
    const logoSize = 84 * scale;
    const rightMargin = 42 * scale;
    const logoX = width - rightMargin - logoSize;
    const logoY = (headerHeight - logoSize) / 2;

    if (logoImg) {
      ctx.save();
      ctx.fillStyle = theme === "light" ? "#ffffff" : "rgba(255, 255, 255, 0.95)";
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(logoX, logoY, logoSize, logoSize, 18 * scale);
      } else {
        ctx.arc(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2, 0, Math.PI * 2);
      }
      ctx.fill();
      ctx.strokeStyle = colors.gridLine;
      ctx.lineWidth = 1.5 * scale;
      ctx.stroke();

      const pad = 6 * scale;
      ctx.drawImage(logoImg, logoX + pad, logoY + pad, logoSize - pad * 2, logoSize - pad * 2);
      ctx.restore();
    }

    const titleRightX = logoImg ? logoX - (20 * scale) : width - (45 * scale);
    ctx.direction = "rtl";
    ctx.textAlign = "right";

    // University Title
    ctx.fillStyle = colors.headerText;
    ctx.font = `bold ${34 * scale}px ${FONT_FAMILY}`;
    ctx.fillText("دانشگاه تبریز • برنامه هفتگی کلاسی", titleRightX, 66 * scale);

    // Faculty Title
    ctx.fillStyle = colors.headerSubText;
    ctx.font = `bold ${23 * scale}px ${FONT_FAMILY}`;
    const rawFaculty = profile?.faculty?.trim();
    const facultyTitle = rawFaculty 
      ? (rawFaculty.startsWith("دانشکده") ? rawFaculty : `دانشکده ${rawFaculty}`)
      : "سامانه هوشمند دانشجویار دانشگاه تبریز";
    ctx.fillText(facultyTitle, titleRightX, 106 * scale);

    // Header Left Side - Student & Telegram Bot Access (NO STUDENT ID FOR PRIVACY!)
    const leftMargin = 42 * scale;

    const studentName = profile?.firstName || profile?.lastName 
      ? `${profile.firstName || ""} ${profile.lastName || ""}`.trim()
      : "دانشجو";

    // Student Name
    ctx.direction = "rtl";
    ctx.textAlign = "left";
    ctx.fillStyle = colors.headerText;
    ctx.font = `bold ${25 * scale}px ${FONT_FAMILY}`;
    ctx.fillText(`نام دانشجو: ${studentName}`, leftMargin, 60 * scale);

    // Bot Access with \u200E isolation locking @ to the beginning of username
    ctx.direction = "ltr";
    ctx.textAlign = "left";
    ctx.fillStyle = colors.headerSubText;
    ctx.font = `bold ${19 * scale}px ${FONT_FAMILY}`;
    ctx.fillText("🤖 ربات تلگرام: \u200E@Daneshjooyardmbot", leftMargin, 96 * scale);

    // Community Channel
    ctx.fillStyle = colors.cardSub;
    ctx.font = `bold ${17 * scale}px ${FONT_FAMILY}`;
    ctx.fillText("📢 کانال رسمی: \u200E@daneshjooyartbz", leftMargin, 126 * scale);

    // 2. Table Layout
    const tableMargin = 40 * scale;
    const tableWidth = width - (tableMargin * 2);
    const rowHeaderWidth = 160 * scale;
    const colWidth = (tableWidth - rowHeaderWidth) / TIME_SLOTS.length;

    // 2.1 Subtle Watermark Logo in the background center of the timetable table
    if (logoImg) {
      ctx.save();
      ctx.globalAlpha = theme === "dark" ? 0.05 : 0.04;
      const watermarkSize = 480 * scale;
      const watermarkX = (width - watermarkSize) / 2;
      const watermarkY = tableTop + (totalTableHeight - watermarkSize) / 2;
      ctx.drawImage(logoImg, watermarkX, watermarkY, watermarkSize, watermarkSize);
      ctx.restore();
    }

    const dayColX = width - tableMargin - rowHeaderWidth;

    // Corner cell
    ctx.fillStyle = colors.colHeaderBg;
    ctx.fillRect(dayColX, tableTop, rowHeaderWidth, colHeaderHeight);
    ctx.strokeStyle = colors.gridLine;
    ctx.lineWidth = 1.5 * scale;
    ctx.strokeRect(dayColX, tableTop, rowHeaderWidth, colHeaderHeight);

    ctx.direction = "rtl";
    ctx.textAlign = "center";
    ctx.fillStyle = colors.colHeaderText;
    ctx.font = `bold ${19 * scale}px ${FONT_FAMILY}`;
    ctx.fillText("روز / زمان", dayColX + (rowHeaderWidth / 2), tableTop + (38 * scale));

    // Time Slot Columns
    TIME_SLOTS.forEach((slot, colIdx) => {
      const colX = dayColX - ((colIdx + 1) * colWidth);
      ctx.fillStyle = colors.colHeaderBg;
      ctx.fillRect(colX, tableTop, colWidth, colHeaderHeight);
      ctx.strokeStyle = colors.gridLine;
      ctx.strokeRect(colX, tableTop, colWidth, colHeaderHeight);

      ctx.direction = "rtl";
      ctx.textAlign = "center";
      ctx.fillStyle = colors.colHeaderText;
      ctx.font = `bold ${19 * scale}px ${FONT_FAMILY}`;
      ctx.fillText(slot.label, colX + (colWidth / 2), tableTop + (29 * scale));

      ctx.fillStyle = colors.headerSubText;
      ctx.font = `normal ${15 * scale}px ${FONT_FAMILY}`;
      ctx.fillText(slot.subLabel, colX + (colWidth / 2), tableTop + (50 * scale));
    });

    // Weekday Rows
    activeDays.forEach((day, rowIdx) => {
      const rowY = tableTop + colHeaderHeight + (rowIdx * rowHeight);

      // Row Header
      ctx.fillStyle = colors.rowHeaderBg;
      ctx.fillRect(dayColX, rowY, rowHeaderWidth, rowHeight);
      ctx.strokeStyle = colors.gridLine;
      ctx.strokeRect(dayColX, rowY, rowHeaderWidth, rowHeight);

      ctx.direction = "rtl";
      ctx.textAlign = "center";
      ctx.fillStyle = colors.rowHeaderText;
      ctx.font = `bold ${21 * scale}px ${FONT_FAMILY}`;
      ctx.fillText(day, dayColX + (rowHeaderWidth / 2), rowY + (rowHeight / 2) + (7 * scale));

      // Cells
      TIME_SLOTS.forEach((slot, colIdx) => {
        const colX = dayColX - ((colIdx + 1) * colWidth);

        ctx.fillStyle = colors.bg;
        ctx.fillRect(colX, rowY, colWidth, rowHeight);
        ctx.strokeStyle = colors.gridLine;
        ctx.strokeRect(colX, rowY, colWidth, rowHeight);

        const daySessions = scheduleMatrix[day]?.[slot.id] || [];
        if (daySessions.length > 0) {
          const sess = daySessions[0];
          const coursePalette = getCourseColor(sess.courseName, sess.color);
          const paletteColors = coursePalette.canvas[theme];

          const cardPadding = 7 * scale;
          const cardX = colX + cardPadding;
          const cardY = rowY + cardPadding;
          const cardW = colWidth - (cardPadding * 2);
          const cardH = rowHeight - (cardPadding * 2);

          // Card Background & Shadow
          ctx.save();
          ctx.shadowColor = paletteColors.shadow;
          ctx.shadowBlur = 12 * scale;
          ctx.shadowOffsetY = 6 * scale;
          ctx.fillStyle = paletteColors.bg;
          if (ctx.roundRect) {
            ctx.beginPath();
            ctx.roundRect(cardX, cardY, cardW, cardH, 14 * scale);
            ctx.fill();
            ctx.shadowColor = "transparent";
            ctx.strokeStyle = paletteColors.border;
            ctx.lineWidth = 1.5 * scale;
            ctx.stroke();
          } else {
            ctx.fillRect(cardX, cardY, cardW, cardH);
            ctx.shadowColor = "transparent";
            ctx.strokeStyle = paletteColors.border;
            ctx.strokeRect(cardX, cardY, cardW, cardH);
          }
          ctx.restore();

          // Signature Vertical Accent Pillar on the right edge (clipped cleanly to card curvature)
          ctx.save();
          ctx.beginPath();
          if (ctx.roundRect) {
            ctx.roundRect(cardX, cardY, cardW, cardH, 14 * scale);
          } else {
            ctx.rect(cardX, cardY, cardW, cardH);
          }
          ctx.clip();
          ctx.fillStyle = paletteColors.stripe;
          ctx.fillRect(cardX + cardW - (6 * scale), cardY, 6 * scale, cardH);
          ctx.restore();

          // Course Name (wraps up to 3 lines on the wider card so long names never clip)
          ctx.direction = "rtl";
          ctx.textAlign = "right";
          ctx.fillStyle = colors.cardText;
          ctx.font = `900 ${22 * scale}px ${FONT_FAMILY}`;
          const baseTitle = sess.isSecond ? `${sess.courseName} (ج ۲)` : sess.courseName;
          const titleLines = wrapTextToLines(ctx, baseTitle, cardW - (28 * scale), 3);
          const titleLineH = 28 * scale;
          let cursorY = cardY + (36 * scale);
          titleLines.forEach((line) => {
            ctx.fillText(line, cardX + cardW - (16 * scale), cursorY);
            cursorY += titleLineH;
          });

          // Professor Name (flows directly under the wrapped title)
          ctx.fillStyle = colors.cardSub;
          ctx.font = `bold ${16 * scale}px ${FONT_FAMILY}`;
          const profName = sess.professor ? `استاد: ${sess.professor}` : "استاد: نامشخص";
          const profLines = wrapTextToLines(ctx, profName, cardW - (28 * scale), 1);
          cursorY += 6 * scale;
          profLines.forEach((line) => {
            ctx.fillText(line, cardX + cardW - (16 * scale), cursorY);
            cursorY += 22 * scale;
          });

          // Location
          if (sess.location) {
            ctx.fillStyle = colors.cardSub;
            ctx.font = `bold ${15 * scale}px ${FONT_FAMILY}`;
            const locText = `مکان: ${sess.location}`;
            const locLines = wrapTextToLines(ctx, locText, cardW - (28 * scale), 1);
            locLines.forEach((line) => {
              ctx.fillText(line, cardX + cardW - (16 * scale), cursorY);
              cursorY += 20 * scale;
            });
          }

          // Time & Week Badge
          const badgeY = cardY + cardH - (36 * scale);
          const badgeRowCenterY = badgeY + (14 * scale);
          
          ctx.save();
          ctx.direction = "ltr";
          ctx.textAlign = "right";
          ctx.textBaseline = "middle";
          ctx.fillStyle = paletteColors.accentText;
          ctx.font = `900 ${16 * scale}px ${FONT_FAMILY}`;
          ctx.fillText(`${sess.startTime} - ${sess.endTime}`, cardX + cardW - (16 * scale), badgeRowCenterY);
          ctx.restore();

          if (sess.weekType && sess.weekType !== "all") {
            ctx.save();
            const badgeLabel = sess.weekType === "even" ? "هفته زوج" : "هفته فرد";
            ctx.fillStyle = paletteColors.badgeBg;
            const bWidth = 88 * scale;
            const bHeight = 28 * scale;
            const bX = cardX + (10 * scale);
            const bY = badgeY;
            if (ctx.roundRect) {
              ctx.beginPath();
              ctx.roundRect(bX, bY, bWidth, bHeight, 6 * scale);
              ctx.fill();
            } else {
              ctx.fillRect(bX, bY, bWidth, bHeight);
            }
            ctx.direction = "rtl";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillStyle = paletteColors.badgeText;
            ctx.font = `bold ${14 * scale}px ${FONT_FAMILY}`;
            ctx.fillText(badgeLabel, bX + (bWidth / 2), bY + (bHeight / 2));
            ctx.restore();
          }
        }
      });
    });

    // 3. Footer Watermark & Bot Reference
    const footerY = height - (18 * scale);
    ctx.direction = "rtl";
    ctx.textAlign = "center";
    ctx.fillStyle = colors.watermark;
    ctx.font = `bold ${17 * scale}px ${FONT_FAMILY}`;
    ctx.fillText("طراحی شده در سامانه دانشجویار دانشگاه تبریز • ربات تلگرام: \u200E@Daneshjooyardmbot • کانال: \u200E@daneshjooyartbz", width / 2, footerY);

    return canvas;
  }, [ensureCanvasAssetsReady, activeDays, theme, profile, scheduleMatrix]);

  // Smooth, non-blocking preview generation with zero main-thread memory bloat
  useEffect(() => {
    let isCancelled = false;

    // Small delay ensures entrance animation is 100% finished without frame drops
    const timer = setTimeout(async () => {
      try {
        // Scale 1 renders 1920x1400 which is crystal-clear Retina preview for modal (max-w ~800px)
        // while cutting pixel count by 4x and reducing render time to <25ms
        const canvas = await renderScheduleToCanvas(1);
        if (isCancelled) return;

        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
        if (!blob || isCancelled) return;

        // Revoke previous URL to keep heap memory footprint near zero
        if (previewBlobUrlRef.current) {
          URL.revokeObjectURL(previewBlobUrlRef.current);
        }

        const objectUrl = URL.createObjectURL(blob);
        previewBlobUrlRef.current = objectUrl;

        setPreviewUrl(objectUrl);
        setIsPreviewLoading(false);
      } catch (err) {
        console.error("Preview render error:", err);
      }
    }, 40);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [theme, renderScheduleToCanvas]);

  // Clean up object URL when modal unmounts
  useEffect(() => {
    return () => {
      if (previewBlobUrlRef.current) {
        URL.revokeObjectURL(previewBlobUrlRef.current);
        previewBlobUrlRef.current = null;
      }
    };
  }, []);

  // Helper to convert Blob to Base64 string
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        resolve(dataUrl.replace(/^data:image\/png;base64,/, ""));
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // Download Trigger (High-Res)
  const handleDownloadImage = async () => {
    setIsGenerating(true);
    try {
      // Scale 2 (2800px) is optimal to prevent OOM crashes on Android WebView
      const canvas = await renderScheduleToCanvas(2);
      const fileName = `barnameh-tabrizu-${Date.now()}.png`;

      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
      if (!blob) {
        throw new Error("Canvas toBlob returned null");
      }

      if (Capacitor.isNativePlatform()) {
        const base64Data = await blobToBase64(blob);
        // Save a real file into the public Downloads folder via the native bridge.
        let savedPath = "";
        try {
          const res = await NativeHelper.saveImageToDownloads?.({
            base64: base64Data,
            fileName
          });
          savedPath = res?.path || "";
        } catch (saveErr) {
          console.warn("MediaStore save failed, falling back to cache+open:", saveErr);
        }

        if (savedPath) {
          setShareToast("تصویر در پوشه دانلودها ذخیره شد ✓");
          setTimeout(() => setShareToast(null), 3500);
        } else {
          // Fallback: write to cache and open with an external viewer.
          const savedFile = await Filesystem.writeFile({
            path: fileName,
            data: base64Data,
            directory: Directory.Cache
          });
          try {
            await FileOpener.open({
              filePath: savedFile.uri,
              contentType: "image/png"
            });
          } catch (openerErr) {
            console.warn("FileOpener fallback:", openerErr);
          }
        }
      } else {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.download = fileName;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error("Download error:", err);
      setShareToast("خطا در ایجاد خروجی تصویر");
      setTimeout(() => setShareToast(null), 3500);
    } finally {
      setIsGenerating(false);
    }
  };

  // Share Trigger (Native Telegram/Messenger or Web Share)
  const handleShareImage = async () => {
    setIsSharing(true);
    try {
      // Scale 2 (2800px) is optimal to prevent OOM crashes on Android WebView
      const canvas = await renderScheduleToCanvas(2);
      const fileName = `barnameh-tabrizu-${Date.now()}.png`;

      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
      if (!blob) {
        throw new Error("Canvas toBlob returned null");
      }

      if (Capacitor.isNativePlatform()) {
        const base64Data = await blobToBase64(blob);
        const savedFile = await Filesystem.writeFile({
          path: fileName,
          data: base64Data,
          directory: Directory.Cache
        });

        await Share.share({
          title: SHARE_TITLE,
          text: SHARE_TEXT,
          url: savedFile.uri,
          dialogTitle: "اشتراک‌گذاری برنامه هفتگی در تلگرام و سایر پیام‌رسان‌ها"
        });
      } else {
        let sharedDirectly = false;
        if (navigator.share) {
          try {
            const file = new File([blob], fileName, { type: "image/png" });
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
              await navigator.share({
                title: SHARE_TITLE,
                text: SHARE_TEXT,
                files: [file]
              });
              sharedDirectly = true;
            }
          } catch (e) {
            console.warn("navigator.share fallback:", e);
          }
        }

        if (!sharedDirectly) {
          // Fallback: Copy official referral message and trigger image download
          try {
            await navigator.clipboard.writeText(SHARE_TEXT);
            setShareToast("متن معرفی ربات کپی شد! در حال ذخیره تصویر...");
          } catch {
            setShareToast("در حال دانلود تصویر...");
          }

          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.download = fileName;
          link.href = url;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);

          setTimeout(() => setShareToast(null), 3500);
        }
      }
    } catch (err) {
      console.error("Share error:", err);
    } finally {
      setIsSharing(false);
    }
  };

  const content = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="fixed inset-0 z-[220] flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-xs font-sans"
      onClick={onClose}
      dir="rtl"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 16 }}
        transition={{ type: "spring", damping: 26, stiffness: 340, duration: 0.2 }}
        className="w-full max-w-5xl bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col relative"
        onClick={(e) => e.stopPropagation()}
      >
        {shareToast && (
          <div className="absolute top-16 left-4 right-4 z-[300] max-w-sm mx-auto bg-slate-900/90 text-white px-4 py-2.5 rounded-xl shadow-xl text-xs font-black text-center">
            {shareToast}
          </div>
        )}
        {/* Header */}
        <div className="px-4 py-3 sm:px-5 sm:py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <ImageIcon className="w-4.5 h-4.5" />
            </div>
            <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
              خروجی تصویر برنامه هفتگی
            </h2>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-200/70 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Minimal Toolbar (Single-row on all screens, zero wrapping) */}
        <div className="px-3 sm:px-5 py-2.5 sm:py-3 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-2">
          {/* Theme Selector (Clean pill toggle) */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 hidden sm:inline-flex items-center gap-1">
              <Palette className="w-3.5 h-3.5 shrink-0" />
              <span>تم:</span>
            </span>
            <div className="inline-flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200/60 dark:border-slate-700/60 h-8">
              {(["light", "dark"] as ThemeStyle[]).map(t => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={`h-7 px-2.5 sm:px-3 rounded-lg text-xs font-bold transition-all inline-flex items-center justify-center cursor-pointer ${
                    theme === t
                      ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  {THEME_CONFIG[t].name}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons: Share & Download */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Share Button */}
            <button
              onClick={handleShareImage}
              disabled={isSharing || isGenerating}
              className="h-8 px-2.5 sm:px-3.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 active:scale-95 rounded-xl text-xs font-black inline-flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer shrink-0"
              title="اشتراک‌گذاری در تلگرام و پیام‌رسان‌ها"
            >
              {isSharing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
              ) : (
                <Share2 className="w-3.5 h-3.5 shrink-0" />
              )}
              <span>{isSharing ? "در حال ارسال..." : <>اشتراک<span className="hidden sm:inline">‌گذاری</span></>}</span>
            </button>

            {/* Download Button */}
            <button
              onClick={handleDownloadImage}
              disabled={isGenerating || isSharing}
              className="h-8 px-3 sm:px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-xl text-xs font-black inline-flex items-center justify-center gap-1.5 shadow-xs transition-all disabled:opacity-50 cursor-pointer shrink-0"
            >
              {isGenerating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
              ) : (
                <Download className="w-3.5 h-3.5 shrink-0" />
              )}
              <span>{isGenerating ? "در حال آماده‌سازی..." : <>دانلود<span className="hidden sm:inline"> تصویر</span></>}</span>
            </button>
          </div>
        </div>

        {/* Share Toast Feedback Notification */}
        <AnimatePresence>
          {shareToast && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-emerald-50 dark:bg-emerald-950/60 border-b border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 px-4 py-2 text-xs font-bold text-center flex items-center justify-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>{shareToast}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Clean Responsive Mobile-First Preview (100% Fit, Zero Drag/Overflow) */}
        <div className="p-3 sm:p-5 overflow-y-auto flex-1 bg-slate-100/70 dark:bg-slate-950/70 flex items-center justify-center">
          {isPreviewLoading && !previewUrl ? (
            <div className="w-full aspect-[16/10] max-h-[360px] rounded-xl bg-slate-200/60 dark:bg-slate-800/60 animate-pulse flex flex-col items-center justify-center gap-2 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
              <span className="text-[11px] font-bold">آماده‌سازی پیش‌نمایش...</span>
            </div>
          ) : previewUrl ? (
            <div className="w-full flex justify-center">
              <img
                src={previewUrl}
                alt="پیش‌نمایش برنامه هفتگی"
                className="w-full max-w-full h-auto object-contain rounded-xl shadow-md border border-slate-200/80 dark:border-slate-800 transition-opacity duration-150 select-none"
              />
            </div>
          ) : null}
        </div>

        {/* Minimal Footer */}
        <div className="h-11 px-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-end text-[11px] text-slate-400">
          <button
            onClick={onClose}
            className="h-7 px-3 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors inline-flex items-center justify-center cursor-pointer"
          >
            بستن
          </button>
        </div>
      </motion.div>
    </motion.div>
  );

  return typeof document !== "undefined" ? createPortal(content, document.body) : null;
}
