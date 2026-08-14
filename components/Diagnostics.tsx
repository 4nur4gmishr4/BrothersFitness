"use client";

import { useState, useRef } from "react";
import { Activity, Flame, Dumbbell } from "lucide-react";
import dynamic from "next/dynamic";
import CalculatorGears from "@/components/animations/CalculatorGears";
import ResultReveal from "@/components/animations/ResultReveal";
import SliderThumb from "@/components/animations/SliderThumb";
import RepProgressRing from "@/components/animations/RepProgressRing";

const ShareMissionReport = dynamic(() => import("./ShareMissionReport"), { ssr: false });

export default function Diagnostics() {
  const [activeTab, setActiveTab] = useState("bmi");

  return (
    <section id="diagnostics" className="surface-canvas py-16 md:py-24">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-12 md:mb-16" data-reveal>
          <p className="label-text text-accent mb-3">CALCULATE</p>
          <h2 className="heading-display text-4xl md:text-6xl mb-4 text-hi">
            CHECK YOUR <span className="text-accent">STATS</span>
          </h2>
          <p className="body-text text-mid">TRACK PROGRESS // STAY ACCOUNTABLE</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-12 justify-center">
          {[
            { id: "bmi", label: "BODY MASS", icon: <Activity className="w-5 h-5" /> },
            { id: "tdee", label: "CALORIE", icon: <Flame className="w-5 h-5" /> },
            { id: "1rm", label: "STRENGTH", icon: <Dumbbell className="w-5 h-5" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 label-text border transition-colors duration-fast ${
                activeTab === tab.id
                  ? "bg-accent text-white border-accent"
                  : "surface-card hairline text-mid hover:border-accent hover:text-accent"
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "bmi" && <BMICalculator />}
        {activeTab === "tdee" && <TDEECalculator />}
        {activeTab === "1rm" && <OneRepMaxCalculator />}
      </div>
    </section>
  );
}

function BMICalculator() {
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [result, setResult] = useState<number | null>(null);
  const [isComputing, setIsComputing] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  const calculate = async () => {
    const h = parseFloat(height) / 100;
    const w = parseFloat(weight);
    if (h && w) {
      setIsComputing(true);
      // Brief delay so the gears read as "computing"
      await new Promise((resolve) => setTimeout(resolve, 500));
      setResult(parseFloat((w / (h * h)).toFixed(1)));
      setIsComputing(false);
    }
  };

  return (
    <div className="surface-card hairline p-8 space-y-6">
      <h3 className="heading-display text-2xl text-hi">BMI // INDEX SCANNER</h3>

      <InputGroup label="Height (cm)" value={height} onChange={setHeight} placeholder="170" />
      <InputGroup label="Weight (kg)" value={weight} onChange={setWeight} placeholder="70" />

      <button onClick={calculate} disabled={isComputing} className="btn-primary w-full">
        {isComputing ? (
          <span className="inline-flex items-center justify-center gap-3">
            <CalculatorGears size={20} />
            <span>Computing...</span>
          </span>
        ) : (
          "Run_Calculation"
        )}
      </button>

      {result !== null && (
        <ResultReveal valueKey={result}>
          <div className="surface-elevated hairline p-8">
            <div className="text-center" ref={resultRef}>
            <p className="label-text text-mid mb-2">YOUR BMI SCORE</p>
            <p className="text-stat-lg font-display text-hi">{result}</p>
            <p className="heading-section text-lg font-bold text-accent mt-4">
              {result < 18.5
                ? "UNDERWEIGHT"
                : result < 25
                  ? "NORMAL WEIGHT"
                  : result < 30
                    ? "OVERWEIGHT"
                    : "OBESE"}
            </p>
          </div>
          <div className="flex justify-center mt-6">
            <ShareMissionReport targetRef={resultRef} filename="bmi-report" />
          </div>
          </div>
        </ResultReveal>
      )}
    </div>
  );
}

function TDEECalculator() {
  const [gender, setGender] = useState<"male" | "female">("male");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [age, setAge] = useState("");
  const [activity, setActivity] = useState("1.55");
  const [result, setResult] = useState<number | null>(null);
  const [isComputing, setIsComputing] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  const calculate = async () => {
    const w = parseFloat(weight);
    const h = parseFloat(height);
    const a = parseFloat(age);
    const act = parseFloat(activity);

    if (w && h && a) {
      setIsComputing(true);
      // Brief delay so the gears read as "computing"
      await new Promise((resolve) => setTimeout(resolve, 500));
      let bmr = 10 * w + 6.25 * h - 5 * a;
      bmr += gender === "male" ? 5 : -161;
      setResult(Math.round(bmr * act));
      setIsComputing(false);
    }
  };

  return (
    <div className="surface-card hairline p-8 space-y-6">
      <h3 className="heading-display text-2xl text-hi">CALORIE ESTIMATE</h3>

      <div className="flex gap-4">
        <button
          onClick={() => setGender("male")}
          className={`flex-1 py-3 label-text border transition-colors duration-fast ${
            gender === "male"
              ? "bg-accent text-white border-accent"
              : "surface-card hairline text-mid hover:border-accent"
          }`}
        >
          MALE
        </button>
        <button
          onClick={() => setGender("female")}
          className={`flex-1 py-3 label-text border transition-colors duration-fast ${
            gender === "female"
              ? "bg-accent text-white border-accent"
              : "surface-card hairline text-mid hover:border-accent"
          }`}
        >
          FEMALE
        </button>
      </div>

      <InputGroup label="Weight (kg)" value={weight} onChange={setWeight} placeholder="70" />
      <InputGroup label="Height (cm)" value={height} onChange={setHeight} placeholder="170" />
      <InputGroup label="Age" value={age} onChange={setAge} placeholder="25" />

      <div>
        <label className="label-text text-mid block mb-2">Activity Level</label>
        <select
          value={activity}
          onChange={(e) => setActivity(e.target.value)}
          className="input-field"
        >
          <option value="1.2">Sedentary (Office Job)</option>
          <option value="1.375">Light (Exercise 1-3 days)</option>
          <option value="1.55">Moderate (Exercise 3-5 days)</option>
          <option value="1.725">Active (Exercise 6-7 days)</option>
          <option value="1.9">Athlete (2x Training)</option>
        </select>
      </div>

      <button onClick={calculate} disabled={isComputing} className="btn-primary w-full">
        {isComputing ? (
          <span className="inline-flex items-center justify-center gap-3">
            <CalculatorGears size={20} />
            <span>Computing...</span>
          </span>
        ) : (
          "Run_Calculation"
        )}
      </button>

      {result !== null && (
        <ResultReveal valueKey={result}>
          <div className="surface-elevated hairline p-8" ref={resultRef}>
          <div className="space-y-6">
            {/* Maintenance Calories */}
            <div className="text-center p-6 surface-card hairline border-accent">
              <p className="label-text text-mid mb-2">Maintenance Calories</p>
              <p className="text-stat-lg font-display text-hi">{result}</p>
              <p className="label-text text-faint mt-2">KCALS/DAY TO MAINTAIN WEIGHT</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Weight Gain */}
              <div className="space-y-4">
                <h4 className="label-text text-status-success text-center">Weight Gain Calories</h4>
                <CalorieCard label="Mild Gain" value={result + 275} sublabel="+0.25 KG/WEEK" color="text-status-success" />
                <CalorieCard label="Weight Gain" value={result + 550} sublabel="+0.5 KG/WEEK" color="text-status-success" />
                <CalorieCard label="Aggressive Gain" value={result + 1100} sublabel="+1 KG/WEEK" color="text-accent" />
              </div>

              {/* Weight Loss */}
              <div className="space-y-4">
                <h4 className="label-text text-accent text-center">Weight Loss Calories</h4>
                <CalorieCard label="Mild Loss" value={result - 275} sublabel="-0.25 KG/WEEK" color="text-accent" />
                <CalorieCard label="Weight Loss" value={result - 550} sublabel="-0.5 KG/WEEK" color="text-accent" />
                <CalorieCard label="Aggressive Loss" value={result - 1100} sublabel="-1 KG/WEEK" color="text-status-danger" />
              </div>
            </div>

            <p className="text-xs text-low text-center">
              ⚠️ Aggressive weight changes should be monitored by a healthcare professional
            </p>
          </div>
          <div className="flex justify-center mt-6">
            <ShareMissionReport targetRef={resultRef} filename="tdee-report" />
          </div>
          </div>
        </ResultReveal>
      )}
    </div>
  );
}

function OneRepMaxCalculator() {
  const [lift, setLift] = useState("");
  const [reps, setReps] = useState(5);
  const [result, setResult] = useState<number | null>(null);
  const [isComputing, setIsComputing] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  const calculate = async () => {
    const w = parseFloat(lift);
    if (w) {
      setIsComputing(true);
      // Brief delay so the gears read as "computing"
      await new Promise((resolve) => setTimeout(resolve, 500));
      setResult(Math.round(w * (1 + reps / 30)));
      setIsComputing(false);
    }
  };

  return (
    <div className="surface-card hairline p-8 space-y-6">
      <h3 className="heading-display text-2xl text-hi">STRENGTH // 1RM ESTIMATOR</h3>

      <InputGroup label="Weight Lifted (kg)" value={lift} onChange={setLift} placeholder="100" />

      {/* Rep count via slider (req #13) + progress ring (req #11) */}
      <div className="space-y-3">
        <div className="flex items-center gap-5">
          <div className="flex-1">
            <SliderThumb value={reps} min={1} max={20} onChange={setReps} label="Reps Completed" />
          </div>
          <div className="pt-5">
            <RepProgressRing reps={reps} target={20} />
          </div>
        </div>
        <p className="text-xs text-faint font-mono uppercase tracking-widest">Reps drive the Epley estimate</p>
      </div>

      <button onClick={calculate} disabled={isComputing} className="btn-primary w-full">
        {isComputing ? (
          <span className="inline-flex items-center justify-center gap-3">
            <CalculatorGears size={20} />
            <span>Computing...</span>
          </span>
        ) : (
          "Run_Calculation"
        )}
      </button>

      {result !== null && (
        <ResultReveal valueKey={result}>
          <div className="surface-elevated hairline p-8" ref={resultRef}>
          <div className="text-center mb-6">
            <p className="label-text text-mid mb-2">ESTIMATED 1RM</p>
            <p className="text-stat-lg font-display text-accent">{result}kg</p>
            <p className="label-text text-faint mt-2">MAX EFFORT</p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="surface-card hairline p-4 text-center">
              <p className="label-text text-mid mb-1">STRENGTH</p>
              <p className="heading-section text-xl text-hi">{Math.round(result * 0.9)}kg</p>
            </div>
            <div className="surface-card hairline p-4 text-center">
              <p className="label-text text-mid mb-1">HYPERTROPHY</p>
              <p className="heading-section text-xl text-hi">{Math.round(result * 0.75)}kg</p>
            </div>
            <div className="surface-card hairline p-4 text-center">
              <p className="label-text text-mid mb-1">ENDURANCE</p>
              <p className="heading-section text-xl text-hi">{Math.round(result * 0.6)}kg</p>
            </div>
          </div>
          <div className="flex justify-center mt-6">
            <ShareMissionReport targetRef={resultRef} filename="1rm-report" />
          </div>
          </div>
        </ResultReveal>
      )}
    </div>
  );
}

function CalorieCard({
  label,
  value,
  sublabel,
  color,
}: {
  label: string;
  value: number;
  sublabel: string;
  color: string;
}) {
  return (
    <div className="text-center p-4 surface-card hairline">
      <p className={`label-text mb-2 ${color}`}>{label}</p>
      <p className={`heading-section text-3xl font-bold ${color}`}>{value}</p>
      <p className="label-text text-faint mt-1">{sublabel}</p>
    </div>
  );
}

function InputGroup({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div>
      <label className="label-text text-mid block mb-2">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="input-field"
      />
    </div>
  );
}
