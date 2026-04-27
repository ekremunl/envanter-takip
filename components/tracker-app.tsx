"use client";

import type { LucideIcon } from "lucide-react";
import {
  BookOpenCheck,
  CalendarDays,
  Coffee,
  Croissant,
  MoonStar,
  Plus,
  Printer,
  Sandwich,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type CategoryKey =
  | "kahvalti"
  | "ogleYemegi"
  | "aksamYemegi"
  | "araOgun"
  | "firinUrunleri";

type Unit = "gram" | "adet";

type Entry = {
  id: string;
  productName: string;
  quantity: number;
  unit: Unit;
  createdAt: string;
  bakeryType?: string;
};

type DayRecord = Record<CategoryKey, Entry[]>;

type StoragePayload = {
  productPool: string[];
  records: Record<string, DayRecord>;
};

type FormState = {
  productName: string;
  quantity: string;
  unit: Unit;
  bakeryType: string;
};

const STORAGE_KEY = "daily-inventory-consumption-tracker";
const MAX_DAYS = 10;
const BAKERY_TYPES = ["Börek", "Ekmek", "Simit", "Poğaça"] as const;

const CATEGORY_META: Array<{
  key: CategoryKey;
  title: string;
  description: string;
  icon: LucideIcon;
}> = [
  {
    key: "kahvalti",
    title: "Kahvaltı",
    description: "Sabah tüketimi ve kahvaltı hazırlıkları",
    icon: Coffee,
  },
  {
    key: "ogleYemegi",
    title: "Öğle Yemeği",
    description: "Öğlen servisi ve tüketim kayıtları",
    icon: UtensilsCrossed,
  },
  {
    key: "aksamYemegi",
    title: "Akşam Yemeği",
    description: "Akşam servisi için günlük takip alanı",
    icon: MoonStar,
  },
  {
    key: "araOgun",
    title: "Ara Öğün",
    description: "Atıştırmalıklar ve ara tüketim kayıtları",
    icon: Sandwich,
  },
  {
    key: "firinUrunleri",
    title: "Fırın Ürünleri",
    description: "Börek, ekmek, simit ve poğaça alt tipleriyle takip",
    icon: Croissant,
  },
];

function createEmptyDayRecord(): DayRecord {
  return {
    kahvalti: [],
    ogleYemegi: [],
    aksamYemegi: [],
    araOgun: [],
    firinUrunleri: [],
  };
}

function createEmptyPayload(): StoragePayload {
  return {
    productPool: [],
    records: {},
  };
}

function getInitialForms(): Record<CategoryKey, FormState> {
  return {
    kahvalti: { productName: "", quantity: "", unit: "adet", bakeryType: "" },
    ogleYemegi: { productName: "", quantity: "", unit: "adet", bakeryType: "" },
    aksamYemegi: { productName: "", quantity: "", unit: "adet", bakeryType: "" },
    araOgun: { productName: "", quantity: "", unit: "adet", bakeryType: "" },
    firinUrunleri: {
      productName: "",
      quantity: "",
      unit: "adet",
      bakeryType: BAKERY_TYPES[0],
    },
  };
}

function normalizeText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, (month || 1) - 1, day || 1, 12, 0, 0);
}

function formatDisplayDate(dateKey: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "full",
  }).format(parseDateKey(dateKey));
}

function formatQuantity(value: number) {
  return Number.isInteger(value) ? `${value}` : value.toFixed(2).replace(/\.?0+$/, "");
}

function sortDateKeys(dateKeys: string[]) {
  return [...dateKeys].sort((first, second) => second.localeCompare(first));
}

