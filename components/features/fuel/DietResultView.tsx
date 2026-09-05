"use client";

import React, { useRef, useState, useMemo } from "react";
import {
  Utensils,
  ShoppingCart,
  IndianRupee,
  Home,
  Store,
  RefreshCw,
  Download,
  Calendar,
  ChevronDown,
  ChevronUp,
  Check,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import DietPlanPrint from "./DietPlanPrint";
import type { DietPlan } from "@/lib/fuel-types";

type Lang = "en" | "hi";
type TimelineUnit = "days" | "weeks" | "months" | "years";
type ActiveTab = "meals" | "groceries" | "timeline";

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
  data,
  lang,
  onLangChange,
  timelineUnit,
  onTimelineUnitChange,
  mode,
  biometrics,
}: DietResultViewProps) {
  const missionRef = useRef<HTMLDivElement>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>("meals");
  const [expandedRecipes, setExpandedRecipes] = useState<Record<number, boolean>>({});
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  // Compute total daily macros across meals
  const totals = useMemo(() => {
    return data.meal_plan.reduce(
      (acc, meal) => ({
        calories: acc.calories + (meal.calories || 0),
        protein: acc.protein + (meal.protein || 0),
        carbs: acc.carbs + (meal.carbs || 0),
        fats: acc.fats + (meal.fats || 0),
        fiber: acc.fiber + (meal.fiber || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0 }
    );
  }, [data.meal_plan]);

  const toggleRecipe = (index: number) => {
    setExpandedRecipes((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const toggleCheckItem = (id: string) => {
    setCheckedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const downloadPDF = async () => {
    if (!missionRef.current) return;
    setPdfLoading(true);

    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);

      const canvas = await html2canvas(missionRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      pdf.save(`Brothers_Fitness_Diet_Plan_${new Date().toISOString().split("T")[0]}.pdf`);
      toast.success("Diet plan PDF exported successfully!");
    } catch (err) {
      console.error("PDF export failed:", err);
      toast.error("PDF export failed. Please try again.");
    } finally {
      setPdfLoading(false);
    }
  };

  const modeBadge = {
    bulk: { label: "Muscle Gain Protocol", color: "text-status-warning bg-status-warning/10 border-status-warning/30" },
    cut: { label: "Fat Shred Protocol", color: "text-status-danger bg-status-danger/10 border-status-danger/30" },
    maintain: { label: "Performance Maintenance", color: "text-status-success bg-status-success/10 border-status-success/30" },
  }[mode] || { label: "Nutrition Protocol", color: "text-accent bg-accent/10 border-accent/30" };

  return (
    <div className="space-y-6 select-none animate-fade-in">
      
      {/* 1. TOP DOCKED CONTROL BAR */}
      <div className="bg-surface-card border border-surface-border rounded-2xl p-3.5 sm:p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
          <span className={`px-3 py-1 text-xs font-bold uppercase rounded-full border ${modeBadge.color}`}>
            {modeBadge.label}
          </span>
          {data.user_inputs_summary?.diet_type && (
            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-surface-soft border border-surface-border text-hi">
              {data.user_inputs_summary.diet_type}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          {/* Language Switcher */}
          <div className="flex items-center rounded-full bg-surface-soft border border-surface-border p-0.5">
            <button
              onClick={() => onLangChange("en")}
              className={`px-3 py-1 text-xs font-semibold rounded-full transition-all duration-150 ${
                lang === "en" ? "bg-accent text-white shadow-xs" : "text-mid hover:text-hi"
              }`}
            >
              English
            </button>
            <button
              onClick={() => onLangChange("hi")}
              className={`px-3 py-1 text-xs font-semibold rounded-full transition-all duration-150 ${
                lang === "hi" ? "bg-accent text-white shadow-xs" : "text-mid hover:text-hi"
              }`}
            >
              हिन्दी
            </button>
          </div>

          {/* Export PDF Button */}
          <button
            id="export-btn"
            onClick={downloadPDF}
            disabled={pdfLoading}
            className="px-4 py-2 text-xs font-bold text-white bg-accent hover:bg-accent-hover active:scale-95 transition-all duration-150 rounded-full flex items-center gap-1.5 shadow-sm disabled:opacity-50"
          >
            {pdfLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            <span>{pdfLoading ? "Exporting..." : "Download PDF"}</span>
          </button>
        </div>
      </div>

      {/* 2. STRATEGY SUMMARY & MACRO DASHBOARD */}
      <div className="bg-surface-card border border-surface-border rounded-2xl p-5 sm:p-7 shadow-sm space-y-6">
        <div>
          <div className="flex items-center gap-2 text-accent text-xs font-bold uppercase tracking-widest mb-2">
            <Sparkles className="w-4 h-4" />
            <span>Personalized Nutrition Strategy</span>
          </div>
          <p className="text-sm sm:text-base text-hi leading-relaxed font-normal">
            &ldquo;{data.summary[lang]}&rdquo;
          </p>
        </div>

        {/* Biometrics Summary Row */}
        {data.user_inputs_summary && (
          <div className="pt-4 border-t border-surface-border/70 flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-mid">
            <span className="px-2.5 py-1 rounded-lg bg-surface-soft border border-surface-border">
              {data.user_inputs_summary.gender}, {data.user_inputs_summary.age} yrs
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-surface-soft border border-surface-border">
              Height: {data.user_inputs_summary.height} cm
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-surface-soft border border-surface-border">
              Current: <strong className="text-hi">{data.user_inputs_summary.current_weight} kg</strong>
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-accent shrink-0" />
            <span className="px-2.5 py-1 rounded-lg bg-surface-soft border border-accent/40 text-accent font-bold">
              Target: {data.user_inputs_summary.target_weight} kg
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-surface-soft border border-surface-border">
              Rate: {data.user_inputs_summary.weight_change_rate || "0.5"} kg/wk
            </span>
          </div>
        )}

        {/* 4-Stat Macro Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
          {/* Daily Target */}
          <div className="p-3.5 rounded-xl bg-surface-soft border border-surface-border flex flex-col justify-between">
            <span className="text-[11px] font-semibold text-mid uppercase tracking-wide">Daily Target</span>
            <div className="flex items-baseline gap-1 mt-2">
              <span className="text-2xl sm:text-3xl font-black text-accent tabular-nums">
                {data.transformation_timeline?.daily_calories || totals.calories}
              </span>
              <span className="text-xs font-bold text-mid">kcal</span>
            </div>
          </div>

          {/* Protein */}
          <div className="p-3.5 rounded-xl bg-surface-soft border border-surface-border flex flex-col justify-between">
            <span className="text-[11px] font-semibold text-mid uppercase tracking-wide">Protein (Daily)</span>
            <div className="flex items-baseline gap-1 mt-2">
              <span className="text-2xl sm:text-3xl font-black text-status-warning tabular-nums">
                {totals.protein}
              </span>
              <span className="text-xs font-bold text-mid">g</span>
            </div>
          </div>

          {/* Carbohydrates */}
          <div className="p-3.5 rounded-xl bg-surface-soft border border-surface-border flex flex-col justify-between">
            <span className="text-[11px] font-semibold text-mid uppercase tracking-wide">Carbohydrates</span>
            <div className="flex items-baseline gap-1 mt-2">
              <span className="text-2xl sm:text-3xl font-black text-hi tabular-nums">
                {totals.carbs}
              </span>
              <span className="text-xs font-bold text-mid">g</span>
            </div>
          </div>

          {/* Healthy Fats */}
          <div className="p-3.5 rounded-xl bg-surface-soft border border-surface-border flex flex-col justify-between">
            <span className="text-[11px] font-semibold text-mid uppercase tracking-wide">Healthy Fats</span>
            <div className="flex items-baseline gap-1 mt-2">
              <span className="text-2xl sm:text-3xl font-black text-mid tabular-nums">
                {totals.fats}
              </span>
              <span className="text-xs font-bold text-mid">g</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. INTERACTIVE SEGMENTED TABS */}
      <div className="flex items-center justify-center p-1 rounded-2xl bg-surface-card border border-surface-border max-w-md mx-auto">
        <button
          onClick={() => setActiveTab("meals")}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all duration-150 flex items-center justify-center gap-1.5 ${
            activeTab === "meals" ? "bg-accent text-white shadow-xs" : "text-mid hover:text-hi"
          }`}
        >
          <Utensils className="w-3.5 h-3.5" />
          <span>Daily Meals ({data.meal_plan.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("groceries")}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all duration-150 flex items-center justify-center gap-1.5 ${
            activeTab === "groceries" ? "bg-accent text-white shadow-xs" : "text-mid hover:text-hi"
          }`}
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          <span>Shopping List</span>
        </button>

        <button
          onClick={() => setActiveTab("timeline")}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all duration-150 flex items-center justify-center gap-1.5 ${
            activeTab === "timeline" ? "bg-accent text-white shadow-xs" : "text-mid hover:text-hi"
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Timeline</span>
        </button>
      </div>

      {/* 4. TAB CONTENTS */}

      {/* --- TAB 1: DAILY MEALS --- */}
      {activeTab === "meals" && (
        <div className="space-y-4">
          {data.meal_plan.map((meal, idx) => {
            const isExpanded = !!expandedRecipes[idx];
            return (
              <div
                key={idx}
                className="bg-surface-card border border-surface-border rounded-2xl p-4 sm:p-5 hover:border-accent/40 transition-all duration-150 shadow-sm"
              >
                {/* Meal Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-accent text-white text-xs font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div>
                      <h4 className="font-bold text-sm sm:text-base text-hi uppercase">
                        {meal.name?.[lang] || meal.name?.en || `Meal ${idx + 1}`}
                      </h4>
                      {meal.timing && (
                        <span className="text-[11px] font-semibold text-mid block">
                          {meal.timing}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Calorie & Macro Badges */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-2.5 py-1 rounded-full bg-accent/10 border border-accent/30 text-accent font-bold text-xs">
                      {meal.calories} kcal
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-surface-soft border border-surface-border text-[11px] font-medium text-mid">
                      P: {meal.protein}g &bull; C: {meal.carbs}g &bull; F: {meal.fats}g
                    </span>
                  </div>
                </div>

                {/* Description */}
                {meal.description?.[lang] && (
                  <p className="text-xs sm:text-sm text-mid leading-relaxed mb-3">
                    {meal.description[lang]}
                  </p>
                )}

                {/* Ingredients Pills */}
                {meal.ingredients && meal.ingredients.length > 0 && (
                  <div className="mb-3">
                    <span className="text-[10px] font-bold text-mid/80 uppercase tracking-widest block mb-1.5">
                      Key Ingredients
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {meal.ingredients.map((ing, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 rounded-lg bg-surface-soft border border-surface-border text-xs text-hi font-medium"
                        >
                          {ing.name?.[lang] || ing.name?.en} ({ing.quantity})
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Expandable Recipe Section */}
                {meal.recipe?.[lang] && (
                  <div className="pt-2 border-t border-surface-border/60">
                    <button
                      onClick={() => toggleRecipe(idx)}
                      className="text-xs font-semibold text-accent hover:underline inline-flex items-center gap-1 transition-colors"
                    >
                      <span>{isExpanded ? "Hide Recipe & Method" : "View Cooking Method"}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                    {isExpanded && (
                      <div className="mt-2.5 p-3.5 rounded-xl bg-surface-soft border border-surface-border text-xs text-mid leading-relaxed animate-fade-in">
                        {meal.recipe[lang]}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* --- TAB 2: GROCERY LIST --- */}
      {activeTab === "groceries" && (
        <div className="bg-surface-card border border-surface-border rounded-2xl p-5 sm:p-7 shadow-sm space-y-6">
          {/* Grocery Top Stat Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-border/70">
            <div>
              <h3 className="font-bold text-lg text-hi">15-Day Grocery Supply List</h3>
              <p className="text-xs text-mid">
                Local Indian market prices in Lakhnadon. Tap any item to check it off as purchased.
              </p>
            </div>

            <div className="flex items-center gap-4 shrink-0">
              <div className="text-right">
                <span className="text-[10px] uppercase tracking-wider text-mid block">Estimated Total</span>
                <span className="text-xl sm:text-2xl font-black text-status-success flex items-center justify-end gap-0.5">
                  <IndianRupee className="w-4 h-4" />
                  {data.shopping_list.total_estimated_cost}
                </span>
              </div>
              <div className="h-8 w-px bg-surface-border" />
              <div className="text-right">
                <span className="text-[10px] uppercase tracking-wider text-mid block">Daily Average</span>
                <span className="text-sm sm:text-base font-bold text-mid flex items-center justify-end gap-0.5">
                  <IndianRupee className="w-3.5 h-3.5" />
                  {data.shopping_list.average_daily_cost ||
                    Math.round(data.shopping_list.total_estimated_cost / (data.shopping_list.duration_days || 15))}
                </span>
              </div>
            </div>
          </div>

          {/* 2-Column Category Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(["Home_Essentials", "Market_Purchase"] as const).map((category) => {
              const items = data.shopping_list.items.filter((i) => i.category === category);
              if (items.length === 0) return null;

              const isHome = category === "Home_Essentials";
              const title = isHome
                ? lang === "en"
                  ? "Home Essentials (Pantry & Spices)"
                  : "घर का सामान (मसाले व तेल)"
                : lang === "en"
                ? "Market Purchase (Fresh & Proteins)"
                : "बाज़ार से खरीदें (ताज़ा व प्रोटीन)";

              return (
                <div key={category} className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-mid">
                    {isHome ? <Home className="w-4 h-4 text-accent" /> : <Store className="w-4 h-4 text-accent" />}
                    <span>{title}</span>
                  </div>

                  <div className="space-y-2">
                    {items.map((item, idx) => {
                      const itemId = `${category}-${idx}`;
                      const isChecked = !!checkedItems[itemId];
                      return (
                        <div
                          key={idx}
                          onClick={() => toggleCheckItem(itemId)}
                          className={`p-3 rounded-xl border transition-all duration-150 cursor-pointer flex items-center justify-between gap-3 ${
                            isChecked
                              ? "bg-surface-soft/50 border-surface-border opacity-50 line-through"
                              : "bg-surface-soft border-surface-border hover:border-accent/50"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                                isChecked ? "bg-accent border-accent text-white" : "border-surface-border bg-surface-card"
                              }`}
                            >
                              {isChecked && <Check className="w-3 h-3" />}
                            </div>
                            <div className="truncate">
                              <span className="font-semibold text-xs sm:text-sm text-hi block truncate">
                                {item.name[lang] || item.name.en}
                              </span>
                              <span className="text-[11px] text-mid truncate block">
                                {item.quantity[lang] || item.quantity.en} &bull; {item.duration_days} Days
                              </span>
                            </div>
                          </div>

                          <span className="text-xs font-bold text-mid shrink-0">
                            &#8377;{item.price_inr}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* --- TAB 3: TIMELINE & MILESTONES --- */}
      {activeTab === "timeline" && data.transformation_timeline && (
        <div className="bg-surface-card border border-surface-border rounded-2xl p-5 sm:p-7 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-border/70">
            <div>
              <h3 className="font-bold text-lg text-hi">Estimated Transformation Timeline</h3>
              <p className="text-xs text-mid">
                Based on a sustainable {data.transformation_timeline.weekly_change} rate of change.
              </p>
            </div>

            {/* Timeline Unit Switcher */}
            <div className="flex items-center rounded-full bg-surface-soft border border-surface-border p-0.5 self-start sm:self-auto">
              {(["days", "weeks", "months"] as const).map((unit) => (
                <button
                  key={unit}
                  onClick={() => onTimelineUnitChange(unit)}
                  className={`px-3 py-1 text-xs font-semibold rounded-full capitalize transition-all duration-150 ${
                    timelineUnit === unit ? "bg-accent text-white shadow-xs" : "text-mid hover:text-hi"
                  }`}
                >
                  {unit}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-surface-soft border border-surface-border">
              <span className="text-xs text-mid font-semibold uppercase tracking-wider block mb-1">
                Estimated Duration
              </span>
              <p className="text-3xl font-black text-hi">
                {timelineUnit === "days" &&
                  (data.transformation_timeline.total_days ||
                    Math.round((data.transformation_timeline.total_weeks || 0) * 7))}
                {timelineUnit === "weeks" &&
                  (data.transformation_timeline.total_weeks || data.transformation_timeline.estimated_duration)}
                {timelineUnit === "months" &&
                  Math.round((data.transformation_timeline.total_weeks || 0) / 4.33)}
                <span className="text-sm text-mid font-bold ml-1.5 capitalize">{timelineUnit}</span>
              </p>
            </div>

            <div className="p-4 rounded-xl bg-surface-soft border border-surface-border">
              <span className="text-xs text-mid font-semibold uppercase tracking-wider block mb-1">
                Pace of Progress
              </span>
              <p className="text-3xl font-black text-status-success">
                {data.transformation_timeline.weekly_change}
                <span className="text-sm text-mid font-bold ml-1.5">/ week</span>
              </p>
            </div>

            <div className="p-4 rounded-xl bg-surface-soft border border-surface-border">
              <span className="text-xs text-mid font-semibold uppercase tracking-wider block mb-1">
                Daily Intake
              </span>
              <p className="text-3xl font-black text-accent">
                {data.transformation_timeline.daily_calories}
                <span className="text-sm text-mid font-bold ml-1.5">kcal</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Print / PDF Layout Component */}
      <div className="absolute top-0 left-[-9999px]">
        <DietPlanPrint
          ref={missionRef}
          data={data}
          lang={lang}
          biometrics={{
            currentWeight: biometrics.currentWeight,
            targetWeight: biometrics.targetWeight,
            goal: `I want to ${mode === "bulk" ? "gain muscle mass" : "shred fat"} effectively.`,
          }}
        />
      </div>
    </div>
  );
}

export { DietResultView };
