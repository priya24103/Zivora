import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, ShieldCheck, Gavel, MessageCircle, TrendingUp, Award, Diamond, ChevronDown, Play } from "lucide-react";
import { motion, useScroll, useTransform } from "motion/react";
import { useRef, useState } from "react";
import ProductCard from "../components/ProductCard";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.7, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] } }),
};

const featuredDiamonds = [
  {
    id: "1",
    name: "Round Brilliant Diamond 2.5ct D VVS1",
    price: 45000,
    image: "https://images.unsplash.com/photo-1605100804567-1ffe942b5cd6?w=1920",
    carat: 2.5,
    cut: "Excellent",
    color: "D",
    clarity: "VVS1",
    certification: "GIA",
  },
  {
    id: "2",
    name: "Princess Cut Diamond 1.8ct E VS1",
    price: 28000,
    image: "https://images.unsplash.com/photo-1599707367072-cd6ada2bc375?w=800",
    carat: 1.8,
    cut: "Ideal",
    color: "E",
    clarity: "VS1",
    certification: "GIA",
  },
  {
    id: "3",
    name: "Cushion Cut Diamond 3.0ct F VVS2",
    price: 52000,
    image: "https://images.unsplash.com/photo-1638517747421-a1eb8b4c9828?w=800",
    carat: 3.0,
    cut: "Very Good",
    color: "F",
    clarity: "VVS2",
    certification: "AGS",
  },
  {
    id: "4",
    name: "Emerald Cut Diamond 2.2ct D IF",
    price: 65000,
    image: "https://images.unsplash.com/photo-1664044020180-b75bfddf9776?w=800",
    carat: 2.2,
    cut: "Excellent",
    color: "D",
    clarity: "IF",
    certification: "GIA",
  },
];

const categories = [
  {
    label: "Round Brilliant",
    desc: "The classic choice",
    image: "https://images.unsplash.com/photo-1605100804567-1ffe942b5cd6?w=1920",
    count: "2,400+ stones",
  },
  {
    label: "Princess Cut",
    desc: "Modern elegance",
    image: "https://images.unsplash.com/photo-1599707367072-cd6ada2bc375?w=800",
    count: "860+ stones",
  },
  {
    label: "Emerald Cut",
    desc: "Timeless luxury",
    image: "https://images.unsplash.com/photo-1638517747421-a1eb8b4c9828?w=800",
    count: "540+ stones",
  },
  {
    label: "Oval Shaped",
    desc: "Elongated beauty",
    image: "https://images.unsplash.com/photo-1664044020180-b75bfddf9776?w=800",
    count: "720+ stones",
  },
];

const features = [
  { icon: ShieldCheck, title: "GIA / AGS Certified", desc: "Every stone rigorously verified" },
  { icon: Gavel, title: "Live Auctions", desc: "Bid on exclusive rare pieces" },
  { icon: MessageCircle, title: "Direct Negotiation", desc: "Chat & offer with sellers" },
  { icon: Award, title: "White-Glove Service", desc: "Expert support at every step" },
];

const stats = [
  { value: "38,000+", label: "Diamonds Listed" },
  { value: "12,000+", label: "Happy Clients" },
  { value: "4.9★", label: "Average Rating" },
  { value: "180+", label: "Verified Sellers" },
];

