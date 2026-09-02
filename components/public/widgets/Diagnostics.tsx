"use client";

import { useState, useRef } from "react";
import { Activity, Flame, Dumbbell } from "lucide-react";
import dynamic from "next/dynamic";
import ResultReveal from "@/components/ui/animations/ResultReveal";
import SliderThumb from "@/components/ui/animations/SliderThumb";
import RepProgressRing from "@/components/ui/animations/RepProgressRing";

const ShareMissionReport = dynamic(() => import("@/components/features/gamification/ShareMissionReport"), { ssr: false });

export default function Diagnostics() {
  const [activeTab, setActiveTab] = useState("bmi");

  return (
    <section id="diagnostics" className="surface-canvas pt-20 sm:pt-24 pb-16 md:py-24">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-8 md:px-12 lg:px-16">
        {/* Top Display Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 md:mb-14 gap-6 pb-8 border-b border-surface-border/70">
          <div>
            <span className="text-xs uppercase tracking-widest text-accent mb-2 block font-semibold">
              FITNESS TOOLS &amp; CALCULATORS
            </span>
            <h1 className="heading-display text-4xl sm:text-6xl md:text-7xl text-hi leading-[0.95] tracking-tight uppercase">
              FITNESS <span className="text-accent">CALCULATORS</span>
            </h1>
          </div>

          <div className="text-left md:text-right border-l-2 md:border-l-0 md:border-r-2 border-surface-border pl-4 md:pl-0 md:pr-4">
            <p className="text-sm font-medium text-hi">Easy Body Calculators</p>
            <p className="text-xs text-mid">Check your BMI, daily calorie needs &amp; lift strength</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-3 mb-12 justify-center">
          {[
            { id: "bmi", label: "BMI", icon: <Activity className="w-4 h-4" /> },
            { id: "tdee", label: "Daily Calories", icon: <Flame className="w-4 h-4" /> },
            { id: "1rm", label: "Max Strength", icon: <Dumbbell className="w-4 h-4" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold border transition-all duration-fast shadow-xs ${
                activeTab === tab.id
                  ? "bg-accent text-white border-accent shadow-sm"
                  : "surface-card border-surface-border text-mid hover:border-accent hover:text-hi"
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
  const resultRef = useRef<HTMLDivElement>(null);

  const calculate = () => {
    const h = parseFloat(height) / 100;
    const w = parseFloat(weight);
    if (h && w) {
      setResult(parseFloat((w / (h * h)).toFixed(1)));
    }
  };

  return (
    <div className="surface-card hairline p-8 space-y-6">
      <h3 className="heading-display text-2xl text-hi">BODY MASS INDEX (BMI)</h3>

      <InputGroup label="Height (cm)" value={height} onChange={setHeight} placeholder="170" />
      <InputGroup label="Weight (kg)" value={weight} onChange={setWeight} placeholder="70" />

      <button onClick={calculate} className="btn-primary w-full">
        Calculate BMI
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
  const resultRef = useRef<HTMLDivElement>(null);

  const calculate = () => {
    const w = parseFloat(weight);
    const h = parseFloat(height);
    const a = parseFloat(age);
    const act = parseFloat(activity);

    if (w && h && a) {
      let bmr = 10 * w + 6.25 * h - 5 * a;
      bmr += gender === "male" ? 5 : -161;
      setResult(Math.round(bmr * act));
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

      <button onClick={calculate} className="btn-primary w-full">
        Calculate TDEE
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

            {/* Split Goals */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <CalorieCard
                label="Weight Loss"
                value={result - 500}
                sublabel="-0.5 kg / week"
                color="text-accent"
              />
              <CalorieCard
                label="Maintenance"
                value={result}
                sublabel="Current Weight"
                color="text-hi"
              />
              <CalorieCard
                label="Muscle Gain"
                value={result + 300}
                sublabel="+0.25 kg / week"
                color="text-hi"
              />
            </div>
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
  const resultRef = useRef<HTMLDivElement>(null);

  const calculate = () => {
    const w = parseFloat(lift);
    if (w) {
      setResult(Math.round(w * (1 + reps / 30)));
    }
  };

  return (
    <div className="surface-card hairline p-8 space-y-6">
      <h3 className="heading-display text-2xl text-hi">ONE-REP MAX (1RM) ESTIMATOR</h3>

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
        <p className="text-xs text-faint uppercase tracking-wider font-medium">Reps drive the strength estimate</p>
      </div>

      <button onClick={calculate} className="btn-primary w-full">
        Calculate 1RM
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
