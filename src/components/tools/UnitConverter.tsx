"use client";

import { useState, useEffect } from "react";
import { Ruler } from "lucide-react";
import { ToolLayout } from "@/components/ToolLayout";

type UnitDef = { label: string; value: string; toBase: number; offset?: number };
type Category = { label: string; units: UnitDef[] };

const categories: Record<string, Category> = {
  length: {
    label: "Length",
    units: [
      { label: "Millimeter", value: "mm", toBase: 0.001 },
      { label: "Centimeter", value: "cm", toBase: 0.01 },
      { label: "Meter", value: "m", toBase: 1 },
      { label: "Kilometer", value: "km", toBase: 1000 },
      { label: "Inch", value: "in", toBase: 0.0254 },
      { label: "Foot", value: "ft", toBase: 0.3048 },
      { label: "Yard", value: "yd", toBase: 0.9144 },
      { label: "Mile", value: "mi", toBase: 1609.344 },
    ],
  },
  weight: {
    label: "Weight",
    units: [
      { label: "Milligram", value: "mg", toBase: 0.000001 },
      { label: "Gram", value: "g", toBase: 0.001 },
      { label: "Kilogram", value: "kg", toBase: 1 },
      { label: "Ounce", value: "oz", toBase: 0.0283495 },
      { label: "Pound", value: "lb", toBase: 0.453592 },
    ],
  },
  temperature: {
    label: "Temperature",
    units: [
      { label: "Celsius", value: "C", toBase: 1, offset: 0 },
      { label: "Fahrenheit", value: "F", toBase: 1, offset: 0 },
      { label: "Kelvin", value: "K", toBase: 1, offset: 0 },
    ],
  },
  volume: {
    label: "Volume",
    units: [
      { label: "Milliliter", value: "mL", toBase: 0.001 },
      { label: "Liter", value: "L", toBase: 1 },
      { label: "Gallon (US)", value: "gal", toBase: 3.78541 },
      { label: "Cup", value: "cup", toBase: 0.236588 },
      { label: "Fluid Ounce (US)", value: "fl oz", toBase: 0.0295735 },
    ],
  },
  area: {
    label: "Area",
    units: [
      { label: "Square Meter", value: "sq m", toBase: 1 },
      { label: "Square Foot", value: "sq ft", toBase: 0.092903 },
      { label: "Acre", value: "acre", toBase: 4046.86 },
      { label: "Hectare", value: "hectare", toBase: 10000 },
    ],
  },
  speed: {
    label: "Speed",
    units: [
      { label: "Meter per second", value: "m/s", toBase: 1 },
      { label: "Kilometer per hour", value: "km/h", toBase: 0.277778 },
      { label: "Mile per hour", value: "mph", toBase: 0.44704 },
      { label: "Knot", value: "knot", toBase: 0.514444 },
    ],
  },
  time: {
    label: "Time",
    units: [
      { label: "Millisecond", value: "ms", toBase: 0.001 },
      { label: "Second", value: "sec", toBase: 1 },
      { label: "Minute", value: "min", toBase: 60 },
      { label: "Hour", value: "hr", toBase: 3600 },
      { label: "Day", value: "day", toBase: 86400 },
      { label: "Week", value: "week", toBase: 604800 },
    ],
  },
  data: {
    label: "Data",
    units: [
      { label: "Byte", value: "B", toBase: 1 },
      { label: "Kilobyte", value: "KB", toBase: 1000 },
      { label: "Megabyte", value: "MB", toBase: 1e6 },
      { label: "Gigabyte", value: "GB", toBase: 1e9 },
      { label: "Terabyte", value: "TB", toBase: 1e12 },
    ],
  },
};

function convert(value: number, from: UnitDef, to: UnitDef): number {
  if (from.value === "C" || from.value === "F" || from.value === "K") {
    let celsius: number;
    if (from.value === "C") celsius = value;
    else if (from.value === "F") celsius = (value - 32) * (5 / 9);
    else celsius = value - 273.15;

    if (to.value === "C") return celsius;
    if (to.value === "F") return celsius * (9 / 5) + 32;
    return celsius + 273.15;
  }
  const base = value * from.toBase;
  return base / to.toBase;
}

export default function UnitConverter() {
  const [categoryKey, setCategoryKey] = useState("length");
  const [fromValue, setFromValue] = useState("m");
  const [toValue, setToValue] = useState("km");
  const [inputVal, setInputVal] = useState("1");
  const [result, setResult] = useState("");

  const cat = categories[categoryKey];
  const fromUnit = cat.units.find((u) => u.value === fromValue) || cat.units[0];
  const toUnit = cat.units.find((u) => u.value === toValue) || cat.units[1];

  useEffect(() => {
    const num = parseFloat(inputVal);
    if (isNaN(num)) { setResult(""); return; }
    const converted = convert(num, fromUnit, toUnit);
    setResult(converted.toFixed(6).replace(/\.?0+$/, ""));
  }, [inputVal, fromValue, toValue, categoryKey]);

  return (
    <ToolLayout
      title="Unit Converter"
      description="Convert between different units of measurement."
      faq={[
        { q: "Are conversions accurate?", a: "Conversions use standard conversion factors. Temperature conversions handle Celsius, Fahrenheit, and Kelvin correctly." },
        { q: "How do I swap units?", a: "Use the swap icon button between the From and To selectors." },
      ]}
    >
      <div className="space-y-5">
        <div className="flex flex-wrap gap-2">
          {Object.entries(categories).map(([key, c]) => (
            <button
              key={key}
              onClick={() => {
                setCategoryKey(key);
                setFromValue(c.units[0].value);
                setToValue(c.units.length > 1 ? c.units[1].value : c.units[0].value);
                setInputVal("1");
              }}
              className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                categoryKey === key
                  ? "border-accent bg-accent/10 text-accent font-medium"
                  : "border-gray-300 dark:border-gray-700 hover:border-gray-400"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-3 items-end">
          <div>
            <label className="text-sm font-medium mb-1 block">From</label>
            <select
              value={fromValue}
              onChange={(e) => setFromValue(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-accent"
            >
              {cat.units.map((u) => (
                <option key={u.value} value={u.value}>{u.label}</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => { setFromValue(toValue); setToValue(fromValue); }}
            className="flex items-center justify-center p-2 mb-0.5 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
          </button>

          <div>
            <label className="text-sm font-medium mb-1 block">To</label>
            <select
              value={toValue}
              onChange={(e) => setToValue(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-accent"
            >
              {cat.units.map((u) => (
                <option key={u.value} value={u.value}>{u.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">Value</label>
          <input
            type="number"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        {result !== "" && (
          <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-center">
            <div className="text-sm text-gray-500 mb-1">Result</div>
            <div className="text-2xl font-bold">
              {inputVal} {fromUnit.label} = {result} {toUnit.label}
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
