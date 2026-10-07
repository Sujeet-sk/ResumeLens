# ResumeLens: AI Resume–Job Description Matcher

A full-stack web app that compares a resume against a target job description, shows which skills genuinely match and which are missing, and generates tailored resume-improvement suggestions with Gemini, without ever inventing experience the candidate doesn't have.

> **Live demo:** _coming soon_ &nbsp;|&nbsp; **Built:** Sep 2026

<!-- Add a screenshot here: ![ResumeLens screenshot](docs/screenshot.png) -->

---

## What it does

1. Upload your resume as **PDF, DOCX, or TXT**.
2. Paste the **job description** you are targeting.
3. Get back:
   - A **resume–job fit analysis**
   - **Matched skills**: skills that appear in both the resume and the job description
   - **Missing skills**: skills the job asks for that your resume doesn't show
   - **AI-generated bullet suggestions** that rephrase and strengthen what is already in your resume

This is not a generic AI chatbot. The product does one thing: resume-to-job-description analysis and actionable resume improvement.

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite |
| Backend | Java 21, Spring Boot (REST API) |
| AI | Gemini REST API via Java `HttpClient` |
| JSON | Jackson |
| Testing | JUnit 5 |

---

## Architecture

```
┌────────────────────────┐        POST /api/analyze        ┌──────────────────────────────┐
│ React + Vite frontend  │ ──────────────────────────────▶ │ Spring Boot backend          │
│                        │  { resumeText, jobDescription } │                              │
│ • file upload          │                                 │  AnalyzeController           │
│ • PDF/DOCX/TXT → text  │                                 │        ↓                     │
│ • JD input             │ ◀────────────────────────────── │  MatchService (skill matcher)│
│ • results display      │   fit, matched, missing, tips   │        ↓                     │
└────────────────────────┘                                 │  GeminiService + validation  │
                                                           └──────────────┬───────────────┘
                                                                          │ HttpClient + Jackson
                                                                          ▼
                                                                    Gemini REST API
```

**Frontend responsibilities**
- Resume file upload
- Text extraction from PDF, DOCX, and TXT files
- Job description input
- Sending the extracted resume text and the job description to the backend
- Displaying the fit analysis, matched skills, missing skills, and AI suggestions

**Backend responsibilities**
- A REST controller exposing a single **stateless** `POST /api/analyze` endpoint
- A service layer holding the business logic, wired with **constructor dependency injection**
- Deterministic skill matching
- Gemini integration through Java's built-in `HttpClient`, with Jackson handling JSON requests and responses
- Validation of the AI response before anything reaches the user

The backend stores nothing. Each request is independent and no resume data is persisted.

---

## Core design decisions

### 1. Deterministic skill matching (no naive substring checks)

Skill matching does **not** use `contains()`. A substring check would report `Java` as present whenever the resume says `JavaScript`.

Instead, text is **normalized first** (case, punctuation, whitespace) and skills are matched as whole terms using **word-boundary checks**. This separates:

- genuinely matched skills
- missing skills
- irrelevant or false matches

For example, `Java` does **not** match `JavaScript`.

### 2. Defensive AI integration

Gemini is used only to generate tailored bullet suggestions, and its output is treated as untrusted:

- The model is asked to follow a **strict JSON schema**.
- The response is **validated** before use.
- If the response is malformed, incomplete, or invalid, the app uses a **safe fallback** instead of showing broken AI output.

### 3. No fabrication

The prompt constrains the model so it must never invent:

- skills
- projects
- experience
- achievements
- technologies
- responsibilities

Suggestions may only **improve or rephrase information that already exists in the resume**.

### 4. Secure API key handling

The Gemini API key is read from the `GEMINI_API_KEY` environment variable on the backend only. The browser never sees it and it is never committed to the repository. The frontend talks only to `/api/analyze`.

---

## Testing

JUnit 5 tests (`MatchServiceTest`) cover the skill-matching edge cases that matter most:

- `Java` vs `JavaScript`
- similar skill names
- word boundaries
- upper/lower case differences
- punctuation and normalization

Run them with:

```bash
cd backend
./mvnw test
```

---

## Getting started

### Prerequisites

- JDK 21
- Node.js 18+
- A Gemini API key from [Google AI Studio](https://aistudio.google.com/)

(The Maven wrapper is included, so a separate Maven install is not required.)

### 1. Clone

```bash
git clone https://github.com/Sujeet-sk/ResumeLens.git
cd ResumeLens
```

### 2. Run the backend

Set your API key as an environment variable. Never hard-code it.

```bash
# macOS / Linux / Git Bash
export GEMINI_API_KEY=your_key_here

# Windows PowerShell
$env:GEMINI_API_KEY="your_key_here"
```

Then start the server:

```bash
cd backend
./mvnw spring-boot:run
```

The API runs on `http://localhost:8080`.

### 3. Run the frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

The app opens on `http://localhost:5173`.

---

## API

### `POST /api/analyze`

**Request**

```json
{
  "resumeText": "…extracted resume text…",
  "jobDescription": "…target job description…"
}
```

**Response** (shape)

```json
{
  "fitScore": 0,
  "matchedSkills": [],
  "missingSkills": [],
  "suggestions": []
}
```

> Field names are indicative. Keep this section in sync with `MatchResult.java`.

---

## Project structure

```
ResumeLens/
├── backend/
│   ├── pom.xml
│   └── src/
│       ├── main/java/com/sujeet/resumematcher/
│       │   ├── ResumeMatcherApplication.java
│       │   ├── AnalyzeController.java   # REST endpoint
│       │   ├── MatchService.java        # skill matching logic
│       │   ├── GeminiService.java       # Gemini API client + response validation
│       │   └── MatchResult.java         # response model
│       └── test/java/com/sujeet/resumematcher/
│           └── MatchServiceTest.java    # JUnit 5 edge-case tests
└── frontend/
    ├── package.json
    └── src/
        ├── App.jsx
        └── main.jsx
```

---

## What this project demonstrates

1. React frontend development
2. Spring Boot REST API design
3. File and text processing
4. Deterministic text matching
5. AI API integration
6. JSON schema validation
7. Defensive handling of AI responses
8. Automated testing
9. Layered backend architecture
10. Secure handling of an API key

---

## Roadmap

- Deploy a public live demo
- Expand the skill dictionary and add synonym handling
- Export the improved bullets

---

## Author

**Sujeet Kumar**
[GitHub](https://github.com/Sujeet-sk) · [LinkedIn](https://linkedin.com/in/sujeet-kumar)
