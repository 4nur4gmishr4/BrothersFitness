"use client";

import { useState, useEffect, Suspense, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, RefreshCw, Cpu, ShoppingCart, Utensils, IndianRupee, Globe, Home, Store, Calculator } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import MissionDirective from "@/components/MissionDirective";
import Navbar from "@/components/Navbar";

// Types for our API response
type LocalizedText = { en: string; hi: string };

type DietPlan = {
    tactical_brief: LocalizedText;
    user_inputs_summary?: {
        gender: string;
        age: string;
        height: string;
        current_weight: string;
        target_weight: string;
        activity_level: string;
        diet_type: string;
        budget: string;
        mode: string;
        weight_change_rate?: string;
        calorie_adjustment?: string;
    };
    shopping_list: {
        total_estimated_cost: number;
        duration_days?: number;
        average_daily_cost?: number;
        items: {
            name: LocalizedText;
            quantity: LocalizedText;
            category: "Home_Essentials" | "Market_Purchase";
            duration_days: number;
            price_inr: number;
        }[];
    };
    transformation_timeline?: {
        estimated_duration: string;
        weekly_change: string;
        daily_calories: number;
        total_days?: number;
        total_weeks?: number;
    };
    meal_plan: {
        name: LocalizedText;
        timing?: string;
        calories: number;
        protein: number;
        carbs: number;
        fats: number;
        fiber?: number;
        sugar?: number;
        recipe?: LocalizedText;
        ingredients?: { name: LocalizedText; quantity: string }[];
        description: LocalizedText;
    }[];
};

const CountdownTimer = ({ duration, onComplete }: { duration: number; onComplete?: () => void }) => {
    const [timeLeft, setTimeLeft] = useState(duration);

    useEffect(() => {
        if (timeLeft <= 0) {
            onComplete?.();
            return;
        }
        const timerId = setInterval(() => {
            setTimeLeft((prev) => prev - 1);
        }, 1000);
        return () => clearInterval(timerId);
    }, [timeLeft, onComplete]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, "0");
        const s = (seconds % 60).toString().padStart(2, "0");
        return `${m}:${s}`;
    };

    return (
        <div className="font-mono text-4xl font-black text-gym-red tabular-nums tracking-widest">
            {formatTime(timeLeft)}
        </div>
    );
};

const LoadingStatus = () => {
    const [index, setIndex] = useState(0);
    const messages = [
        "CALCULATING OPTIMAL MACRO DISTRIBUTION...",
        "ANALYZING MARKET PRICES (INR)...",
        "TRANSLATING TO HINDI...",
        "CATEGORIZING HOME ESSENTIALS...",
        "FINALIZING TACTICAL BRIEF..."
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setIndex((prev) => (prev + 1) % messages.length);
        }, 3000);
        return () => clearInterval(interval);
    }, [messages.length]);

    return (
        <p className="font-dot text-xs text-green-500 uppercase tracking-widest min-h-[1.5em]">
            {messages[index]}
        </p>
    );
};

function FuelSynthesizerContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const missionRef = useRef<HTMLDivElement>(null);

    const [calories] = useState(searchParams.get("calories") || "");
    const [mode] = useState(searchParams.get("mode") || "bulk");
    const [dietType, setDietType] = useState("Everything");
    const [budget, setBudget] = useState("Standard");
    const [lang, setLang] = useState<"en" | "hi">("en");

    // New Biometric States - Initialized to empty strings for placeholders
    const [currentWeight, setCurrentWeight] = useState("");
    const [targetWeight, setTargetWeight] = useState("");
    const [age, setAge] = useState("");
    const [height, setHeight] = useState("");
    const [gender, setGender] = useState("Male");
    const [activityLevel, setActivityLevel] = useState("Moderate (Exercise 3-5 days)");
    const [weightChangeRate, setWeightChangeRate] = useState("0.5"); // kg per week
    const [calculatedCalories, setCalculatedCalories] = useState<number | null>(null);

    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<DietPlan | null>(null);
    const [error, setError] = useState("");
    const [pdfLoading, setPdfLoading] = useState(false);
    const [timelineUnit, setTimelineUnit] = useState<"days" | "weeks" | "months" | "years">("weeks");

    // Activity level multiplier mapping
    const getActivityMultiplier = (level: string): number => {
        const mapping: { [key: string]: number } = {
            "Sedentary (Office Job)": 1.2,
            "Light (Exercise 1-3 days)": 1.375,
            "Moderate (Exercise 3-5 days)": 1.55,
            "Active (Exercise 6-7 days)": 1.725,
            "Athlete (2x Training)": 1.9
        };
        return mapping[level] || 1.55;
    };

    // Calculate TDEE using Mifflin-St Jeor equation (same as Diagnostics.tsx)
    const calculateTDEE = useCallback((): number | null => {
        const w = parseFloat(currentWeight);
        const h = parseFloat(height);
        const a = parseFloat(age);
        const act = getActivityMultiplier(activityLevel);

        if (isNaN(w) || isNaN(h) || isNaN(a) || w <= 0 || h <= 0 || a <= 0) {
            return null;
        }

        // BMR calculation
        let bmr = (10 * w) + (6.25 * h) - (5 * a);
        bmr += gender === "Male" ? 5 : -161;

        // TDEE = BMR * Activity Multiplier
        return Math.round(bmr * act);
    }, [currentWeight, height, age, gender, activityLevel]);

    // Calculate target calories based on weight goal
    const calculateTargetCalories = useCallback((): number | null => {
        const tdee = calculateTDEE();
        if (tdee === null) return null;

        const current = parseFloat(currentWeight);
        const target = parseFloat(targetWeight);
        const rate = parseFloat(weightChangeRate);

        if (isNaN(current) || isNaN(target) || isNaN(rate)) {
            return null;
        }

        // Calorie adjustment based on rate (1 kg fat ≈ 7700 calories, weekly deficit/surplus)
        // 0.25 kg/week = 275 cal/day, 0.5 kg/week = 550 cal/day, 1 kg/week = 1100 cal/day
        const calorieAdjustment = rate * 1100;

        // Determine if weight loss or weight gain
        if (target < current) {
            // Weight loss - calorie deficit
            return Math.round(tdee - calorieAdjustment);
        } else if (target > current) {
            // Weight gain - calorie surplus
            return Math.round(tdee + calorieAdjustment);
        } else {
            // Maintenance
            return tdee;
        }
    }, [calculateTDEE, currentWeight, targetWeight, weightChangeRate]);

    // Manual calculation handler
    const handleCalculateCalories = useCallback(() => {
        const targetCals = calculateTargetCalories();
        setCalculatedCalories(targetCals);
    }, [calculateTargetCalories]);

    // Auto-calculate on input change IF already calculated once
    useEffect(() => {
        if (calculatedCalories !== null) {
            handleCalculateCalories();
        }
    }, [currentWeight, targetWeight, age, height, gender, activityLevel, weightChangeRate, calculatedCalories, handleCalculateCalories]);

    // Comprehensive validation function
    const validateInputs = (): { valid: boolean; error: string } => {
        // Check if fields are empty
        if (!currentWeight || currentWeight.trim() === "") {
            return { valid: false, error: "INVALID INPUT: Current Weight is required" };
        }
        if (!targetWeight || targetWeight.trim() === "") {
            return { valid: false, error: "INVALID INPUT: Target Weight is required" };
        }
        if (!age || age.trim() === "") {
            return { valid: false, error: "INVALID INPUT: Age is required" };
        }
        if (!height || height.trim() === "") {
            return { valid: false, error: "INVALID INPUT: Height is required" };
        }

        // Validate numeric ranges
        const weightNum = parseFloat(currentWeight);
        const targetWeightNum = parseFloat(targetWeight);
        const ageNum = parseFloat(age);
        const heightNum = parseFloat(height);
        const caloriesNum = parseFloat(calories);

        if (isNaN(weightNum) || weightNum <= 0 || weightNum > 500) {
            return { valid: false, error: "INVALID INPUT: Current Weight must be between 1-500 kg" };
        }
        if (isNaN(targetWeightNum) || targetWeightNum <= 0 || targetWeightNum > 500) {
            return { valid: false, error: "INVALID INPUT: Target Weight must be between 1-500 kg" };
        }
        if (isNaN(ageNum) || ageNum < 10 || ageNum > 150) {
            return { valid: false, error: "INVALID INPUT: Age must be between 10-150 years" };
        }
        if (isNaN(heightNum) || heightNum < 50 || heightNum > 300) {
            return { valid: false, error: "INVALID INPUT: Height must be between 50-300 cm" };
        }
        // Calories is optional but if provided, must be valid
        if (calories && calories.trim() !== "" && (isNaN(caloriesNum) || caloriesNum < 1000 || caloriesNum > 10000)) {
            return { valid: false, error: "INVALID INPUT: Calories must be between 1000-10000" };
        }

        return { valid: true, error: "" };
    };

    const generateProtocol = async () => {
        // Comprehensive validation check
        const validation = validateInputs();
        if (!validation.valid) {
            setError(validation.error);
            return;
        }

        // Input Validation (redundant numeric validation kept for safety)
        const weightNum = parseFloat(currentWeight);
        const targetWeightNum = parseFloat(targetWeight);
        const ageNum = parseFloat(age);
        const heightNum = parseFloat(height);

        if (isNaN(weightNum) || weightNum <= 0 || weightNum > 500) {
            setError("INVALID INPUT: Current Weight must be between 1-500 kg");
            return;
        }
        if (isNaN(targetWeightNum) || targetWeightNum <= 0 || targetWeightNum > 500) {
            setError("INVALID INPUT: Target Weight must be between 1-500 kg");
            return;
        }
        if (isNaN(ageNum) || ageNum < 10 || ageNum > 150) {
            setError("INVALID INPUT: Age must be between 10-150 years");
            return;
        }
        if (isNaN(heightNum) || heightNum < 50 || heightNum > 300) {
            setError("INVALID INPUT: Height must be between 50-300 cm");
            return;
        }

        setLoading(true);
        setError("");
        setData(null);

        // Create AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 90000); // 90 second timeout

        try {
            const res = await fetch("/api/generate-diet", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    calories: calculatedCalories?.toString() || calories,
                    mode,
                    dietType,
                    budget,
                    currentWeight,
                    targetWeight,
                    age,
                    height,
                    gender,
                    activityLevel,
                    weightChangeRate,
                    goal_description: `I want to ${mode === "bulk" ? "gain muscle mass" : "shred fat"} effectively at ${weightChangeRate} kg/week.`
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!res.ok) throw new Error("Synthesis Failed");

            const result = await res.json();

            // Validate critical fields exist
            if (!result.tactical_brief || !result.shopping_list || !result.meal_plan) {
                throw new Error("Malformed AI Response");
            }

            setData(result);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            if (message.includes('abort') || (err instanceof Error && err.name === 'AbortError')) {
                setError("TIMEOUT: AI UPLINK TOOK TOO LONG (>90s). RETRY ADVISED.");
            } else {
                setError("SYSTEM FAILURE: CONNECTION SEVERED");
            }
        } finally {
            clearTimeout(timeoutId);
            setLoading(false);
        }
    };

    const downloadPDF = async () => {
        if (!missionRef.current) return;

        setPdfLoading(true);
        // REMOVED: Direct DOM manipulation (btn.innerText) - using React state instead

        try {
            const canvas = await html2canvas(missionRef.current, {
                scale: 2, // Higher resolution
                useCORS: true,
                backgroundColor: "#ffffff"
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = pdfWidth;
            const imgHeight = (canvas.height * pdfWidth) / canvas.width;

            let heightLeft = imgHeight;
            let position = 0;

            // Add first page
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pdfHeight;

            // Add additional pages if content overflows
            while (heightLeft > 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pdfHeight;
            }

            pdf.save(`BroFit_Mission_Directive_${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (err) {
            console.error("PDF Fail:", err);
            alert("Tactical Printer Jammed. Please retry.");
        } finally {
            setPdfLoading(false);
        }
    };

    // Auto-clear input on focus
    const handleInputFocus = (dispatcher: React.Dispatch<React.SetStateAction<string>>) => {
        dispatcher("");
    };

    return (
        <div className="min-h-screen bg-black text-white font-sans relative">
            <Navbar />
            <div className="p-4 md:p-8 pt-4">
                {/* Header */}
                <motion.div
                    className="max-w-4xl mx-auto flex justify-between items-center mb-12 border-b border-white/20 pb-6"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.back()}
                            className="flex items-center gap-2 text-gray-400 hover:text-gym-red transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            <span className="font-dot text-[10px] uppercase tracking-widest hidden sm:inline">Back</span>
                        </button>
                    </div>
                    <div className="text-right">
                        <h1 className="text-2xl font-black uppercase tracking-tighter">Fuel / Diet Generator</h1>
                        <p className="text-xs font-dot text-gray-500 uppercase tracking-widest">Your Details</p>
                    </div>
                </motion.div>

                <div className="max-w-4xl mx-auto pb-20">
                    {/* Input Confirm Section */}
                    {!data && !loading && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="border border-white/20 p-8 space-y-8 bg-white/5 backdrop-blur-sm"
                        >
                            <h3 className="text-gym-red font-dot text-sm uppercase tracking-widest mb-4 border-b border-white/10 pb-2">Your Body Info</h3>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-[10px] font-dot text-gray-500 uppercase tracking-widest mb-2">Gender</label>
                                    <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full bg-black border border-white/20 p-2 font-bold text-white focus:border-gym-red focus:outline-none">
                                        <option>Male</option>
                                        <option>Female</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-dot text-gray-500 uppercase tracking-widest mb-2">Age <span className="text-gym-red">*</span></label>
                                    <input type="number" value={age} onFocus={() => handleInputFocus(setAge)} onChange={(e) => setAge(e.target.value)} placeholder="25" className="w-full bg-black border border-white/20 p-2 font-bold focus:border-gym-red focus:outline-none placeholder:text-gray-700" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-dot text-gray-500 uppercase tracking-widest mb-2">Height (cm) <span className="text-gym-red">*</span></label>
                                    <input type="number" value={height} onFocus={() => handleInputFocus(setHeight)} onChange={(e) => setHeight(e.target.value)} placeholder="175" className="w-full bg-black border border-white/20 p-2 font-bold focus:border-gym-red focus:outline-none placeholder:text-gray-700" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-dot text-gray-500 uppercase tracking-widest mb-2">Current Weight (kg) <span className="text-gym-red">*</span></label>
                                    <input type="number" value={currentWeight} onFocus={() => handleInputFocus(setCurrentWeight)} onChange={(e) => setCurrentWeight(e.target.value)} placeholder="70" className="w-full bg-black border border-white/20 p-2 font-bold focus:border-gym-red focus:outline-none placeholder:text-gray-700" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-dot text-gray-500 uppercase tracking-widest mb-2">Target Weight (kg) <span className="text-gym-red">*</span></label>
                                    <input type="number" value={targetWeight} onFocus={() => handleInputFocus(setTargetWeight)} onChange={(e) => setTargetWeight(e.target.value)} placeholder="75" className="w-full bg-black border border-white/20 p-2 font-bold text-gym-red focus:border-gym-red focus:outline-none placeholder:text-red-900/50" />
                                </div>
                            </div>

                            {/* Weight Goal & Calorie Calculation Section */}
                            <div className="border-t border-white/10 pt-6 mt-6">
                                <h3 className="text-gym-red font-dot text-sm uppercase tracking-widest mb-4">Weight Goal & Calorie Target</h3>

                                <div className="grid md:grid-cols-2 gap-6">
                                    {/* Rate Selection */}
                                    <div>
                                        <label className="block text-xs font-dot text-gray-500 uppercase tracking-widest mb-3">Rate of Change (per week) <span className="text-gym-red">*</span></label>
                                        <div className="space-y-2">
                                            {[
                                                { value: "0.25", label: "0.25 kg/week (Slow & Steady)" },
                                                { value: "0.5", label: "0.5 kg/week (Recommended)" },
                                                { value: "1", label: "1 kg/week (Aggressive)" }
                                            ].map((option) => (
                                                <label key={option.value} className="flex items-center gap-3 cursor-pointer group">
                                                    <input
                                                        type="radio"
                                                        name="weightChangeRate"
                                                        value={option.value}
                                                        checked={weightChangeRate === option.value}
                                                        onChange={(e) => setWeightChangeRate(e.target.value)}
                                                        className="w-4 h-4 accent-gym-red cursor-pointer"
                                                    />
                                                    <span className="text-sm font-medium group-hover:text-gym-red transition-colors">
                                                        {option.label}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Calculated Calories Display */}
                                    <div className="flex flex-col justify-center">
                                        <label className="block text-xs font-dot text-gray-500 uppercase tracking-widest mb-2">Calculated Daily Calories</label>
                                        <div className="bg-gym-red/10 border-2 border-gym-red p-4 text-center">
                                            {calculatedCalories !== null ? (
                                                <>
                                                    <p className="text-4xl font-black text-gym-red">{calculatedCalories}</p>
                                                    <p className="text-xs text-gray-400 uppercase mt-1">KCAL/DAY</p>
                                                    <p className="text-[10px] text-gray-500 mt-2 mb-3">
                                                        {parseFloat(targetWeight) < parseFloat(currentWeight)
                                                            ? `Deficit for ${weightChangeRate} kg/week loss`
                                                            : parseFloat(targetWeight) > parseFloat(currentWeight)
                                                                ? `Surplus for ${weightChangeRate} kg/week gain`
                                                                : "Maintenance calories"}
                                                    </p>
                                                    <button
                                                        onClick={handleCalculateCalories}
                                                        className="text-[10px] font-dot font-bold uppercase text-gray-500 hover:text-gym-red border border-gray-700 hover:border-gym-red px-3 py-1 transition-colors"
                                                    >
                                                        Recalculate
                                                    </button>
                                                </>
                                            ) : (
                                                <div className="py-2">
                                                    <p className="text-sm text-gray-500 mb-3">Enter methodology above</p>
                                                    <button
                                                        onClick={handleCalculateCalories}
                                                        className="bg-white text-black text-xs font-bold px-4 py-2 uppercase hover:bg-gym-red hover:text-white transition-colors"
                                                    >
                                                        Calculate Target
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-[10px] text-gray-400 mt-2 leading-relaxed">
                                            💡 Calories calculated using the TDEE formula from our{" "}
                                            <a href="/calculators" className="text-gym-red hover:underline font-bold">
                                                Calculator page
                                            </a>
                                            . Visit for detailed breakdown.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-xs font-dot text-gray-500 uppercase tracking-widest mb-2">Activity Level <span className="text-gym-red">*</span></label>
                                        <select value={activityLevel} onChange={(e) => setActivityLevel(e.target.value)} className="w-full bg-black border border-white/20 p-4 font-bold text-white focus:border-gym-red focus:outline-none">
                                            <option>Sedentary (Office Job)</option>
                                            <option>Light (Exercise 1-3 days)</option>
                                            <option>Moderate (Exercise 3-5 days)</option>
                                            <option>Active (Exercise 6-7 days)</option>
                                            <option>Athlete (2x Training)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-xs font-dot text-gray-500 uppercase tracking-widest mb-2">Diet Preference</label>
                                        <select
                                            value={dietType}
                                            onChange={(e) => setDietType(e.target.value)}
                                            className="w-full bg-black border border-white/20 p-4 font-sans font-bold text-white focus:border-gym-red focus:outline-none appearance-none cursor-pointer"
                                        >
                                            <option value="Everything">Standard (Omnivore)</option>
                                            <option value="Vegetarian">Vegetarian (No Meat)</option>
                                            <option value="Vegan">Vegan (Plant Based)</option>
                                            <option value="Pescatarian">Pescatarian (Fish OK)</option>
                                            <option value="Keto">Ketogenic (Low Carb)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-dot text-gray-500 uppercase tracking-widest mb-2">Budget Level</label>
                                        <select
                                            value={budget}
                                            onChange={(e) => setBudget(e.target.value)}
                                            className="w-full bg-black border border-white/20 p-4 font-sans font-bold text-white focus:border-gym-red focus:outline-none appearance-none cursor-pointer"
                                        >
                                            <option value="Standard">Standard</option>
                                            <option value="Budget">Budget Friendly (Low Cost)</option>
                                            <option value="Premium">Premium (Organic/High End)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Calculation Summary - Shown after Calculate Target */}
                            {calculatedCalories !== null && (
                                <div className="mb-6 p-4 bg-gym-red/10 border border-gym-red/30 rounded">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Calculator className="w-4 h-4 text-gym-red" />
                                        <h4 className="font-dot text-xs uppercase tracking-widest text-gym-red">Your Calculated Profile</h4>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                        <div className="bg-black/30 p-2 rounded text-center">
                                            <span className="block text-[10px] text-gray-500 uppercase">Daily Calories</span>
                                            <span className="font-black text-gym-red text-lg">{calculatedCalories} kcal</span>
                                        </div>
                                        <div className="bg-black/30 p-2 rounded text-center">
                                            <span className="block text-[10px] text-gray-500 uppercase">Weight Change</span>
                                            <span className="font-bold text-white">{weightChangeRate} kg/week</span>
                                        </div>
                                        <div className="bg-black/30 p-2 rounded text-center">
                                            <span className="block text-[10px] text-gray-500 uppercase">Activity</span>
                                            <span className="font-bold text-white text-xs">{activityLevel.split(" ")[0]}</span>
                                        </div>
                                        <div className="bg-black/30 p-2 rounded text-center">
                                            <span className="block text-[10px] text-gray-500 uppercase">Mode</span>
                                            <span className="font-bold text-white">{mode.toUpperCase()}</span>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mt-3">
                                        <div className="bg-black/30 p-2 rounded text-center">
                                            <span className="block text-[10px] text-gray-500 uppercase">Diet Type</span>
                                            <span className="font-bold text-white text-xs">{dietType}</span>
                                        </div>
                                        <div className="bg-black/30 p-2 rounded text-center">
                                            <span className="block text-[10px] text-gray-500 uppercase">Budget</span>
                                            <span className="font-bold text-white text-xs">{budget}</span>
                                        </div>
                                        <div className="bg-black/30 p-2 rounded text-center">
                                            <span className="block text-[10px] text-gray-500 uppercase">Current → Target</span>
                                            <span className="font-bold text-white text-xs">{currentWeight}kg → {targetWeight}kg</span>
                                        </div>
                                        <div className="bg-black/30 p-2 rounded text-center">
                                            <span className="block text-[10px] text-gray-500 uppercase">Body Stats</span>
                                            <span className="font-bold text-white text-xs">{gender}, {age}y, {height}cm</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="pt-8 border-t border-white/10">
                                <button
                                    onClick={generateProtocol}
                                    disabled={!validateInputs().valid || loading || calculatedCalories === null}
                                    className="w-full bg-white text-black font-black uppercase text-lg py-4 hover:bg-gym-red hover:text-white transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-black"
                                >
                                    <Cpu className="w-6 h-6" />
                                    Initialize Synthesis
                                </button>
                                {!validateInputs().valid && !error && (
                                    <p className="text-xs text-gym-red/70 mt-2 font-dot uppercase tracking-wider text-center">
                                        ⚠ All fields must be filled with valid values
                                    </p>
                                )}
                                {validateInputs().valid && calculatedCalories === null && !loading && (
                                    <p className="text-xs text-gym-red/70 mt-2 font-dot uppercase tracking-wider text-center">
                                        ⚠ Calculate calories first to enable synthesis
                                    </p>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {/* Loading State */}
                    {loading && (
                        <div className="flex flex-col items-center justify-center py-20 space-y-6">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            >
                                <RefreshCw className="w-16 h-16 text-gym-red" />
                            </motion.div>
                            <div className="text-center space-y-2 max-w-md mx-auto">
                                <p className="font-black text-xl uppercase animate-pulse">Establishing Uplink...</p>
                                <CountdownTimer duration={60} />
                                <LoadingStatus />
                                <p className="text-[10px] text-gray-500 font-mono mt-4 border border-white/10 p-2 inline-block">
                                    NOTE: Complex synthesis (Dual-Language + Pricing) active.<br />
                                    Optimizing tactical response...
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Error State */}
                    {error && (
                        <div className="border border-red-500/50 bg-red-500/10 p-8 text-center space-y-4">
                            <p className="text-red-500 font-black text-2xl uppercase">{error}</p>
                            <button
                                onClick={generateProtocol}
                                className="text-xs font-dot uppercase tracking-widest border border-red-500 px-6 py-2 hover:bg-red-500 hover:text-black transition-colors"
                            >
                                Retry Protocol
                            </button>
                        </div>
                    )}

                    {/* Results */}
                    {data && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-8"
                        >
                            {/* Control Bar */}
                            <div className="flex justify-between items-center bg-white/5 p-4 border border-white/10">
                                <div className="flex items-center gap-2">
                                    <Globe className="w-4 h-4 text-gym-red" />
                                    <span className="font-dot text-xs uppercase tracking-widest text-gray-400">Language Protocol</span>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setLang("en")}
                                        className={`px-3 py-1 text-xs font-bold uppercase transition-colors ${lang === "en" ? "bg-gym-red text-white" : "border border-white/20 text-gray-400"}`}
                                    >
                                        English
                                    </button>
                                    <button
                                        onClick={() => setLang("hi")}
                                        className={`px-3 py-1 text-xs font-bold uppercase transition-colors ${lang === "hi" ? "bg-gym-red text-white" : "border border-white/20 text-gray-400"}`}
                                    >
                                        Hindi
                                    </button>
                                </div>
                            </div>

                            {/* Brief */}
                            {/* Enhanced Your Plan Section */}
                            <div className="bg-gym-red/10 border-l-4 border-gym-red p-6">
                                <h3 className="text-gym-red font-dot text-xs uppercase tracking-widest mb-3">Your Plan // Mission Summary</h3>
                                <p className="font-medium text-lg italic mb-4">&quot;{data.tactical_brief[lang]}&quot;</p>

                                {/* User Inputs Summary */}
                                {data.user_inputs_summary && (
                                    <div className="mt-4 pt-4 border-t border-gym-red/30">
                                        <h4 className="text-xs font-dot text-gray-400 uppercase tracking-widest mb-3">Your Complete Profile</h4>
                                        <div className="grid grid-cols-3 md:grid-cols-5 gap-3 text-xs">
                                            <div className="bg-black/30 p-2 text-center rounded">
                                                <span className="block text-gray-500">Gender</span>
                                                <span className="font-bold text-white">{data.user_inputs_summary.gender}</span>
                                            </div>
                                            <div className="bg-black/30 p-2 text-center rounded">
                                                <span className="block text-gray-500">Age</span>
                                                <span className="font-bold text-white">{data.user_inputs_summary.age} yrs</span>
                                            </div>
                                            <div className="bg-black/30 p-2 text-center rounded">
                                                <span className="block text-gray-500">Height</span>
                                                <span className="font-bold text-white">{data.user_inputs_summary.height} cm</span>
                                            </div>
                                            <div className="bg-black/30 p-2 text-center rounded">
                                                <span className="block text-gray-500">Current</span>
                                                <span className="font-bold text-white">{data.user_inputs_summary.current_weight} kg</span>
                                            </div>
                                            <div className="bg-black/30 p-2 text-center rounded">
                                                <span className="block text-gray-500">Target</span>
                                                <span className="font-bold text-gym-red">{data.user_inputs_summary.target_weight} kg</span>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs mt-3">
                                            <div className="bg-black/30 p-2 text-center rounded">
                                                <span className="block text-gray-500">Activity</span>
                                                <span className="font-bold text-white text-[10px]">{data.user_inputs_summary.activity_level?.split(" ")[0] || "N/A"}</span>
                                            </div>
                                            <div className="bg-black/30 p-2 text-center rounded">
                                                <span className="block text-gray-500">Diet Type</span>
                                                <span className="font-bold text-white text-[10px]">{data.user_inputs_summary.diet_type}</span>
                                            </div>
                                            <div className="bg-black/30 p-2 text-center rounded">
                                                <span className="block text-gray-500">Budget</span>
                                                <span className="font-bold text-white text-[10px]">{data.user_inputs_summary.budget}</span>
                                            </div>
                                            <div className="bg-black/30 p-2 text-center rounded">
                                                <span className="block text-gray-500">Mode</span>
                                                <span className="font-bold text-green-400">{data.user_inputs_summary.mode?.toUpperCase()}</span>
                                            </div>
                                            <div className="bg-black/30 p-2 text-center rounded">
                                                <span className="block text-gray-500">Rate</span>
                                                <span className="font-bold text-yellow-400">{data.user_inputs_summary.weight_change_rate || "0.5"} kg/wk</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Timeline with Unit Switcher */}
                            {data.transformation_timeline && (
                                <div className="bg-white/5 border border-white/20 p-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-gray-400 font-dot text-xs uppercase tracking-widest">Estimated Timeline</h3>
                                        <div className="flex gap-1">
                                            {(["days", "weeks", "months", "years"] as const).map((unit) => (
                                                <button
                                                    key={unit}
                                                    onClick={() => setTimelineUnit(unit)}
                                                    className={`px-2 py-1 text-[10px] font-bold uppercase transition-colors ${timelineUnit === unit ? "bg-gym-red text-white" : "border border-white/20 text-gray-500 hover:text-white"}`}
                                                >
                                                    {unit}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-4xl font-black text-white">
                                                {timelineUnit === "days" && (data.transformation_timeline.total_days || Math.round((data.transformation_timeline.total_weeks || 0) * 7))}
                                                {timelineUnit === "weeks" && (data.transformation_timeline.total_weeks || data.transformation_timeline.estimated_duration)}
                                                {timelineUnit === "months" && Math.round((data.transformation_timeline.total_weeks || 0) / 4.33)}
                                                {timelineUnit === "years" && ((data.transformation_timeline.total_weeks || 0) / 52).toFixed(1)}
                                                <span className="text-lg text-gray-400 ml-2">{timelineUnit}</span>
                                            </p>
                                            <p className="text-xs text-green-500 font-mono uppercase mt-1">
                                                {data.transformation_timeline.weekly_change} / week
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-gray-400 uppercase">Target Intake</p>
                                            <p className="text-2xl font-black text-gym-red">{data.transformation_timeline.daily_calories} kcal</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* MEAL PLAN SECTION - NOW ABOVE SHOPPING CART */}
                            <div className="border border-white/20 p-6 bg-black relative">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gym-red to-transparent opacity-50" />
                                <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
                                    <Utensils className="w-5 h-5 text-gym-red" />
                                    <h3 className="text-xl font-black uppercase">Fuel Injector // Daily Protocol</h3>
                                </div>
                                <div className="space-y-4">
                                    {data.meal_plan.map((meal, idx) => (
                                        <div key={idx} className="bg-white/5 p-4 border border-white/10 hover:border-gym-red/50 transition-colors">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex items-center gap-3">
                                                    {meal.timing && (
                                                        <span className="text-yellow-400 font-mono font-bold text-sm bg-yellow-400/10 px-2 py-1 rounded">
                                                            {meal.timing}
                                                        </span>
                                                    )}
                                                    <h4 className="font-bold text-white uppercase text-sm">{meal.name?.[lang] || "Unnamed Ration"}</h4>
                                                </div>
                                                <span className="text-gym-red font-black text-xs">{meal.calories} kcal</span>
                                            </div>
                                            <p className="text-xs text-gray-400 mb-3 leading-relaxed">{meal.description?.[lang] || "No strategic details provided."}</p>

                                            {/* Ingredients List */}
                                            {meal.ingredients && meal.ingredients.length > 0 && (
                                                <div className="mb-3 p-2 bg-black/50 border border-white/5 rounded">
                                                    <p className="text-[10px] font-dot text-gray-500 uppercase mb-1">Ingredients</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {meal.ingredients.map((ing, i) => (
                                                            <span key={i} className="text-[10px] text-gray-300 bg-white/5 px-2 py-0.5 rounded">
                                                                {ing.name?.[lang] || ing.name?.en} ({ing.quantity})
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Recipe */}
                                            {meal.recipe && (
                                                <div className="mb-3 p-2 bg-black/50 border border-white/5 rounded">
                                                    <p className="text-[10px] font-dot text-gray-500 uppercase mb-1">Recipe</p>
                                                    <p className="text-xs text-gray-300 leading-relaxed">{meal.recipe[lang]}</p>
                                                </div>
                                            )}

                                            {/* Macros */}
                                            <div className="flex flex-wrap gap-2 text-[10px] font-dot uppercase tracking-widest text-gray-500">
                                                <span className="bg-black px-2 py-1 border border-white/10 rounded">P: {meal.protein}g</span>
                                                <span className="bg-black px-2 py-1 border border-white/10 rounded">C: {meal.carbs}g</span>
                                                <span className="bg-black px-2 py-1 border border-white/10 rounded">F: {meal.fats}g</span>
                                                {meal.fiber !== undefined && <span className="bg-black px-2 py-1 border border-white/10 rounded">Fiber: {meal.fiber}g</span>}
                                                {meal.sugar !== undefined && <span className="bg-black px-2 py-1 border border-white/10 rounded">Sugar: {meal.sugar}g</span>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* SHOPPING CART SECTION - NOW BELOW MEAL PLAN */}
                            <div className="border border-white/20 p-6 bg-black">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b border-white/10 pb-4 gap-4">
                                    <div className="flex items-center gap-3">
                                        <ShoppingCart className="w-5 h-5 text-gym-red" />
                                        <h3 className="text-xl font-black uppercase">Mission Manifest</h3>
                                        {data.shopping_list.duration_days && (
                                            <span className="text-[10px] bg-gym-red/20 text-gym-red px-2 py-1 rounded font-bold">
                                                {data.shopping_list.duration_days} DAY SUPPLY
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-center">
                                            <p className="text-[10px] text-gray-500 uppercase">Total (15 Days)</p>
                                            <div className="flex items-center gap-1 text-green-400 font-bold text-lg">
                                                <IndianRupee className="w-4 h-4" />
                                                {data.shopping_list.total_estimated_cost}
                                            </div>
                                        </div>
                                        <div className="h-8 w-[1px] bg-white/10" />
                                        <div className="text-center">
                                            <p className="text-[10px] text-gray-500 uppercase">Avg/Day</p>
                                            <div className="flex items-center gap-1 text-yellow-400 font-bold">
                                                <IndianRupee className="w-3 h-3" />
                                                {data.shopping_list.average_daily_cost || Math.round(data.shopping_list.total_estimated_cost / (data.shopping_list.duration_days || 15))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-8">
                                    {["Home_Essentials", "Market_Purchase"].map((category) => {
                                        const items = data.shopping_list.items.filter(i => i.category === category);
                                        if (items.length === 0) return null;

                                        return (
                                            <div key={category}>
                                                <div className="flex items-center gap-2 mb-3 text-gray-400">
                                                    {category === "Home_Essentials" ? <Home className="w-4 h-4" /> : <Store className="w-4 h-4" />}
                                                    <h4 className="font-dot text-xs uppercase tracking-widest">
                                                        {category === "Home_Essentials" ? (lang === "en" ? "Home Essentials" : "Ghar ka Samaan") : (lang === "en" ? "Market Purchase" : "Bazaar se Kharidein")}
                                                    </h4>
                                                </div>
                                                <div className="space-y-2">
                                                    {items.map((item, idx) => (
                                                        <div key={idx} className="flex justify-between items-center text-sm p-2 bg-white/5 border border-white/5">
                                                            <div>
                                                                <p className="font-bold">{item.name[lang]}</p>
                                                                <p className="text-xs text-gray-500">{item.quantity[lang]} • {item.duration_days} Days</p>
                                                            </div>
                                                            <div className="text-right text-gray-300">
                                                                ₹{item.price_inr}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="mt-6 pt-4 border-t border-white/10 text-center">
                                    <p className="text-[10px] text-gray-500 font-dot uppercase">* Prices are Average Market Estimates (INR) for {data.shopping_list.duration_days || 15} Days</p>
                                </div>
                            </div>

                            <button
                                id="export-btn"
                                onClick={downloadPDF}
                                disabled={pdfLoading}
                                className="w-full border border-white/20 py-4 font-dot font-bold text-xs uppercase tracking-widest hover:bg-white hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {pdfLoading && (
                                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                                        <RefreshCw className="w-4 h-4" />
                                    </motion.div>
                                )}
                                {pdfLoading ? "CAPTURING DIRECTIVE..." : "DOWNLOAD MISSION DIRECTIVE (PDF)"}
                            </button>
                        </motion.div>
                    )}

                    {/* Hidden PDF Component */}
                    {data && (
                        <div className="absolute top-0 left-[-9999px]">
                            <MissionDirective
                                ref={missionRef}
                                data={data}
                                lang={lang}
                                biometrics={{
                                    currentWeight,
                                    targetWeight,
                                    goal: `I want to ${mode === "bulk" ? "gain muscle mass" : "shred fat"} effectively.`
                                }}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function FuelPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-white">LOADING SYSTEM...</div>}>
            <FuelSynthesizerContent />
        </Suspense>
    );
}
