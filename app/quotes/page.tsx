"use client";

import { useState, useEffect } from "react";
import { Flame, Brain, Target, Laugh, Sparkles, ArrowLeft, Shuffle, Heart } from "lucide-react";
import Link from "next/link";

const quotes = {
  intensity: [
    "Go hard or go home.",
    "Light weight, baby! (Ronnie Coleman)",
    "Ain't nothin' but a peanut.",
    "Train insane or remain the same.",
    "Be the hardest worker in the room.",
    "Pain is weakness leaving the body.",
    "Shut up and squat.",
    "Unless you puke, faint, or die, keep going.",
    "Your workout is my warmup.",
    "Be a beast.",
    "Conquer the inner b*tch.",
    "Sweat is just fat crying.",
    "Leave it all on the floor.",
    "Squat till you walk funny.",
    "If the bar ain't bending, you're just pretending.",
    "Train like a beast, look like a beauty.",
    "I don't stop when I'm tired, I stop when I'm done.",
    "Get comfortable being uncomfortable.",
    "Go the extra mile. It's never crowded.",
    "Make your haters your motivators.",
    "Be stronger than your excuses.",
    "Nobody cares. Work harder.",
    "Suffer the pain of discipline or the pain of regret.",
    "Eat big, lift big, get big.",
    "The iron never lies.",
    "Weakness is a choice.",
    "Do it because they said you couldn't.",
    "Train like your worst enemy is watching.",
    "Blood, sweat, and respect. First two you give, last one you earn.",
    "Be unstoppable."
  ],
  mindset: [
    "Your only limit is you.",
    "Clear your mind of can't.",
    "Don't wish for it, work for it.",
    "The body achieves what the mind believes.",
    "Motivation gets you started. Habit keeps you going.",
    "Results happen over time, not overnight.",
    "Fall in love with the process.",
    "Success starts with self-discipline.",
    "Your body can stand almost anything. It's your mind you have to convince.",
    "What seems impossible today will become your warm-up tomorrow.",
    "Focus on the goal, not the obstacle.",
    "Discipline is doing what needs to be done, even if you don't want to.",
    "The only bad workout is the one that didn't happen.",
    "You don't find willpower, you create it.",
    "Excuses don't burn calories.",
    "Don't count the days, make the days count.",
    "Strength doesn't come from what you can do. It comes from overcoming the things you once thought you couldn't.",
    "If it doesn't challenge you, it doesn't change you.",
    "Strive for progress, not perfection.",
    "Willpower is a muscle. The more you use it, the stronger it gets.",
    "Action is the foundational key to all success.",
    "Dream big, lift big.",
    "Master your mindset and you'll master your body.",
    "Fit is not a destination, it is a way of life.",
    "A champion is someone who gets up when they can't.",
    "Rome wasn't built in a day, but they worked on it every single day.",
    "Don't look back, you're not going that way.",
    "Invest in yourself.",
    "Confidence comes from preparation.",
    "Doubt kills more dreams than failure ever will.",
    "Make yourself proud.",
    "The struggle is part of the story.",
    "Mind over muscle.",
    "Energy flows where attention goes.",
    "Be the best version of you."
  ],
  discipline: [
    "Discipline eats motivation for breakfast.",
    "Consistency is the key.",
    "Don't decrease the goal. Increase the effort.",
    "Stop stopping.",
    "One day or Day One. You decide.",
    "A one-hour workout is only 4% of your day. No excuses.",
    "Respect the training. Honor the commitment.",
    "Wake up. Workout. Look hot. Kick ass.",
    "Of course it's hard. It's supposed to be hard.",
    "Slow progress is still progress.",
    "Hustle for that muscle.",
    "You get what you work for, not what you wish for.",
    "Actions speak louder than coaches.",
    "Earn your shower.",
    "Push yourself, because no one else is going to do it for you.",
    "It's a slow process, but quitting won't speed it up.",
    "There is no elevator to success. You have to take the stairs.",
    "Obsession is what lazy people call dedication.",
    "Grind now. Shine later.",
    "Do something today that your future self will thank you for.",
    "Never miss a Monday.",
    "Less talk, more lifting.",
    "Show up even when you don't feel like it.",
    "Don't talk about it, be about it.",
    "Every rep counts.",
    "Commit to be fit.",
    "Sore today, strong tomorrow.",
    "The pain you feel today will be the strength you feel tomorrow.",
    "Champions keep playing until they get it right.",
    "Success doesn't come to you, you go to it.",
    "Work hard in silence. Let success be your noise.",
    "Create healthy habits, not restrictions.",
    "Stay consistent.",
    "Finish strong.",
    "Just do it.",
    "Look in the mirror. That's your competition.",
    "Working on my masterpiece.",
    "Running on caffeine and ambition.",
    "Fitness is like a relationship. You can't cheat and expect it to work.",
    "Keep your squats low and your standards high.",
    "Good things come to those who sweat.",
    "Think of your workouts as important meetings you've scheduled with yourself.",
    "Be the girl/guy who decided to go for it.",
    "Health is wealth.",
    "Take care of your body. It's the only place you have to live.",
    "Fitness is 100% mental. Your body won't go where your mind doesn't push it.",
    "Every step is progress.",
    "Glow up in progress.",
    "Self-care is not selfish.",
    "Strong body, strong mind.",
    "Dedication doesn't have an off-season.",
    "Build a body you can be proud of.",
    "Your health is an investment, not an expense.",
    "Love yourself enough to live a healthy lifestyle.",
    "Change your body, change your life.",
    "Fitness is not about being better than someone else. It's about being better than you used to be.",
    "Eat for the body you want, not the body you have.",
    "Make it a lifestyle, not a duty.",
    "Be proud of how far you've come.",
    "The gym is open."
  ],
  funny: [
    "I lift things up and put them down.",
    "Gym hair, don't care.",
    "I run because I really like food.",
    "Exercise? I thought you said extra fries.",
    "My favorite machine at the gym is the vending machine. (Just kidding!)",
    "Running late is my cardio.",
    "I'm only here so I can eat more later.",
    "Life has its ups and downs. I call them squats.",
    "Squats? I thought you said shots!",
    "Does refusing to go to the gym count as resistance training?",
    "My warm-up is your workout.",
    "Rest day is the best day.",
    "Friends don't let friends skip leg day.",
    "I work out because punching people is frowned upon.",
    "Muscles are just vanity's way of showing off.",
    "Sweating like a sinner in church.",
    "Abs are made in the kitchen, but I can't find the recipe.",
    "I'm in a relationship with the gym. It's complicated.",
    "Burpees? You mean 'hurpees'.",
    "Is it heavy? Put it down. (Wait, that's not right).",
    "Cardio is hardio.",
    "I flexed and the sleeves fell off.",
    "Sore? Good.",
    "Weights before dates.",
    "Curls for the girls.",
    "Sun's out, guns out.",
    "Do I have abs yet?",
    "Taking a selfie is part of the workout, right?",
    "Everything hurts and I'm dying.",
    "If you still look cute after your workout, you didn't train hard enough.",
    "Running is a mental sport, and we are all insane.",
    "Fitness witness.",
    "I've got 99 problems, but the bench ain't one.",
    "Don't exercise to lose weight, exercise to eat cake.",
    "Gluten free? I'm glutton free.",
    "Summer bodies are made in winter.",
    "I don't sweat, I sparkle."
  ]
};

