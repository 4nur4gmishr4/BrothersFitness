"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, RefreshCw, Cpu, ShoppingCart, Utensils, IndianRupee, Globe, Home, Store } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import MissionDirective from "@/components/MissionDirective";

// Types for our API response
type LocalizedText = { en: string; hi: string };

type DietPlan = {
    tactical_brief: LocalizedText;
    shopping_list: {
        total_estimated_cost: number;
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
    };
    meal_plan: {
        name: LocalizedText;
        calories: number;
        protein: number;
        carbs: number;
        fats: number;
        description: LocalizedText;
    }[];
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

    // New Biometric States
    const [currentWeight, setCurrentWeight] = useState("70");
    const [targetWeight, setTargetWeight] = useState("75");
    const [age, setAge] = useState("25");
    const [height, setHeight] = useState("175");
    const [gender, setGender] = useState("Male");
    const [activityLevel, setActivityLevel] = useState("Moderate (Exercise 3-5 days)");

    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<DietPlan | null>(null);
    const [error, setError] = useState("");
    const [pdfLoading, setPdfLoading] = useState(false);

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
                    calories,
                    mode,
                    dietType,
                    budget,
                    currentWeight,
                    targetWeight,
                    age,
                    height,
                    gender,
                    activityLevel,
                    goal_description: `I want to ${mode === "bulk" ? "gain muscle mass" : "shred fat"} effectively.`
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

    return (
        <div className="min-h-screen bg-black text-white p-4 md:p-8 font-sans relative">
            {/* Header */}
            <motion.div
                className="max-w-4xl mx-auto flex justify-between items-center mb-12 border-b border-white/20 pb-6"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-gray-400 hover:text-gym-red transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span className="font-dot text-xs uppercase tracking-widest">Cancel</span>
                </button>
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

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            <div>
                                <label className="block text-[10px] font-dot text-gray-500 uppercase tracking-widest mb-2">Gender</label>
                                <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full bg-black border border-white/20 p-2 font-bold text-white focus:border-gym-red focus:outline-none">
                                    <option>Male</option>
                                    <option>Female</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-dot text-gray-500 uppercase tracking-widest mb-2">Age <span className="text-gym-red">*</span></label>
                                <input type="number" value={age} onChange={(e) => setAge(e.target.value)} className="w-full bg-black border border-white/20 p-2 font-bold focus:border-gym-red focus:outline-none" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-dot text-gray-500 uppercase tracking-widest mb-2">Height (cm) <span className="text-gym-red">*</span></label>
                                <input type="number" value={height} onChange={(e) => setHeight(e.target.value)} className="w-full bg-black border border-white/20 p-2 font-bold focus:border-gym-red focus:outline-none" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-dot text-gray-500 uppercase tracking-widest mb-2">Target Weight (kg) <span className="text-gym-red">*</span></label>
                                <input type="number" value={targetWeight} onChange={(e) => setTargetWeight(e.target.value)} className="w-full bg-black border border-white/20 p-2 font-bold text-gym-red focus:border-gym-red focus:outline-none" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-dot text-gray-500 uppercase tracking-widest mb-2">Current Weight (kg) <span className="text-gym-red">*</span></label>
                                <input type="number" value={currentWeight} onChange={(e) => setCurrentWeight(e.target.value)} className="w-full bg-black border border-white/20 p-2 font-bold focus:border-gym-red focus:outline-none" />
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

                        <div className="pt-8 border-t border-white/10">
                            <button
                                onClick={generateProtocol}
                                disabled={!validateInputs().valid || loading}
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
                            <LoadingStatus />
                            <p className="text-[10px] text-gray-500 font-mono mt-4 border border-white/10 p-2 inline-block">
                                NOTE: Complex synthesis (Dual-Language + Pricing) active.<br />
                                Response may take up to <span className="text-gym-red">60 seconds</span>.
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
                        {/* Brief & Timeline */}
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="bg-gym-red/10 border-l-4 border-gym-red p-6">
                                <h3 className="text-gym-red font-dot text-xs uppercase tracking-widest mb-2">Your Plan</h3>
                                <p className="font-medium text-lg italic">&quot;{data.tactical_brief[lang]}&quot;</p>
                            </div>

                            {data.transformation_timeline && (
                                <div className="bg-white/5 border border-white/20 p-6 flex flex-col justify-center">
                                    <h3 className="text-gray-400 font-dot text-xs uppercase tracking-widest mb-4">Estimated Timeline</h3>
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-3xl font-black text-white">{data.transformation_timeline.estimated_duration}</p>
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
                        </div>

                        {/* Manifest (Shopping List) - Full Width Now */}
                        <div className="border border-white/20 p-6 bg-black">
                            <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                                <div className="flex items-center gap-3">
                                    <ShoppingCart className="w-5 h-5 text-gym-red" />
                                    <h3 className="text-xl font-black uppercase">Mission Manifest</h3>
                                </div>
                                <div className="flex items-center gap-1 text-green-400 font-bold">
                                    <IndianRupee className="w-4 h-4" />
                                    {data.shopping_list.total_estimated_cost}
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
                                            <div className="space-y-3">
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
                                <p className="text-[10px] text-gray-500 font-dot uppercase">* Prices are Average Market Estimates (INR)</p>
                            </div>
                        </div>

                        {/* Separate Meal Plan Section */}
                        <div className="border border-white/20 p-6 bg-black relative">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gym-red to-transparent opacity-50" />
                            <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
                                <Utensils className="w-5 h-5 text-gym-red" />
                                <h3 className="text-xl font-black uppercase">Fuel Injector // Daily Protocol</h3>
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                                {data.meal_plan.map((meal, idx) => (
                                    <div key={idx} className="bg-white/5 p-4 border border-white/10 hover:border-gym-red/50 transition-colors">
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-bold text-white uppercase text-sm">{meal.name?.[lang] || "Unnamed Ration"}</h4>
                                            <span className="text-gym-red font-black text-xs">{meal.calories} kcal</span>
                                        </div>
                                        <p className="text-xs text-gray-400 mb-3 leading-relaxed">{meal.description?.[lang] || "No strategic details provided."}</p>
                                        <div className="flex gap-2 text-[10px] font-dot uppercase tracking-widest text-gray-500">
                                            <span className="bg-black px-2 py-1 border border-white/10 rounded">P: {meal.protein}g</span>
                                            <span className="bg-black px-2 py-1 border border-white/10 rounded">C: {meal.carbs}g</span>
                                            <span className="bg-black px-2 py-1 border border-white/10 rounded">F: {meal.fats}g</span>
                                        </div>
                                    </div>
                                ))}
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
    );
}

export default function FuelPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-white">LOADING SYSTEM...</div>}>
            <FuelSynthesizerContent />
        </Suspense>
    );
}
