const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize the Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Generate website code from a user prompt
 * @param {string} prompt - User's description of the website they want to build
 * @returns {Promise<Object>} - Generated HTML, CSS, and JS code along with a description
 */
async function generateWebsite(prompt) {
  try {
    // Enhanced prompt to match Gemini 2.0 Flash expected format
    const enhancedPrompt = {
      contents: [{
        parts: [{
          text: `You are an expert web developer. Generate a complete, functional website based on this description:
          
          "${prompt}"
          
          Return your response in a structured JSON format with these keys:
          1. html: The complete HTML code including proper document structure
          2. css: The complete CSS styling code
          3. js: Any necessary JavaScript code to make the site interactive
          4. description: A brief description of what you created
          
          Make sure the website is visually appealing, functional, and adheres to modern web development best practices.
          If the request is vague, use your expertise to build something that would satisfy most users.
          
          The HTML, CSS and JS should be COMPLETE, FUNCTIONAL and READY to be used without additional modifications.`
        }]
      }]
    };

    // Use the Gemini Flash 2.0 model as specified by the user
    // The correct model name is "gemini-2.0-flash" (version number first)
    console.log("Using Gemini 2.0 Flash model");
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    const result = await model.generateContent(enhancedPrompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse the response as JSON
    // The model might return the JSON directly or wrapped in markdown code blocks
    let jsonResponse;
    try {
      // Try direct JSON parsing first
      jsonResponse = JSON.parse(text);
    } catch (e) {
      // If direct parsing fails, try to extract JSON from markdown code blocks
      const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch && jsonMatch[1]) {
        try {
          jsonResponse = JSON.parse(jsonMatch[1]);
        } catch (innerError) {
          throw new Error("Could not parse the model's response as JSON");
        }
      } else {
        throw new Error("Model did not return properly formatted JSON");
      }
    }
    
    // Validate the response structure
    if (!jsonResponse.html || !jsonResponse.css || !jsonResponse.description) {
      throw new Error("Model response is missing required fields");
    }
    
    return {
      html: jsonResponse.html,
      css: jsonResponse.css,
      js: jsonResponse.js || "",
      description: jsonResponse.description
    };
  } catch (error) {
    console.error("Error generating website:", error);
    throw error;
  }
}

module.exports = { generateWebsite };