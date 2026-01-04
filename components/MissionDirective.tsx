"use client";

import React, { forwardRef } from 'react';
import { ShoppingCart, Utensils, Zap } from 'lucide-react';

// Reusing types from page.tsx (ideally move to a types.ts file)
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
    meal_plan: {
        name: LocalizedText;
        calories: number;
        protein: number;
        carbs: number;
        fats: number;
        description: LocalizedText;
    }[];
};

interface MissionDirectiveProps {
    data: DietPlan;
    lang: "en" | "hi";
    biometrics: {
        name?: string;
        currentWeight: string;
        targetWeight: string;
        goal: string;
    };
}

const MissionDirective = forwardRef<HTMLDivElement, MissionDirectiveProps>(({ data, lang, biometrics }, ref) => {
    // Sanitize HTML to prevent XSS in PDF
    const sanitizeHTML = (text: string): string => {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;');
    };

    return (
        <div ref={ref} className="bg-white text-black p-8 max-w-[800px] mx-auto font-mono text-sm leading-relaxed hidden-print-view">
            {/* Header */}
            <div className="border-b-4 border-black pb-4 mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black uppercase tracking-tighter">Mission Directive</h1>
                    <p className="text-xs uppercase tracking-widest mt-1">BroFit Tactical Fitness Systems // Classified</p>
                </div>
                <div className="text-right">
                    <p className="font-bold text-lg">PROT: {biometrics.goal.toUpperCase().slice(0, 10)}...</p>
                    <p className="text-xs">ID: {new Date().toLocaleDateString().replace(/\//g, '')}-{Math.floor(Math.random() * 9999)}</p>
                </div>
            </div>

            {/* Tactical Brief */}
            <div className="mb-8 border border-black p-4">
                <h3 className="font-black uppercase text-lg mb-2 flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    Your Plan
                </h3>
                <p className="italic">&quot;{data.tactical_brief[lang]}&quot;</p>
            </div>

            {/* Biometrics Snapshot */}
            <div className="grid grid-cols-3 gap-4 mb-8 text-xs uppercase tracking-wider border-b border-gray-300 pb-8">
                <div>
                    <span className="block text-gray-500">Current Load</span>
                    <span className="font-black text-lg">{sanitizeHTML(biometrics.currentWeight)} KG</span>
                </div>
                <div>
                    <span className="block text-gray-500">Target Load</span>
                    <span className="font-black text-lg">{sanitizeHTML(biometrics.targetWeight)} KG</span>
                </div>
                <div>
                    <span className="block text-gray-500">Est. Cost</span>
                    <span className="font-black text-lg">₹{data.shopping_list.total_estimated_cost}</span>
                </div>
            </div>

            {/* Daily Protocol (Meals) */}
            <div className="mb-8">
                <h3 className="font-black uppercase text-lg mb-4 border-b border-black pb-2 flex items-center gap-2">
                    <Utensils className="w-5 h-5" />
                    Daily Fuel Protocol
                </h3>
                <div className="space-y-4">
                    {data.meal_plan.map((meal, idx) => (
                        <div key={idx} className="flex border-b border-gray-200 pb-4">
                            <div className="w-12 font-black text-xl text-gray-300">{(idx + 1).toString().padStart(2, '0')}</div>
                            <div className="flex-1">
                                <div className="flex justify-between items-baseline mb-1">
                                    <h4 className="font-bold uppercase text-base">{meal.name?.[lang] || "Standard Ration"}</h4>
                                    <span className="font-bold text-xs bg-black text-white px-2 py-0.5 rounded-full">{meal.calories} KCAL</span>
                                </div>
                                <p className="text-gray-600 mb-2">{meal.description?.[lang] || "N/A"}</p>
                                <div className="flex gap-3 text-[10px] font-bold text-gray-500 uppercase">
                                    <span>PRO: {meal.protein}g</span>
                                    <span>CARB: {meal.carbs}g</span>
                                    <span>FAT: {meal.fats}g</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Supply Manifest (Shopping) */}
            <div className="mb-8">
                <div className="flex justify-between items-center mb-4 border-b border-black pb-2">
                    <h3 className="font-black uppercase text-lg flex items-center gap-2">
                        <ShoppingCart className="w-5 h-5" />
                        Supply Manifest
                    </h3>
                    <span className="font-bold text-xs bg-gray-200 px-2 py-1 rounded">7 DAY CYCLE</span>
                </div>

                <div className="grid grid-cols-2 gap-8">
                    {/* Market */}
                    <div>
                        <h4 className="font-bold uppercase text-xs mb-3 text-gray-500">Market Purchase</h4>
                        <ul className="space-y-2 text-sm">
                            {data.shopping_list.items.filter(i => i.category === "Market_Purchase").map((item, idx) => (
                                <li key={idx} className="flex justify-between border-b border-dotted border-gray-300 pb-1">
                                    <span>{item.name[lang]}</span>
                                    <span className="font-bold">{item.quantity[lang]}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                    {/* Home */}
                    <div>
                        <h4 className="font-bold uppercase text-xs mb-3 text-gray-500">Home Essentials</h4>
                        <ul className="space-y-2 text-sm">
                            {data.shopping_list.items.filter(i => i.category === "Home_Essentials").map((item, idx) => (
                                <li key={idx} className="flex justify-between border-b border-dotted border-gray-300 pb-1">
                                    <span>{item.name[lang]}</span>
                                    <span className="font-bold">{item.quantity[lang]}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="text-center pt-8 border-t-2 border-black mt-12">
                <p className="font-black text-2xl uppercase tracking-[0.5em] text-gray-300">BroFit Tactical</p>
                <p className="text-[10px] uppercase text-gray-400 mt-2">Generated by AI Neural Core v3.1 // Authorized Personnel Only</p>
            </div>

        </div>
    );
});

MissionDirective.displayName = "MissionDirective";
export default MissionDirective;
