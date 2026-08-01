"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import {
    Globe, Utensils, ShoppingCart, IndianRupee, Home, Store, RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import MissionDirective from "@/components/MissionDirective";
import type { DietPlan } from "@/lib/fuel-types";

type Lang = "en" | "hi";
type TimelineUnit = "days" | "weeks" | "months" | "years";

interface DietResultViewProps {
    data: DietPlan;
    lang: Lang;
    onLangChange: (lang: Lang) => void;
    timelineUnit: TimelineUnit;
    onTimelineUnitChange: (unit: TimelineUnit) => void;
    mode: "bulk" | "cut";
    biometrics: { currentWeight: string; targetWeight: string };
}

export default function DietResultView({
    data, lang, onLangChange, timelineUnit, onTimelineUnitChange, mode, biometrics,
}: DietResultViewProps) {
    const missionRef = useRef<HTMLDivElement>(null);
    const [pdfLoading, setPdfLoading] = useState(false);

    const downloadPDF = async () => {
        if (!missionRef.current) return;
        setPdfLoading(true);

        try {
            // Dynamic import keeps the heavy canvas/PDF libs out of the main
            // bundle; they only load when the user actually exports.
            const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
                import("html2canvas"),
                import("jspdf")
            ]);

            const canvas = await html2canvas(missionRef.current, {
                scale: 2,
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

            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pdfHeight;

            while (heightLeft > 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pdfHeight;
            }

            pdf.save(`BroFit_Mission_Directive_${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (err) {
            console.error("PDF Fail:", err);
            toast.error("Tactical Printer Jammed. Please retry.");
        } finally {
            setPdfLoading(false);
        }
    };

    return (
        <>
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
                            onClick={() => onLangChange("en")}
                            className={`px-3 py-1 text-xs font-bold uppercase transition-colors ${lang === "en" ? "bg-gym-red text-white" : "border border-white/20 text-gray-400"}`}
                        >
                            English
                        </button>
                        <button
                            onClick={() => onLangChange("hi")}
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
                                        onClick={() => onTimelineUnitChange(unit)}
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

            {/* Hidden PDF Component */}
            <div className="absolute top-0 left-[-9999px]">
                <MissionDirective
                    ref={missionRef}
                    data={data}
                    lang={lang}
                    biometrics={{
                        currentWeight: biometrics.currentWeight,
                        targetWeight: biometrics.targetWeight,
                        goal: `I want to ${mode === "bulk" ? "gain muscle mass" : "shred fat"} effectively.`
                    }}
                />
            </div>
        </>
    );
}
