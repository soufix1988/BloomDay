import { Heart, Sparkles, Wallet, Flower2, Footprints, BookHeart, CalendarHeart, Newspaper, Menu, Instagram, Music2, Mail, ArrowRight, Star } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import heroGirl from "@/assets/hero-girl.jpg";
import featBudget from "@/assets/feat-budget.jpg";
import featYoga from "@/assets/feat-yoga.jpg";
import featSteps from "@/assets/feat-steps.jpg";
import featDiary from "@/assets/feat-diary.jpg";
import featCycle from "@/assets/feat-cycle.jpg";
import featBlog from "@/assets/feat-blog.jpg";

const tools = [
  { icon: Wallet, title: "Budget Planner", desc: "Glow up your finances with cute trackers & savings goals.", img: featBudget, tag: "Money" },
  { icon: Flower2, title: "Yoga Flows", desc: "Daily yoga & stretches to feel soft, strong and centered.", img: featYoga, tag: "Body" },
  { icon: Footprints, title: "Steps Tracker", desc: "Walk it out, queen. Count steps & earn pretty rewards.", img: featSteps, tag: "Active" },
  { icon: BookHeart, title: "Dreamy Diary", desc: "Pour your heart out in a private, glittery journal.", img: featDiary, tag: "Mind" },
  { icon: CalendarHeart, title: "Cycle Tracker", desc: "Know your flow — moods, symptoms & predictions.", img: featCycle, tag: "Cycle" },
  { icon: Newspaper, title: "Bloom Blog", desc: "Tips, stories & rituals for the modern girl.", img: featBlog, tag: "Read" },
];

function SparkleIcon({ className = "" }: { className?: string }) {
  return <Sparkles className={`absolute text-primary animate-sparkle ${className}`} />;
}

