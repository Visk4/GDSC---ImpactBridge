const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function generateProposal({ name, registrationType, state, theme, description, yearsActive, annualBeneficiaries }) {
  if (!process.env.GEMINI_API_KEY) return getFallbackProposal({ name, theme, annualBeneficiaries });

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `You are an expert CSR compliance officer and NGO proposal writer in India.
Convert this NGO description into a structured, corporate-ready funding proposal.
Respond with ONLY a valid JSON object. No markdown. No explanation. Just JSON.

NGO Name: ${name}
Registration Type: ${registrationType}
State: ${state}
Theme: ${theme}
Description: ${description}
Years Active: ${yearsActive}
Annual Beneficiaries: ${annualBeneficiaries}

Return ONLY this JSON:
{
  "projectTitle": "compelling project title",
  "problemStatement": "2-3 sentence problem description",
  "proposedSolution": "2-3 sentence solution description",
  "targetBeneficiaries": number,
  "budgetRequired": number in INR,
  "budgetBreakdown": {
    "personnel": number,
    "operations": number,
    "equipment": number,
    "monitoring": number
  },
  "expectedOutcomes": ["outcome1", "outcome2", "outcome3"],
  "sdgTags": ["SDG 1", "SDG 4"],
  "scheduleVIICategory": "exact Schedule VII activity name",
  "scheduleVIIClause": "Clause (ii)",
  "credibilityScore": number 0-100,
  "credibilityFactors": ["factor1", "factor2"],
  "implementationTimeline": "12 months",
  "complianceNote": "one sentence on tax benefits for donor"
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json|```/g, "").trim();
    return JSON.parse(text);
  } catch (err) {
    console.error("Gemini proposal error:", err.message);
    return getFallbackProposal({ name, theme, annualBeneficiaries });
  }
}

async function parseCSRPolicy(policyText) {
  if (!process.env.GEMINI_API_KEY) return getFallbackCSRPolicy();

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `You are an expert in Indian CSR law and corporate social responsibility.
Analyze this CSR policy text and extract structured information.
Respond with ONLY a valid JSON object. No markdown. No explanation. Just JSON.

CSR Policy Text:
${policyText}

Return ONLY this JSON:
{
  "companyName": "extracted company name or null",
  "focusThemes": ["EDUCATION", "HEALTH"],
  "preferredStates": ["Maharashtra", "Gujarat"],
  "annualBudgetMin": number in INR or null,
  "annualBudgetMax": number in INR or null,
  "excludedActivities": ["activity1"],
  "preferredRegistrationTypes": ["TRUST", "SECTION8"],
  "requiresFCRA": boolean,
  "preferAspiationalDistricts": boolean,
  "keyPriorities": ["priority1", "priority2", "priority3"],
  "complianceNotes": "brief note on their CSR mandate",
  "scheduleVIICategories": ["Clause (ii)", "Clause (iv)"]
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json|```/g, "").trim();
    return JSON.parse(text);
  } catch (err) {
    console.error("Gemini CSR parse error:", err.message);
    return getFallbackCSRPolicy();
  }
}

async function analyzeNGODescription(description) {
  if (!process.env.GEMINI_API_KEY) return { sentiment: "POSITIVE", entities: [], language: "en" };

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `Analyze this NGO description and return ONLY valid JSON:
"${description}"
{
  "detectedLanguage": "en or hi or ta etc",
  "translatedToEnglish": "english version if not english, else same text",
  "keyEntities": ["entity1", "entity2"],
  "urgencyLevel": "HIGH or MEDIUM or LOW",
  "primaryBeneficiary": "women/children/elderly/farmers/etc",
  "geographicScope": "village/district/state/national",
  "innovationScore": number 0-10,
  "clarityScore": number 0-10
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json|```/g, "").trim();
    return JSON.parse(text);
  } catch (err) {
    return { detectedLanguage: "en", translatedToEnglish: description, keyEntities: [], urgencyLevel: "MEDIUM" };
  }
}

