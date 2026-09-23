import "./Sidebar.css";
import { useContext, useEffect } from "react";
import { MyContext } from "./MyContext.jsx";
import { v1 as uuidv1 } from "uuid";
import SigmaLogo from "./SigmaLogo.jsx";

function Sidebar() {
    const { 
        allThreads, 
        setAllThreads, 
        currThreadId, 
        setNewChat, 
        setPrompt, 
        setReply, 
        setCurrThreadId, 
        setPrevChats,
        sidebarOpen,
        setSidebarOpen
    } = useContext(MyContext);

    useEffect(() => {
        const getAllThreads = async () => {
            try {
                const response = await fetch("/api/thread");
                const res = await response.json();
                if (Array.isArray(res)) {
                    const filteredData = res.map(thread => ({ threadId: thread.threadId, title: thread.title }));
                    setAllThreads(filteredData);
                } else {
                    console.warn("Unexpected threads response:", res);
                }
            } catch (err) {
                console.error("Error fetching threads:", err);
            }
        };

        getAllThreads();
    }, [currThreadId, setAllThreads]);

    const createNewChat = () => {
        setNewChat(true);
        setPrompt("");
        setReply(null);
        setCurrThreadId(uuidv1());
        setPrevChats([]);
    };

    const changeThread = async (newThreadId) => {
        setCurrThreadId(newThreadId);

        try {
            const response = await fetch(`/api/thread/${newThreadId}`);
            const res = await response.json();
            setPrevChats(Array.isArray(res) ? res : []);
            setNewChat(false);
            setReply(null);
        } catch (err) {
            console.error("Error changing thread:", err);
            setPrevChats([]);
        }
    };

    const deleteThread = async (threadId) => {
        try {
            const response = await fetch(`/api/thread/${threadId}`, { method: "DELETE" });
            await response.json();

            setAllThreads(prev => prev.filter(thread => thread.threadId !== threadId));

            if (threadId === currThreadId) {
                createNewChat();
            }
        } catch (err) {
            console.error("Error deleting thread:", err);
        }
    };

    return (
        <aside className={`sidebar ${sidebarOpen ? "open" : "closed"}`}>
            {/* Header / Brand */}
            <div className="sidebarHeader">
                <div className="brandGroup" onClick={createNewChat}>
                    <SigmaLogo size={28} />
                    <div className="brandText">
                        <span className="brandTitle">SigmaGPT</span>
                        <span className="brandBadge">AI</span>
                    </div>
                </div>
                <button 
                    className="iconBtn closeBtn" 
                    onClick={() => setSidebarOpen(false)}
                    title="Close Sidebar"
                >
                    <i className="fa-solid fa-xmark"></i>
                </button>
            </div>

            {/* New Chat Action */}
            <button className="newChatBtn" onClick={createNewChat}>
                <div className="newChatContent">
                    <i className="fa-solid fa-plus"></i>
                    <span>New chat</span>
                </div>
                <span className="kbdShortcut">⌘N</span>
            </button>

            {/* History Section */}
            <div className="historySection">
                <span className="historyLabel">Recent Chats</span>
                <ul className="history">
                    {
                        allThreads && allThreads.length > 0 ? (
                            allThreads.map((thread, idx) => (
                                <li 
                                    key={idx} 
                                    onClick={() => changeThread(thread.threadId)}
                                    className={`historyItem ${thread.threadId === currThreadId ? "active" : ""}`}
                                    title={thread.title}
                                >
                                    <i className="fa-regular fa-message itemIcon"></i>
                                    <span className="threadTitle">{thread.title}</span>
                                    <button 
                                        className="deleteBtn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            deleteThread(thread.threadId);
                                        }}
                                        title="Delete chat"
                                    >
                                        <i className="fa-solid fa-trash-can"></i>
                                    </button>
                                </li>
                            ))
                        ) : (
                            <div className="emptyHistory">
                                <span>No chats yet</span>
                            </div>
                        )
                    }
                </ul>
            </div>

            {/* Subham Tomar Branding Card */}
            <div className="creatorCard">
                <div className="creatorAvatar">ST</div>
                <div className="creatorDetails">
                    <span className="creatorName">Subham Tomar</span>
                    <span className="creatorRole">Creator & Developer</span>
                </div>
                <div className="creatorStatus" title="System Online">
                    <span className="statusDot"></span>
                </div>
            </div>
        </aside>
    );
}

export default Sidebar;