function normalizeDayRecord(value: unknown): DayRecord {
  const source = value && typeof value === "object" ? (value as Partial<DayRecord>) : {};

  const sanitizeEntries = (entries: unknown): Entry[] => {
    if (!Array.isArray(entries)) {
      return [];
    }

    return entries
      .filter((entry) => entry && typeof entry === "object")
      .map((entry) => {
        const current = entry as Partial<Entry>;
        const quantity = Number(current.quantity);
        const productName = normalizeText(String(current.productName ?? ""));
        const unit: Unit = current.unit === "gram" ? "gram" : "adet";
        const bakeryType =
          typeof current.bakeryType === "string" ? normalizeText(current.bakeryType) : undefined;

        return {
          id: typeof current.id === "string" && current.id ? current.id : crypto.randomUUID(),
          productName,
          quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 0,
          unit,
          createdAt:
            typeof current.createdAt === "string" && current.createdAt
              ? current.createdAt
              : new Date().toISOString(),
          bakeryType,
        };
      })
      .filter((entry) => entry.productName && entry.quantity > 0);
  };

  return {
    kahvalti: sanitizeEntries(source.kahvalti),
    ogleYemegi: sanitizeEntries(source.ogleYemegi),
    aksamYemegi: sanitizeEntries(source.aksamYemegi),
    araOgun: sanitizeEntries(source.araOgun),
    firinUrunleri: sanitizeEntries(source.firinUrunleri),
  };
}

function sanitizePayload(payload: unknown): StoragePayload {
  const source = payload && typeof payload === "object" ? (payload as Partial<StoragePayload>) : {};
  const rawPool = Array.isArray(source.productPool) ? source.productPool : [];
  const rawRecords =
    source.records && typeof source.records === "object"
      ? (source.records as Record<string, unknown>)
      : {};

  const cutoffDate = new Date();
  cutoffDate.setHours(0, 0, 0, 0);
  cutoffDate.setDate(cutoffDate.getDate() - (MAX_DAYS - 1));

  const retainedDateKeys = sortDateKeys(Object.keys(rawRecords))
    .filter((dateKey) => parseDateKey(dateKey) >= cutoffDate)
    .slice(0, MAX_DAYS);

  const records = retainedDateKeys.reduce<Record<string, DayRecord>>((accumulator, dateKey) => {
    accumulator[dateKey] = normalizeDayRecord(rawRecords[dateKey]);
    return accumulator;
  }, {});

  return {
    productPool: [...new Set(rawPool.map((item) => normalizeText(String(item))).filter(Boolean))].sort(
      (first, second) => first.localeCompare(second, "tr"),
    ),
    records,
  };
}

function readStorage() {
  if (typeof window === "undefined") {
    return createEmptyPayload();
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? sanitizePayload(JSON.parse(raw)) : createEmptyPayload();
  } catch {
    return createEmptyPayload();
  }
}

function persistStorage(payload: StoragePayload) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitizePayload(payload)));
}

function getDayRecord(storage: StoragePayload, dateKey: string) {
  return storage.records[dateKey] ?? createEmptyDayRecord();
}

function getEmptyForm(category: CategoryKey): FormState {
  return category === "firinUrunleri"
    ? {
        productName: "",
        quantity: "",
        unit: "adet",
        bakeryType: BAKERY_TYPES[0],
      }
    : {
        productName: "",
        quantity: "",
        unit: "adet",
        bakeryType: "",
      };
}

