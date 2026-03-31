// import { Link } from "react-router-dom";

// const Home = () => {
//   return (
//     <div className="bg-gray-50 text-gray-900">
//       {/* NAVBAR */}
//       <header className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-gray-200">
//         <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
//           <span className="text-lg font-semibold tracking-tight">CampusIQ</span>

//           <Link
//             to="/login"
//             className="text-lg font-medium text-gray-700 hover:text-gray-900"
//           >
//             Login
//           </Link>
//         </div>
//       </header>

//       {/* HERO */}
//       <section className="relative overflow-hidden">
//         <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-white" />

//         <div className="relative max-w-7xl mx-auto px-6 py-32">
//           <div className="max-w-3xl">
//             <h1 className="text-4xl md:text-5xl font-semibold leading-tight tracking-tight">
//               Academic intelligence <br className="hidden sm:block" />
//               for modern campuses
//             </h1>

//             <p className="mt-6 text-lg text-gray-600 leading-relaxed">
//               CampusIQ helps colleges transform raw academic data into
//               actionable insights — empowering administrators, teachers, and
//               students to make smarter decisions.
//             </p>

//             <div className="mt-10 flex items-center gap-4">
//               <Link
//                 to="/login"
//                 className="px-6 py-3 rounded-md bg-indigo-600 !text-white text-sm font-medium hover:bg-indigo-500 transition"
//               >
//                 Get Started
//               </Link>

//               <span className="text-sm text-gray-500">
//                 Built for institutions, not just classrooms
//               </span>
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* FEATURES */}
//       <section className="max-w-7xl mx-auto px-6 py-24">
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
//           <Feature
//             title="Unified Academic View"
//             text="Attendance, assessments, activities, and progress — centralized and structured."
//           />
//           <Feature
//             title="Performance Intelligence"
//             text="Identify strengths, weaknesses, and trends before problems escalate."
//           />
//           <Feature
//             title="Role-Based Experience"
//             text="Purpose-built dashboards for admins, teachers, and students."
//           />
//         </div>
//       </section>

//       {/* AUDIENCE */}
//       <section className="bg-white border-t border-gray-200">
//         <div className="max-w-7xl mx-auto px-6 py-24">
//           <h2 className="text-2xl font-semibold tracking-tight">
//             Designed for the academic ecosystem
//           </h2>

//           <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
//             <Audience
//               title="Administrators"
//               text="Gain visibility into institutional performance and academic health."
//             />
//             <Audience
//               title="Teachers"
//               text="Understand student progress and intervene at the right time."
//             />
//             <Audience
//               title="Students"
//               text="Visualize your academic journey and improve intentionally."
//             />
//           </div>
//         </div>
//       </section>

//       {/* FOOTER */}
//       <footer className="border-t border-gray-200 py-8 text-center text-sm text-gray-500">
//         © {new Date().getFullYear()} CampusIQ — Academic Intelligence Platform
//       </footer>
//     </div>
//   );
// };

// const Feature = ({ title, text }) => (
//   <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm hover:shadow-md transition">
//     <h3 className="text-sm font-semibold tracking-wide uppercase text-indigo-600">
//       {title}
//     </h3>
//     <p className="mt-4 text-sm text-gray-600 leading-relaxed">{text}</p>
//   </div>
// );

// const Audience = ({ title, text }) => (
//   <div className="rounded-xl bg-gray-50 border border-gray-200 p-8">
//     <h4 className="text-base font-medium">{title}</h4>
//     <p className="mt-3 text-sm text-gray-600 leading-relaxed">{text}</p>
//   </div>
// );

// export default Home;

import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";

