import "./Chat.css";
import React, { useContext, useState, useEffect, useRef } from "react";
import { MyContext } from "./MyContext";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import SigmaLogo from "./SigmaLogo.jsx";

const SUGGESTIONS = [
    {
        title: "Brainstorm Ideas",
        desc: "Innovative concepts for AI productivity tools",
        prompt: "Give me 5 innovative SaaS ideas combining AI with modern web productivity."
    },
    {
        title: "Write Clean Code",
        desc: "Express route with robust error handling",
        prompt: "Show me a production-ready Express.js route with error handling and validation."
    },
    {
        title: "Explain a Concept",
        desc: "How transformer models process tokens",
        prompt: "Explain how transformer neural networks process text tokens in simple terms."
    },
    {
        title: "Polish Writing",
        desc: "Draft a concise project pitch",
        prompt: "Draft an engaging and concise pitch for a full-stack AI chat application."
    }
];

function CodeBlock({ children, ...props }) {
    const [copied, setCopied] = useState(false);
    const codeRef = useRef(null);

    const handleCopy = () => {
        if (codeRef.current) {
            const text = codeRef.current.innerText;
            navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="codeBlockWrapper">
            <button className="copyBtn" onClick={handleCopy} title="Copy code">
                <i className={`fa-solid ${copied ? "fa-check" : "fa-copy"}`}></i>
                <span>{copied ? "Copied!" : "Copy"}</span>
            </button>
            <pre ref={codeRef} {...props}>
                {children}
            </pre>
        </div>
    );
}

function Chat() {
    const { prevChats, reply, setPrompt } = useContext(MyContext);
    const [latestReply, setLatestReply] = useState(null);
    const chatBottomRef = useRef(null);

    // Auto-scroll on new content
    useEffect(() => {
        chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [prevChats, latestReply]);

    // Typewriter effect for latest assistant reply
    useEffect(() => {
        if (!reply || typeof reply !== "string") {
            setLatestReply(null);
            return;
        }

        if (!Array.isArray(prevChats) || !prevChats.length) {
            setLatestReply(null);
            return;
        }

        const words = reply.split(" ");
        let idx = 0;
        const interval = setInterval(() => {
            setLatestReply(words.slice(0, idx + 1).join(" "));
            idx++;
            if (idx >= words.length) clearInterval(interval);
        }, 30);

        return () => clearInterval(interval);
    }, [prevChats, reply]);

    const handleSuggestionClick = (promptText) => {
        setPrompt(promptText);
    };

    const hasChats = Array.isArray(prevChats) && prevChats.length > 0;

    return (
        <div className="chatContainer">
            {!hasChats ? (
                /* Hero Greeting / Empty State */
                <div className="heroGreeting">
                    <div className="heroLogoWrapper">
                        <SigmaLogo size={52} />
                    </div>
                    <h1 className="heroTitle">What can I help with today?</h1>
                    <p className="heroSubtitle">
                        SigmaGPT by <span className="authorName">Subham Tomar</span> • Powered by Mistral AI
                    </p>

                    <div className="suggestionsGrid">
                        {SUGGESTIONS.map((item, idx) => (
                            <div 
                                key={idx} 
                                className="suggestionCard"
                                onClick={() => handleSuggestionClick(item.prompt)}
                            >
                                <span className="suggestionTitle">{item.title}</span>
                                <span className="suggestionDesc">{item.desc}</span>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                /* Messages Stream */
                <div className="chats">
                    {prevChats.map((chat, idx) => {
                        const isLast = idx === prevChats.length - 1;

                        if (chat.role === "user") {
                            return (
                                <div className="messageRow userRow" key={idx}>
                                    <div className="userMessageBubble">
                                        <p>{chat.content}</p>
                                    </div>
                                    <div className="avatar userAvatar">
                                        <span>ST</span>
                                    </div>
                                </div>
                            );
                        }

                        // Assistant message
                        const displayedContent = (isLast && latestReply !== null) 
                            ? latestReply 
                            : (chat.content || "");

                        return (
                            <div className="messageRow botRow" key={idx}>
                                <div className="avatar botAvatar">
                                    <SigmaLogo size={20} />
                                </div>
                                <div className="botMessageContent">
                                    <ReactMarkdown 
                                        rehypePlugins={[rehypeHighlight]}
                                        components={{
                                            pre: ({ node, ...props }) => <CodeBlock {...props} />
                                        }}
                                    >
                                        {displayedContent}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={chatBottomRef} />
                </div>
            )}
        </div>
    );
}

export default Chat;