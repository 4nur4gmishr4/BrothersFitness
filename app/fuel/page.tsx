"use client";

import { useState, useEffect, Suspense, useCallback, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, RefreshCw, Cpu, Calculator } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useUserAuth } from "@/lib/user-auth-context";
import { MAX_DAILY_CREDITS } from "@/lib/config";
import type { DietPlan } from "@/lib/fuel-types";
import DietResultView from "@/components/fuel/DietResultView";
import CountdownTimer from "@/components/fuel/CountdownTimer";
import LoadingStatus from "@/components/fuel/LoadingStatus";

function FuelSynthesizerContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [calories] = useState(searchParams.get("calories") || "");
    const [dietType, setDietType] = useState("Everything");
    const [budget, setBudget] = useState("Standard");
    const [lang, setLang] = useState<"en" | "hi">("en");

    const { user, isLoggedIn, checkCredit, deductCredit, setShowLoginModal, accessToken } = useUserAuth();

    const [currentWeight, setCurrentWeight] = useState("");
    const [targetWeight, setTargetWeight] = useState("");
    const [age, setAge] = useState("");
    const [height, setHeight] = useState("");
    const [gender, setGender] = useState("Male");
    const [activityLevel, setActivityLevel] = useState("Moderate (Exercise 3-5 days)");
    const [weightChangeRate, setWeightChangeRate] = useState("0.5"); // kg per week
    const [calculatedCalories, setCalculatedCalories] = useState<number | null>(null);

    const mode = useMemo(() => {
        const current = parseFloat(currentWeight);
        const target = parseFloat(targetWeight);
        if (isNaN(current) || isNaN(target) || current === target) {
            return "bulk"; // Default to bulk if weights are equal or invalid
        }
        return target < current ? "cut" : "bulk";
    }, [currentWeight, targetWeight]);

    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<DietPlan | null>(null);
    const [error, setError] = useState("");
    const [timelineUnit, setTimelineUnit] = useState<"days" | "weeks" | "months" | "years">("weeks");


    useEffect(() => {
        const verifyCredits = async () => {
            if (isLoggedIn) {
                await checkCredit();
            }
        };
        verifyCredits();
    }, [isLoggedIn, checkCredit]);

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
        setError("");

        // 1. Check Login
        if (!isLoggedIn) {
            setShowLoginModal(true);
            return;
        }

        // 2. Check Credits (Local Check)
        const canProceed = await checkCredit();
        if (!canProceed) {
            setError("INSUFFICIENT CREDITS: DAILY LIMIT REACHED. REFRESH TOMORROW.");
            return;
        }

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
        setData(null);

        // Create AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 90000); // 90 second timeout

        try {
            const res = await fetch("/api/generate-diet", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${accessToken ?? ''}`
                },
                body: JSON.stringify({
                    calories: calculatedCalories ? calculatedCalories : (calories ? parseFloat(calories) : undefined),
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

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || "Synthesis Failed");
            }

            const result = await res.json();

            // Validate critical fields exist
            if (!result.tactical_brief || !result.shopping_list || !result.meal_plan) {
                throw new Error("Malformed AI Response");
            }

            // SUCCESS: Setup Data & Deduct Credit
            setData(result);
            await deductCredit();
            // Refresh credit state
            await checkCredit();

        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            if (message.includes('abort') || (err instanceof Error && err.name === 'AbortError')) {
                setError("TIMEOUT: AI UPLINK TOOK TOO LONG (>90s). RETRY ADVISED.");
            } else {
                // Show the actual error message from backend (e.g. Rate limit, API key)
                setError(message.toUpperCase());
            }
        } finally {
            clearTimeout(timeoutId);
            setLoading(false);
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
                        {isLoggedIn && user && (
                            <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
                                <Cpu className="w-3 h-3 text-gym-red" />
                                <span className={`text-xs font-bold ${user.daily_credits > 0 ? "text-white" : "text-red-500"}`}>
                                    {user.daily_credits}/{MAX_DAILY_CREDITS} CREDITS
                                </span>
                            </div>
                        )}
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

                                <div className="max-w-md">
                                    {/* Rate Selection */}
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

                                    {/* Calculated Calories Button moved here */}
                                    <div className="pt-2">
                                        <div className="bg-gym-red/10 border-2 border-gym-red p-4 text-center">
                                            {calculatedCalories !== null ? (
                                                <>
                                                    <p className="text-4xl font-black text-gym-red">{calculatedCalories}</p>
                                                    <p className="text-xs text-gray-400 uppercase mt-1">KCAL/DAY</p>
                                                    <button
                                                        onClick={handleCalculateCalories}
                                                        className="text-[10px] font-dot font-bold uppercase text-gray-500 hover:text-gym-red border border-gray-700 hover:border-gym-red px-3 py-1 mt-3 transition-colors"
                                                    >
                                                        Recalculate
                                                    </button>
                                                </>
                                            ) : (
                                                <div className="py-2">
                                                    <p className="text-sm text-gray-500 mb-3 text-center uppercase font-dot tracking-widest">Target Estimation</p>
                                                    <button
                                                        onClick={handleCalculateCalories}
                                                        className="bg-white text-black text-xs font-bold px-4 py-3 w-full uppercase hover:bg-gym-red hover:text-white transition-colors"
                                                    >
                                                        Calculate Calorie
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 md:mt-0">
                                    <div className="bg-white/5 border border-white/10 p-6 h-full flex flex-col justify-center">
                                        <div className="flex items-center gap-2 mb-4">
                                            <Calculator className="w-5 h-5 text-gym-red" />
                                            <h4 className="font-dot text-xs uppercase tracking-widest text-white">System Estimation</h4>
                                        </div>
                                        <p className="text-sm text-gray-400 leading-relaxed mb-4">
                                            Our Tactical AI uses the Mifflin-St Jeor equation to precisely estimate your Total Daily Energy Expenditure (TDEE).
                                        </p>
                                        <ul className="space-y-2 text-xs text-gray-500">
                                            <li className="flex gap-2">
                                                <span className="text-gym-red">/</span>
                                                Automatic Deficit/Surplus Scaling
                                            </li>
                                            <li className="flex gap-2">
                                                <span className="text-gym-red">/</span>
                                                Activity Multiplier Calibration
                                            </li>
                                            <li className="flex gap-2">
                                                <span className="text-gym-red">/</span>
                                                Real-time Goal Adjustment
                                            </li>
                                        </ul>
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
                        <DietResultView
                            data={data}
                            lang={lang}
                            onLangChange={setLang}
                            timelineUnit={timelineUnit}
                            onTimelineUnitChange={setTimelineUnit}
                            mode={mode}
                            biometrics={{ currentWeight, targetWeight }}
                        />
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
