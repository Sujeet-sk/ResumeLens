package com.sujeet.resumematcher;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
public class AnalyzeController {

    private final MatchService matchService;
    private final GeminiService geminiService;

    public AnalyzeController(MatchService matchService, GeminiService geminiService) {
        this.matchService = matchService;
        this.geminiService = geminiService;
    }

    @PostMapping("/api/analyze")
    public Map<String, Object> analyze(@RequestBody Map<String, String> request) {
        String resume = request.get("resume");
        String jobDescription = request.get("jobDescription");

        MatchResult match = matchService.analyze(resume, jobDescription);
        var suggestions = geminiService.suggestBullets(resume, jobDescription, match.missingSkills());

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("score", match.score());
        response.put("matchedSkills", match.matchedSkills());
        response.put("missingSkills", match.missingSkills());
        response.put("suggestions", suggestions);
        return response;
    }
}