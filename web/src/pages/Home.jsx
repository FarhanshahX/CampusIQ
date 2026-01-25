import { Link } from "react-router-dom";

const Home = () => {
  return (
    <div className="bg-gray-50 text-gray-900">
      {/* NAVBAR */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="text-lg font-semibold tracking-tight">CampusIQ</span>

          <Link
            to="/login"
            className="text-lg font-medium text-gray-700 hover:text-gray-900"
          >
            Login
          </Link>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-white" />

        <div className="relative max-w-7xl mx-auto px-6 py-32">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-semibold leading-tight tracking-tight">
              Academic intelligence <br className="hidden sm:block" />
              for modern campuses
            </h1>

            <p className="mt-6 text-lg text-gray-600 leading-relaxed">
              CampusIQ helps colleges transform raw academic data into
              actionable insights — empowering administrators, teachers, and
              students to make smarter decisions.
            </p>

            <div className="mt-10 flex items-center gap-4">
              <Link
                to="/login"
                className="px-6 py-3 rounded-md bg-indigo-600 !text-white text-sm font-medium hover:bg-indigo-500 transition"
              >
                Get Started
              </Link>

              <span className="text-sm text-gray-500">
                Built for institutions, not just classrooms
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Feature
            title="Unified Academic View"
            text="Attendance, assessments, activities, and progress — centralized and structured."
          />
          <Feature
            title="Performance Intelligence"
            text="Identify strengths, weaknesses, and trends before problems escalate."
          />
          <Feature
            title="Role-Based Experience"
            text="Purpose-built dashboards for admins, teachers, and students."
          />
        </div>
      </section>

      {/* AUDIENCE */}
      <section className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-24">
          <h2 className="text-2xl font-semibold tracking-tight">
            Designed for the academic ecosystem
          </h2>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
            <Audience
              title="Administrators"
              text="Gain visibility into institutional performance and academic health."
            />
            <Audience
              title="Teachers"
              text="Understand student progress and intervene at the right time."
            />
            <Audience
              title="Students"
              text="Visualize your academic journey and improve intentionally."
            />
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-gray-200 py-8 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} CampusIQ — Academic Intelligence Platform
      </footer>
    </div>
  );
};

const Feature = ({ title, text }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm hover:shadow-md transition">
    <h3 className="text-sm font-semibold tracking-wide uppercase text-indigo-600">
      {title}
    </h3>
    <p className="mt-4 text-sm text-gray-600 leading-relaxed">{text}</p>
  </div>
);

const Audience = ({ title, text }) => (
  <div className="rounded-xl bg-gray-50 border border-gray-200 p-8">
    <h4 className="text-base font-medium">{title}</h4>
    <p className="mt-3 text-sm text-gray-600 leading-relaxed">{text}</p>
  </div>
);

export default Home;
