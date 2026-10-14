import './App.css';
import Sidebar from "./Sidebar.jsx";
import ChatWindow from "./ChatWindow.jsx";
import Dashboard from "./Dashboard.jsx";
import { MyContext } from "./MyContext.jsx";
import { useState } from 'react';
import { v1 as uuidv1 } from "uuid";

function App() {
  const [prompt, setPrompt] = useState("");
  const [reply, setReply] = useState(null);
  const [currThreadId, setCurrThreadId] = useState(uuidv1());
  const [prevChats, setPrevChats] = useState([]);
  const [newChat, setNewChat] = useState(true);
  const [allThreads, setAllThreads] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  // "chat" | "dashboard"
  const [view, setView] = useState("chat");

  const providerValues = {
    prompt, setPrompt,
    reply, setReply,
    currThreadId, setCurrThreadId,
    newChat, setNewChat,
    prevChats, setPrevChats,
    allThreads, setAllThreads,
    sidebarOpen, setSidebarOpen,
    view, setView
  };

  return (
    <div className='app'>
      <MyContext.Provider value={providerValues}>
        <Sidebar />
        {view === "dashboard" ? <Dashboard /> : <ChatWindow />}
      </MyContext.Provider>
    </div>
  );
}

export default App;
