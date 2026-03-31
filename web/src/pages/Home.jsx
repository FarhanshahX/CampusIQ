import { Link } from "react-router-dom";
import "./Home.css";
import heroBg from "../assets/hero-bg.png";

const Home = () => {
  return (
    <div className="home-container">
      {/* NAVBAR */}
      <nav className="navbar">
        <div className="nav-logo">CampusIQ</div>
        <Link to="/login" className="login-btn">
          Login to Portal
        </Link>
      </nav>

      {/* HERO SECTION */}
      <section className="hero">
        <div
          className="hero-bg"
          style={{ backgroundImage: `url(${heroBg})` }}
        ></div>
        <div className="hero-content">
          <span className="hero-tagline">Academic Intelligence Platform</span>
          <h1>
            <span>The Future of</span>
            Campus Management
          </h1>
          <p className="hero-desc">
            Transform institutional data into actionable insights. Empower
            administrators, teachers, and students with the next generation of
            academic intelligence.
          </p>
          <div className="cta-group">
            <Link to="/login" className="btn-primary">
              Get Started Now
            </Link>
            <Link
              to="/login"
              className="login-btn"
              style={{ padding: "16px 32px" }}
            >
              View Demo
            </Link>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="features">
        <div className="section-label">Core Capabilities</div>
        <h2 className="section-title">Engineered for Excellence</h2>

        <div className="features-grid">
          <FeatureCard
            icon={<UnifiedIcon />}
            title="Unified Ecosystem"
            description="Attendance, assessments, and activities centralized in a single, fluid interface."
          />
          <FeatureCard
            icon={<IntelligenceIcon />}
            title="Predictive Analytics"
            description="Identify trends and academic risks before they escalate with AI-driven insights."
          />
          <FeatureCard
            icon={<RoleIcon />}
            title="Adaptive Dashboards"
            description="Purpose-built experiences tailored specifically for every role in the campus."
          />
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <p>© {new Date().getFullYear()} CampusIQ. All rights reserved.</p>
        <p
          style={{
            marginTop: "10px",
            fontSize: "0.8rem",
            color: "var(--text-muted)",
          }}
        >
          Built for modern institutions. Powered by Intelligence.
        </p>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }) => (
  <div className="feature-card">
    <div className="feature-icon">{icon}</div>
    <h3>{title}</h3>
    <p>{description}</p>
  </div>
);

/* Icons */
const UnifiedIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="3" width="7" height="7"></rect>
    <rect x="14" y="3" width="7" height="7"></rect>
    <rect x="14" y="14" width="7" height="7"></rect>
    <rect x="3" y="14" width="7" height="7"></rect>
  </svg>
);

const IntelligenceIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
  </svg>
);

const RoleIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
    <circle cx="9" cy="7" r="4"></circle>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
  </svg>
);

export default Home;
