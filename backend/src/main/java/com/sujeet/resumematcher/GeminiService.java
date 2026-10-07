package com.sujeet.resumematcher;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Map;

@Service
public class GeminiService {

    // If you ever get a 404 "model not found", swap this for another
    // free model like "gemini-1.5-flash" or "gemini-2.5-flash".
    private static final String MODEL = "gemini-3.5-flash-lite";
    private static final String API_KEY = System.getenv("GEMINI_API_KEY");

    private final HttpClient httpClient = HttpClient.newHttpClient();
    private final ObjectMapper mapper = new ObjectMapper();


    public String generate(String prompt) {
        if (API_KEY == null || API_KEY.isBlank()) {
            return "ERROR: GEMINI_API_KEY environment variable is not set.";
        }

        try {
            String url = "https://generativelanguage.googleapis.com/v1beta/models/"
                    + MODEL + ":generateContent?key=" + API_KEY;

            // Build the request body as JSON using Jackson
            Map<String, Object> body = Map.of(
                    "contents", new Object[]{
                            Map.of("parts", new Object[]{
                                    Map.of("text", prompt)
                            })
                    }
            );
            String jsonBody = mapper.writeValueAsString(body);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Content-Type", "application/json")
                    .timeout(Duration.ofSeconds(30))
                    .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                    .build();

            HttpResponse<String> response =
                    httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                return "ERROR: Gemini returned status " + response.statusCode()
                        + " -> " + response.body();
            }

            // Pull out candidates[0].content.parts[0].text
            JsonNode textNode = mapper.readTree(response.body())
                    .path("candidates").path(0)
                    .path("content").path("parts").path(0)
                    .path("text");

            if (textNode.isMissingNode()) {
                return "ERROR: unexpected response -> " + response.body();
            }
            return textNode.asText();

        } catch (Exception e) {
            return "ERROR: could not reach Gemini -> " + e.getMessage();
        }
    }
    public java.util.List<String> suggestBullets(String resume, String jobDescription,
                                                 java.util.List<String> missingSkills) {
        String prompt = """
            You are a resume coach helping a candidate tailor their resume to a job.
            Using ONLY the real experience in their resume, suggest 3 to 5 concrete,
            rewritten resume bullet points that better match the job description.
            Do NOT invent skills or experience the candidate does not have. If the
            candidate lacks a required skill, you may suggest they gain or highlight
            related real experience, but never fabricate.

            Return ONLY valid JSON in exactly this shape, nothing else:
            { "suggestions": ["first bullet", "second bullet", "third bullet"] }

            RESUME:
            """ + resume + """

            JOB DESCRIPTION:
            """ + jobDescription + """

            SKILLS THE JOB WANTS THAT ARE MISSING FROM THE RESUME:
            """ + String.join(", ", missingSkills);

        String raw = generate(prompt);

        // The model sometimes wraps JSON in ```json fences — strip them.
        String cleaned = raw.replace("```json", "").replace("```", "").trim();

        try {
            JsonNode node = mapper.readTree(cleaned).path("suggestions");
            java.util.List<String> suggestions = new java.util.ArrayList<>();
            if (node.isArray()) {
                for (JsonNode item : node) {
                    suggestions.add(item.asText());
                }
            }
            if (suggestions.isEmpty()) {
                suggestions.add("No AI suggestions were generated. Try adding more detail to your resume.");
            }
            return suggestions;
        } catch (Exception e) {
            // Fallback if the model didn't return valid JSON
            return java.util.List.of("AI suggestions are temporarily unavailable. Please try again.");
        }
    }
}