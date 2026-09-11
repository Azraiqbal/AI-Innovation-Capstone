import { useEffect, useState } from "react";

import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  LayoutDashboard,
  LogOut,
  MapPin,
  Mic,
  Radio,
  Search,
  ShieldAlert,
} from "lucide-react";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import Auth from "./Auth";
import { supabase } from "./supabase";


function App() {
  const [incidents, setIncidents] = useState([]);
  const [report, setReport] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isListening, setIsListening] = useState(false);

  // AUTH
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);


  // =========================
  // AUTH SESSION
  // =========================

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setSession(session);
      setAuthLoading(false);
    };

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);


  // =========================
  // LOAD INCIDENTS FROM DATABASE
  // =========================

  const loadIncidents = async () => {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      throw new Error("User is not authenticated");
    }

    const response = await fetch(
      "http://127.0.0.1:8000/api/incidents",
      {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to load incidents");
    }

    const data = await response.json();

    const formattedIncidents = data.incidents.map((item) => ({
      id: item.id,
      priority: item.priority?.split(" ")[0] || "P4",
      title: item.disaster_type || "Unknown Incident",
      location: "Reported Incident",
      risk: item.risk_score || 0,
      peopleAtRisk: item.people_at_risk_count || 0,
      status: item.status || "Active",
      report: item.report,
      summary: item.summary,
      createdAt: item.created_at,
    }));

    setIncidents(formattedIncidents);
  } catch (err) {
    console.error("Failed to load incidents:", err);
  }
};

  // =========================
// LOGOUT
// =========================