/* ─── Tiny CSS injected once ─────────────────────────────────────────────── */
const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  html { scroll-behavior: smooth; }

  body {
    font-family: 'DM Sans', sans-serif;
    background: #09090E;
    color: #F0EFE8;
    overflow-x: hidden;
  }

  .serif { font-family: 'Instrument Serif', serif; }

  /* Fade-up animation */
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(28px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .fade-up { animation: fadeUp 0.7s cubic-bezier(.22,1,.36,1) both; }
  .delay-1 { animation-delay: 0.1s; }
  .delay-2 { animation-delay: 0.22s; }
  .delay-3 { animation-delay: 0.34s; }
  .delay-4 { animation-delay: 0.46s; }

  /* Grid dot background */
  .dot-grid {
    background-image: radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px);
    background-size: 28px 28px;
  }

  /* Noise texture overlay */
  .noise::after {
    content: '';
    position: absolute;
    inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
    pointer-events: none;
    z-index: 1;
  }

  /* Glow orb */
  .orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(100px);
    pointer-events: none;
  }

  /* Stat counter */
  @keyframes countUp {
    from { opacity: 0; transform: scale(0.85); }
    to   { opacity: 1; transform: scale(1); }
  }
  .stat-num { animation: countUp 0.6s cubic-bezier(.34,1.56,.64,1) both; }

  /* Hover card lift */
  .card-lift {
    transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
  }
  .card-lift:hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 60px rgba(0,0,0,0.35);
    border-color: rgba(255,255,255,0.12);
  }

  /* Marquee */
  @keyframes marquee {
    from { transform: translateX(0); }
    to   { transform: translateX(-50%); }
  }
  .marquee-track {
    display: flex;
    width: max-content;
    animation: marquee 28s linear infinite;
  }
  .marquee-track:hover { animation-play-state: paused; }

  /* CTA button shimmer */
  @keyframes shimmer {
    0%   { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
  .btn-primary {
    background: linear-gradient(90deg, #4F46E5 0%, #818CF8 40%, #4F46E5 80%);
    background-size: 200% auto;
    transition: background-position 0.4s ease, transform 0.15s ease, box-shadow 0.2s ease;
  }
  .btn-primary:hover {
    background-position: right center;
    transform: translateY(-1px);
    box-shadow: 0 8px 30px rgba(79,70,229,0.45);
  }

  /* Scroll indicator */
  @keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50%       { transform: translateY(6px); }
  }
  .bounce { animation: bounce 1.8s ease-in-out infinite; }

  /* Feature pill */
  .pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: rgba(79,70,229,0.12);
    border: 1px solid rgba(79,70,229,0.3);
    color: #A5B4FC;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    padding: 5px 12px;
    border-radius: 100px;
  }

  a { text-decoration: none; color: inherit; }
  img { display: block; max-width: 100%; }

  /* Section spacing */
  section { position: relative; }

  /* Responsive helpers */
  @media (max-width: 768px) {
    .hide-mobile { display: none !important; }
    .hero-title  { font-size: 2.6rem !important; }
  }
`;

/* ─── Sub-components ─────────────────────────────────────────────────────── */

const FeatureCard = ({ icon, title, text, delay }) => (
  <div
    className={`card-lift fade-up delay-${delay}`}
    style={{
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 16,
      padding: "32px 28px",
    }}
  >
    <div
      style={{
        width: 44,
        height: 44,
        borderRadius: 12,
        background: "rgba(79,70,229,0.15)",
        border: "1px solid rgba(79,70,229,0.25)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 22,
        marginBottom: 20,
      }}
    >
      {icon}
    </div>
    <h3
      style={{
        fontSize: 16,
        fontWeight: 600,
        color: "#F0EFE8",
        marginBottom: 10,
      }}
    >
      {title}
    </h3>
    <p
      style={{ fontSize: 14, color: "rgba(240,239,232,0.5)", lineHeight: 1.7 }}
    >
      {text}
    </p>
  </div>
);

const RoleCard = ({ emoji, role, tagline, perks, accent }) => (
  <div
    className="card-lift"
    style={{
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 20,
      padding: "36px 32px",
      display: "flex",
      flexDirection: "column",
      gap: 20,
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: 14,
          background: accent + "20",
          border: `1px solid ${accent}40`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 26,
        }}
      >
        {emoji}
      </div>
      <div>
        <p style={{ fontSize: 18, fontWeight: 600, color: "#F0EFE8" }}>
          {role}
        </p>
        <p
          style={{
            fontSize: 13,
            color: "rgba(240,239,232,0.45)",
            marginTop: 2,
          }}
        >
          {tagline}
        </p>
      </div>
    </div>
    <ul
      style={{
        listStyle: "none",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      {perks.map((p, i) => (
        <li
          key={i}
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
            fontSize: 13,
            color: "rgba(240,239,232,0.65)",
            lineHeight: 1.5,
          }}
        >
          <span style={{ color: accent, fontSize: 14, marginTop: 1 }}>✓</span>
          {p}
        </li>
      ))}
    </ul>
  </div>
);

const StatCard = ({ number, label, delay }) => (
  <div
    className={`fade-up delay-${delay}`}
    style={{
      textAlign: "center",
      padding: "28px 20px",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 16,
      background: "rgba(255,255,255,0.02)",
    }}
  >
    <p
      className="serif stat-num"
      style={{
        fontSize: 48,
        fontWeight: 400,
        color: "#F0EFE8",
        letterSpacing: -1,
        lineHeight: 1,
      }}
    >
      {number}
    </p>
    <p
      style={{
        fontSize: 12,
        color: "rgba(240,239,232,0.4)",
        marginTop: 8,
        letterSpacing: 1,
        textTransform: "uppercase",
        fontWeight: 500,
      }}
    >
      {label}
    </p>
  </div>
);

const ScrollIndicator = () => (
  <div
    className="bounce"
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 6,
      opacity: 0.35,
    }}
  >
    <span
      style={{
        fontSize: 11,
        letterSpacing: 2,
        textTransform: "uppercase",
        fontWeight: 500,
      }}
    >
      Scroll
    </span>
    <svg
      width="14"
      height="20"
      viewBox="0 0 14 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="1"
        y="1"
        width="12"
        height="18"
        rx="6"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <rect x="6" y="5" width="2" height="4" rx="1" fill="currentColor" />
    </svg>
  </div>
);

/* ─── Main Component ─────────────────────────────────────────────────────── */

export default function Home() {
  const [scrolled, setScrolled] = useState(false);
  const heroRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      {/* Global styles */}
      <style dangerouslySetInnerHTML={{ __html: globalStyles }} />

      <div style={{ background: "#09090E", minHeight: "100vh" }}>
        {/* ── NAVBAR ─────────────────────────────────────────────────────── */}
        <header
          style={{
            position: "sticky",
            top: 0,
            zIndex: 100,
            background: scrolled ? "rgba(9,9,14,0.88)" : "transparent",
            backdropFilter: scrolled ? "blur(16px)" : "none",
            borderBottom: scrolled
              ? "1px solid rgba(255,255,255,0.07)"
              : "1px solid transparent",
            transition: "all 0.3s ease",
          }}
        >
          <div
            style={{
              maxWidth: 1280,
              margin: "0 auto",
              padding: "0 32px",
              height: 68,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            {/* Logo */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: "#4F46E5",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 15,
                  fontWeight: 800,
                  color: "#fff",
                }}
              >
                C
              </div>
              <span
                style={{ fontSize: 18, fontWeight: 600, letterSpacing: -0.3 }}
              >
                CampusIQ
              </span>
            </div>

            {/* Nav links */}
            <nav
              className="hide-mobile"
              style={{ display: "flex", alignItems: "center", gap: 32 }}
            >
              {[
                ["Features", "#features"],
                ["For Who", "#audience"],
                ["About", "#about"],
              ].map(([label, href]) => (
                <a
                  key={label}
                  href={href}
                  style={{
                    fontSize: 14,
                    fontWeight: 500,
                    color: "rgba(240,239,232,0.55)",
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={(e) => (e.target.style.color = "#F0EFE8")}
                  onMouseLeave={(e) =>
                    (e.target.style.color = "rgba(240,239,232,0.55)")
                  }
                >
                  {label}
                </a>
              ))}
            </nav>

            {/* CTA */}
            <Link
              to="/login"
              style={{
                fontSize: 13,
                fontWeight: 600,
                padding: "8px 20px",
                borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.15)",
                color: "#F0EFE8",
                background: "rgba(255,255,255,0.05)",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
              }}
            >
              Sign In
            </Link>
          </div>
        </header>

        {/* ── HERO ───────────────────────────────────────────────────────── */}
        <section
          ref={heroRef}
          className="dot-grid noise"
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            overflow: "hidden",
            paddingTop: 80,
          }}
        >
          {/* Orbs */}
          <div
            className="orb"
            style={{
              width: 600,
              height: 600,
              background: "rgba(79,70,229,0.18)",
              top: -200,
              left: -150,
            }}
          />
          <div
            className="orb"
            style={{
              width: 400,
              height: 400,
              background: "rgba(129,140,248,0.1)",
              top: 100,
              right: -100,
            }}
          />
          <div
            className="orb"
            style={{
              width: 300,
              height: 300,
              background: "rgba(16,185,129,0.06)",
              bottom: 50,
              left: "40%",
            }}
          />

          <div
            style={{
              maxWidth: 1280,
              margin: "0 auto",
              padding: "0 32px",
              position: "relative",
              zIndex: 2,
              width: "100%",
            }}
          >
            {/* Badge */}
            <div className="fade-up" style={{ marginBottom: 28 }}>
              <span className="pill">✦ Academic Intelligence Platform</span>
            </div>

            {/* Headline */}
            <h1
              className="hero-title fade-up delay-1 serif"
              style={{
                fontSize: "clamp(3rem, 6vw, 5.5rem)",
                fontWeight: 400,
                lineHeight: 1.08,
                letterSpacing: -1.5,
                color: "#F0EFE8",
                maxWidth: 820,
                marginBottom: 28,
              }}
            >
              Academic intelligence
              <br />
              <em style={{ color: "#818CF8" }}>for modern campuses</em>
            </h1>

            {/* Sub */}
            <p
              className="fade-up delay-2"
              style={{
                fontSize: 18,
                color: "rgba(240,239,232,0.55)",
                lineHeight: 1.7,
                maxWidth: 520,
                marginBottom: 44,
              }}
            >
              CampusIQ transforms raw academic data into actionable insight —
              connecting administrators, teachers, and students on a single
              intelligent platform.
            </p>

            {/* CTA row */}
            <div
              className="fade-up delay-3"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                flexWrap: "wrap",
                marginBottom: 80,
              }}
            >
              <Link
                to="/login"
                className="btn-primary"
                style={{
                  padding: "14px 32px",
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#fff",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                Get Started Free
                <span style={{ fontSize: 16 }}>→</span>
              </Link>
              <a
                href="#features"
                style={{
                  padding: "14px 24px",
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 500,
                  color: "rgba(240,239,232,0.6)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  transition: "all 0.2s ease",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#F0EFE8";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "rgba(240,239,232,0.6)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                }}
              >
                See how it works ↓
              </a>
            </div>

            {/* Scroll indicator */}
            <ScrollIndicator />
          </div>
        </section>

        {/* ── MARQUEE STRIP ──────────────────────────────────────────────── */}
        <div
          style={{
            borderTop: "1px solid rgba(255,255,255,0.06)",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            background: "rgba(255,255,255,0.02)",
            overflow: "hidden",
            padding: "18px 0",
          }}
        >
          <div className="marquee-track">
            {[...Array(2)].map((_, rep) => (
              <span key={rep} style={{ display: "flex", alignItems: "center" }}>
                {[
                  "Attendance Tracking",
                  "Score Entry",
                  "Activity Logs",
                  "Resource Sharing",
                  "Academic Analytics",
                  "Role-Based Access",
                  "Performance Reports",
                  "Student Portal",
                  "Teacher Dashboard",
                ].map((item, i) => (
                  <span
                    key={i}
                    style={{ display: "flex", alignItems: "center", gap: 0 }}
                  >
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 500,
                        color: "rgba(240,239,232,0.35)",
                        whiteSpace: "nowrap",
                        padding: "0 32px",
                        letterSpacing: 0.5,
                      }}
                    >
                      {item}
                    </span>
                    <span
                      style={{ color: "#4F46E5", fontSize: 16, opacity: 0.6 }}
                    >
                      ✦
                    </span>
                  </span>
                ))}
              </span>
            ))}
          </div>
        </div>

        {/* ── STATS ──────────────────────────────────────────────────────── */}
        <section style={{ padding: "80px 32px" }}>
          <div style={{ maxWidth: 1280, margin: "0 auto" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                gap: 16,
              }}
            >
              <StatCard number="3x" label="Faster mark entry" delay="1" />
              <StatCard number="100%" label="Role-based access" delay="2" />
              <StatCard number="5 min" label="Setup per teacher" delay="3" />
              <StatCard number="0 paper" label="Fully digital" delay="4" />
            </div>
          </div>
        </section>

        {/* ── FEATURES ───────────────────────────────────────────────────── */}
        <section id="features" style={{ padding: "80px 32px 100px" }}>
          <div style={{ maxWidth: 1280, margin: "0 auto" }}>
            {/* Section label */}
            <div style={{ marginBottom: 56 }}>
              <span
                className="pill"
                style={{ marginBottom: 16, display: "inline-flex" }}
              >
                Features
              </span>
              <h2
                className="serif fade-up"
                style={{
                  fontSize: "clamp(2rem, 3.5vw, 3rem)",
                  fontWeight: 400,
                  letterSpacing: -0.8,
                  color: "#F0EFE8",
                  maxWidth: 560,
                  lineHeight: 1.15,
                  marginTop: 12,
                }}
              >
                Everything a campus needs,
                <br />
                <em style={{ color: "#818CF8" }}>in one place</em>
              </h2>
            </div>

            {/* Feature grid — 3 col with a large featured card */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 16,
              }}
            >
              <div
                style={{
                  gridColumn: "span 2",
                  background: "rgba(79,70,229,0.07)",
                  border: "1px solid rgba(79,70,229,0.2)",
                  borderRadius: 20,
                  padding: "40px 36px",
                }}
                className="card-lift fade-up delay-1"
              >
                <div style={{ fontSize: 34, marginBottom: 20 }}>📊</div>
                <h3
                  className="serif"
                  style={{
                    fontSize: 26,
                    fontWeight: 400,
                    color: "#F0EFE8",
                    letterSpacing: -0.5,
                    marginBottom: 12,
                  }}
                >
                  Unified Academic View
                </h3>
                <p
                  style={{
                    fontSize: 15,
                    color: "rgba(240,239,232,0.5)",
                    lineHeight: 1.75,
                    maxWidth: 420,
                  }}
                >
                  Attendance, internal assessments, lab experiments,
                  assignments, practical scores and theory results — structured
                  and accessible from a single dashboard, updated in real time
                  as the semester progresses.
                </p>
                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    marginTop: 28,
                    flexWrap: "wrap",
                  }}
                >
                  {[
                    "Marks Entry",
                    "Lock/Unlock",
                    "Live Totals",
                    "Student View",
                  ].map((tag) => (
                    <span
                      key={tag}
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        letterSpacing: 0.5,
                        padding: "4px 12px",
                        borderRadius: 100,
                        background: "rgba(129,140,248,0.12)",
                        border: "1px solid rgba(129,140,248,0.2)",
                        color: "#A5B4FC",
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <FeatureCard
                delay="2"
                icon="🧠"
                title="Performance Intelligence"
                text="Spot trends in student performance early. Compare section-wide data, identify at-risk students, and understand which components need attention — before it's too late."
              />
              <FeatureCard
                delay="3"
                icon="🎭"
                title="Role-Based Experience"
                text="Every role gets a purpose-built interface. Admins see institutional health. Teachers enter and lock marks. Students track their own journey and access resources."
              />
              <FeatureCard
                delay="4"
                icon="📁"
                title="Resource Management"
                text="Teachers upload study materials subject-wise. Students browse and download from a clean, organised library. No more WhatsApp PDFs."
              />
              <FeatureCard
                delay="1"
                icon="🏅"
                title="Activity Portfolio"
                text="Students document internships, sports, prizes, and extracurriculars — with certificate uploads stored permanently on Cloudinary."
              />
            </div>
          </div>
        </section>

        {/* ── FOR WHO ────────────────────────────────────────────────────── */}
        <section
          id="audience"
          style={{
            padding: "100px 32px",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            background: "rgba(255,255,255,0.01)",
          }}
        >
          <div style={{ maxWidth: 1280, margin: "0 auto" }}>
            <div style={{ marginBottom: 60 }}>
              <span
                className="pill"
                style={{ marginBottom: 16, display: "inline-flex" }}
              >
                Who it's for
              </span>
              <h2
                className="serif fade-up"
                style={{
                  fontSize: "clamp(2rem, 3.5vw, 3rem)",
                  fontWeight: 400,
                  letterSpacing: -0.8,
                  color: "#F0EFE8",
                  maxWidth: 540,
                  lineHeight: 1.15,
                  marginTop: 12,
                }}
              >
                Built for every person
                <br />
                <em style={{ color: "#34D399" }}>in the academic chain</em>
              </h2>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: 16,
              }}
            >
              <RoleCard
                emoji="🏛️"
                role="Administrators"
                tagline="Institutional oversight, simplified"
                accent="#818CF8"
                perks={[
                  "View academic health across departments",
                  "Manage student registrations & departments",
                  "Configure subjects and teacher access",
                  "Export reports for compliance",
                ]}
              />
              <RoleCard
                emoji="📐"
                role="Teachers"
                tagline="Focus on teaching, not paperwork"
                accent="#34D399"
                perks={[
                  "Enter marks progressively through the semester",
                  "Lock marks when finalised to prevent changes",
                  "Upload study materials subject-wise",
                  "Auto-fill attendance scores from records",
                ]}
              />
              <RoleCard
                emoji="🎓"
                role="Students"
                tagline="Your academic life, at a glance"
                accent="#F59E0B"
                perks={[
                  "See marks as they're entered by teachers",
                  "Browse and download subject resources",
                  "Log activities, internships & certificates",
                  "Track your cumulative performance over time",
                ]}
              />
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ───────────────────────────────────────────────── */}
        <section
          id="about"
          style={{
            padding: "100px 32px",
            borderTop: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div style={{ maxWidth: 1280, margin: "0 auto" }}>
            <div style={{ marginBottom: 64 }}>
              <span
                className="pill"
                style={{ marginBottom: 16, display: "inline-flex" }}
              >
                How it works
              </span>
              <h2
                className="serif fade-up"
                style={{
                  fontSize: "clamp(2rem, 3.5vw, 3rem)",
                  fontWeight: 400,
                  letterSpacing: -0.8,
                  color: "#F0EFE8",
                  marginTop: 12,
                  lineHeight: 1.15,
                }}
              >
                Three steps to a<br />
                <em style={{ color: "#818CF8" }}>smarter campus</em>
              </h2>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: 2,
              }}
            >
              {[
                {
                  step: "01",
                  title: "Register & Configure",
                  text: "Students register with their registration number. Admins set up departments, semesters, and assign subjects to teachers.",
                },
                {
                  step: "02",
                  title: "Enter & Track",
                  text: "Teachers progressively enter marks as tests and labs are completed. Students see their scores update in real time.",
                },
                {
                  step: "03",
                  title: "Analyse & Act",
                  text: "Review performance data, download reports, share resources, and make data-driven academic interventions.",
                },
              ].map(({ step, title, text }, i) => (
                <div
                  key={step}
                  className={`fade-up delay-${i + 1}`}
                  style={{
                    padding: "40px 32px",
                    borderLeft:
                      i === 0 ? "1px solid rgba(255,255,255,0.07)" : "none",
                    borderRight: "1px solid rgba(255,255,255,0.07)",
                    borderTop: "1px solid rgba(255,255,255,0.07)",
                    borderBottom: "1px solid rgba(255,255,255,0.07)",
                    background:
                      i === 1 ? "rgba(79,70,229,0.04)" : "transparent",
                  }}
                >
                  <p
                    className="serif"
                    style={{
                      fontSize: 52,
                      fontWeight: 400,
                      color: "rgba(240,239,232,0.1)",
                      lineHeight: 1,
                      marginBottom: 24,
                    }}
                  >
                    {step}
                  </p>
                  <h3
                    style={{
                      fontSize: 18,
                      fontWeight: 600,
                      color: "#F0EFE8",
                      marginBottom: 12,
                      letterSpacing: -0.2,
                    }}
                  >
                    {title}
                  </h3>
                  <p
                    style={{
                      fontSize: 14,
                      color: "rgba(240,239,232,0.45)",
                      lineHeight: 1.75,
                    }}
                  >
                    {text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA BANNER ─────────────────────────────────────────────────── */}
        <section style={{ padding: "80px 32px" }}>
          <div style={{ maxWidth: 1280, margin: "0 auto" }}>
            <div
              style={{
                position: "relative",
                overflow: "hidden",
                borderRadius: 24,
                border: "1px solid rgba(79,70,229,0.25)",
                background: "rgba(79,70,229,0.08)",
                padding: "72px 56px",
                textAlign: "center",
              }}
            >
              <div
                className="orb"
                style={{
                  width: 500,
                  height: 500,
                  background: "rgba(79,70,229,0.2)",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%,-50%)",
                }}
              />
              <div style={{ position: "relative", zIndex: 2 }}>
                <h2
                  className="serif fade-up"
                  style={{
                    fontSize: "clamp(2rem, 4vw, 3.5rem)",
                    fontWeight: 400,
                    letterSpacing: -1,
                    color: "#F0EFE8",
                    marginBottom: 16,
                    lineHeight: 1.1,
                  }}
                >
                  Ready to bring intelligence
                  <br />
                  to your campus?
                </h2>
                <p
                  style={{
                    fontSize: 16,
                    color: "rgba(240,239,232,0.5)",
                    maxWidth: 420,
                    margin: "0 auto 36px",
                    lineHeight: 1.7,
                  }}
                >
                  Join the institutions already using CampusIQ to manage
                  academic data smarter.
                </p>
                <Link
                  to="/login"
                  className="btn-primary"
                  style={{
                    padding: "16px 40px",
                    borderRadius: 12,
                    fontSize: 15,
                    fontWeight: 600,
                    color: "#fff",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  Get Started Free →
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── FOOTER ─────────────────────────────────────────────────────── */}
        <footer
          style={{
            borderTop: "1px solid rgba(255,255,255,0.06)",
            padding: "40px 32px",
          }}
        >
          <div
            style={{
              maxWidth: 1280,
              margin: "0 auto",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 20,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 7,
                  background: "#4F46E5",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 13,
                  fontWeight: 800,
                  color: "#fff",
                }}
              >
                C
              </div>
              <span
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: "rgba(240,239,232,0.7)",
                }}
              >
                CampusIQ
              </span>
            </div>

            <p style={{ fontSize: 13, color: "rgba(240,239,232,0.3)" }}>
              © {new Date().getFullYear()} CampusIQ — Academic Intelligence
              Platform
            </p>

            <div style={{ display: "flex", gap: 24 }}>
              {["Features", "Login", "Register"].map((item) => (
                <Link
                  key={item}
                  to={
                    item === "Features" ? "#features" : `/${item.toLowerCase()}`
                  }
                  style={{
                    fontSize: 13,
                    color: "rgba(240,239,232,0.35)",
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={(e) => (e.target.style.color = "#F0EFE8")}
                  onMouseLeave={(e) =>
                    (e.target.style.color = "rgba(240,239,232,0.35)")
                  }
                >
                  {item}
                </Link>
              ))}
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
