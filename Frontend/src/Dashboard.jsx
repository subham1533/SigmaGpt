import "./Dashboard.css";
import { useContext, useEffect, useState, useCallback } from "react";
import { MyContext } from "./MyContext.jsx";
import SigmaLogo from "./SigmaLogo.jsx";

const formatDate = (iso) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const formatTime = (iso) => {
    if (!iso) return "—";
    const d = new Date(iso);
    const diff = Date.now() - d.getTime();
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(mins / 60);
    const days = Math.floor(hrs / 24);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    if (hrs < 24) return `${hrs}h ago`;
    return `${days}d ago`;
};

const StatCard = ({ icon, label, value, sub }) => (
    <div className="statCard">
        <div className="statIcon">
            <i className={`fa-solid ${icon}`}></i>
        </div>
        <div className="statBody">
            <span className="statValue">{value ?? "—"}</span>
            <span className="statLabel">{label}</span>
            {sub && <span className="statSub">{sub}</span>}
        </div>
    </div>
);

function Dashboard() {
    const { setSidebarOpen, sidebarOpen, setView } = useContext(MyContext);

    const [stats, setStats] = useState(null);
    const [health, setHealth] = useState(null);
    const [loading, setLoading] = useState(true);
    const [lastRefreshed, setLastRefreshed] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [statsRes, healthRes] = await Promise.all([
                fetch("/api/stats"),
                fetch("/api/health")
            ]);
            const statsData = await statsRes.json();
            const healthData = await healthRes.json();
            setStats(statsData);
            setHealth(healthData);
            setLastRefreshed(new Date());
        } catch (err) {
            console.error("Dashboard fetch error:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        // Auto-refresh every 30 seconds
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, [fetchData]);

    const avgMsgsPerThread = stats?.totalThreads > 0
        ? (stats.totalMessages / stats.totalThreads).toFixed(1)
        : "0";

    return (
        <main className="dashboardPage">
            {/* Navbar */}
            <header className="navbar">
                <div className="navLeft">
                    {!sidebarOpen && (
                        <button
                            className="sidebarToggleBtn"
                            onClick={() => setSidebarOpen(true)}
                            title="Open Sidebar"
                        >
                            <i className="fa-solid fa-bars-staggered"></i>
                        </button>
                    )}
                    <div className="modelSelector">
                        <SigmaLogo size={18} />
                        <span className="modelName">SigmaGPT</span>
                        <span className="modelVersion">Dashboard</span>
                    </div>
                </div>
                <div className="navRight">
                    <button
                        className="dashNavBtn"
                        onClick={fetchData}
                        disabled={loading}
                        title="Refresh stats"
                    >
                        <i className={`fa-solid fa-rotate-right ${loading ? "fa-spin" : ""}`}></i>
                        <span>Refresh</span>
                    </button>
                    <button
                        className="dashNavBtn dashNavBtnPrimary"
                        onClick={() => setView("chat")}
                        title="Back to Chat"
                    >
                        <i className="fa-solid fa-message"></i>
                        <span>Back to Chat</span>
                    </button>
                </div>
            </header>

            {/* Dashboard Body */}
            <div className="dashboardBody">

                {/* Page Title */}
                <div className="dashboardTitleRow">
                    <div>
                        <h1 className="dashboardTitle">Analytics Dashboard</h1>
                        <p className="dashboardSubtitle">
                            Live overview of your SigmaGPT usage
                            {lastRefreshed && (
                                <span className="refreshTime"> · Updated {formatTime(lastRefreshed.toISOString())}</span>
                            )}
                        </p>
                    </div>
                </div>

                {loading && !stats ? (
                    <div className="dashLoadingState">
                        <i className="fa-solid fa-circle-notch fa-spin"></i>
                        <span>Loading dashboard data...</span>
                    </div>
                ) : (
                    <>
                        {/* System Status Banner */}
                        <div className={`statusBanner ${health?.status === "ok" ? "statusOk" : "statusError"}`}>
                            <div className="statusBannerLeft">
                                <span className={`statusPulse ${health?.status === "ok" ? "pulseGreen" : "pulseRed"}`}></span>
                                <span className="statusBannerText">
                                    System {health?.status === "ok" ? "Operational" : "Degraded"}
                                </span>
                            </div>
                            <div className="statusBannerRight">
                                <span className="statusPill">
                                    <i className="fa-solid fa-microchip"></i>
                                    {health?.model || stats?.model || "ministral-8b-latest"}
                                </span>
                                <span className="statusPill">
                                    <i className="fa-solid fa-database"></i>
                                    {health?.database || "—"}
                                </span>
                                {stats?.firstChatAt && (
                                    <span className="statusPill">
                                        <i className="fa-solid fa-calendar-days"></i>
                                        Since {formatDate(stats.firstChatAt)}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Stat Cards Grid */}
                        <div className="statsGrid">
                            <StatCard
                                icon="fa-comments"
                                label="Total Conversations"
                                value={stats?.totalThreads ?? 0}
                                sub="Unique chat threads"
                            />
                            <StatCard
                                icon="fa-envelope-open-text"
                                label="Total Messages"
                                value={stats?.totalMessages ?? 0}
                                sub="All turns combined"
                            />
                            <StatCard
                                icon="fa-user"
                                label="Your Messages"
                                value={stats?.totalUserMessages ?? 0}
                                sub="Prompts you sent"
                            />
                            <StatCard
                                icon="fa-robot"
                                label="AI Responses"
                                value={stats?.totalAssistantMessages ?? 0}
                                sub="Generated by Mistral"
                            />
                            <StatCard
                                icon="fa-chart-line"
                                label="Avg Messages / Chat"
                                value={avgMsgsPerThread}
                                sub="Per conversation"
                            />
                            <StatCard
                                icon="fa-bolt"
                                label="Active Model"
                                value="Ministral 8B"
                                sub="Mistral AI"
                            />
                        </div>

                        {/* Message Breakdown */}
                        <div className="dashSection">
                            <h2 className="sectionTitle">
                                <i className="fa-solid fa-chart-pie"></i>
                                Message Breakdown
                            </h2>
                            <div className="breakdownCard">
                                <div className="breakdownBar">
                                    <div
                                        className="breakdownFill userFill"
                                        style={{
                                            width: stats?.totalMessages > 0
                                                ? `${(stats.totalUserMessages / stats.totalMessages) * 100}%`
                                                : "50%"
                                        }}
                                    ></div>
                                    <div
                                        className="breakdownFill aiFill"
                                        style={{
                                            width: stats?.totalMessages > 0
                                                ? `${(stats.totalAssistantMessages / stats.totalMessages) * 100}%`
                                                : "50%"
                                        }}
                                    ></div>
                                </div>
                                <div className="breakdownLegend">
                                    <div className="legendItem">
                                        <span className="legendDot userDot"></span>
                                        <span className="legendLabel">You — {stats?.totalUserMessages ?? 0} msgs</span>
                                    </div>
                                    <div className="legendItem">
                                        <span className="legendDot aiDot"></span>
                                        <span className="legendLabel">SigmaGPT — {stats?.totalAssistantMessages ?? 0} msgs</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div className="dashSection">
                            <h2 className="sectionTitle">
                                <i className="fa-solid fa-clock-rotate-left"></i>
                                Recent Conversations
                            </h2>
                            <div className="activityList">
                                {stats?.recentActivity?.length > 0 ? (
                                    stats.recentActivity.map((item, idx) => (
                                        <div className="activityItem" key={idx}>
                                            <div className="activityIcon">
                                                <i className="fa-regular fa-message"></i>
                                            </div>
                                            <div className="activityContent">
                                                <span className="activityTitle">{item.title}</span>
                                                <span className="activityMeta">
                                                    {item.messageCount} messages · Started {formatDate(item.createdAt)}
                                                </span>
                                            </div>
                                            <div className="activityTime">
                                                {formatTime(item.updatedAt)}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="noActivity">
                                        <i className="fa-regular fa-comment-dots"></i>
                                        <span>No conversations yet. Start chatting!</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* API & System Info */}
                        <div className="dashSection">
                            <h2 className="sectionTitle">
                                <i className="fa-solid fa-server"></i>
                                System Info
                            </h2>
                            <div className="infoGrid">
                                <div className="infoRow">
                                    <span className="infoKey">Backend</span>
                                    <span className="infoValue">Express.js + SQLite</span>
                                </div>
                                <div className="infoRow">
                                    <span className="infoKey">Frontend</span>
                                    <span className="infoValue">React 19 + Vite</span>
                                </div>
                                <div className="infoRow">
                                    <span className="infoKey">AI Provider</span>
                                    <span className="infoValue">Mistral AI</span>
                                </div>
                                <div className="infoRow">
                                    <span className="infoKey">Model</span>
                                    <span className="infoValue">{health?.model || stats?.model || "ministral-8b-latest"}</span>
                                </div>
                                <div className="infoRow">
                                    <span className="infoKey">Database</span>
                                    <span className={`infoValue ${health?.database === "connected" ? "textGreen" : "textRed"}`}>
                                        {health?.database === "connected" ? "● Connected" : "○ Disconnected"}
                                    </span>
                                </div>
                                <div className="infoRow">
                                    <span className="infoKey">API Status</span>
                                    <span className={`infoValue ${health?.status === "ok" ? "textGreen" : "textRed"}`}>
                                        {health?.status === "ok" ? "● Operational" : "○ Error"}
                                    </span>
                                </div>
                                <div className="infoRow">
                                    <span className="infoKey">Built by</span>
                                    <span className="infoValue">Subham Tomar</span>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </main>
    );
}

export default Dashboard;
