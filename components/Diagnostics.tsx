"use client";

import { useState, useEffect, useRef } from "react";
import { Activity, Flame, Dumbbell } from "lucide-react";
import { motion, AnimatePresence, useSpring, useTransform } from "framer-motion";
import dynamic from "next/dynamic";

const ShareMissionReport = dynamic(() => import("./ShareMissionReport"), { ssr: false });

export default function Diagnostics() {
  const [activeTab, setActiveTab] = useState("bmi");

  return (
    <section id="diagnostics" className="min-h-screen bg-black py-12 md:py-20">
      <div className="max-w-4xl mx-auto px-4">
        <motion.div
          className="text-center mb-8 md:mb-10"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-6xl font-black uppercase mb-4 font-sans">
            CALIBRATE YOUR METRICS
          </h2>
          <p className="text-lg text-gray-400 font-dot">
            ANALYZE PERFORMANCE // OPTIMIZE RESULTS
          </p>
        </motion.div>

        <div className="flex gap-2 md:gap-4 mb-8 overflow-x-auto">
          {[
            { id: "bmi", label: "BODY MASS", icon: <Activity className="w-4 h-4" /> },
            { id: "tdee", label: "CALORIE", icon: <Flame className="w-4 h-4" /> },
            { id: "1rm", label: "STRENGTH", icon: <Dumbbell className="w-4 h-4" /> }
          ].map((tab) => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 md:flex-none px-4 py-3 font-dot font-bold text-[10px] md:text-xs uppercase tracking-widest flex items-center justify-center gap-2 border transition-all whitespace-nowrap rounded-sm
                ${activeTab === tab.id
                  ? "bg-gym-red text-white border-gym-red shadow-md"
                  : "bg-transparent text-gray-500 border-white/20 hover:border-gym-red hover:text-gym-red"
                }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {tab.icon} {tab.label}
            </motion.button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "bmi" && <BMICalculator key="bmi" />}
          {activeTab === "tdee" && <TDEECalculator key="tdee" />}
          {activeTab === "1rm" && <OneRepMaxCalculator key="1rm" />}
        </AnimatePresence>
      </div>
    </section>
  );
}

function AnimatedNumber({ value, isFloat = false }: { value: number; isFloat?: boolean }) {
  const spring = useSpring(0, { mass: 0.8, stiffness: 75, damping: 15 });
  const display = useTransform(spring, (current) => current.toFixed(isFloat ? 1 : 0));

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return <motion.span>{display}</motion.span>;
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="border border-white/20 p-4 md:p-7 space-y-5"
    >
      <h3 className="text-xl md:text-2xl font-black font-sans uppercase">BMI // INDEX SCANNER</h3>

      <InputGroup label="Height (cm)" value={height} onChange={setHeight} placeholder="170" />
      <InputGroup label="Weight (kg)" value={weight} onChange={setWeight} placeholder="70" />

      <CalcButton onClick={calculate} />

      {result !== null && (
        <ResultDisplay>
          <div className="text-center" ref={resultRef}>
            <p className="text-xs font-dot uppercase tracking-widest text-gray-500 mb-2">
              YOUR BMI SCORE
            </p>
            <p className="text-6xl font-black font-sans">
              <AnimatedNumber value={result} isFloat />
            </p>
            <motion.p
              className="text-lg font-bold text-gym-red mt-4"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              {result < 18.5 ? "UNDERWEIGHT" : result < 25 ? "NORMAL WEIGHT" : result < 30 ? "OVERWEIGHT" : "OBESE"}
            </motion.p>
          </div>
          <div className="flex justify-center">
            <ShareMissionReport targetRef={resultRef} filename="bmi-report" />
          </div>
        </ResultDisplay>
      )}
    </motion.div>
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
      let bmr = (10 * w) + (6.25 * h) - (5 * a);
      bmr += gender === "male" ? 5 : -161;
      setResult(Math.round(bmr * act));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="border border-white/20 p-5 md:p-7 space-y-5"
    >
      <h3 className="text-2xl font-black font-sans uppercase">CALORIES // TDEE PROTOCOL</h3>

      <div className="flex gap-4">
        <motion.button
          onClick={() => setGender("male")}
          className={`flex-1 py-3 font-dot font-bold text-xs uppercase tracking-widest border transition-colors ${gender === "male"
            ? "bg-white text-black border-transparent"
            : "text-gray-400 border-white/20 hover:text-gym-red"
            }`}
          whileTap={{ scale: 0.95 }}
        >
          MALE
        </motion.button>
        <motion.button
          onClick={() => setGender("female")}
          className={`flex-1 py-3 font-dot font-bold text-xs uppercase tracking-widest border transition-colors ${gender === "female"
            ? "bg-white text-black border-transparent"
            : "text-gray-400 border-white/20 hover:text-gym-red"
            }`}
          whileTap={{ scale: 0.95 }}
        >
          FEMALE
        </motion.button>
      </div>

      <InputGroup label="Weight (kg)" value={weight} onChange={setWeight} placeholder="70" />
      <InputGroup label="Height (cm)" value={height} onChange={setHeight} placeholder="170" />
      <InputGroup label="Age" value={age} onChange={setAge} placeholder="25" />

      <div>
        <label className="block text-xs font-dot font-bold mb-2 uppercase tracking-widest">Activity Level</label>
        <select
          value={activity}
          onChange={(e) => setActivity(e.target.value)}
          className="p-3 bg-black border border-white/20 font-sans text-sm focus:border-gym-red focus:ring-2 focus:ring-gym-red/20 outline-none text-white w-full rounded-sm transition-all"
        >
          <option value="1.2">Sedentary (Office Job)</option>
          <option value="1.375">Light (Exercise 1-3 days)</option>
          <option value="1.55">Moderate (Exercise 3-5 days)</option>
          <option value="1.725">Active (Exercise 6-7 days)</option>
          <option value="1.9">Athlete (2x Training)</option>
        </select>
      </div>

      <CalcButton onClick={calculate} />

      {result !== null && (
        <ResultDisplay>
          <div className="space-y-6" ref={resultRef}>
            {/* Maintenance Calories - Center Top */}
            <motion.div
              className="text-center p-6 bg-white/5 border-2 border-white/20 rounded-sm"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
            >
              <p className="text-xs font-dot uppercase tracking-widest text-gray-500 mb-2">
                Maintenance Calories
              </p>
              <p className="text-5xl font-black font-sans">
                <AnimatedNumber value={result} />
              </p>
              <p className="text-xs text-gray-400 mt-2">KCALS/DAY TO MAINTAIN WEIGHT</p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Left Column - Weight Gain */}
              <div className="space-y-4">
                <h4 className="text-sm font-dot font-bold uppercase tracking-widest text-green-400 text-center">
                  Weight Gain Calories
                </h4>

                {/* Mild Weight Gain */}
                <motion.div
                  className="text-center p-4 bg-white/5 border border-green-500/20 rounded-sm"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <p className="text-xs font-dot uppercase tracking-widest text-green-400 mb-2">
                    Mild Gain
                  </p>
                  <p className="text-3xl font-black font-sans text-green-400">
                    <AnimatedNumber value={result + 275} />
                  </p>
                  <p className="text-xs text-gray-400 mt-1">+0.25 KG/WEEK</p>
                </motion.div>

                {/* Weight Gain */}
                <motion.div
                  className="text-center p-4 bg-white/5 border border-green-400/30 rounded-sm"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 }}
                >
                  <p className="text-xs font-dot uppercase tracking-widest text-green-300 mb-2">
                    Weight Gain
                  </p>
                  <p className="text-3xl font-black font-sans text-green-300">
                    <AnimatedNumber value={result + 550} />
                  </p>
                  <p className="text-xs text-gray-400 mt-1">+0.5 KG/WEEK</p>
                </motion.div>

                {/* Extreme Weight Gain */}
                <motion.div
                  className="text-center p-4 bg-white/5 border border-gym-red/50 rounded-sm"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <p className="text-xs font-dot uppercase tracking-widest text-gym-red mb-2">
                    Extreme Gain
                  </p>
                  <p className="text-3xl font-black font-sans text-gym-red">
                    <AnimatedNumber value={result + 1100} />
                  </p>
                  <p className="text-xs text-gray-400 mt-1">+1 KG/WEEK</p>
                </motion.div>
              </div>

              {/* Right Column - Weight Loss */}
              <div className="space-y-4">
                <h4 className="text-sm font-dot font-bold uppercase tracking-widest text-gym-red text-center">
                  Weight Loss Calories
                </h4>

                {/* Mild Weight Loss */}
                <motion.div
                  className="text-center p-4 bg-white/5 border border-gym-red/20 rounded-sm"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <p className="text-xs font-dot uppercase tracking-widest text-gym-red mb-2">
                    Mild Loss
                  </p>
                  <p className="text-3xl font-black font-sans text-gym-red">
                    <AnimatedNumber value={result - 275} />
                  </p>
                  <p className="text-xs text-gray-400 mt-1">-0.25 KG/WEEK</p>
                </motion.div>

                {/* Weight Loss */}
                <motion.div
                  className="text-center p-4 bg-white/5 border border-gym-red/30 rounded-sm"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 }}
                >
                  <p className="text-xs font-dot uppercase tracking-widest text-gym-red/90 mb-2">
                    Weight Loss
                  </p>
                  <p className="text-3xl font-black font-sans text-gym-red/90">
                    <AnimatedNumber value={result - 550} />
                  </p>
                  <p className="text-xs text-gray-400 mt-1">-0.5 KG/WEEK</p>
                </motion.div>

                {/* Extreme Weight Loss */}
                <motion.div
                  className="text-center p-4 bg-white/5 border border-gym-red/50 rounded-sm"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <p className="text-xs font-dot uppercase tracking-widest text-gym-red/80 mb-2">
                    Extreme Loss
                  </p>
                  <p className="text-3xl font-black font-sans text-gym-red/80">
                    <AnimatedNumber value={result - 1100} />
                  </p>
                  <p className="text-xs text-gray-400 mt-1">-1 KG/WEEK</p>
                </motion.div>
              </div>
            </div>

            <div className="mt-6 text-center">
              <p className="text-xs text-gray-400 italic">
                ⚠️ Extreme weight changes should be monitored by a healthcare professional
              </p>
            </div>
          </div>
          <div className="flex justify-center">
            <ShareMissionReport targetRef={resultRef} filename="tdee-report" />
          </div>
        </ResultDisplay>
      )}
    </motion.div>
  );
}

