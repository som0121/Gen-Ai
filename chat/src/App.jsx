import { useEffect, useRef, useState } from "react";

const API_ENDPOINT = "http://localhost:8787/api/chat";

function MessageBubble({ role, text, pending }) {
  const isUser = role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-lg px-4 py-2 text-sm leading-relaxed ${
          isUser
            ? "bg-amber-500 text-slate-900"
            : "bg-slate-800 text-slate-100 border border-slate-700"
        }`}
      >
        {pending ? (
          <span className="animate-pulse text-slate-400">Thinking…</span>
        ) : (
          <span className="whitespace-pre-wrap">{text}</span>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, pending]);

  const sendMessage = async () => {
    const text = draft.trim();
    if (!text || pending) return;

    const history = messages.map((m) => ({
      role: m.role === "user" ? "user" : "model",
      text: m.text,
    }));

    setMessages((prev) => [...prev, { role: "user", text }]);
    setDraft("");
    setPending(true);

    try {
      const res = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setMessages((prev) => [...prev, { role: "model", text: data.reply }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: "model", text: `⚠ ${err.message}` }]);
    } finally {
      setPending(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex justify-center py-10 px-4">
      <div className="w-full max-w-2xl flex flex-col gap-4">
        <h1 className="text-xl font-semibold text-slate-100">DSA Chatbot</h1>

        <div
          ref={scrollRef}
          className="flex-1 min-h-[26rem] max-h-[32rem] overflow-y-auto bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-col gap-3"
        >
          {messages.length === 0 && (
            <p className="text-slate-500 text-sm m-auto">
              Ask a question about data structures or algorithms.
            </p>
          )}
          {messages.map((m, i) => (
            <MessageBubble key={i} role={m.role} text={m.text} />
          ))}
          {pending && <MessageBubble role="model" pending />}
        </div>

        <div className="flex gap-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            rows={1}
            placeholder="e.g. What is a stack?"
            className="flex-1 resize-none rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-amber-500"
          />
          <button
            onClick={sendMessage}
            disabled={pending || !draft.trim()}
            className="px-4 py-2 rounded-md bg-amber-500 text-slate-900 text-sm font-medium disabled:opacity-30"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}