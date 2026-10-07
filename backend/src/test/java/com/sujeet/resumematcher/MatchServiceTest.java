package com.sujeet.resumematcher;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class MatchServiceTest {

    private final MatchService service = new MatchService();

    @Test
    void perfectMatchScores100() {
        MatchResult result = service.analyze(
                "I know Java and React",
                "We need Java and React"
        );
        assertEquals(100, result.score());
        assertTrue(result.missingSkills().isEmpty());
    }

    @Test
    void missingSkillLowersScore() {
        MatchResult result = service.analyze(
                "I know Java",                 // resume has Java only
                "We need Java and Docker"      // job wants Java + Docker
        );
        assertEquals(50, result.score());               // 1 of 2 = 50%
        assertTrue(result.matchedSkills().contains("java"));
        assertTrue(result.missingSkills().contains("docker"));
    }

    @Test
    void noRequiredSkillsGivesZero() {
        MatchResult result = service.analyze(
                "I like painting and music",
                "We want someone who enjoys hiking"
        );
        assertEquals(0, result.score());
    }

    @Test
    void javaDoesNotFalselyMatchJavascript() {
        MatchResult result = service.analyze(
                "I know javascript",           // resume: javascript, NOT java
                "We need java"                 // job wants java
        );
        assertTrue(result.missingSkills().contains("java"));  // should be missing
        assertEquals(0, result.score());
    }
}