function OneRepMaxCalculator() {
  const [lift, setLift] = useState("");
  const [reps, setReps] = useState("");
  const [result, setResult] = useState<number | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const calculate = () => {
    const w = parseFloat(lift);
    const r = parseFloat(reps);
    if (w && r) {
      setResult(Math.round(w * (1 + r / 30)));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="border border-white/20 p-5 md:p-7 space-y-5"
    >
      <h3 className="text-2xl font-black font-sans uppercase">STRENGTH // 1RM ESTIMATOR</h3>

      <InputGroup label="Weight Lifted (kg)" value={lift} onChange={setLift} placeholder="100" />
      <InputGroup label="Reps Completed" value={reps} onChange={setReps} placeholder="5" />

      <CalcButton onClick={calculate} />

      {result !== null && (
        <ResultDisplay>
          <div ref={resultRef}>
            <div className="text-center mb-6">
              <p className="text-xs font-dot uppercase tracking-widest text-gray-500 mb-2">
                ESTIMATED 1RM
              </p>
              <p className="text-6xl font-black font-sans text-gym-red">
                <AnimatedNumber value={result} />kg
              </p>
              <p className="text-sm text-gray-400 mt-2">MAX EFFORT</p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-xs font-dot uppercase mb-2">STRENGTH</p>
                <p className="text-2xl font-bold">{Math.round(result * 0.90)}kg</p>
              </div>
              <div className="text-center">
                <p className="text-xs font-dot uppercase mb-2">HYPERTROPHY</p>
                <p className="text-2xl font-bold">{Math.round(result * 0.75)}kg</p>
              </div>
              <div className="text-center">
                <p className="text-xs font-dot uppercase mb-2">ENDURANCE</p>
                <p className="text-2xl font-bold">{Math.round(result * 0.60)}kg</p>
              </div>
            </div>
          </div>
          <div className="flex justify-center">
            <ShareMissionReport targetRef={resultRef} filename="1rm-report" />
          </div>
        </ResultDisplay>
      )}
    </motion.div>
  );
}

const InputGroup = ({ label, value, onChange, placeholder }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) => (
  <motion.div whileFocus={{ scale: 1.01 }}>
    <label className="block text-xs font-dot font-bold mb-2 uppercase tracking-widest">
      {label}
    </label>
    <motion.input
      type="number"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="p-3 bg-black border border-white/20 font-sans text-lg focus:border-gym-red focus:ring-2 focus:ring-gym-red/20 outline-none transition-all placeholder:text-gray-400 text-white w-full rounded-sm"
      whileFocus={{ boxShadow: "0 0 0 3px rgba(215, 25, 33, 0.1)" }}
    />
  </motion.div>
);

const CalcButton = ({ onClick }: { onClick: () => void }) => {
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setRipples([...ripples, { id: Date.now(), x, y }]);
    setTimeout(() => setRipples((r) => r.slice(1)), 600);
    onClick();
  };

  return (
    <motion.button
      onClick={handleClick}
      className="w-full bg-gym-red text-white font-dot font-bold py-4 px-8 text-sm uppercase tracking-widest hover:bg-white hover:text-black transition-colors relative overflow-hidden"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="absolute w-2 h-2 bg-white rounded-full ripple"
          style={{ left: ripple.x, top: ripple.y }}
        />
      ))}
      Run_Calculation
    </motion.button>
  );
};

const ResultDisplay = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="bg-white/5 border border-white/10 p-6 md:p-8"
  >
    {children}
  </motion.div>
);