const handleLogout = async () => {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw error;
    }

    setSession(null);
    setIncidents([]);
    setResult(null);
    setReport("");
    setError("");
  } catch (err) {
    console.error("Logout failed:", err);
    setError("Unable to logout.");
  }
};

  // =========================
  // MARK INCIDENT RESOLVED
  // =========================

  const markAsResolved = async (incidentId) => {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      throw new Error("User is not authenticated");
    }

    const response = await fetch(
      `http://127.0.0.1:8000/api/incidents/${incidentId}/status?status=Resolved`,
      {
        method: "PATCH",

        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to update incident");
    }

    setIncidents((prev) =>
      prev.map((incident) =>
        incident.id === incidentId
          ? {
              ...incident,
              status: "Resolved",
            }
          : incident
      )
    );
  } catch (err) {
    console.error("Status update failed:", err);
    setError("Unable to update incident status.");
  }
};


  // =========================
  // VOICE INPUT
  // =========================

  const startListening = () => {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError(
        "Voice input is not supported in this browser. Please use Chrome or Edge."
      );
      return;
    }

    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-IN";

    recognition.onstart = () => {
      setIsListening(true);
      setError("");
    };

    recognition.onresult = (event) => {
      const transcript =
        event.results[0][0].transcript;

      setReport((prev) =>
        prev.trim()
          ? `${prev.trim()} ${transcript.trim()}`
          : transcript.trim()
      );
    };

    recognition.onerror = (event) => {
      setError(
        `Voice input error: ${event.error}`
      );

      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };


  // =========================
  // ANALYZE INCIDENT
  // =========================

  const analyzeIncident = async () => {
    if (!report.trim()) {
      setError(
        "Please enter an incident report."
      );
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const {
  data: { session },
} = await supabase.auth.getSession();

if (!session) {
  throw new Error("User is not authenticated");
}

const response = await fetch(
  "http://127.0.0.1:8000/api/crisis-agent",
  {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },

    body: JSON.stringify({
      report: report,
    }),
  }
);

      const data = await response.json();

      if (!response.ok) {
        let message =
          data.detail ||
          "Incident analysis failed.";

        if (
          message.includes("429") ||
          message.includes("RESOURCE_EXHAUSTED") ||
          message.toLowerCase().includes("quota")
        ) {
          message =
            "AI service quota is temporarily exhausted. Please try again later.";
        }

        throw new Error(message);
      }

      setResult(data);

      // Backend already saves incident in Supabase.
      await loadIncidents();

    } catch (err) {
      setError(
        err.message ||
          "Unable to connect to the AI service. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };


  // =========================
  // DASHBOARD STATISTICS
  // =========================

  const activeIncidents =
    incidents.filter(
      (incident) =>
        incident.status === "Active"
    ).length;


  const criticalIncidents =
    incidents.filter(
      (incident) =>
        incident.priority === "P1" &&
        incident.status === "Active"
    ).length;


  const totalPeopleAtRisk =
    incidents
      .filter(
        (incident) =>
          incident.status === "Active"
      )
      .reduce(
        (total, incident) =>
          total +
          (incident.peopleAtRisk || 0),
        0
      );


  const resolvedIncidents =
    incidents.filter(
      (incident) =>
        incident.status === "Resolved"
    ).length;


  // Only active incidents in priority queue
  const activeIncidentList = incidents
    .filter(
      (incident) =>
        incident.status === "Active"
    )
    .sort(
      (a, b) =>
        b.risk - a.risk
    );


  // =========================
  // ANALYTICS DATA
  // =========================

  const disasterChartData = Object.values(
    incidents.reduce((acc, incident) => {
      const type =
        incident.title || "Unknown";

      if (!acc[type]) {
        acc[type] = {
          name: type,
          incidents: 0,
        };
      }

      acc[type].incidents += 1;

      return acc;
    }, {})
  );


  const riskChartData = incidents.map(
    (incident) => ({
      name: `${incident.title} #${incident.id}`,
      risk: incident.risk,
    })
  );


  // =========================
  // AUTH LOADING
  // =========================

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#07111f] text-white flex items-center justify-center">
        <div className="text-center">
          <ShieldAlert
            className="text-cyan-400 mx-auto mb-4 animate-pulse"
            size={36}
          />

          <p className="text-cyan-400">
            Loading Crisis Intelligence...
          </p>
        </div>
      </div>
    );
  }


  // =========================
  // LOGIN / SIGNUP
  // =========================

  if (!session) {
    return <Auth />;
  }


  // =========================
  // MAIN UI
  // =========================

  return (
    <div className="min-h-screen bg-[#07111f] text-white flex">

      {/* ========================= */}
      {/* SIDEBAR */}
      {/* ========================= */}

      <aside className="w-64 border-r border-slate-800 bg-[#0a1628] p-5 hidden lg:block">

        <div className="flex items-center gap-3 mb-10">

          <div className="bg-cyan-500/10 p-2 rounded-xl">
            <ShieldAlert
              className="text-cyan-400"
              size={28}
            />
          </div>

          <div>
            <h1 className="font-bold text-lg">
              Crisis Intelligence
            </h1>

            <p className="text-xs text-slate-400">
              Decision Support System
            </p>
          </div>

        </div>


        <nav className="space-y-2">

          <MenuItem
            icon={
              <LayoutDashboard size={19} />
            }
            text="Command Center"
            active
          />

          <MenuItem
            icon={
              <AlertTriangle size={19} />
            }
            text="Incidents"
          />

          <MenuItem
            icon={
              <BarChart3 size={19} />
            }
            text="Analytics"
          />

          <MenuItem
            icon={
              <Radio size={19} />
            }
            text="Response Center"
          />

        </nav>


        {/* USER + LOGOUT */}

        <div className="mt-10 pt-5 border-t border-slate-800">

          <p className="text-xs text-slate-500 mb-1">
            Signed in as
          </p>

          <p className="text-sm text-slate-300 truncate mb-4">
            {session.user?.email}
          </p>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 border border-red-500/20 bg-red-500/10 text-red-300 hover:bg-red-500/20 px-4 py-2.5 rounded-xl text-sm transition"
          >
            <LogOut size={17} />
            Logout
          </button>

        </div>

      </aside>


      {/* ========================= */}
      {/* MAIN */}
      {/* ========================= */}

      <main className="flex-1 p-5 md:p-8 overflow-x-hidden">

        {/* HEADER */}

        <header className="flex flex-col md:flex-row md:items-center justify-between gap-5 mb-8">

          <div>

            <p className="text-cyan-400 text-sm font-medium">
              AI INNOVATION CAPSTONE
            </p>

            <h2 className="text-3xl font-bold mt-1">
              Crisis Command Center
            </h2>

            <p className="text-slate-400 mt-2">
              AI-powered incident analysis and emergency decision support
            </p>

          </div>


          <div className="flex items-center gap-3">

            <div className="flex items-center gap-2 border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 rounded-xl">

              <Activity
                size={16}
                className="text-emerald-400"
              />

              <span className="text-sm text-emerald-300">
                System Operational
              </span>

            </div>


            <button
              type="button"
              className="border border-slate-700 p-2.5 rounded-xl hover:bg-slate-800"
            >
              <Bell size={19} />
            </button>

          </div>

        </header>


        {/* ========================= */}
        {/* DASHBOARD STATS */}
        {/* ========================= */}

        <section className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">

          <StatCard
            title="Active Incidents"
            value={activeIncidents}
            detail="Currently active"
          />

          <StatCard
            title="Critical Priority"
            value={criticalIncidents}
            detail="Requires action"
          />

          <StatCard
            title="People At Risk"
            value={totalPeopleAtRisk}
            detail="Across active incidents"
          />

          <StatCard
            title="Resolved Incidents"
            value={resolvedIncidents}
            detail="Response completed"
          />

        </section>


        {/* ========================= */}
        {/* ANALYTICS */}
        {/* ========================= */}

        <section className="grid lg:grid-cols-2 gap-6 mb-6">

          {/* DISASTER DISTRIBUTION */}

          <div className="border border-slate-800 bg-[#0b1729] rounded-2xl p-6">

            <div className="mb-5">
              <h3 className="text-lg font-semibold">
                Disaster Distribution
              </h3>

              <p className="text-sm text-slate-400 mt-1">
                Incidents grouped by disaster type
              </p>
            </div>


            {disasterChartData.length === 0 ? (

              <div className="h-64 flex items-center justify-center text-slate-500">
                No incident data available
              </div>

            ) : (

              <div className="h-64">

                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >
                  <BarChart
                    data={disasterChartData}
                  >

                    <XAxis
                      dataKey="name"
                      tick={{
                        fill: "#94a3b8",
                        fontSize: 12,
                      }}
                    />

                    <YAxis
                      allowDecimals={false}
                      tick={{
                        fill: "#94a3b8",
                        fontSize: 12,
                      }}
                    />

                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#07111f",
                        border:
                          "1px solid #334155",
                        borderRadius: "10px",
                      }}
                    />

                    <Bar
                      dataKey="incidents"
                      fill="#22d3ee"
                      radius={[6, 6, 0, 0]}
                    />

                  </BarChart>
                </ResponsiveContainer>

              </div>

            )}

          </div>


          {/* RISK ANALYTICS */}

          <div className="border border-slate-800 bg-[#0b1729] rounded-2xl p-6">

            <div className="mb-5">

              <h3 className="text-lg font-semibold">
                Incident Risk Analysis
              </h3>

              <p className="text-sm text-slate-400 mt-1">
                AI-calculated risk scores
              </p>

            </div>


            {riskChartData.length === 0 ? (

              <div className="h-64 flex items-center justify-center text-slate-500">
                No risk data available
              </div>

            ) : (

              <div className="h-64">

                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >

                  <BarChart
                    data={riskChartData}
                  >

                    <XAxis
                      dataKey="name"
                      tick={{
                        fill: "#94a3b8",
                        fontSize: 11,
                      }}
                    />

                    <YAxis
                      domain={[0, 100]}
                      tick={{
                        fill: "#94a3b8",
                        fontSize: 12,
                      }}
                    />

                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#07111f",
                        border:
                          "1px solid #334155",
                        borderRadius: "10px",
                      }}
                    />

                    <Bar
                      dataKey="risk"
                      fill="#fb923c"
                      radius={[6, 6, 0, 0]}
                    />

                  </BarChart>

                </ResponsiveContainer>

              </div>

            )}

          </div>

        </section>


        {/* ========================= */}
        {/* REPORT + PRIORITY QUEUE */}
        {/* ========================= */}

        <section className="grid xl:grid-cols-[1.1fr_0.9fr] gap-6">

          {/* ========================= */}
          {/* INCIDENT REPORT */}
          {/* ========================= */}

          <div className="border border-slate-800 bg-[#0b1729] rounded-2xl p-6">

            <div className="flex justify-between gap-4 mb-5">

              <div>

                <h3 className="text-xl font-semibold">
                  Report New Incident
                </h3>

                <p className="text-sm text-slate-400 mt-1">
                  Type or speak an emergency report in your preferred language.
                </p>

              </div>


              <div className="bg-cyan-500/10 text-cyan-400 p-2.5 rounded-xl h-fit">
                <Radio size={20} />
              </div>

            </div>


            {/* INPUT */}

            <div className="relative">

              <textarea
                value={report}
                onChange={(e) =>
                  setReport(e.target.value)
                }
                className="w-full h-48 resize-none rounded-xl border border-slate-700 bg-[#07111f] p-4 pr-14 outline-none focus:border-cyan-500 text-slate-200"
                placeholder="Example: Hamare area mein flood aa gaya hai. 10 log ghar mein phase hain..."
              />


              <button
                type="button"
                onClick={startListening}
                disabled={isListening}
                title={
                  isListening
                    ? "Listening..."
                    : "Voice input"
                }
                className={`absolute bottom-4 right-4 p-3 rounded-full transition ${
                  isListening
                    ? "bg-red-500 text-white animate-pulse"
                    : "bg-cyan-500 hover:bg-cyan-400 text-slate-950"
                }`}
              >
                <Mic size={20} />
              </button>

            </div>


            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mt-4">

              <span className="text-xs text-slate-500">

                {isListening
                  ? "🎙 Listening... Speak your incident report"
                  : "Automatic language detection enabled"}

              </span>


              <button
                type="button"
                onClick={analyzeIncident}
                disabled={loading}
                className="bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-semibold px-6 py-3 rounded-xl"
              >

                {loading
                  ? "Analyzing..."
                  : "Analyze Incident"}

              </button>

            </div>


            {/* ERROR */}

            {error && (

              <div className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4">

                <div className="flex items-start gap-3">

                  <AlertTriangle
                    size={19}
                    className="text-red-400 mt-0.5"
                  />

                  <div>

                    <p className="font-medium text-red-300">
                      Analysis unavailable
                    </p>

                    <p className="text-sm text-red-200/80 mt-1">
                      {error}
                    </p>

                  </div>

                </div>

              </div>

            )}


            {/* ========================= */}
            {/* AI RESULT */}
            {/* ========================= */}

            {result && (

              <div className="mt-6 space-y-5">

                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">

                  <p className="font-semibold text-emerald-300">
                    Analysis completed successfully
                  </p>

                </div>


                <div className="grid sm:grid-cols-2 gap-3">

                  <ResultCard
                    label="Disaster Type"
                    value={
                      result
                        .incident_analysis
                        ?.disaster_type || "-"
                    }
                  />

                  <ResultCard
                    label="Severity"
                    value={
                      result
                        .incident_analysis
                        ?.severity || "-"
                    }
                  />

                  <ResultCard
                    label="Risk Score"
                    value={`${
                      result
                        .incident_analysis
                        ?.risk_score ?? "-"
                    }/100`}
                  />

                  <ResultCard
                    label="Priority"
                    value={
                      result
                        .incident_analysis
                        ?.priority || "-"
                    }
                  />

                </div>


                {/* SUMMARY */}

                {result
                  .incident_analysis
                  ?.summary && (

                  <ResponseSection title="AI Summary">

                    <p className="text-sm text-slate-300 leading-6">
                      {
                        result
                          .incident_analysis
                          .summary
                      }
                    </p>

                  </ResponseSection>

                )}


                {/* IMMEDIATE ACTIONS */}

                <ResponseSection title="Immediate Actions">

                  {result
                    .response_plan
                    ?.immediate_actions
                    ?.length ? (

                    <ul className="space-y-2">

                      {result.response_plan.immediate_actions.map(
                        (action, index) => (

                          <li
                            key={index}
                            className="text-sm text-slate-300 flex gap-2"
                          >

                            <span className="text-cyan-400">
                              {index + 1}.
                            </span>

                            <span>
                              {action}
                            </span>

                          </li>

                        )
                      )}

                    </ul>

                  ) : (

                    <p className="text-sm text-slate-500">
                      No actions available.
                    </p>

                  )}

                </ResponseSection>


                {/* RESOURCES */}

                <ResponseSection title="Recommended Resources">

                  {result
                    .response_plan
                    ?.recommended_resources
                    ?.length ? (

                    <ul className="space-y-2">

                      {result.response_plan.recommended_resources.map(
                        (resource, index) => (

                          <li
                            key={index}
                            className="text-sm text-slate-300"
                          >
                            • {resource}
                          </li>

                        )
                      )}

                    </ul>

                  ) : (

                    <p className="text-sm text-slate-500">
                      No resources available.
                    </p>

                  )}

                </ResponseSection>


                {/* WARNINGS */}

                <ResponseSection title="Safety Warnings">

                  {result
                    .response_plan
                    ?.safety_warnings
                    ?.length ? (

                    <ul className="space-y-2">

                      {result.response_plan.safety_warnings.map(
                        (warning, index) => (

                          <li
                            key={index}
                            className="text-sm text-orange-200"
                          >
                            ⚠ {warning}
                          </li>

                        )
                      )}

                    </ul>

                  ) : (

                    <p className="text-sm text-slate-500">
                      No warnings available.
                    </p>

                  )}

                </ResponseSection>


                {/* KNOWLEDGE SOURCES */}

                <ResponseSection title="Trusted Knowledge Sources">

                  {result
                    .knowledge_sources
                    ?.length ? (

                    <div className="space-y-3">

                      {result.knowledge_sources.map(
                        (source, index) => (

                          <div
                            key={index}
                            className="border border-slate-800 bg-[#07111f] rounded-lg p-3"
                          >

                            <p className="text-xs text-cyan-400">
                              {source.source}
                            </p>

                            <p className="text-sm text-slate-300 mt-1">
                              {source.content}
                            </p>

                            <p className="text-xs text-slate-500 mt-2">
                              Relevance:{" "}
                              {source.relevance}
                            </p>

                          </div>

                        )
                      )}

                    </div>

                  ) : (

                    <p className="text-sm text-slate-500">
                      No knowledge sources returned.
                    </p>

                  )}

                </ResponseSection>


                <div className="flex flex-wrap gap-3 text-xs">

                  <span className="border border-cyan-500/20 bg-cyan-500/10 text-cyan-300 px-3 py-2 rounded-lg">

                    {result.agent_status ||
                      "Decision support generated"}

                  </span>


                  {result
                    .human_review_required && (

                    <span className="border border-orange-500/20 bg-orange-500/10 text-orange-300 px-3 py-2 rounded-lg">
                      Human Review Required
                    </span>

                  )}

                </div>

              </div>

            )}

          </div>


          {/* ========================= */}
          {/* PRIORITY QUEUE */}
          {/* ========================= */}

          <div className="border border-slate-800 bg-[#0b1729] rounded-2xl p-6">

            <div className="flex items-center justify-between mb-5">

              <div>

                <h3 className="text-xl font-semibold">
                  Priority Queue
                </h3>

                <p className="text-sm text-slate-400 mt-1">
                  AI-ranked active incidents
                </p>

              </div>


              <Search
                size={19}
                className="text-slate-400"
              />

            </div>


            <div className="space-y-3">

              {activeIncidentList.length === 0 ? (

                <div className="border border-dashed border-slate-700 rounded-xl p-8 text-center">

                  <p className="text-slate-300 font-medium">
                    No active incidents
                  </p>

                  <p className="text-sm text-slate-500 mt-2">
                    New active incidents will appear here.
                  </p>

                </div>

              ) : (

                activeIncidentList.map(
                  (incident) => (

                    <Incident
                      key={incident.id}
                      id={incident.id}
                      priority={incident.priority}
                      title={incident.title}
                      location={incident.location}
                      risk={incident.risk}
                      status={incident.status}
                      onResolve={markAsResolved}
                    />

                  )
                )

              )}

            </div>

          </div>

        </section>

      </main>

    </div>
  );
}


