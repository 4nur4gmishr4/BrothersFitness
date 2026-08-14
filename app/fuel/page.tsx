"use client";

import { useState, useEffect, Suspense, useCallback, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, Cpu, Calculator } from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/public/layout/Navbar";
import { useUserAuth } from "@/lib/user-auth-context";
import { MAX_DAILY_CREDITS } from "@/lib/config";
import type { DietPlan } from "@/lib/fuel-types";
import DietResultView from "@/components/fuel/DietResultView";
import CountdownTimer from "@/components/fuel/CountdownTimer";
import LoadingStatus from "@/components/fuel/LoadingStatus";
import MealPlate from "@/components/animations/MealPlate";
import BellRing from "@/components/animations/BellRing";
import PageSpinner from "@/components/animations/PageSpinner";

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
        // L40: equal weights mean "hold my weight" — defaulting to bulk (the
        // old behaviour) silently told the AI to gain muscle. Maintain is the
        // least-biased default and matches what the numbers say.
        if (isNaN(current) || isNaN(target) || current === target) {
            return "maintain";
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
            return { valid: false, error: "Current weight is required" };
        }
        if (!targetWeight || targetWeight.trim() === "") {
            return { valid: false, error: "Target weight is required" };
        }
        if (!age || age.trim() === "") {
            return { valid: false, error: "Age is required" };
        }
        if (!height || height.trim() === "") {
            return { valid: false, error: "Height is required" };
        }

        // Validate numeric ranges
        const weightNum = parseFloat(currentWeight);
        const targetWeightNum = parseFloat(targetWeight);
        const ageNum = parseFloat(age);
        const heightNum = parseFloat(height);
        const caloriesNum = parseFloat(calories);

        if (isNaN(weightNum) || weightNum <= 0 || weightNum > 500) {
            return { valid: false, error: "Current weight must be between 1-500 kg" };
        }
        if (isNaN(targetWeightNum) || targetWeightNum <= 0 || targetWeightNum > 500) {
            return { valid: false, error: "Target weight must be between 1-500 kg" };
        }
        if (isNaN(ageNum) || ageNum < 10 || ageNum > 150) {
            return { valid: false, error: "Age must be between 10-150 years" };
        }
        if (isNaN(heightNum) || heightNum < 50 || heightNum > 300) {
            return { valid: false, error: "Height must be between 50-300 cm" };
        }
        // Calories is optional but if provided, must be valid
        if (calories && calories.trim() !== "" && (isNaN(caloriesNum) || caloriesNum < 1000 || caloriesNum > 10000)) {
            return { valid: false, error: "Calories must be between 1000-10000" };
        }

        return { valid: true, error: "" };
    };

    const generatePlan = async () => {
        setError("");

        // 1. Check Login
        if (!isLoggedIn) {
            setShowLoginModal(true);
            return;
        }

        // 2. Check Credits (Local Check)
        const canProceed = await checkCredit();
        if (!canProceed) {
            setError("Daily credit limit reached. New credits reset at 5:30 AM IST.");
            return;
        }

        // Comprehensive validation check (single source of truth — M2)
        const validation = validateInputs();
        if (!validation.valid) {
            setError(validation.error);
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
                    goal_description: `I want to ${mode === "bulk" ? "gain muscle mass" : mode === "cut" ? "shred fat" : "maintain my weight"} effectively at ${weightChangeRate} kg/week.`
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || "Generation failed");
            }

            const result = await res.json();

            // Validate critical fields exist
            if (!result.summary || !result.shopping_list || !result.meal_plan) {
                throw new Error("Malformed AI Response");
            }

            // SUCCESS: Setup Data & Deduct Credit
            setData(result);
            toast.success(
                <span className="flex items-center gap-2">
                    <BellRing />
                    <span>{lang === "hi" ? "Aapka diet plan taiyar hai!" : "Your diet plan is ready!"}</span>
                </span>
            );
            await deductCredit();
            // Refresh credit state
            await checkCredit();

        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            if (message.includes('abort') || (err instanceof Error && err.name === 'AbortError')) {
                setError("The request took too long (>90s). Please try again.");
            } else {
                // Show the actual error message from backend (e.g. Rate limit, API key)
                setError(message);
            }
        } finally {
            clearTimeout(timeoutId);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-surface-canvas text-hi font-sans relative">
            <Navbar />
            <div className="p-4 md:p-8 pt-4">
                {/* Header */}
                <div className="max-w-4xl mx-auto flex justify-between items-center mb-12 hairline-b pb-6">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.back()}
                            className="flex items-center gap-2 text-low hover:text-accent transition-colors duration-fast"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            <span className="font-mono text-xs uppercase tracking-widest hidden sm:inline">Back</span>
                        </button>
                        {isLoggedIn && user && (
                            <div className="flex items-center gap-1.5 surface-card hairline px-3 py-1.5">
                                <Cpu className="w-3 h-3 text-accent" />
                                <span className={`text-xs font-bold ${user.daily_credits > 0 ? "text-hi" : "text-status-danger"}`}>
                                    {user.daily_credits}/{MAX_DAILY_CREDITS} CREDITS
                                </span>
                            </div>
                        )}
                    </div>
                    <div className="text-right">
                        <h1 className="heading-display text-2xl text-hi uppercase tracking-tight">Fuel / Diet Generator</h1>
                        <p className="label-text text-xs text-faint uppercase tracking-widest">Your Details</p>
                    </div>
                </div>

                <div className="max-w-4xl mx-auto pb-20">
                    {/* Input Confirm Section */}
                    {!data && !loading && (
                        <div className="surface-card hairline p-8 space-y-8">
                            <h3 className="label-text text-accent text-sm uppercase tracking-widest mb-4 hairline-b pb-2">Your Details</h3>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                <div>
                                    <label className="block label-text text-xs text-faint uppercase tracking-widest mb-2">Gender</label>
                                    <select value={gender} onChange={(e) => setGender(e.target.value)} className="input-field w-full">
                                        <option>Male</option>
                                        <option>Female</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block label-text text-xs text-faint uppercase tracking-widest mb-2">Age <span className="text-accent">*</span></label>
                                    <input type="number" value={age} onFocus={(e) => e.target.select()} onChange={(e) => setAge(e.target.value)} placeholder="25" className="input-field w-full" />
                                </div>
                                <div>
                                    <label className="block label-text text-xs text-faint uppercase tracking-widest mb-2">Height (cm) <span className="text-accent">*</span></label>
                                    <input type="number" value={height} onFocus={(e) => e.target.select()} onChange={(e) => setHeight(e.target.value)} placeholder="175" className="input-field w-full" />
                                </div>
                                <div>
                                    <label className="block label-text text-xs text-faint uppercase tracking-widest mb-2">Current Weight (kg) <span className="text-accent">*</span></label>
                                    <input type="number" value={currentWeight} onFocus={(e) => e.target.select()} onChange={(e) => setCurrentWeight(e.target.value)} placeholder="70" className="input-field w-full" />
                                </div>
                                <div>
                                    <label className="block label-text text-xs text-faint uppercase tracking-widest mb-2">Target Weight (kg) <span className="text-accent">*</span></label>
                                    <input type="number" value={targetWeight} onFocus={(e) => e.target.select()} onChange={(e) => setTargetWeight(e.target.value)} placeholder="75" className="input-field w-full text-accent" />
                                </div>
                            </div>

                            {/* Weight Goal & Calorie Calculation Section */}
                            <div className="hairline-t pt-6 mt-6">
                                <h3 className="label-text text-accent text-sm uppercase tracking-widest mb-4">Goal & Calorie Target</h3>

                                <div className="max-w-md">
                                    {/* Rate Selection */}
                                    <label className="block text-xs label-text text-faint uppercase tracking-widest mb-3">Rate of Change (per week) <span className="text-accent">*</span></label>
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
                                                    className="w-4 h-4 accent-[#D71921] cursor-pointer"
                                                />
                                                <span className="text-sm font-medium text-mid group-hover:text-accent transition-colors duration-fast">
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
                                        <label className="block label-text text-xs text-faint uppercase tracking-widest mb-2">Activity Level <span className="text-accent">*</span></label>
                                        <select value={activityLevel} onChange={(e) => setActivityLevel(e.target.value)} className="input-field w-full p-4">
                                            <option>Sedentary (Office Job)</option>
                                            <option>Light (Exercise 1-3 days)</option>
                                            <option>Moderate (Exercise 3-5 days)</option>
                                            <option>Active (Exercise 6-7 days)</option>
                                            <option>Athlete (2x Training)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block label-text text-xs text-faint uppercase tracking-widest mb-2">Diet Preference</label>
                                        <select
                                            value={dietType}
                                            onChange={(e) => setDietType(e.target.value)}
                                            className="input-field w-full p-4 appearance-none cursor-pointer"
                                        >
                                            <option value="Everything">Standard (Omnivore)</option>
                                            <option value="Vegetarian">Vegetarian (No Meat)</option>
                                            <option value="Vegan">Vegan (Plant Based)</option>
                                            <option value="Pescatarian">Pescatarian (Fish OK)</option>
                                            <option value="Keto">Ketogenic (Low Carb)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block label-text text-xs text-faint uppercase tracking-widest mb-2">Budget Level</label>
                                        <select
                                            value={budget}
                                            onChange={(e) => setBudget(e.target.value)}
                                            className="input-field w-full p-4 appearance-none cursor-pointer"
                                        >
                                            <option value="Standard">Standard</option>
                                            <option value="Budget">Budget Friendly (Low Cost)</option>
                                            <option value="Premium">Premium (Organic/High End)</option>
                                        </select>
                                    </div>

                                    {/* Calculated Calories */}
                                    <div className="pt-2">
                                        <div className="surface-elevated hairline-l-[3px] border-l-accent p-4">
                                            {calculatedCalories !== null ? (
                                                <>
                                                    <p className="text-4xl font-black text-accent">{calculatedCalories}</p>
                                                    <p className="label-text text-xs text-faint uppercase mt-1">KCAL/DAY</p>
                                                    <button
                                                        onClick={handleCalculateCalories}
                                                        className="label-text text-xs font-bold uppercase text-faint hover:text-accent hairline hover:border-accent px-3 py-1 mt-3 transition-colors duration-fast"
                                                    >
                                                        Recalculate
                                                    </button>
                                                </>
                                            ) : (
                                                <div className="py-2">
                                                    <p className="label-text text-sm text-faint mb-3 text-center uppercase tracking-widest">Calorie Target</p>
                                                    <button
                                                        onClick={handleCalculateCalories}
                                                        className="btn-secondary w-full text-xs font-bold uppercase hover:bg-accent hover:text-white hover:border-accent transition-colors duration-fast"
                                                    >
                                                        Calculate Calories
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 md:mt-0">
                                    <div className="surface-canvas hairline p-6 h-full flex flex-col justify-center">
                                        <div className="flex items-center gap-2 mb-4">
                                            <Calculator className="w-5 h-5 text-accent" />
                                            <h4 className="label-text text-xs uppercase tracking-widest text-hi">Calorie Estimation</h4>
                                        </div>
                                        <p className="text-sm text-mid leading-relaxed mb-4">
                                            Your daily calories are estimated using the Mifflin-St Jeor equation, adjusted for your activity level and weekly weight-change goal.
                                        </p>
                                        <ul className="space-y-2 text-xs text-faint">
                                            <li className="flex gap-2">
                                                <span className="text-accent">/</span>
                                                Automatic deficit/surplus scaling
                                            </li>
                                            <li className="flex gap-2">
                                                <span className="text-accent">/</span>
                                                Activity multiplier calibration
                                            </li>
                                            <li className="flex gap-2">
                                                <span className="text-accent">/</span>
                                                Real-time goal adjustment
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            {/* Calculation Summary - Shown after Calculate Target */}
                            {calculatedCalories !== null && (
                                <div className="mb-6 p-4 surface-elevated hairline border-accent/30">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Calculator className="w-4 h-4 text-accent" />
                                        <h4 className="label-text text-xs uppercase tracking-widest text-accent">Your Calculated Profile</h4>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                        <div className="surface-canvas hairline p-2 text-center">
                                            <span className="block text-xs text-faint uppercase">Daily Calories</span>
                                            <span className="font-black text-accent text-lg">{calculatedCalories} kcal</span>
                                        </div>
                                        <div className="surface-canvas hairline p-2 text-center">
                                            <span className="block text-xs text-faint uppercase">Weight Change</span>
                                            <span className="font-bold text-hi">{weightChangeRate} kg/week</span>
                                        </div>
                                        <div className="surface-canvas hairline p-2 text-center">
                                            <span className="block text-xs text-faint uppercase">Activity</span>
                                            <span className="font-bold text-hi text-xs">{activityLevel.split(" ")[0]}</span>
                                        </div>
                                        <div className="surface-canvas hairline p-2 text-center">
                                            <span className="block text-xs text-faint uppercase">Mode</span>
                                            <span className="font-bold text-hi">{mode.toUpperCase()}</span>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mt-3">
                                        <div className="surface-canvas hairline p-2 text-center">
                                            <span className="block text-xs text-faint uppercase">Diet Type</span>
                                            <span className="font-bold text-hi text-xs">{dietType}</span>
                                        </div>
                                        <div className="surface-canvas hairline p-2 text-center">
                                            <span className="block text-xs text-faint uppercase">Budget</span>
                                            <span className="font-bold text-hi text-xs">{budget}</span>
                                        </div>
                                        <div className="surface-canvas hairline p-2 text-center">
                                            <span className="block text-xs text-faint uppercase">Current → Target</span>
                                            <span className="font-bold text-hi text-xs">{currentWeight}kg → {targetWeight}kg</span>
                                        </div>
                                        <div className="surface-canvas hairline p-2 text-center">
                                            <span className="block text-xs text-faint uppercase">Body Stats</span>
                                            <span className="font-bold text-hi text-xs">{gender}, {age}y, {height}cm</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="pt-8 hairline-t">
                                <button
                                    onClick={generatePlan}
                                    disabled={!validateInputs().valid || loading || calculatedCalories === null}
                                    className="w-full bg-accent text-white font-black uppercase text-lg py-4 hover:bg-accent-hover transition-colors duration-fast flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Cpu className="w-6 h-6" />
                                    Generate Diet Plan
                                </button>
                                {!validateInputs().valid && !error && (
                                    <p className="label-text text-xs text-status-danger mt-2 uppercase tracking-wider text-center">
                                        All fields must be filled with valid values
                                    </p>
                                )}
                                {validateInputs().valid && calculatedCalories === null && !loading && (
                                    <p className="label-text text-xs text-status-danger mt-2 uppercase tracking-wider text-center">
                                        Calculate calories first to continue
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Loading State */}
                    {loading && (
                        <div className="flex flex-col items-center justify-center py-20 space-y-6">
                            <MealPlate active />
                            <div className="text-center space-y-2 max-w-md mx-auto">
                                <p className="font-black text-xl uppercase animate-pulse">Generating your plan...</p>
                                <CountdownTimer duration={60} />
                                <LoadingStatus />
                                <p className="text-xs text-faint font-mono mt-4 hairline p-2 inline-block">
                                    NOTE: Building your bilingual meal plan and pricing.<br />
                                    Estimated time: under a minute.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Error State */}
                    {error && (
                        <div className="surface-elevated hairline border-status-danger/50 p-8 text-center space-y-4">
                            <p className="text-status-danger font-black text-2xl uppercase">{error}</p>
                            <button
                                onClick={generatePlan}
                                className="label-text text-xs uppercase tracking-widest hairline border-status-danger px-6 py-2 hover:bg-status-danger hover:text-status-on transition-colors duration-fast"
                            >
                                Try Again
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
        <Suspense fallback={<PageSpinner />}>
            <FuelSynthesizerContent />
        </Suspense>
    );
}