async function generateMatchExplanation({ overallScore, geographicScore, thematicScore, budgetScore, complianceScore, impactDensityScore, ngoName, corporateName }) {
  if (!process.env.GEMINI_API_KEY) {
    return getStaticExplanation({ overallScore, geographicScore, thematicScore, budgetScore });
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `You are a CSR expert. Generate a 2-3 sentence explanation for why ${corporateName} should fund ${ngoName}.
Scores: Overall ${overallScore}/100, Geographic ${geographicScore}/20, Thematic ${thematicScore}/30, Budget ${budgetScore}/20, Compliance ${complianceScore}/15, Impact ${impactDensityScore}/15.
Return ONLY JSON: { "explanation": "2-3 sentences", "recommendation": "STRONGLY_RECOMMENDED or RECOMMENDED or REVIEW_NEEDED", "topReason": "single best reason" }`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json|```/g, "").trim();
    return JSON.parse(text);
  } catch (err) {
    return getStaticExplanation({ overallScore, geographicScore, thematicScore, budgetScore });
  }
}

function getStaticExplanation({ overallScore, geographicScore, thematicScore, budgetScore }) {
  const explanations = [];
  if (thematicScore >= 25) explanations.push("Strong thematic alignment with corporate CSR focus areas.");
  if (geographicScore >= 15) explanations.push("Operates in the corporate's preferred geography.");
  if (budgetScore >= 15) explanations.push("Budget request is well within the corporate's CSR allocation.");
  return {
    explanation: explanations.join(" ") || "Moderate match based on available criteria.",
    recommendation: overallScore >= 70 ? "STRONGLY_RECOMMENDED" : overallScore >= 50 ? "RECOMMENDED" : "REVIEW_NEEDED",
    topReason: explanations[0] || "Meets basic CSR criteria"
  };
}

function getFallbackProposal({ name, theme, annualBeneficiaries }) {
  return {
    projectTitle: `${name} — Community Impact Initiative`,
    problemStatement: "Underserved communities lack access to essential services and support systems that enable sustainable development.",
    proposedSolution: "A structured program delivering targeted interventions with measurable outcomes and community participation.",
    targetBeneficiaries: annualBeneficiaries || 200,
    budgetRequired: 800000,
    budgetBreakdown: { personnel: 400000, operations: 200000, equipment: 150000, monitoring: 50000 },
    expectedOutcomes: ["Improved access to services", "Enhanced community capacity", "Measurable impact on 200+ beneficiaries"],
    sdgTags: ["SDG 1", "SDG 10"],
    scheduleVIICategory: "Eradicating poverty and promoting education",
    scheduleVIIClause: "Clause (i)",
    credibilityScore: 65,
    credibilityFactors: ["Registered organization", "Active community presence"],
    implementationTimeline: "12 months",
    complianceNote: "CSR expenditure qualifies under Section 135 of the Companies Act 2013. Donation eligible for 80G tax deduction."
  };
}

function getFallbackCSRPolicy() {
  return {
    companyName: null,
    focusThemes: ["EDUCATION", "HEALTH"],
    preferredStates: [],
    annualBudgetMin: null,
    annualBudgetMax: null,
    excludedActivities: [],
    preferredRegistrationTypes: ["TRUST", "SOCIETY", "SECTION8"],
    requiresFCRA: false,
    preferAspiationalDistricts: false,
    keyPriorities: ["Community development", "Skill building"],
    complianceNotes: "Standard CSR mandate under Companies Act 2013",
    scheduleVIICategories: ["Clause (ii)"]
  };
}

const axios = require('axios');

async function parseDocumentVision(base64Image) {
  try {
    const GCP_KEY = process.env.GOOGLE_API_KEY || "AIzaSyC-IVnO8ZfCAFeR7M-NI9jv53wTr0inOgY";
    // Remove data:image/jpeg;base64, if present
    const base64Data = base64Image.replace(/^data:image\/[a-z]+;base64,/, "");
    
    const response = await axios.post(`https://vision.googleapis.com/v1/images:annotate?key=${GCP_KEY}`, {
      requests: [{
        image: { content: base64Data },
        features: [{ type: "DOCUMENT_TEXT_DETECTION" }]
      }]
    });
    
    if (response.data.responses && response.data.responses[0].fullTextAnnotation) {
      return response.data.responses[0].fullTextAnnotation.text;
    }
    return "";
  } catch (err) {
    console.error("Vision API Error:", err.message);
    return "";
  }
}

async function translateText(text) {
  try {
    const GCP_KEY = process.env.GOOGLE_API_KEY || "AIzaSyC-IVnO8ZfCAFeR7M-NI9jv53wTr0inOgY";
    const response = await axios.post(`https://translation.googleapis.com/language/translate/v2?key=${GCP_KEY}`, {
      q: text,
      target: "en"
    });
    
    if (response.data.data && response.data.data.translations) {
      return {
        detectedLanguage: response.data.data.translations[0].detectedSourceLanguage || "en",
        translatedText: response.data.data.translations[0].translatedText
      };
    }
    return { detectedLanguage: "unknown", translatedText: text };
  } catch (err) {
    console.error("Translation API Error:", err.message);
    return { detectedLanguage: "unknown", translatedText: text };
  }
}

module.exports = { generateProposal, parseCSRPolicy, analyzeNGODescription, generateMatchExplanation, parseDocumentVision, translateText };