// =========================
// SIDEBAR ITEM
// =========================

function MenuItem({
  icon,
  text,
  active,
}) {
  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer ${
        active
          ? "bg-cyan-500/10 text-cyan-400"
          : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
      }`}
    >
      {icon}

      <span className="text-sm font-medium">
        {text}
      </span>
    </div>
  );
}


// =========================
// STAT CARD
// =========================

function StatCard({
  title,
  value,
  detail,
}) {
  return (
    <div className="border border-slate-800 bg-[#0b1729] rounded-2xl p-5">

      <p className="text-sm text-slate-400">
        {title}
      </p>

      <p className="text-3xl font-bold mt-2">
        {value}
      </p>

      <p className="text-xs text-slate-500 mt-2">
        {detail}
      </p>

    </div>
  );
}


// =========================
// RESULT CARD
// =========================

function ResultCard({
  label,
  value,
}) {
  return (
    <div className="border border-slate-800 bg-[#07111f] rounded-xl p-4">

      <p className="text-xs text-slate-500">
        {label}
      </p>

      <p className="font-semibold mt-1 text-slate-100">
        {value}
      </p>

    </div>
  );
}


// =========================
// RESPONSE SECTION
// =========================

function ResponseSection({
  title,
  children,
}) {
  return (
    <div className="border border-slate-800 bg-[#07111f] rounded-xl p-4">

      <h4 className="font-semibold text-slate-100 mb-3">
        {title}
      </h4>

      {children}

    </div>
  );
}


// =========================
// INCIDENT CARD
// =========================

function Incident({
  id,
  priority,
  title,
  location,
  risk,
  status,
  onResolve,
}) {
  const critical =
    priority === "P1";

  const resolved =
    status === "Resolved";


  return (
    <div
      className={`border rounded-xl p-4 transition ${
        resolved
          ? "border-emerald-500/20 bg-emerald-500/5"
          : "border-slate-800 bg-[#07111f] hover:border-slate-700"
      }`}
    >

      <div className="flex justify-between gap-4">

        <div>

          <div className="flex items-center gap-2 mb-2">

            <span
              className={`text-xs font-bold px-2 py-1 rounded-md ${
                resolved
                  ? "bg-emerald-500/15 text-emerald-400"
                  : critical
                  ? "bg-red-500/15 text-red-400"
                  : "bg-orange-500/15 text-orange-400"
              }`}
            >
              {priority}
            </span>


            <span className="text-xs text-slate-500">
              Risk {risk}/100
            </span>

          </div>


          <p className="font-medium">
            {title}
          </p>


          <div className="flex items-center gap-1 mt-2 text-slate-500 text-xs">

            <MapPin size={13} />

            {location}

          </div>


          {status === "Active" && (

            <button
              type="button"
              onClick={() =>
                onResolve(id)
              }
              className="mt-3 px-3 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-sm font-medium hover:bg-emerald-500/20 transition-colors"
            >
              Mark Resolved
            </button>

          )}


          {status === "Resolved" && (

            <div className="mt-3">

              <span className="inline-flex px-3 py-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-sm font-medium">
                ✓ Resolved
              </span>

            </div>

          )}

        </div>


        <AlertTriangle
          size={20}
          className={
            resolved
              ? "text-emerald-400"
              : critical
              ? "text-red-400"
              : "text-orange-400"
          }
        />

      </div>

    </div>
  );
}


export default App;