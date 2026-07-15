"use client";

import { useState } from "react";
import { Activity } from "lucide-react";
import { ToolLayout } from "@/components/ToolLayout";

function bmiCategory(bmi: number): { label: string; color: string; barColor: string; position: number } {
  if (bmi < 18.5) return { label: "Underweight", color: "text-blue-500", barColor: "bg-blue-500", position: 12 };
  if (bmi < 25) return { label: "Normal", color: "text-green-500", barColor: "bg-green-500", position: 31 };
  if (bmi < 30) return { label: "Overweight", color: "text-yellow-500", barColor: "bg-yellow-500", position: 50 };
  if (bmi < 35) return { label: "Obese Class I", color: "text-orange-500", barColor: "bg-orange-500", position: 68 };
  if (bmi < 40) return { label: "Obese Class II", color: "text-red-500", barColor: "bg-red-500", position: 82 };
  return { label: "Obese Class III", color: "text-red-600", barColor: "bg-red-600", position: 93 };
}

function healthyWeightRange(heightCm: number): { min: number; max: number } {
  const m = heightCm / 100;
  return { min: Math.round(18.5 * m * m * 10) / 10, max: Math.round(24.9 * m * m * 10) / 10 };
}

export default function BMICalculator() {
  const [weightUnit, setWeightUnit] = useState<"kg" | "lbs">("kg");
  const [heightUnit, setHeightUnit] = useState<"cm" | "ftin">("cm");
  const [weight, setWeight] = useState("70");
  const [height, setHeight] = useState("175");
  const [heightFt, setHeightFt] = useState("5");
  const [heightIn, setHeightIn] = useState("9");
  const [bmi, setBmi] = useState<number | null>(null);

  const calculate = () => {
    const w = parseFloat(weight);
    if (isNaN(w) || !weight) return;
    let hCm: number;
    if (heightUnit === "cm") {
      hCm = parseFloat(height);
    } else {
      hCm = (parseFloat(heightFt) || 0) * 30.48 + (parseFloat(heightIn) || 0) * 2.54;
    }
    if (isNaN(hCm) || hCm <= 0) return;
    const wKg = weightUnit === "kg" ? w : w * 0.453592;
    const bmiVal = wKg / ((hCm / 100) * (hCm / 100));
    setBmi(Math.round(bmiVal * 10) / 10);
  };

  const cat = bmi !== null ? bmiCategory(bmi) : null;
  const range = bmi !== null && heightUnit === "cm"
    ? healthyWeightRange(parseFloat(height))
    : bmi !== null
    ? healthyWeightRange((parseFloat(heightFt) || 0) * 30.48 + (parseFloat(heightIn) || 0) * 2.54)
    : null;

  return (
    <ToolLayout
      title="BMI Calculator"
      description="Calculate your Body Mass Index and see where you fall on the scale."
      faq={[
        { q: "What is BMI?", a: "Body Mass Index (BMI) is a measure calculated from your weight and height. It is used to screen for weight categories." },
        { q: "Is BMI accurate?", a: "BMI is a general screening tool and may not be accurate for athletes, pregnant women, or the elderly. Consult a healthcare provider for a full assessment." },
      ]}
    >
      <div className="space-y-5">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium">Weight</span>
            <div className="flex bg-gray-200 dark:bg-gray-700 rounded-lg p-0.5">
              <button
                onClick={() => setWeightUnit("kg")}
                className={`px-3 py-1 text-xs rounded-md transition-colors ${weightUnit === "kg" ? "bg-white dark:bg-gray-600 font-medium shadow-sm" : ""}`}
              >
                kg
              </button>
              <button
                onClick={() => setWeightUnit("lbs")}
                className={`px-3 py-1 text-xs rounded-md transition-colors ${weightUnit === "lbs" ? "bg-white dark:bg-gray-600 font-medium shadow-sm" : ""}`}
              >
                lbs
              </button>
            </div>
          </div>
          <input
            type="number"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-accent"
            placeholder={weightUnit === "kg" ? "Weight in kg" : "Weight in lbs"}
          />
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium">Height</span>
            <div className="flex bg-gray-200 dark:bg-gray-700 rounded-lg p-0.5">
              <button
                onClick={() => setHeightUnit("cm")}
                className={`px-3 py-1 text-xs rounded-md transition-colors ${heightUnit === "cm" ? "bg-white dark:bg-gray-600 font-medium shadow-sm" : ""}`}
              >
                cm
              </button>
              <button
                onClick={() => setHeightUnit("ftin")}
                className={`px-3 py-1 text-xs rounded-md transition-colors ${heightUnit === "ftin" ? "bg-white dark:bg-gray-600 font-medium shadow-sm" : ""}`}
              >
                ft / in
              </button>
            </div>
          </div>
          {heightUnit === "cm" ? (
            <input
              type="number"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="Height in cm"
            />
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                value={heightFt}
                onChange={(e) => setHeightFt(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="ft"
              />
              <input
                type="number"
                value={heightIn}
                onChange={(e) => setHeightIn(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="in"
              />
            </div>
          )}
        </div>

        <button
          onClick={calculate}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-accent text-white rounded-lg hover:bg-accent-dark transition-colors font-medium"
        >
          <Activity className="w-4 h-4" /> Calculate BMI
        </button>

        {bmi !== null && cat && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-sm text-gray-500">Your BMI</div>
              <div className={`text-4xl font-bold ${cat.color}`}>{bmi}</div>
              <div className={`text-sm font-medium ${cat.color} mt-1`}>{cat.label}</div>
            </div>

            <div className="relative h-3 bg-gradient-to-r from-blue-500 via-green-500 via-yellow-500 to-red-600 rounded-full overflow-hidden">
              <div
                className="absolute top-0.5 w-0.5 h-2.5 bg-white rounded-full shadow-md transition-all"
                style={{ left: `${Math.min(Math.max(cat.position, 0), 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-gray-500 -mt-2">
              <span>18.5</span><span>25</span><span>30</span><span>35</span><span>40</span>
            </div>

            {range && (
              <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-center">
                <div className="text-xs text-gray-500">Healthy weight range for your height</div>
                <div className="text-lg font-bold mt-0.5">{range.min} kg – {range.max} kg</div>
              </div>
            )}
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