export default function TrackerApp() {
  const [selectedDate, setSelectedDate] = useState(() => formatDateKey(new Date()));
  const [storage, setStorage] = useState<StoragePayload>(() => readStorage());
  const [forms, setForms] = useState<Record<CategoryKey, FormState>>(getInitialForms);

  useEffect(() => {
    persistStorage(storage);
  }, [storage]);

  const selectedDayRecord = useMemo(() => getDayRecord(storage, selectedDate), [selectedDate, storage]);
  const savedDays = useMemo(() => sortDateKeys(Object.keys(storage.records)), [storage.records]);
  const totalEntries = useMemo(
    () => CATEGORY_META.reduce((total, category) => total + selectedDayRecord[category.key].length, 0),
    [selectedDayRecord],
  );
  const populatedCategoryCount = useMemo(
    () => CATEGORY_META.filter((category) => selectedDayRecord[category.key].length > 0).length,
    [selectedDayRecord],
  );

  const updateStorage = (updater: (current: StoragePayload) => StoragePayload) => {
    setStorage((current) => sanitizePayload(updater(current)));
  };

  const updateForm = (category: CategoryKey, field: keyof FormState, value: string) => {
    setForms((current) => ({
      ...current,
      [category]: {
        ...current[category],
        [field]: value,
      },
    }));
  };

  const resetForm = (category: CategoryKey) => {
    setForms((current) => ({
      ...current,
      [category]: getEmptyForm(category),
    }));
  };

  const addEntry = (category: CategoryKey) => {
    const form = forms[category];
    const productName = normalizeText(form.productName);
    const quantity = Number(form.quantity);

    if (!productName || !Number.isFinite(quantity) || quantity <= 0) {
      return;
    }

    const entry: Entry = {
      id: crypto.randomUUID(),
      productName,
      quantity,
      unit: form.unit,
      createdAt: new Date().toISOString(),
      bakeryType: category === "firinUrunleri" ? form.bakeryType : undefined,
    };

    updateStorage((current) => {
      const record = getDayRecord(current, selectedDate);

      return {
        productPool: [...current.productPool, productName],
        records: {
          ...current.records,
          [selectedDate]: {
            ...record,
            [category]: [...record[category], entry],
          },
        },
      };
    });

    resetForm(category);
  };

  const removeEntry = (category: CategoryKey, entryId: string) => {
    updateStorage((current) => {
      const record = getDayRecord(current, selectedDate);
      const nextEntries = record[category].filter((entry) => entry.id !== entryId);
      const nextRecord = {
        ...record,
        [category]: nextEntries,
      };
      const hasEntries = CATEGORY_META.some((item) => nextRecord[item.key].length > 0);

      if (!hasEntries) {
        const { [selectedDate]: _removed, ...remainingRecords } = current.records;

        return {
          ...current,
          records: remainingRecords,
        };
      }

      return {
        ...current,
        records: {
          ...current.records,
          [selectedDate]: nextRecord,
        },
      };
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(168,85,247,0.18),_transparent_40%),linear-gradient(180deg,_#09090f_0%,_#111827_100%)] text-slate-100">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-3 py-4 sm:gap-8 sm:px-6 sm:py-8 lg:px-8 print:max-w-none print:px-0 print:py-0">
        <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 shadow-2xl shadow-fuchsia-950/20 backdrop-blur print:rounded-none print:border-0 print:bg-white print:shadow-none">
          <div className="grid gap-5 border-b border-white/10 px-4 py-5 sm:px-6 sm:py-8 lg:grid-cols-[1.6fr_1fr] lg:px-8 print:hidden">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-fuchsia-400/30 bg-fuchsia-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-fuchsia-200 sm:text-xs">
                <BookOpenCheck className="h-4 w-4" />
                Günlük Envanter ve Tüketim Takibi
              </div>
              <div className="space-y-3">
                <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-4xl">
                  Günlük tüketimi tek ekranda kaydet, raporla ve PDF olarak dışa aktar.
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                  Türkçe arayüz, ürün havuzu, kategori bazlı girişler ve son 10 günü koruyan
                  localStorage yapısıyla günlük operasyon takibini sadeleştirir.
                </p>
              </div>
            </div>

            <div className="grid gap-4 rounded-3xl border border-white/10 bg-slate-950/40 p-4 sm:p-5">
              <label className="space-y-2">
                <span className="flex items-center gap-2 text-sm font-medium text-slate-200">
                  <CalendarDays className="h-4 w-4 text-fuchsia-300" />
                  Kayıt Tarihi
                </span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(event) => setSelectedDate(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-fuchsia-400/60 focus:ring-2 focus:ring-fuchsia-400/30"
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Seçili Gün</p>
                  <p className="mt-2 text-sm font-medium text-white">{formatDisplayDate(selectedDate)}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Toplam Kayıt</p>
                  <p className="mt-2 text-3xl font-semibold text-fuchsia-200">{totalEntries}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-fuchsia-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-fuchsia-400"
              >
                <Printer className="h-4 w-4" />
                Yazdır / PDF Olarak Kaydet
              </button>
            </div>
          </div>

          <div className="grid gap-6 px-4 py-5 sm:px-6 sm:py-8 lg:grid-cols-[1.45fr_1fr] lg:px-8 print:block print:px-5 print:py-5">
            <section className="space-y-5 print:hidden">
              <div>
                <h2 className="text-xl font-semibold text-white">Günlük Giriş Formları</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Her kategori için ürün adı, miktar ve birim seçerek yeni kayıt ekleyin.
                </p>
              </div>

              <div className="grid gap-4">
                {CATEGORY_META.map((category) => {
                  const Icon = category.icon;
                  const categoryForm = forms[category.key];
                  const entries = selectedDayRecord[category.key];

                  return (
                    <article
                      key={category.key}
                      className="rounded-3xl border border-white/10 bg-slate-950/40 p-4 sm:p-5"
                    >
                      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex items-start gap-3">
                          <div className="rounded-2xl border border-fuchsia-400/20 bg-fuchsia-400/10 p-3 text-fuchsia-200">
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-white">{category.title}</h3>
                            <p className="text-sm text-slate-400">{category.description}</p>
                          </div>
                        </div>

                        <div className="self-start rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
                          {entries.length} kayıt
                        </div>
                      </div>

                      {category.key === "firinUrunleri" ? (
                        <label className="mb-3 block space-y-2">
                          <span className="text-sm font-medium text-slate-200">Fırın Alt Tipi</span>
                          <select
                            value={categoryForm.bakeryType}
                            onChange={(event) =>
                              updateForm(category.key, "bakeryType", event.target.value)
                            }
                            className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-fuchsia-400/60 focus:ring-2 focus:ring-fuchsia-400/30"
                          >
                            {BAKERY_TYPES.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        </label>
                      ) : null}

                      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1.4fr_0.7fr_0.7fr_auto]">
                        <label className="space-y-2">
                          <span className="text-sm font-medium text-slate-200">Ürün Adı</span>
                          <input
                            list={`product-pool-${category.key}`}
                            value={categoryForm.productName}
                            onChange={(event) =>
                              updateForm(category.key, "productName", event.target.value)
                            }
                            placeholder="Örn. Peynir, Çorba, Su"
                            className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-fuchsia-400/60 focus:ring-2 focus:ring-fuchsia-400/30"
                          />
                          <datalist id={`product-pool-${category.key}`}>
                            {storage.productPool.map((product) => (
                              <option key={product} value={product} />
                            ))}
                          </datalist>
                        </label>

                        <label className="space-y-2">
                          <span className="text-sm font-medium text-slate-200">Miktar</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={categoryForm.quantity}
                            onChange={(event) => updateForm(category.key, "quantity", event.target.value)}
                            placeholder="0"
                            className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-fuchsia-400/60 focus:ring-2 focus:ring-fuchsia-400/30"
                          />
                        </label>

                        <label className="space-y-2">
                          <span className="text-sm font-medium text-slate-200">Birim</span>
                          <select
                            value={categoryForm.unit}
                            onChange={(event) => updateForm(category.key, "unit", event.target.value)}
                            className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-fuchsia-400/60 focus:ring-2 focus:ring-fuchsia-400/30"
                          >
                            <option value="gram">Gram</option>
                            <option value="adet">Adet</option>
                          </select>
                        </label>

                        <button
                          type="button"
                          onClick={() => addEntry(category.key)}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-white md:mt-7 xl:w-auto"
                        >
                          <Plus className="h-4 w-4" />
                          Ekle
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-slate-950/40 p-4 sm:p-5 print:rounded-none print:border-0 print:bg-white print:p-0">
              <div className="mb-4 flex flex-col gap-3 border-b border-white/10 pb-4 sm:mb-5 sm:flex-row sm:items-start sm:justify-between sm:pb-5 print:mb-3 print:flex-row print:items-start print:justify-between print:border-slate-300 print:pb-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-fuchsia-200 print:text-slate-500">
                    Günlük Rapor
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-white sm:text-2xl print:text-[20px] print:text-slate-900">
                    Günlük Envanter ve Tüketim Özeti
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-slate-400 print:text-[11px] print:leading-4 print:text-slate-600">
                    Seçilen tarihteki tüm kategoriler ve tüketim kayıtları tek sayfada listelenir.
                  </p>
                </div>
                <div className="rounded-2xl border border-fuchsia-400/20 bg-fuchsia-400/10 px-4 py-3 text-left text-sm font-medium text-fuchsia-100 sm:text-right print:min-w-[200px] print:border-slate-300 print:bg-slate-50 print:px-3 print:py-2 print:text-right print:text-[11px] print:text-slate-700">
                  <div className="text-xs uppercase tracking-[0.2em] text-fuchsia-200/80 print:text-slate-500">
                    Tarih
                  </div>
                  <div>{formatDisplayDate(selectedDate)}</div>
                </div>
              </div>

              <div className="mb-4 flex flex-wrap gap-2 print:mb-3 print:gap-1.5">
                <div className="rounded-full border border-fuchsia-400/20 bg-fuchsia-400/10 px-3 py-1 text-xs font-medium text-fuchsia-100 print:border-slate-300 print:bg-slate-50 print:px-2.5 print:text-[10px] print:text-slate-700">
                  Toplam {totalEntries} kayıt
                </div>
                <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300 print:border-slate-300 print:bg-white print:px-2.5 print:text-[10px] print:text-slate-700">
                  {populatedCategoryCount} aktif kategori
                </div>
                {CATEGORY_META.filter((category) => selectedDayRecord[category.key].length > 0).map((category) => (
                  <div
                    key={`summary-${category.key}`}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300 print:border-slate-300 print:bg-white print:px-2.5 print:text-[10px] print:text-slate-700"
                  >
                    {category.title}: {selectedDayRecord[category.key].length}
                  </div>
                ))}
              </div>

              {totalEntries === 0 ? (
                <div className="hidden rounded-2xl border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500 print:block print:rounded-xl print:px-3 print:py-4 print:text-[11px]">
                  Seçili tarihte yazdırılacak kayıt bulunmuyor.
                </div>
              ) : null}

              <div className="grid gap-3 sm:gap-4 print:grid-cols-2 print:gap-2" aria-live="polite">
                {CATEGORY_META.map((category) => {
                  const Icon = category.icon;
                  const entries = selectedDayRecord[category.key];

                  return (
                    <article
                      key={`report-${category.key}`}
                      className={`rounded-2xl border border-white/10 bg-white/[0.03] p-4 print:break-inside-avoid print:rounded-xl print:border-slate-300 print:bg-white print:p-3 ${
                        entries.length === 0 ? "print:hidden" : ""
                      }`}
                    >
                      <div className="mb-3 flex items-center gap-3 print:mb-2 print:gap-2">
                        <div className="rounded-xl border border-fuchsia-400/20 bg-fuchsia-400/10 p-2 text-fuchsia-200 print:border-slate-300 print:bg-slate-100 print:p-1.5 print:text-slate-700">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-white print:text-sm print:text-slate-900">
                            {category.title}
                          </h3>
                          <p className="text-xs text-slate-400 print:text-[10px] print:text-slate-500">
                            {entries.length > 0 ? `${entries.length} kayıt bulundu` : "Kayıt bulunmuyor"}
                          </p>
                        </div>
                      </div>

                      {entries.length > 0 ? (
                        <>
                          <div className="space-y-2 print:hidden">
                            {entries.map((entry) => (
                              <div
                                key={entry.id}
                                className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 sm:flex-row sm:items-start sm:justify-between print:border-slate-200 print:bg-white"
                              >
                                <div>
                                  <p className="font-medium text-white print:text-slate-900">
                                    {entry.productName}
                                  </p>
                                  <p className="text-sm text-slate-400 print:text-slate-600">
                                    {category.key === "firinUrunleri" && entry.bakeryType
                                      ? `${entry.bakeryType} · `
                                      : ""}
                                    {formatQuantity(entry.quantity)}{" "}
                                    {entry.unit === "gram" ? "Gram" : "Adet"}
                                  </p>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => removeEntry(category.key, entry.id)}
                                  className="self-end rounded-full border border-white/10 p-2 text-slate-400 transition hover:border-rose-400/40 hover:text-rose-300 sm:self-start print:hidden"
                                  aria-label={`${entry.productName} kaydını sil`}
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            ))}
                          </div>

                          <div className="hidden print:block">
                            <div className="space-y-1">
                              {entries.map((entry) => (
                                <div
                                  key={`${entry.id}-print`}
                                  className="grid grid-cols-[1fr_auto] gap-2 border-b border-slate-200 py-1 last:border-b-0"
                                >
                                  <div className="min-w-0">
                                    <p className="truncate text-[11px] font-medium leading-4 text-slate-900">
                                      {entry.productName}
                                    </p>
                                    {category.key === "firinUrunleri" && entry.bakeryType ? (
                                      <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">
                                        {entry.bakeryType}
                                      </p>
                                    ) : null}
                                  </div>
                                  <div className="text-right text-[11px] font-semibold leading-4 text-slate-700">
                                    {formatQuantity(entry.quantity)}{" "}
                                    {entry.unit === "gram" ? "gr" : "adet"}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-center text-sm text-slate-500 print:border-slate-300 print:text-slate-500">
                          Bu kategori için seçili tarihte kayıt yok.
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            </section>
          </div>

          <div className="grid gap-4 border-t border-white/10 bg-slate-950/30 px-4 py-5 sm:px-6 sm:py-6 lg:grid-cols-[1.15fr_1fr] lg:px-8 print:hidden">
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
              <h2 className="text-lg font-semibold text-white">Ürün Havuzu</h2>
              <p className="mt-1 text-sm text-slate-400">
                Yeni girilen ürün adları otomatik kaydedilir ve sonraki girişlerde açılır öneri olarak kullanılır.
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {storage.productPool.length > 0 ? (
                  storage.productPool.map((product) => (
                    <span
                      key={product}
                      className="rounded-full border border-fuchsia-400/20 bg-fuchsia-400/10 px-3 py-1 text-xs text-fuchsia-100 sm:text-sm"
                    >
                      {product}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">Henüz ürün havuzunda kayıt yok.</p>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
              <h2 className="text-lg font-semibold text-white">Saklama Kuralları</h2>
              <ul className="mt-3 space-y-3 text-sm leading-6 text-slate-300">
                <li>• Veriler tarayıcıda localStorage ile saklanır.</li>
                <li>• Uygulama yalnızca son 10 günün kayıtlarını korur.</li>
                <li>• Daha eski veriler otomatik olarak temizlenir.</li>
                <li>• Yazdır ekranı üzerinden PDF olarak dışa aktarım yapılabilir.</li>
              </ul>

              {savedDays.length > 0 ? (
                <div className="mt-4 rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Kayıtlı Günler</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {savedDays.map((day) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => setSelectedDate(day)}
                        className={`rounded-full border px-3 py-1 text-xs transition ${
                          selectedDate === day
                            ? "border-fuchsia-300 bg-fuchsia-400/15 text-fuchsia-100"
                            : "border-white/10 text-slate-300 hover:border-fuchsia-400/40 hover:text-white"
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
