import "./ChatWindow.css";
import Chat from "./Chat.jsx";
import { MyContext } from "./MyContext.jsx";
import { useContext, useState, useRef, useEffect } from "react";
import SigmaLogo from "./SigmaLogo.jsx";

function ChatWindow() {
    const { 
        prompt, 
        setPrompt, 
        setReply, 
        currThreadId, 
        setPrevChats, 
        setNewChat,
        sidebarOpen,
        setSidebarOpen,
        setAllThreads,
        setView
    } = useContext(MyContext);

    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const textareaRef = useRef(null);

    // Auto-focus input
    useEffect(() => {
        textareaRef.current?.focus();
    }, [currThreadId]);

    const getReply = async () => {
        if (!prompt.trim() || loading) return;

        const currentPrompt = prompt.trim();
        setLoading(true);
        setNewChat(false);

        setPrevChats(prevChats => [
            ...prevChats,
            { role: "user", content: currentPrompt }
        ]);
        setPrompt("");

        const options = {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: currentPrompt,
                threadId: currThreadId
            })
        };

        try {
            const response = await fetch("/api/chat", options);
            const res = await response.json();

            const assistantReply = res?.reply || res?.error || "I couldn't generate a response right now.";

            setReply(assistantReply);
            setPrevChats(prevChats => [
                ...prevChats,
                { role: "assistant", content: assistantReply }
            ]);

            // Refresh thread list in sidebar
            const threadsRes = await fetch("/api/thread");
            const threadsData = await threadsRes.json();
            if (Array.isArray(threadsData)) {
                setAllThreads(threadsData.map(t => ({ threadId: t.threadId, title: t.title })));
            }
        } catch (err) {
            console.error("Chat error:", err);
            const fallbackReply = "Something went wrong while communicating with the API. Please try again.";
            setReply(fallbackReply);
            setPrevChats(prevChats => [
                ...prevChats,
                { role: "assistant", content: fallbackReply }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            getReply();
        }
    };

    const handleProfileClick = () => {
        setIsOpen(!isOpen);
    };

    return (
        <main className="chatWindow">
            {/* Top Navigation Bar */}
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
                        <span className="modelVersion">Mistral 8B</span>
                        <i className="fa-solid fa-chevron-down navChevron"></i>
                    </div>
                </div>

                <div className="navRight">
                    <div className="creatorBadgeHeader" title="Created by Subham Tomar">
                        <span className="badgeDot"></span>
                        <span className="badgeText">by Subham Tomar</span>
                    </div>

                    <button
                        className="navDashBtn"
                        onClick={() => setView("dashboard")}
                        title="Open Dashboard"
                    >
                        <i className="fa-solid fa-chart-line"></i>
                        <span>Dashboard</span>
                    </button>

                    <div className="userIconDiv" onClick={handleProfileClick} title="Account Menu">
                        <div className="userIcon">
                            <span>ST</span>
                        </div>
                    </div>
                </div>

                {isOpen && (
                    <div className="dropDown">
                        <div className="dropDownHeader">
                            <span className="userName">Subham Tomar</span>
                            <span className="userEmail">Developer & Creator</span>
                        </div>
                        <div className="dropDownDivider"></div>
                        <div className="dropDownItem" onClick={() => setIsOpen(false)}>
                            <i className="fa-solid fa-bolt"></i> Model: Ministral-8B
                        </div>
                        <div className="dropDownItem" onClick={() => setIsOpen(false)}>
                            <i className="fa-solid fa-circle-check"></i> Status: Connected
                        </div>
                        <div className="dropDownDivider"></div>
                        <div className="dropDownItem" onClick={() => setIsOpen(false)}>
                            <i className="fa-solid fa-gear"></i> Settings
                        </div>
                    </div>
                )}
            </header>

            {/* Chat Body */}
            <Chat />

            {/* Subtle Loading Shimmer */}
            {loading && (
                <div className="thinkingIndicator">
                    <span className="thinkingDot"></span>
                    <span className="thinkingDot"></span>
                    <span className="thinkingDot"></span>
                    <span className="thinkingText">SigmaGPT is generating...</span>
                </div>
            )}

            {/* Input Box Footer */}
            <footer className="chatInputArea">
                <div className="inputWrapper">
                    <input
                        ref={textareaRef}
                        type="text"
                        placeholder="Message SigmaGPT..."
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={loading}
                    />
                    <button 
                        className={`sendBtn ${prompt.trim() && !loading ? "active" : ""}`}
                        onClick={getReply}
                        disabled={!prompt.trim() || loading}
                        title="Send Message"
                    >
                        <i className="fa-solid fa-arrow-up"></i>
                    </button>
                </div>
                <p className="disclaimer">
                    SigmaGPT may provide inaccurate info. Verification recommended • Built by <strong>Subham Tomar</strong>
                </p>
            </footer>
        </main>
    );
}

export default ChatWindow;