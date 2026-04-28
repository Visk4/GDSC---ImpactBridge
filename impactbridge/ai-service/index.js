require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { generateProposal, parseCSRPolicy, analyzeNGODescription, generateMatchExplanation, parseDocumentVision, translateText } = require("./services/geminiService");
const scheduleVII = require("./data/scheduleVII.json");

const app = express();
const PORT = process.env.PORT || 3001;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Health
app.get("/health", (_req, res) => res.json({ status: "ok", service: "impactbridge-ai", gemini: !!process.env.GEMINI_API_KEY, googleApi: !!GOOGLE_API_KEY }));

// POST /generate-proposal
app.post("/generate-proposal", async (req, res) => {
  try {
    const { name, registrationType, state, theme, description, yearsActive, annualBeneficiaries } = req.body;
    if (!description) return res.status(400).json({ error: "Description is required" });

    // Analyze description first (language detection, entities)
    const analysis = await analyzeNGODescription(description);
    const descriptionToUse = analysis.translatedToEnglish || description;

    const proposal = await generateProposal({ name, registrationType, state, theme, description: descriptionToUse, yearsActive, annualBeneficiaries });

    res.json({ proposal, analysis });
  } catch (err) {
    console.error("Proposal generation error:", err);
    res.status(500).json({ error: "Failed to generate proposal", details: err.message });
  }
});

// POST /parse-csr-policy (NEW — AI reads corporate CSR policy text)
app.post("/parse-csr-policy", async (req, res) => {
  try {
    const { policyText } = req.body;
    if (!policyText || policyText.trim().length < 20) {
      return res.status(400).json({ error: "Policy text too short" });
    }
    const parsed = await parseCSRPolicy(policyText);
    res.json({ parsed });
  } catch (err) {
    console.error("CSR policy parse error:", err);
    res.status(500).json({ error: "Failed to parse CSR policy", details: err.message });
  }
});

// POST /analyze-description (NEW — NLP analysis of NGO description)
app.post("/analyze-description", async (req, res) => {
  try {
    const { description } = req.body;
    if (!description) return res.status(400).json({ error: "Description required" });
    const analysis = await analyzeNGODescription(description);
    res.json({ analysis });
  } catch (err) {
    res.status(500).json({ error: "Analysis failed", details: err.message });
  }
});

// POST /check-compliance
app.post("/check-compliance", (req, res) => {
  try {
    const { registrationType, theme, description } = req.body;
    const descLower = (description || "").toLowerCase();
    const themeLower = (theme || "").toUpperCase();

    let matchedActivities = [];
    for (const activity of scheduleVII.activities) {
      const themeMatch = activity.themes.includes(themeLower);
      const keywordMatch = activity.keywords.some((kw) => descLower.includes(kw.toLowerCase()));
      if (themeMatch || keywordMatch) {
        matchedActivities.push({
          clause: activity.clause,
          activity: activity.activity,
          matchType: themeMatch ? "theme" : "keyword"
        });
      }
    }

    const regType = (registrationType || "").toUpperCase();
    let complianceLevel = "BASIC";
    if (regType.includes("FCRA") || regType.includes("SECTION")) complianceLevel = "HIGH";
    else if (regType === "TRUST") complianceLevel = "MODERATE";

    res.json({
      complianceLevel,
      matchedActivities,
      registrationType: regType,
      note: matchedActivities.length > 0
        ? `Activity aligns with ${matchedActivities[0].clause}: ${matchedActivities[0].activity}. Eligible under Schedule VII.`
        : "No direct Schedule VII match found. Manual review recommended."
    });
  } catch (err) {
    res.status(500).json({ error: "Compliance check failed", details: err.message });
  }
});

// POST /generate-match-explanation
app.post("/generate-match-explanation", async (req, res) => {
  try {
    const result = await generateMatchExplanation(req.body);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Match explanation failed" });
  }
});

// GET /geocode?address=Nandurbar+Maharashtra (NEW — Google Geocoding)
app.get("/geocode", async (req, res) => {
  try {
    const { address } = req.query;
    if (!address) return res.status(400).json({ error: "Address required" });
    if (!GOOGLE_API_KEY) return res.status(400).json({ error: "Google API key not configured" });

    const response = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json`, {
      params: { address: `${address}, India`, key: GOOGLE_API_KEY }
    });

    const result = response.data.results[0];
    if (!result) return res.status(404).json({ error: "Location not found" });

    res.json({
      lat: result.geometry.location.lat,
      lng: result.geometry.location.lng,
      formattedAddress: result.formatted_address
    });
  } catch (err) {
    res.status(500).json({ error: "Geocoding failed", details: err.message });
  }
});

// GET /places-autocomplete?input=Nandurbar (NEW — Google Places)
app.get("/places-autocomplete", async (req, res) => {
  try {
    const { input } = req.query;
    if (!input) return res.status(400).json({ error: "Input required" });
    if (!GOOGLE_API_KEY) return res.status(400).json({ error: "Google API key not configured" });

    const response = await axios.get(`https://maps.googleapis.com/maps/api/place/autocomplete/json`, {
      params: {
        input: `${input} India`,
        types: "(cities)",
        components: "country:in",
        key: GOOGLE_API_KEY
      }
    });

    const suggestions = response.data.predictions.map(p => ({
      description: p.description,
      placeId: p.place_id,
      mainText: p.structured_formatting.main_text
    }));

    res.json({ suggestions });
  } catch (err) {
    res.status(500).json({ error: "Places autocomplete failed" });
  }
});

app.post('/api/ai/vision-ocr', async (req, res) => {
  const { image } = req.body;
  if (!image) return res.status(400).json({ error: "Image is required" });
  try {
    const text = await parseDocumentVision(image);
    res.json({ text });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/ai/translate', async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "Text is required" });
  try {
    const result = await translateText(text);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🤖 ImpactBridge AI Service running on port ${PORT}`);
  console.log(`   Gemini API: ${process.env.GEMINI_API_KEY ? "✅ Connected" : "❌ Missing"}`);
  console.log(`   Google API: ${GOOGLE_API_KEY ? "✅ Connected" : "❌ Missing"}`);
});
