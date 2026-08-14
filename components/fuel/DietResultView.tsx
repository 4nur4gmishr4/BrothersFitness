"use client";

import { useRef, useState } from "react";
import {
    Globe, Utensils, ShoppingCart, IndianRupee, Home, Store, RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import DietPlanPrint from "@/components/DietPlanPrint";
import CheckDraw from "@/components/animations/CheckDraw";
import type { DietPlan } from "@/lib/fuel-types";

type Lang = "en" | "hi";
type TimelineUnit = "days" | "weeks" | "months" | "years";

interface DietResultViewProps {
    data: DietPlan;
    lang: Lang;
    onLangChange: (lang: Lang) => void;
    timelineUnit: TimelineUnit;
    onTimelineUnitChange: (unit: TimelineUnit) => void;
    mode: "bulk" | "cut" | "maintain";
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

            pdf.save(`Brothers_Fitness_Diet_Plan_${new Date().toISOString().split('T')[0]}.pdf`);
            toast.success(
                <span className="flex items-center gap-2">
                    <CheckDraw />
                    <span>Diet plan saved!</span>
                </span>
            );
        } catch (err) {
            console.error("PDF export failed:", err);
            toast.error("PDF export failed. Please try again.");
        } finally {
            setPdfLoading(false);
        }
    };

    return (
        <>
            <div className="space-y-8">
                {/* Control Bar */}
                <div className="surface-card hairline p-4 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-accent" />
                        <span className="label-text text-xs">Language</span>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => onLangChange("en")}
                            className={`px-3 py-1 text-xs font-bold uppercase transition-colors duration-fast ${lang === "en" ? "bg-accent text-white border border-accent" : "surface-elevated hairline text-low hover:border-accent"}`}
                        >
                            English
                        </button>
                        <button
                            onClick={() => onLangChange("hi")}
                            className={`px-3 py-1 text-xs font-bold uppercase transition-colors duration-fast ${lang === "hi" ? "bg-accent text-white border border-accent" : "surface-elevated hairline text-low hover:border-accent"}`}
                        >
                            Hindi
                        </button>
                    </div>
                </div>

                {/* Brief */}
                <div className="surface-elevated hairline-l-[3px] border-l-accent p-6">
                    <h3 className="label-text text-xs text-accent mb-3">Your Plan</h3>
                    <p className="font-medium text-lg text-hi mb-4">&quot;{data.summary[lang]}&quot;</p>

                    {/* User Inputs Summary */}
                    {data.user_inputs_summary && (
                        <div className="mt-4 pt-4 hairline-t border-accent/20">
                            <h4 className="label-text text-xs text-low mb-3">Your Profile</h4>
                            <div className="grid grid-cols-3 md:grid-cols-5 gap-3 text-xs">
                                <div className="surface-canvas hairline p-2 text-center">
                                    <span className="block text-faint">Gender</span>
                                    <span className="font-bold text-hi">{data.user_inputs_summary.gender}</span>
                                </div>
                                <div className="surface-canvas hairline p-2 text-center">
                                    <span className="block text-faint">Age</span>
                                    <span className="font-bold text-hi">{data.user_inputs_summary.age} yrs</span>
                                </div>
                                <div className="surface-canvas hairline p-2 text-center">
                                    <span className="block text-faint">Height</span>
                                    <span className="font-bold text-hi">{data.user_inputs_summary.height} cm</span>
                                </div>
                                <div className="surface-canvas hairline p-2 text-center">
                                    <span className="block text-faint">Current</span>
                                    <span className="font-bold text-hi">{data.user_inputs_summary.current_weight} kg</span>
                                </div>
                                <div className="surface-canvas hairline p-2 text-center">
                                    <span className="block text-faint">Target</span>
                                    <span className="font-bold text-accent">{data.user_inputs_summary.target_weight} kg</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs mt-3">
                                <div className="surface-canvas hairline p-2 text-center">
                                    <span className="block text-faint">Activity</span>
                                    <span className="font-bold text-hi text-xs">{data.user_inputs_summary.activity_level?.split(" ")[0] || "N/A"}</span>
                                </div>
                                <div className="surface-canvas hairline p-2 text-center">
                                    <span className="block text-faint">Diet Type</span>
                                    <span className="font-bold text-hi text-xs">{data.user_inputs_summary.diet_type}</span>
                                </div>
                                <div className="surface-canvas hairline p-2 text-center">
                                    <span className="block text-faint">Budget</span>
                                    <span className="font-bold text-hi text-xs">{data.user_inputs_summary.budget}</span>
                                </div>
                                <div className="surface-canvas hairline p-2 text-center">
                                    <span className="block text-faint">Mode</span>
                                    <span className="font-bold text-status-success">{data.user_inputs_summary.mode?.toUpperCase()}</span>
                                </div>
                                <div className="surface-canvas hairline p-2 text-center">
                                    <span className="block text-faint">Rate</span>
                                    <span className="font-bold text-status-warning">{data.user_inputs_summary.weight_change_rate || "0.5"} kg/wk</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Timeline with Unit Switcher */}
                {data.transformation_timeline && (
                    <div className="surface-card hairline p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="label-text text-xs text-low">Estimated Timeline</h3>
                            <div className="flex gap-1">
                                {(["days", "weeks", "months", "years"] as const).map((unit) => (
                                    <button
                                        key={unit}
                                        onClick={() => onTimelineUnitChange(unit)}
                                        className={`px-2 py-1 text-xs font-bold uppercase transition-colors duration-fast ${timelineUnit === unit ? "bg-accent text-white border border-accent" : "surface-elevated hairline text-faint hover:text-hi hover:border-accent"}`}
                                    >
                                        {unit}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex justify-between items-end">
                            <div>
                                <p className="text-4xl font-black text-hi">
                                    {timelineUnit === "days" && (data.transformation_timeline.total_days || Math.round((data.transformation_timeline.total_weeks || 0) * 7))}
                                    {timelineUnit === "weeks" && (data.transformation_timeline.total_weeks || data.transformation_timeline.estimated_duration)}
                                    {timelineUnit === "months" && Math.round((data.transformation_timeline.total_weeks || 0) / 4.33)}
                                    {timelineUnit === "years" && ((data.transformation_timeline.total_weeks || 0) / 52).toFixed(1)}
                                    <span className="text-lg text-faint ml-2">{timelineUnit}</span>
                                </p>
                                <p className="text-xs text-status-success font-mono uppercase mt-1">
                                    {data.transformation_timeline.weekly_change} / week
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-faint uppercase">Target Intake</p>
                                <p className="text-2xl font-black text-accent">{data.transformation_timeline.daily_calories} kcal</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* MEAL PLAN SECTION */}
                <div className="surface-card hairline p-6">
                    <div className="flex items-center gap-3 mb-6 hairline-b pb-4">
                        <Utensils className="w-5 h-5 text-accent" />
                        <h3 className="heading-section text-xl text-hi">Daily Meal Plan</h3>
                    </div>
                    <div className="space-y-4">
                        {data.meal_plan.map((meal, idx) => (
                            <div key={idx} className="surface-elevated hairline p-4 hover:border-accent transition-colors duration-fast">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-3">
                                        {meal.timing && (
                                            <span className="font-mono font-bold text-sm text-status-warning bg-status-warning/10 border border-status-warning/30 px-2 py-1">
                                                {meal.timing}
                                            </span>
                                        )}
                                        <h4 className="font-bold text-hi uppercase text-sm">{meal.name?.[lang] || "Standard Meal"}</h4>
                                    </div>
                                    <span className="text-accent font-black text-xs">{meal.calories} kcal</span>
                                </div>
                                <p className="text-xs text-low mb-3 leading-relaxed">{meal.description?.[lang] || "No details provided."}</p>

                                {/* Ingredients List */}
                                {meal.ingredients && meal.ingredients.length > 0 && (
                                    <div className="mb-3 p-2 surface-canvas hairline">
                                        <p className="label-text text-xs text-faint mb-1">Ingredients</p>
                                        <div className="flex flex-wrap gap-2">
                                            {meal.ingredients.map((ing, i) => (
                                                <span key={i} className="badge">
                                                    {ing.name?.[lang] || ing.name?.en} ({ing.quantity})
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Recipe */}
                                {meal.recipe && (
                                    <div className="mb-3 p-2 surface-canvas hairline">
                                        <p className="label-text text-xs text-faint mb-1">Recipe</p>
                                        <p className="text-xs text-mid leading-relaxed">{meal.recipe[lang]}</p>
                                    </div>
                                )}

                                {/* Macros */}
                                <div className="flex flex-wrap gap-2 text-xs font-mono uppercase tracking-widest text-faint">
                                    <span className="surface-canvas hairline px-2 py-1">P: {meal.protein}g</span>
                                    <span className="surface-canvas hairline px-2 py-1">C: {meal.carbs}g</span>
                                    <span className="surface-canvas hairline px-2 py-1">F: {meal.fats}g</span>
                                    {meal.fiber !== undefined && <span className="surface-canvas hairline px-2 py-1">Fiber: {meal.fiber}g</span>}
                                    {meal.sugar !== undefined && <span className="surface-canvas hairline px-2 py-1">Sugar: {meal.sugar}g</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* SHOPPING CART SECTION */}
                <div className="surface-card hairline p-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 hairline-b pb-4 gap-4">
                        <div className="flex items-center gap-3">
                            <ShoppingCart className="w-5 h-5 text-accent" />
                            <h3 className="heading-section text-xl text-hi">Shopping List</h3>
                            {data.shopping_list.duration_days && (
                                <span className="badge badge--accent">
                                    {data.shopping_list.duration_days} DAY SUPPLY
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-center">
                                <p className="label-text text-xs text-faint">Total</p>
                                <div className="flex items-center gap-1 text-status-success font-bold text-lg">
                                    <IndianRupee className="w-4 h-4" />
                                    {data.shopping_list.total_estimated_cost}
                                </div>
                            </div>
                            <div className="h-8 w-[1px] surface-border" />
                            <div className="text-center">
                                <p className="label-text text-xs text-faint">Avg/Day</p>
                                <div className="flex items-center gap-1 text-status-warning font-bold">
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
                                    <div className="flex items-center gap-2 mb-3 text-low">
                                        {category === "Home_Essentials" ? <Home className="w-4 h-4" /> : <Store className="w-4 h-4" />}
                                        <h4 className="label-text text-xs">
                                            {category === "Home_Essentials" ? (lang === "en" ? "Home Essentials" : "Ghar ka Samaan") : (lang === "en" ? "Market Purchase" : "Bazaar se Kharidein")}
                                        </h4>
                                    </div>
                                    <div className="space-y-2">
                                        {items.map((item, idx) => (
                                            <div key={idx} className="flex justify-between items-center text-sm p-2 surface-elevated hairline hover:border-accent transition-colors duration-fast">
                                                <div>
                                                    <p className="font-bold text-hi">{item.name[lang]}</p>
                                                    <p className="text-xs text-faint">{item.quantity[lang]} &middot; {item.duration_days} Days</p>
                                                </div>
                                                <div className="text-right text-mid">
                                                    &#8377;{item.price_inr}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="mt-6 pt-4 hairline-t text-center">
                        <p className="label-text text-xs text-faint">* Prices are Average Market Estimates (INR) for {data.shopping_list.duration_days || 15} Days</p>
                    </div>
                </div>

                <button
                    id="export-btn"
                    onClick={downloadPDF}
                    disabled={pdfLoading}
                    className="btn-secondary w-full py-4 text-xs hover:bg-accent hover:text-white hover:border-accent disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {pdfLoading && (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                    )}
                    {pdfLoading ? "Exporting..." : "Download PDF"}
                </button>
            </div>

            {/* Hidden PDF Component */}
            <div className="absolute top-0 left-[-9999px]">
                <DietPlanPrint
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