const categories = [
  { id: "intensity", name: "Pure Intensity", icon: <Flame className="w-5 h-5" />, color: "bg-red-500" },
  { id: "mindset", name: "Mindset", icon: <Brain className="w-5 h-5" />, color: "bg-purple-500" },
  { id: "discipline", name: "Discipline", icon: <Target className="w-5 h-5" />, color: "bg-blue-500" },
  { id: "funny", name: "Humor", icon: <Laugh className="w-5 h-5" />, color: "bg-yellow-500" }
];

export default function QuotesPage() {
  const [activeCategory, setActiveCategory] = useState<keyof typeof quotes>("intensity");
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [displayMode, setDisplayMode] = useState<"single" | "grid">("single");

  const currentQuotes = quotes[activeCategory];

  useEffect(() => {
    const saved = localStorage.getItem("favoriteQuotes");
    if (saved) setFavorites(JSON.parse(saved));
  }, []);

  const toggleFavorite = (quote: string) => {
    const newFavorites = favorites.includes(quote)
      ? favorites.filter(q => q !== quote)
      : [...favorites, quote];
    setFavorites(newFavorites);
    localStorage.setItem("favoriteQuotes", JSON.stringify(newFavorites));
  };

  const randomQuote = () => {
    setCurrentQuoteIndex(Math.floor(Math.random() * currentQuotes.length));
  };

  const nextQuote = () => {
    setCurrentQuoteIndex((prev) => (prev + 1) % currentQuotes.length);
  };

  useEffect(() => {
    setCurrentQuoteIndex(0);
  }, [activeCategory]);

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Static Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(rgba(215, 25, 33, 0.3) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(215, 25, 33, 0.3) 1px, transparent 1px)`,
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="p-6 md:p-8">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-white hover:text-gym-red transition-colors group">
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span className="font-mono text-sm uppercase tracking-wider">Back to Gym</span>
            </Link>

            <div className="flex gap-3">
              <button
                onClick={() => setDisplayMode(displayMode === "single" ? "grid" : "single")}
                className="p-3 border border-white/20 hover:border-gym-red hover:text-gym-red transition-all"
              >
                <Sparkles className="w-5 h-5" />
              </button>
              <button
                onClick={randomQuote}
                className="p-3 border border-white/20 hover:border-gym-red hover:text-gym-red transition-all"
              >
                <Shuffle className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Title */}
        <div className="text-center py-8">
          <h1 className="heading-display text-5xl md:text-7xl mb-4">
            DAILY FUEL
          </h1>
          <p className="font-mono text-sm tracking-ultra text-gray-400">
            QUOTES THAT FORGE CHAMPIONS
          </p>
        </div>

        {/* Category Tabs */}
        <div className="px-4 mb-8">
          <div className="max-w-4xl mx-auto flex flex-wrap gap-3 justify-center">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id as keyof typeof quotes)}
                className={`flex items-center gap-2 px-6 py-3 font-mono text-xs uppercase tracking-widest border transition-all ${activeCategory === cat.id
                  ? `${cat.color} text-white border-transparent`
                  : "bg-transparent text-gray-400 border-white/20 hover:border-white/40"
                  }`}
              >
                {cat.icon}
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Quotes Display */}
        <div className="flex-1 px-4 pb-8">
          {displayMode === "single" ? (
            <div className="max-w-5xl mx-auto">
              <div
                className="relative animate-in fade-in duration-500"
                key={`${activeCategory}-${currentQuoteIndex}`}
              >
                <div className="border-2 border-white/20 p-12 md:p-16 bg-white/5 backdrop-blur-sm">
                  <div
                    className="absolute top-4 right-4"
                    onClick={() => toggleFavorite(currentQuotes[currentQuoteIndex])}
                  >
                    <Heart
                      className={`w-6 h-6 cursor-pointer transition-colors ${favorites.includes(currentQuotes[currentQuoteIndex])
                        ? "fill-gym-red text-gym-red"
                        : "text-white/40 hover:text-white"
                        }`}
                    />
                  </div>

                  <p className="text-2xl md:text-4xl lg:text-5xl font-display font-bold text-center leading-relaxed">
                    &quot;{currentQuotes[currentQuoteIndex]}&quot;
                  </p>

                  <div className="flex justify-center gap-4 mt-12">
                    <button
                      onClick={nextQuote}
                      className="px-8 py-3 bg-gym-red text-white font-mono text-sm uppercase tracking-widest hover:bg-white hover:text-black transition-colors"
                    >
                      Next Quote
                    </button>
                  </div>

                  <p className="text-center text-sm font-mono text-gray-500 mt-8">
                    {currentQuoteIndex + 1} / {currentQuotes.length}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-7xl mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentQuotes.map((quote, index) => (
                <div
                  key={index}
                  className="border border-white/20 p-6 bg-white/5 backdrop-blur-sm relative group cursor-pointer hover:border-gym-red transition-colors"
                  onClick={() => {
                    setCurrentQuoteIndex(index);
                    setDisplayMode("single");
                  }}
                >
                  <div
                    className="absolute top-3 right-3"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(quote);
                    }}
                  >
                    <Heart
                      className={`w-4 h-4 transition-colors ${favorites.includes(quote) ? "fill-gym-red text-gym-red" : "text-white/20 hover:text-white"
                        }`}
                    />
                  </div>
                  <p className="text-sm md:text-base font-sans leading-relaxed pr-6">
                    &quot;{quote}&quot;
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
