package com.sujeet.resumematcher;

import java.util.List;

public record MatchResult(
        int score,
        List<String> matchedSkills,
        List<String> missingSkills,
        List<String> requiredSkills
) {}