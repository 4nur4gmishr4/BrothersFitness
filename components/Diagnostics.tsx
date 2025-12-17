"use client";
import { useState, useEffect } from "react";
import { Activity, Calculator, Dumbbell, Flame, Loader2 } from "lucide-react";
import { motion, AnimatePresence, useSpring, useTransform } from "framer-motion";

export default function Diagnostics() {
  const [activeTab, setActiveTab] = useState("bmi");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <section id="diagnostics" className="py-12 md:py-24 bg-gray-100 dark:bg-gym-black transition-colors duration-300 border-t border-black/10 dark:border-white/10">
      <div className="max-w-4xl mx-auto px-4 md:px-6">
        
        <div className="text-center mb-8 md:mb-12">
            <h3 className="text-2xl md:text-3xl font-black font-sans italic uppercase flex items-center justify-center gap-3 text-black dark:text-white">
                <Activity className="text-gym-red w-6 h-6 md:w-8 md:h-8" /> 
                System <span className="text-gym-red">Diagnostics</span>
            </h3>
            <p className="font-dot text-xs md:text-sm text-gray-500 mt-2 tracking-widest">CALIBRATE YOUR METRICS.</p>
        </div>

        <div className="flex flex-wrap justify-center gap-2 mb-6 md:mb-8">
            {[
                { id: "bmi", label: "BODY MASS", icon: <Calculator size={14} /> },
                { id: "tdee", label: "FUEL", icon: <Flame size={14} /> },
                { id: "1rm", label: "STRENGTH", icon: <Dumbbell size={14} /> }
            ].map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 md:flex-none px-4 py-3 font-dot font-bold text-[10px] md:text-xs uppercase tracking-widest flex items-center justify-center gap-2 border transition-all whitespace-nowrap rounded-sm
                        ${activeTab === tab.id 
                            ? "bg-gym-red text-white border-gym-red shadow-md" 
                            : "bg-transparent text-gray-500 border-gray-300 dark:border-white/20 hover:border-gym-red hover:text-gym-red"
                        }`}
                >
                    {tab.icon} {tab.label}
                </button>
            ))}
        </div>

        <div className="bg-white dark:bg-black/50 border border-gray-200 dark:border-white/10 p-6 md:p-8 rounded-sm min-h-[450px] relative overflow-hidden shadow-lg flex flex-col justify-center">
             <AnimatePresence mode="wait">
                {activeTab === "bmi" && <BMICalculator key="bmi" />}
                {activeTab === "tdee" && <TDEECalculator key="tdee" />}
                {activeTab === "1rm" && <OneRepMaxCalculator key="1rm" />}
             </AnimatePresence>
        </div>

      </div>
    </section>
  );
}

// --- ANIMATION COMPONENTS ---

function AnimatedNumber({ value, isFloat = false }: { value: number, isFloat?: boolean }) {
  const spring = useSpring(0, { mass: 0.8, stiffness: 75, damping: 15 });
  const display = useTransform(spring, (current) => current.toFixed(isFloat ? 1 : 0));

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return <motion.span>{display}</motion.span>;
}

function ProcessingOverlay({ text }: { text: string }) {
    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-white/90 dark:bg-black/90 z-20 flex flex-col items-center justify-center gap-4 backdrop-blur-sm"
        >
            <div className="relative">
                <div className="w-16 h-16 border-4 border-gym-red/20 border-t-gym-red rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <Activity size={20} className="text-gym-red animate-pulse" />
                </div>
            </div>
            <div className="font-dot text-xs font-bold tracking-[0.2em] text-gym-red animate-pulse">
                {text}
            </div>
        </motion.div>
    )
}

// --- CALCULATORS ---

function BMICalculator() {
    const [height, setHeight] = useState("");
    const [weight, setWeight] = useState("");
    const [result, setResult] = useState<number | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const calculate = () => {
        const h = parseFloat(height) / 100;
        const w = parseFloat(weight);
        if (h && w) {
            setIsProcessing(true);
            setResult(null);
            setTimeout(() => {
                setResult(parseFloat((w / (h * h)).toFixed(1)));
                setIsProcessing(false);
            }, 2000); // 2 Second Delay
        }
    };

    return (
        <motion.div initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} exit={{opacity:0, x:-20}} transition={{ duration: 0.3 }} className="space-y-6 relative h-full flex flex-col justify-center">
            <h4 className="text-xl font-black font-sans italic text-black dark:text-white">BMI // INDEX SCANNER</h4>
            
            <AnimatePresence>
                {isProcessing && <ProcessingOverlay key="proc" text="ANALYZING BIOMETRICS..." />}
            </AnimatePresence>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputGroup label="Height (cm)" value={height} onChange={setHeight} placeholder="175" disabled={isProcessing} />
                <InputGroup label="Weight (kg)" value={weight} onChange={setWeight} placeholder="70" disabled={isProcessing} />
            </div>
            <CalcButton onClick={calculate} disabled={isProcessing} />
            
            <AnimatePresence>
                {result !== null && !isProcessing && (
                    <ResultDisplay>
                        <div className="font-dot font-bold text-[10px] md:text-xs text-gray-500 uppercase tracking-widest mb-1">YOUR BMI SCORE</div>
                        <div className={`text-3xl md:text-4xl font-black font-sans ${result < 18.5 ? "text-blue-500" : result < 25 ? "text-green-500" : "text-gym-red"}`}>
                            <AnimatedNumber value={result} isFloat={true} />
                        </div>
                        <div className="font-dot text-[10px] text-gray-400 mt-1">
                            {result < 18.5 ? "UNDERWEIGHT" : result < 25 ? "NORMAL WEIGHT" : result < 30 ? "OVERWEIGHT" : "OBESE"}
                        </div>
                    </ResultDisplay>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

function TDEECalculator() {
    const [gender, setGender] = useState<"male" | "female">("male");
    const [weight, setWeight] = useState("");
    const [height, setHeight] = useState("");
    const [age, setAge] = useState("");
    const [activity, setActivity] = useState("1.2");
    const [result, setResult] = useState<number | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const calculate = () => {
        const w = parseFloat(weight);
        const h = parseFloat(height);
        const a = parseFloat(age);
        const act = parseFloat(activity);
        
        if (w && h && a) {
            setIsProcessing(true);
            setResult(null);
            setTimeout(() => {
                let bmr = (10 * w) + (6.25 * h) - (5 * a);
                bmr += gender === "male" ? 5 : -161;
                setResult(Math.round(bmr * act));
                setIsProcessing(false);
            }, 2000);
        }
    };

    return (
        <motion.div initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} exit={{opacity:0, x:-20}} transition={{ duration: 0.3 }} className="space-y-6 relative h-full flex flex-col justify-center">
            <h4 className="text-xl font-black font-sans italic text-black dark:text-white">CALORIES // TDEE PROTOCOL</h4>
            
            <AnimatePresence>
                {isProcessing && <ProcessingOverlay key="proc" text="CALCULATING EXPENDITURE..." />}
            </AnimatePresence>

            <div className="flex gap-4">
                <button onClick={() => setGender("male")} className={`flex-1 py-3 font-dot font-bold text-xs uppercase tracking-widest border transition-colors ${gender === "male" ? "bg-black text-white dark:bg-white dark:text-black border-transparent" : "text-gray-400 border-gray-300 dark:border-white/20 hover:text-gym-red"}`}>MALE</button>
                <button onClick={() => setGender("female")} className={`flex-1 py-3 font-dot font-bold text-xs uppercase tracking-widest border transition-colors ${gender === "female" ? "bg-black text-white dark:bg-white dark:text-black border-transparent" : "text-gray-400 border-gray-300 dark:border-white/20 hover:text-gym-red"}`}>FEMALE</button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <InputGroup label="Age" value={age} onChange={setAge} placeholder="25" disabled={isProcessing} />
                <InputGroup label="Weight (kg)" value={weight} onChange={setWeight} placeholder="75" disabled={isProcessing} />
                <InputGroup label="Height (cm)" value={height} onChange={setHeight} placeholder="180" disabled={isProcessing} />
            </div>

            <div className="flex flex-col gap-2">
                <label className="font-dot text-xs font-bold text-gray-500 uppercase tracking-widest">Activity Level</label>
                <select 
                    value={activity} 
                    onChange={(e) => setActivity(e.target.value)}
                    disabled={isProcessing}
                    className="p-3 bg-white dark:bg-black border border-gray-300 dark:border-white/20 font-sans text-sm focus:border-gym-red outline-none text-black dark:text-white w-full rounded-sm"
                >
                    <option value="1.2">Sedentary (Office Job)</option>
                    <option value="1.375">Light (Exercise 1-3 days)</option>
                    <option value="1.55">Moderate (Exercise 3-5 days)</option>
                    <option value="1.725">Active (Exercise 6-7 days)</option>
                    <option value="1.9">Athlete (2x Training)</option>
                </select>
            </div>
            
            <CalcButton onClick={calculate} disabled={isProcessing} />
            
            <AnimatePresence>
                {result !== null && !isProcessing && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <ResultDisplay>
                            <div className="font-dot font-bold text-[10px] md:text-xs text-gray-500 uppercase tracking-widest mb-1">MAINTENANCE</div>
                            <div className="text-3xl md:text-4xl font-black font-sans text-black dark:text-white">
                                <AnimatedNumber value={result} />
                            </div>
                            <div className="font-dot text-[10px] text-gray-400 mt-1">KCALS TO SUSTAIN</div>
                        </ResultDisplay>
                        <ResultDisplay>
                            <div className="font-dot font-bold text-[10px] md:text-xs text-gray-500 uppercase tracking-widest mb-1">GROWTH</div>
                            <div className="text-3xl md:text-4xl font-black font-sans text-gym-yellow">
                                <AnimatedNumber value={result + 400} />
                            </div>
                            <div className="font-dot text-[10px] text-gray-400 mt-1">KCALS TO BUILD</div>
                        </ResultDisplay>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

function OneRepMaxCalculator() {
    const [lift, setLift] = useState("");
    const [reps, setReps] = useState("");
    const [result, setResult] = useState<number | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const calculate = () => {
        const w = parseFloat(lift);
        const r = parseFloat(reps);
        if (w && r) {
            setIsProcessing(true);
            setResult(null);
            setTimeout(() => {
                setResult(Math.round(w * (1 + r / 30)));
                setIsProcessing(false);
            }, 2000);
        }
    };

    return (
        <motion.div initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} exit={{opacity:0, x:-20}} transition={{ duration: 0.3 }} className="space-y-6 relative h-full flex flex-col justify-center">
            <h4 className="text-xl font-black font-sans italic text-black dark:text-white">STRENGTH // 1RM ESTIMATOR</h4>
            
            <AnimatePresence>
                {isProcessing && <ProcessingOverlay key="proc" text="CALCULATING MAX POTENTIAL..." />}
            </AnimatePresence>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputGroup label="Weight Lifted (kg)" value={lift} onChange={setLift} placeholder="100" disabled={isProcessing} />
                <InputGroup label="Reps Performed" value={reps} onChange={setReps} placeholder="5" disabled={isProcessing} />
            </div>
            <CalcButton onClick={calculate} disabled={isProcessing} />
            
            <AnimatePresence>
                {result !== null && !isProcessing && (
                    <div className="space-y-4">
                        <ResultDisplay>
                             <div className="font-dot font-bold text-[10px] md:text-xs text-gray-500 uppercase tracking-widest mb-1">ESTIMATED 1RM</div>
                             <div className="text-3xl md:text-4xl font-black font-sans text-gym-red">
                                <AnimatedNumber value={result} />
                             </div>
                             <div className="font-dot text-[10px] text-gray-400 mt-1">KG MAX EFFORT</div>
                        </ResultDisplay>
                        
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="grid grid-cols-3 gap-2 text-center text-[10px] md:text-xs font-sans text-gray-500"
                        >
                            <div className="p-2 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-sm">
                                <div className="font-bold text-black dark:text-white">STRENGTH</div>
                                <div>{Math.round(result * 0.90)}kg</div>
                            </div>
                             <div className="p-2 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-sm">
                                <div className="font-bold text-black dark:text-white">HYPERTROPHY</div>
                                <div>{Math.round(result * 0.75)}kg</div>
                            </div>
                             <div className="p-2 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-sm">
                                <div className="font-bold text-black dark:text-white">ENDURANCE</div>
                                <div>{Math.round(result * 0.60)}kg</div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

const InputGroup = ({ label, value, onChange, placeholder, disabled }: any) => (
    <div className="flex flex-col gap-2">
        <label className="font-dot text-xs font-bold text-gray-500 uppercase tracking-widest">{label}</label>
        <input 
            type="number" 
            value={value} 
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            className="p-3 bg-white dark:bg-black border border-gray-300 dark:border-white/20 font-sans text-lg focus:border-gym-red outline-none transition-colors placeholder:text-gray-400 text-black dark:text-white w-full rounded-sm disabled:opacity-50"
        />
    </div>
);

const CalcButton = ({ onClick, disabled }: { onClick: () => void, disabled: boolean }) => (
    <button 
        onClick={onClick}
        disabled={disabled}
        className="w-full py-3 md:py-4 bg-black dark:bg-white text-white dark:text-black font-black font-dot tracking-widest uppercase hover:bg-gym-red dark:hover:bg-gym-red hover:text-white transition-colors text-sm md:text-sm rounded-sm shadow-lg active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
    >
        {disabled ? "PROCESSING..." : "Run_Calculation"}
    </button>
);

const ResultDisplay = ({ children }: { children: React.ReactNode }) => (
    <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ type: "spring", bounce: 0.4 }}
        className="p-4 border border-dashed border-gray-400 dark:border-white/20 text-center bg-gray-100 dark:bg-white/5 rounded-sm"
    >
        {children}
    </motion.div>
);