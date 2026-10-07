package com.sujeet.resumematcher;

import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class MatchService {

    // The vocabulary the matcher understands. Grow this list over time.
    private static final List<String> KNOWN_SKILLS = List.of(
            "java", "spring boot", "hibernate", "jdbc", "maven",
            "python", "javascript", "typescript", "react", "angular",
            "node", "html", "css", "sql", "mysql", "postgresql", "mongodb",
            "rest", "api", "git", "github", "docker", "kubernetes", "aws",
            "linux", "junit", "data structures", "algorithms",
            "oop", "microservices", "agile"
    );

    public MatchResult analyze(String resume, String jobDescription) {
        String normalizedResume = normalize(resume);
        String normalizedJd = normalize(jobDescription);

        List<String> requiredSkills = new ArrayList<>();
        List<String> matchedSkills = new ArrayList<>();
        List<String> missingSkills = new ArrayList<>();

        for (String skill : KNOWN_SKILLS) {
            String padded = " " + skill + " ";
            if (normalizedJd.contains(padded)) {          // job asks for it
                requiredSkills.add(skill);
                if (normalizedResume.contains(padded)) {  // resume has it
                    matchedSkills.add(skill);
                } else {
                    missingSkills.add(skill);
                }
            }
        }

        int score = requiredSkills.isEmpty()
                ? 0
                : (int) Math.round(100.0 * matchedSkills.size() / requiredSkills.size());

        return new MatchResult(score, matchedSkills, missingSkills, requiredSkills);
    }

    // lowercase, turn punctuation into spaces, pad with spaces so we match
    // whole words/phrases (so "java" won't accidentally match "javascript").
    private String normalize(String text) {
        if (text == null) return " ";
        String cleaned = text.toLowerCase().replaceAll("[^a-z0-9+# ]", " ");
        return " " + cleaned.replaceAll("\\s+", " ").trim() + " ";
    }
}