export default function Home() {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  const [activeCategory, setActiveCategory] = useState(0);

  return (
    <div style={{ background: "#F7F3EF" }}>
      {/* ─── HERO ─────────────────────────────────────────────────────── */}
      <section ref={heroRef} className="relative h-screen min-h-[700px] flex items-center overflow-hidden" style={{ position: "relative" }}>
        <motion.div style={{ y: heroY }} className="absolute inset-0">
          <img
            src="/images/hero-ring.jpg"
            alt="hero"
            className="w-full h-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(105deg, rgba(241,237,230,0.97) 0%, rgba(235,227,219,0.88) 35%, rgba(209,199,189,0.4) 65%, transparent 100%)",
            }}
          />
        </motion.div>

        <motion.div
          className="absolute top-20 right-[15%] w-80 h-80 rounded-full blur-3xl pointer-events-none"
          style={{ background: "rgba(203,173,141,0.18)" }}
          animate={{ y: [0, -20, 0], scale: [1, 1.05, 1] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-24 right-[30%] w-60 h-60 rounded-full blur-3xl pointer-events-none"
          style={{ background: "rgba(164,131,116,0.12)" }}
          animate={{ y: [0, 15, 0], scale: [1, 1.08, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />

        <motion.div style={{ opacity: heroOpacity }} className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 w-full">
          <div className="max-w-2xl">
            <motion.div variants={fadeUp} initial="hidden" animate="show" custom={0} className="flex items-center gap-2 mb-6">
              <div className="h-px w-8" style={{ background: "#CBAD8D" }} />
              <span className="text-xs uppercase tracking-[0.35em]" style={{ color: "#A48374" }}>
                Luxury Diamond Marketplace
              </span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={1}
              className="mb-6 leading-[1.1]"
              style={{ fontSize: "clamp(3rem, 6vw, 5.5rem)", fontWeight: 200, color: "#3A2D28", fontFamily: "Georgia, serif" }}
            >
              Where Every Diamond
              <br />
              <em style={{ color: "#A48374", fontStyle: "italic" }}>Tells a Story</em>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={2}
              className="text-lg mb-10 leading-relaxed"
              style={{ color: "#6B5549", maxWidth: "480px" }}
            >
              Discover certified diamonds, bid in live auctions, and connect directly
              with verified sellers — all in one elegant marketplace.
            </motion.p>

            <motion.div variants={fadeUp} initial="hidden" animate="show" custom={3} className="flex flex-wrap gap-4">
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Link
                  to="/marketplace/diamonds"
                  className="inline-flex items-center gap-3 px-8 py-4 rounded-full text-white text-sm tracking-wide"
                  style={{ background: "linear-gradient(135deg, #A48374, #3A2D28)" }}
                >
                  <Diamond className="w-4 h-4" />
                  Explore Diamonds
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>

              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Link
                  to="/signup?role=seller"
                  className="inline-flex items-center gap-3 px-8 py-4 rounded-full text-sm tracking-wide"
                  style={{
                    background: "rgba(255,255,255,0.7)",
                    backdropFilter: "blur(12px)",
                    border: "1.5px solid rgba(203,173,141,0.5)",
                    color: "#3A2D28",
                  }}
                >
                  <Sparkles className="w-4 h-4" style={{ color: "#A48374" }} />
                  Start as Seller
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
            </motion.div>

            <motion.div variants={fadeUp} initial="hidden" animate="show" custom={4} className="flex gap-8 mt-14">
              {stats.slice(0, 3).map((s, i) => (
                <div key={i}>
                  <p className="text-2xl font-light" style={{ color: "#3A2D28", fontFamily: "Georgia, serif" }}>{s.value}</p>
                  <p className="text-xs tracking-wide mt-0.5" style={{ color: "#A48374" }}>{s.label}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </motion.div>

        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <span className="text-[10px] tracking-widest uppercase" style={{ color: "#A48374" }}>Scroll</span>
          <ChevronDown className="w-4 h-4" style={{ color: "#CBAD8D" }} />
        </motion.div>
      </section>

      {/* ─── TRUST BAR ──────────────────────────────────────────────────── */}
      <section style={{ background: "rgba(203,173,141,0.12)", borderTop: "1px solid rgba(203,173,141,0.2)", borderBottom: "1px solid rgba(203,173,141,0.2)" }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {features.map((f, i) => (
              <motion.div key={i} variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} custom={i} className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center" style={{ background: "linear-gradient(135deg, #EBE3DB, #D1C7BD)" }}>
                  <f.icon className="w-5 h-5" style={{ color: "#A48374" }} />
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: "#3A2D28" }}>{f.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: "#A48374" }}>{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CATEGORY EXPLORER ──────────────────────────────────────────── */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} className="text-center mb-14">
            <p className="text-xs tracking-[0.35em] uppercase mb-4" style={{ color: "#CBAD8D" }}>Shop by Shape</p>
            <h2 style={{ fontWeight: 200, color: "#3A2D28", fontFamily: "Georgia, serif", fontSize: "2.25rem" }}>
              Find Your Perfect Cut
            </h2>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {categories.map((cat, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                custom={i}
                className="group relative rounded-3xl overflow-hidden cursor-pointer"
                style={{ aspectRatio: "3/4" }}
                whileHover={{ y: -4 }}
                onHoverStart={() => setActiveCategory(i)}
              >
                <img src={cat.image} alt={cat.label} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(58,45,40,0.7) 0%, rgba(58,45,40,0.1) 50%, transparent 100%)" }} />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <p className="text-white font-medium mb-0.5">{cat.label}</p>
                  <p className="text-[#D1C7BD] text-xs mb-3">{cat.desc}</p>
                  <span className="text-[10px] tracking-widest uppercase px-3 py-1 rounded-full" style={{ background: "rgba(203,173,141,0.3)", color: "#CBAD8D", border: "1px solid rgba(203,173,141,0.4)" }}>
                    {cat.count}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURED DIAMONDS ──────────────────────────────────────────── */}
      <section className="py-20" style={{ background: "rgba(235,227,219,0.3)" }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} className="flex items-end justify-between mb-12">
            <div>
              <p className="text-xs tracking-[0.35em] uppercase mb-3" style={{ color: "#CBAD8D" }}>
                Handpicked Collection
              </p>
              <h2 style={{ fontWeight: 200, color: "#3A2D28", fontFamily: "Georgia, serif", fontSize: "2.25rem" }}>
                Featured Diamonds
              </h2>
            </div>
            <Link to="/marketplace/diamonds" className="hidden md:flex items-center gap-2 text-sm group" style={{ color: "#A48374" }}>
              View All Collection
              <motion.span className="inline-block" animate={{ x: [0, 4, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                <ArrowRight className="w-4 h-4" />
              </motion.span>
            </Link>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredDiamonds.map((diamond, i) => (
              <motion.div key={diamond.id} variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} custom={i}>
                <ProductCard {...diamond} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── EDITORIAL BANNER ───────────────────────────────────────────── */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} className="grid lg:grid-cols-2 gap-6 items-stretch">
            {/* Auction CTA */}
            <motion.div className="relative rounded-3xl overflow-hidden p-10 flex flex-col justify-end min-h-[420px]" whileHover={{ scale: 1.01 }} transition={{ duration: 0.3 }}>
              <img src="https://images.unsplash.com/photo-1599707367072-cd6ada2bc375?w=800" alt="Auction" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(58,45,40,0.85) 0%, rgba(58,45,40,0.3) 60%, transparent 100%)" }} />
              <div className="relative z-10">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] tracking-widest uppercase mb-4" style={{ background: "rgba(203,173,141,0.25)", color: "#CBAD8D", border: "1px solid rgba(203,173,141,0.4)" }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                  Live Now
                </span>
                <h3 className="text-white mb-3 text-2xl" style={{ fontWeight: 200, fontFamily: "Georgia, serif" }}>
                  Exclusive Live Auctions
                </h3>
                <p className="text-[#D1C7BD] text-sm mb-6 leading-relaxed">
                  Bid on rare GIA-certified diamonds and win at your price.
                </p>
                <Link to="/auctions" className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm text-[#3A2D28]" style={{ background: "linear-gradient(135deg, #CBAD8D, #A48374)", color: "white" }}>
                  <Gavel className="w-4 h-4" />
                  View Auctions
                </Link>
              </div>
            </motion.div>

            {/* RFQ CTA */}
            <div className="flex flex-col gap-6">
              <motion.div className="flex-1 rounded-3xl p-10 flex flex-col justify-between min-h-[190px]" style={{ background: "linear-gradient(135deg, #EBE3DB, #D1C7BD)" }} whileHover={{ scale: 1.01 }} transition={{ duration: 0.3 }}>
                <div>
                  <TrendingUp className="w-8 h-8 mb-4" style={{ color: "#A48374" }} />
                  <h3 className="mb-2" style={{ fontWeight: 300, color: "#3A2D28", fontFamily: "Georgia, serif", fontSize: "1.5rem" }}>
                    Can't Find It?
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: "#6B5549" }}>
                    Submit a Request for Quote and let verified sellers compete for your business.
                  </p>
                </div>
                <Link to="/rfq/create" className="self-start mt-4 inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-sm text-white" style={{ background: "#3A2D28" }}>
                  Create RFQ
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>

              <motion.div className="flex-1 rounded-3xl p-10 flex flex-col justify-between min-h-[190px]" style={{ background: "linear-gradient(135deg, #3A2D28, #5a3f36)" }} whileHover={{ scale: 1.01 }} transition={{ duration: 0.3 }}>
                <div>
                  <Sparkles className="w-8 h-8 mb-4" style={{ color: "#CBAD8D" }} />
                  <h3 className="mb-2" style={{ fontWeight: 300, color: "#F1EDE6", fontFamily: "Georgia, serif", fontSize: "1.5rem" }}>
                    Sell on Zivora
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: "#A48374" }}>
                    Join 180+ verified sellers. List your inventory and reach serious buyers.
                  </p>
                </div>
                <Link to="/signup?role=seller" className="self-start mt-4 inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-sm" style={{ background: "linear-gradient(135deg, #CBAD8D, #A48374)", color: "white" }}>
                  Start Selling
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── STATS ─────────────────────────────────────────────────────── */}
      <section className="py-20" style={{ background: "linear-gradient(135deg, #3A2D28, #2a1f1b)" }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-10">
            {stats.map((s, i) => (
              <motion.div key={i} variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} custom={i} className="text-center">
                <p className="mb-2" style={{ fontSize: "2.8rem", fontWeight: 200, color: "#CBAD8D", fontFamily: "Georgia, serif" }}>
                  {s.value}
                </p>
                <p className="text-xs tracking-widest uppercase" style={{ color: "#A48374" }}>{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── NEWSLETTER ──────────────────────────────────────────────────── */}
      <section className="py-24" style={{ background: "#F7F3EF" }}>
        <div className="max-w-2xl mx-auto px-6 text-center">
          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}>
            <Diamond className="w-10 h-10 mx-auto mb-6" style={{ color: "#CBAD8D" }} />
            <h2 className="mb-4 text-3xl" style={{ fontWeight: 200, color: "#3A2D28", fontFamily: "Georgia, serif" }}>
              Stay in the Loop
            </h2>
            <p className="text-sm mb-8 leading-relaxed" style={{ color: "#A48374" }}>
              Get early access to auction drops, new arrivals, and exclusive offers
              curated for the discerning buyer.
            </p>
            <div className="flex rounded-full overflow-hidden p-1.5 mx-auto max-w-md" style={{ background: "rgba(203,173,141,0.15)", border: "1px solid rgba(203,173,141,0.3)" }}>
              <input type="email" placeholder="Enter your email address" className="flex-1 px-5 py-2.5 bg-transparent text-sm focus:outline-none" style={{ color: "#3A2D28" }} />
              <button className="px-6 py-2.5 rounded-full text-sm text-white whitespace-nowrap" style={{ background: "linear-gradient(135deg, #A48374, #3A2D28)" }}>
                Subscribe
              </button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
