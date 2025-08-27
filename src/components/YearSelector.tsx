"use client";

interface YearSelectorProps {
  selectedYear: number;
  onChange: (year: number) => void;
}

export default function YearSelector({ selectedYear, onChange }: YearSelectorProps) {
  const currentYear = new Date().getFullYear();

  const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

  return (
    <select
      value={selectedYear}
      onChange={(e) => onChange(parseInt(e.target.value))}
      className="border border-gray-300 rounded px-3 py-1 shadow-sm"
    >
      {years.map((year) => (
        <option
          key={year}
          value={year}
          className={year === currentYear ? "bg-blue-100 font-bold text-blue-700" : ""}
        >
          {year === currentYear ? `ปี ${year} (ปัจจุบัน)` : `ปี ${year}`}
        </option>
      ))}
    </select>
  );
}