export default function Landing() {
  const [email, setEmail] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen overflow-x-hidden relative">
      <SparkleIcon className="top-20 left-4 size-4" />
      <SparkleIcon className="top-40 right-6 size-5" />
      <SparkleIcon className="top-[55%] left-2 size-3" />

      <div className="bg-gradient-pink text-primary-foreground text-xs sm:text-sm py-2 text-center font-semibold tracking-wide">
        ✿ NEW! Bloom Premium is here — get 20% off today ✿
      </div>

      <header className="sticky top-0 z-40 bg-card/80 backdrop-blur border-b border-secondary">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <a href="#" className="flex items-center gap-2">
            <div className="size-9 rounded-full bg-gradient-pink grid place-items-center shadow-soft">
              <Flower2 className="size-5 text-primary-foreground" />
            </div>
            <span className="font-display text-2xl text-gradient-pink leading-none">Bloom</span>
          </a>
          <nav className="hidden md:flex items-center gap-7 text-sm font-semibold text-secondary-foreground">
            <a href="#tools" className="hover:text-primary">Tools</a>
            <a href="#bestsellers" className="hover:text-primary">Favorites</a>
            <a href="#blog" className="hover:text-primary">Blog</a>
            <a href="#subscribe" className="hover:text-primary">Subscribe</a>
          </nav>
          <div className="flex items-center gap-2">
            <a href="#" aria-label="Instagram" className="size-9 grid place-items-center rounded-full bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground transition"><Instagram className="size-4"/></a>
            <a href="#" aria-label="TikTok" className="hidden sm:grid size-9 place-items-center rounded-full bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground transition"><Music2 className="size-4"/></a>
            <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden size-9 grid place-items-center rounded-full bg-secondary text-secondary-foreground">
              <Menu className="size-4"/>
            </button>
          </div>
        </div>
        {menuOpen && (
          <div className="md:hidden border-t border-secondary bg-card px-4 py-3 flex flex-col gap-3 text-sm font-semibold">
            <a href="#tools" onClick={() => setMenuOpen(false)}>Tools</a>
            <a href="#bestsellers" onClick={() => setMenuOpen(false)}>Favorites</a>
            <a href="#blog" onClick={() => setMenuOpen(false)}>Blog</a>
            <a href="#subscribe" onClick={() => setMenuOpen(false)}>Subscribe</a>
          </div>
        )}
      </header>

      <section className="relative px-4 pt-8 pb-16 bg-dots">
        <div className="max-w-6xl mx-auto bg-gradient-hero rounded-[2.5rem] p-6 sm:p-10 md:p-14 relative overflow-hidden shadow-pink border-pop">
          <div className="absolute -top-20 -right-20 size-60 rounded-full bg-sunburst opacity-30 animate-spin-slow" />
          <Heart className="absolute top-6 right-8 size-6 text-primary fill-primary animate-float" />
          <Heart className="absolute bottom-10 left-8 size-5 text-hot fill-hot animate-float" style={{animationDelay:'1s'}} />
          <Sparkles className="absolute top-12 left-12 size-5 text-primary-foreground/70 animate-sparkle" />

          <div className="grid md:grid-cols-2 gap-8 items-center relative">
            <div className="relative order-2 md:order-1">
              <div className="absolute inset-0 -m-4 bg-bubble animate-blob opacity-90" />
              <img
                src={heroGirl}
                alt="A happy girl ready to bloom"
                width={1024} height={1024}
                className="relative w-full max-w-sm mx-auto aspect-square object-cover animate-blob shadow-pink"
              />
              <Sparkles className="absolute -top-2 -right-2 size-8 text-primary-foreground animate-sparkle" />
            </div>

            <div className="order-1 md:order-2 text-center md:text-left">
              <span className="inline-flex items-center gap-1 bg-card text-primary text-xs font-bold px-3 py-1 rounded-full shadow-soft">
                <Sparkles className="size-3"/> For every girl, every day
              </span>
              <h1 className="font-display text-6xl sm:text-7xl md:text-8xl text-gradient-pink mt-4 leading-[0.95] drop-shadow-sm">
                Bloom
              </h1>
              <p className="font-script text-2xl sm:text-3xl text-hot mt-2">your softest era starts here</p>
              <p className="mt-5 text-base sm:text-lg text-secondary-foreground/90 max-w-md mx-auto md:mx-0">
                The cutest little app packed with tools for the modern girl — budgets, yoga, steps, diaries, cycles & feel-good reads. All in pink. 💕
              </p>
              <div className="mt-7 flex flex-wrap gap-3 justify-center md:justify-start">
                <Link to="/" className="inline-flex items-center gap-2 bg-gradient-pink text-primary-foreground font-bold px-6 py-3 rounded-full shadow-pink hover:scale-105 transition">
                  Open the App <ArrowRight className="size-4"/>
                </Link>
                <a href="#subscribe" className="inline-flex items-center gap-2 bg-card text-primary font-bold px-6 py-3 rounded-full border-2 border-primary hover:bg-primary hover:text-primary-foreground transition">
                  Join Bloom
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 -mt-6 relative z-10">
        <div className="max-w-5xl mx-auto bg-card rounded-3xl shadow-soft p-4 sm:p-6 grid grid-cols-3 sm:grid-cols-6 gap-3 border-pop">
          {tools.map(({ icon: Icon, title }) => (
            <a key={title} href="#tools" className="group flex flex-col items-center gap-2 p-2 rounded-2xl hover:bg-blush transition">
              <div className="size-12 sm:size-14 rounded-full bg-gradient-pink grid place-items-center shadow-soft group-hover:scale-110 transition border-2 border-card">
                <Icon className="size-6 text-primary-foreground"/>
              </div>
              <span className="text-[10px] sm:text-xs font-bold text-secondary-foreground text-center leading-tight">{title}</span>
            </a>
          ))}
        </div>
      </section>

      <section className="px-4 py-10">
        <div className="max-w-6xl mx-auto bg-stripes animate-stripes text-primary-foreground rounded-2xl py-6 px-4 grid grid-cols-3 text-center text-xs sm:text-base font-black border-pop">
          <div className="px-2 drop-shadow">✨ NEW DROP</div>
          <div className="px-2 drop-shadow">💕 20% OFF TODAY</div>
          <div className="px-2 drop-shadow">🚀 50K GIRLS</div>
        </div>
      </section>

      <section id="tools" className="px-4 py-16 bg-checker relative">
        <div className="max-w-3xl mx-auto mb-12 relative z-10">
          <div className="bg-card rounded-3xl px-6 py-8 sm:px-10 sm:py-10 text-center shadow-pink border-pop">
            <p className="font-script text-2xl text-hot">all your faves in one place</p>
            <h2 className="font-display text-4xl sm:text-5xl text-gradient-pink mt-2">Tools to Help You Bloom</h2>
            <p className="text-secondary-foreground mt-4 max-w-xl mx-auto">Six dreamy little tools designed to make every part of your day softer, prettier and easier.</p>
          </div>
        </div>

        <div id="bestsellers" className="max-w-6xl mx-auto grid sm:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
          {tools.map(({ icon: Icon, title, desc, img, tag }, i) => (
            <article key={title} className={`group bg-card rounded-3xl overflow-hidden shadow-soft hover:shadow-pink transition hover:-translate-y-1 border-pop ${i % 2 === 0 ? '' : 'rotate-[-1deg] hover:rotate-0'}`}>
              <div className="relative aspect-[4/3] overflow-hidden">
                <img src={img} alt={title} width={640} height={480} loading="lazy" className="w-full h-full object-cover group-hover:scale-110 transition duration-700"/>
                <span className="absolute top-3 left-3 bg-card text-primary text-xs font-black px-3 py-1 rounded-full shadow-soft border-2 border-primary uppercase tracking-wide">{tag}</span>
                <div className="absolute bottom-3 right-3 size-12 rounded-full bg-gradient-pink grid place-items-center shadow-pink border-2 border-card">
                  <Icon className="size-6 text-primary-foreground"/>
                </div>
              </div>
              <div className="p-5">
                <h3 className="font-display text-2xl text-primary">{title}</h3>
                <p className="text-sm text-secondary-foreground/80 mt-2">{desc}</p>
                <a href="#" className="inline-flex items-center gap-1 mt-4 text-hot font-bold text-sm">
                  Open tool <ArrowRight className="size-4"/>
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="blog" className="px-4 py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-sunburst opacity-20 animate-spin-slow" />
        <div className="max-w-4xl mx-auto bg-card rounded-3xl p-8 sm:p-12 text-center shadow-pink relative overflow-hidden border-pop">
          <Heart className="absolute top-6 left-6 size-5 text-primary fill-primary"/>
          <Heart className="absolute bottom-6 right-6 size-5 text-hot fill-hot"/>
          <div className="flex justify-center gap-1 mb-4">
            {Array.from({length:5}).map((_,i)=>(<Star key={i} className="size-5 text-primary fill-primary"/>))}
          </div>
          <p className="font-script text-3xl sm:text-4xl text-hot">"Bloom feels like a hug in app form 💖"</p>
          <p className="mt-3 text-secondary-foreground/80 text-sm">— Lily, 22 · loved by 50,000+ girls worldwide</p>
        </div>
      </section>

      <section id="subscribe" className="px-4 py-12 bg-dots-lg">
        <div className="max-w-4xl mx-auto bg-gradient-pink rounded-[2.5rem] p-8 sm:p-12 text-center text-primary-foreground shadow-pink relative overflow-hidden border-pop">
          <Sparkles className="absolute top-6 left-8 size-6 animate-sparkle"/>
          <Sparkles className="absolute bottom-8 right-10 size-5 animate-sparkle" style={{animationDelay:'.8s'}}/>
          <div className="inline-flex size-14 rounded-full bg-card text-primary items-center justify-center mb-4 shadow-pink">
            <Mail className="size-6"/>
          </div>
          <h2 className="font-display text-4xl sm:text-5xl">Subscribe</h2>
          <p className="font-script text-2xl mt-1">to our pink little newsletter</p>
          <p className="mt-3 opacity-90 text-sm sm:text-base">Weekly tips, free printables & secret discounts — straight to your inbox.</p>
          <form onSubmit={(e)=>{e.preventDefault(); setEmail("");}} className="mt-6 flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email" required value={email} onChange={(e)=>setEmail(e.target.value)}
              placeholder="your@email.com"
              className="flex-1 rounded-full px-5 py-3 text-foreground bg-card placeholder:text-muted-foreground focus:outline-none focus:ring-4 focus:ring-card/50"
            />
            <button className="bg-card text-primary font-bold px-6 py-3 rounded-full hover:scale-105 transition shadow-soft">
              Join 💕
            </button>
          </form>
        </div>
      </section>

      <footer className="mt-4">
        <div className="bg-stripes h-4 w-full" />
        <div className="bg-card px-4 pb-10 pt-8">
          <div className="max-w-6xl mx-auto text-center">
            <div className="flex justify-center items-center gap-2 mb-3">
              <Flower2 className="size-5 text-primary"/>
              <span className="font-display text-2xl text-gradient-pink">Bloom</span>
            </div>
            <p className="text-xs text-secondary-foreground/70">© {new Date().getFullYear()} Bloom · Made with 💕 for girls everywhere</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
