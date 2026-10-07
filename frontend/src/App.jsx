import { useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import * as mammoth from "mammoth/mammoth.browser";
import "./App.css";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

// Change this ONE line to your live backend URL when you deploy.
const API_BASE = "http://localhost:8080";

const SAMPLE_RESUME =
  "Final-year B.E. student experienced with Java, Spring Boot, MySQL, JDBC, Git, and REST APIs. Built an Employee Management System with a layered architecture and JUnit tests. Comfortable with data structures and algorithms.";
const SAMPLE_JD =
  "We are hiring a backend engineer skilled in Java, Spring Boot, MySQL, Docker, Kubernetes, and REST APIs. Experience with microservices and Agile teams is a plus.";

const FEATURES = [
  { icon: "🧠", label: "Skill Matching", labelColor: "#818cf8", cover: "linear-gradient(135deg,#312e81,#4f46e5)",
    title: "Smart Skill Detection", text: "We scan the job post for the skills it requires, then check each one against your resume." },
  { icon: "📊", label: "Scoring", labelColor: "#34d399", cover: "linear-gradient(135deg,#064e3b,#059669)",
    title: "Transparent Score", text: "Your percentage is calculated, not guessed — see which skills you have and which you're missing." },
  { icon: "✨", label: "AI Rewrites", labelColor: "#f0abfc", cover: "linear-gradient(135deg,#581c87,#a21caf)",
    title: "AI-Tailored Bullets", text: "Gemini rewrites your bullets to fit the role — grounded in your real experience, never fabricated." },
  { icon: "📄", label: "Upload", labelColor: "#fbbf24", cover: "linear-gradient(135deg,#7c2d12,#d97706)",
    title: "Drop In Your Resume", text: "Attach a PDF, DOCX, or TXT and we extract the text automatically — no copy-paste needed." },
  { icon: "⚡", label: "Instant", labelColor: "#22d3ee", cover: "linear-gradient(135deg,#155e75,#0891b2)",
    title: "Instant & Private", text: "No sign-up, no accounts, nothing stored. Paste, analyze, and move on in seconds." },
  { icon: "✅", label: "ATS", labelColor: "#f472b6", cover: "linear-gradient(135deg,#831843,#be185d)",
    title: "Beat Keyword Filters", text: "Line up with the keywords recruiter systems scan for, and boost your shortlisting odds." },
  { icon: "🔀", label: "Compare", labelColor: "#60a5fa", cover: "linear-gradient(135deg,#1e3a8a,#2563eb)",
    title: "Side-by-Side View", text: "Compare your resume and the job description together in one clean view." },
  { icon: "🆓", label: "Open", labelColor: "#4ade80", cover: "linear-gradient(135deg,#14532d,#16a34a)",
    title: "Free & Open", text: "An open portfolio project — no paywalls, no limits, just paste and go." },
];

function FeatureCards() {
  return (
    <div className="feature-grid2">
      {FEATURES.map((f, i) => (
        <div className="glow-card" key={i}>
          <div className="glow-inner">
            <div className="glow-cover" style={{ background: f.cover }}>{f.icon}</div>
            <div className="glow-body">
              <p className="glow-label" style={{ color: f.labelColor }}>{f.label}</p>
              <h3 className="glow-title">{f.title}</h3>
              <p className="glow-text">{f.text}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}


function App() {
  const [resume, setResume] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [fileName, setFileName] = useState("");
  const [extracting, setExtracting] = useState(false);

  async function extractPdf(file) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let text = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map((it) => it.str).join(" ") + "\n";
    }
    return text;
  }

  async function handleResumeFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    setError("");
    setExtracting(true);
    setFileName(file.name);
    try {
      const name = file.name.toLowerCase();
      let text = "";
      if (name.endsWith(".pdf")) {
        text = await extractPdf(file);
      } else if (name.endsWith(".docx")) {
        const arrayBuffer = await file.arrayBuffer();
        const res = await mammoth.extractRawText({ arrayBuffer });
        text = res.value;
      } else if (name.endsWith(".txt")) {
        text = await file.text();
      } else {
        throw new Error("Unsupported file. Please use PDF, DOCX, or TXT.");
      }
      setResume(text.trim());
    } catch (err) {
      setError("Could not read that file: " + err.message);
      setFileName("");
    } finally {
      setExtracting(false);
    }
  }

  async function handleAnalyze() {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const response = await fetch(API_BASE + "/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume, jobDescription }),
      });
      if (!response.ok) throw new Error("Server responded with status " + response.status);
      setResult(await response.json());
    } catch (err) {
      setError("Could not reach the backend: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  function loadSample() {
    setResume(SAMPLE_RESUME);
    setJobDescription(SAMPLE_JD);
    setResult(null);
    setError("");
    setFileName("");
  }

  function clearAll() {
    setResume("");
    setJobDescription("");
    setResult(null);
    setError("");
    setFileName("");
  }

  function copySuggestion(text, index) {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
  }

  const scoreColor = (s) => (s >= 75 ? "#16a34a" : s >= 50 ? "#d97706" : "#dc2626");
  const scoreVerdict = (s) =>
    s >= 75 ? "Strong match" : s >= 50 ? "Moderate match" : s > 0 ? "Needs work" : "No required skills detected";

  const canAnalyze = resume.trim() && jobDescription.trim() && !loading;

  return (
    <div className="app">
      <header className="hero">
        <h1 className="hero-title">Resume ↔ Job Description Matcher</h1>
        <p className="hero-subtitle">
          See how well your resume fits a job — with a transparent skill score and AI-tailored bullet suggestions.
        </p>
        <div className="badges">
          <span className="badge">✓ Transparent scoring</span>
          <span className="badge">✦ AI-tailored bullets</span>
          <span className="badge">⚡ Instant analysis</span>
        </div>
      </header>

      <div className="card">
        <div className="toolbar">
          <button className="ghost-btn" onClick={loadSample}>Load sample</button>
          <button className="ghost-btn" onClick={clearAll}>Clear</button>
        </div>

        <div className="inputs">
          <div className="field">
            <div className="field-head">
              <label>Your Resume</label>
              <label className="upload-btn">
                {extracting ? "Reading..." : "📎 Attach file"}
                <input type="file" accept=".pdf,.docx,.txt" onChange={handleResumeFile} hidden />
              </label>
            </div>
            <textarea
              value={resume}
              onChange={(e) => setResume(e.target.value)}
              placeholder="Paste your resume here, or attach a PDF / DOCX / TXT..."
            />
            <div className="field-foot">
              <span className="filename">{fileName && `📄 ${fileName}`}</span>
              <span className="counter">{resume.length} characters</span>
            </div>
          </div>

          <div className="field">
            <div className="field-head">
              <label>Job Description</label>
            </div>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description here..."
            />
            <div className="field-foot">
              <span className="filename"></span>
              <span className="counter">{jobDescription.length} characters</span>
            </div>
          </div>
        </div>

        <button className="analyze-btn" onClick={handleAnalyze} disabled={!canAnalyze}>
          {loading ? (<><span className="spinner" /> Analyzing...</>) : "Analyze Match"}
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      {!result && !loading && !error && (
        <p className="hint">Paste both texts (or hit "Load sample") and click Analyze.</p>
      )}

      {result && (
        <div className="results">
          <div className="score-head">
            <div>
              <p className="score-label">Match Score</p>
              <p className="score-value" style={{ color: scoreColor(result.score) }}>{result.score}%</p>
            </div>
            <span className="verdict" style={{ background: scoreColor(result.score) }}>
              {scoreVerdict(result.score)}
            </span>
          </div>

          <div className="score-bar">
            <div className="score-bar-fill"
                 style={{ width: result.score + "%", background: scoreColor(result.score) }} />
          </div>
          <p className="summary">
            You match <strong>{result.matchedSkills.length}</strong> of{" "}
            <strong>{result.matchedSkills.length + result.missingSkills.length}</strong> skills this job asks for.
          </p>

          <p className="section-title">✅ Skills you have ({result.matchedSkills.length})</p>
          <div className="chips">
            {result.matchedSkills.length > 0
              ? result.matchedSkills.map((s, i) => <span key={i} className="chip matched">{s}</span>)
              : <span className="muted">None found</span>}
          </div>

          <p className="section-title">⚠️ Missing skills ({result.missingSkills.length})</p>
          <div className="chips">
            {result.missingSkills.length > 0
              ? result.missingSkills.map((s, i) => <span key={i} className="chip missing">{s}</span>)
              : <span className="muted">None — great match!</span>}
          </div>

          <p className="section-title">✨ AI suggestions to improve your resume</p>
          <ul className="suggestions">
            {(result.suggestions || []).map((s, i) => (
              <li key={i} className="suggestion-card" style={{ animationDelay: i * 0.08 + "s" }}>
                <span className="suggestion-num">{i + 1}</span>
                <span className="suggestion-text">{s}</span>
                <button className="copy-btn" onClick={() => copySuggestion(s, i)}>
                  {copiedIndex === i ? "✓ Copied" : "Copy"}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <h2 className="features-heading">Why use this tool</h2>
      <FeatureCards />

      <footer className="app-footer">
        <p><strong>How it works:</strong> the backend extracts the skills a job asks for, checks them against your resume for a transparent score, then uses AI to suggest tailored bullet points based on your real experience.</p>
        <p className="muted">Built with React, Spring Boot & the Gemini API.</p>
      </footer>
    </div>
  );
}

export default App;