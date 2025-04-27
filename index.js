// --- START OF index.js ---

// Import necessary modules
import express from 'express';
import cors from 'cors';
import { HfInference } from "@huggingface/inference";
import path from 'path';
import { fileURLToPath } from 'url';

// --- Configuration ---

// Get Hugging Face token from environment variables
const HF_TOKEN = process.env.HF_TOKEN;

// Exit if token is missing (critical configuration)
if (!HF_TOKEN) {
  console.error("!!! FATAL ERROR: Hugging Face Token (HF_TOKEN) environment variable not found!");
  console.error("Please set HF_TOKEN in Render Environment Variables.");
  process.exit(1); // Stop the server
}

// Initialize Hugging Face client
const client = new HfInference(HF_TOKEN);

// Initialize Express app
const app = express();

// Define the port - Render provides PORT env var, fallback to 3000 locally
const PORT = process.env.PORT || 3000;

// Helper variables for ES Modules to get directory path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Middleware ---

// Enable CORS for all origins (Important for allowing requests from your frontend)
app.use(cors());

// Parse incoming JSON requests (Needed to read req.body)
app.use(express.json());

// --- API Routes ---

// POST route to handle chat messages
app.post('/api/chat', async (req, res) => {
  const userInput = req.body.message;

  console.log("Received request for /api/chat");
  console.log("Request Body:", JSON.stringify(req.body)); // Log the received body

  // Validate input
  if (!userInput) {
    console.error("Validation Error: Request body missing 'message' field.");
    return res.status(400).json({ error: 'Request body must contain a "message" field.' });
  }
  console.log(`User input: "${userInput}"`);

  try {
    console.log("Attempting to call Hugging Face chat completion stream...");

    // Set headers for streaming response
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');

    // Call the Hugging Face streaming API
    const stream = client.chatCompletionStream({
      model: "deepseek-ai/DeepSeek-V3-0324", // Confirm this model & provider are correct
      provider: "fireworks-ai",
      temperature: 0.4,
      max_tokens: 512,
      top_p: 0.7,
      messages: [{ role: "user", content: userInput }],
    });

    console.log("Streaming response started...");

    // Iterate through the stream and send chunks to the client
    for await (const chunk of stream) {
      if (chunk.choices?.[0]?.delta?.content) {
        res.write(chunk.choices[0].delta.content); // Send content chunk
      }
      // Stop streaming if the model indicates completion
      if (chunk.choices?.[0]?.finish_reason) {
        console.log("Stream finished with reason:", chunk.choices[0].finish_reason);
        break;
      }
    }

    // End the response stream
    res.end();
    console.log('Finished sending streaming response.');

  } catch (error) {
    // --- Detailed Error Handling ---
    console.error("\n!!!!!!!! ERROR CAUGHT IN /api/chat !!!!!!!!");
    console.error("Timestamp:", new Date().toISOString());
    console.error("Error Message:", error.message);

    // Log details if it's an HTTP error from the underlying API call
    if (error.response) {
      console.error("--- Underlying HTTP Response Error Details ---");
      console.error("Response Status:", error.response.status);
      // Be careful logging full data in production, might contain sensitive info
      console.error("Response Data:", JSON.stringify(error.response.data, null, 2));
      console.error("--------------------------------------------");
    }

    // Log the full stack trace for debugging
    console.error("Error Stack Trace:", error.stack);

    // Send a generic error response to the client ONLY if headers haven't been sent
    if (!res.headersSent) {
       console.log("Sending 500 error response back to client.");
       res.status(500).json({ error: 'Failed to process chat message due to an internal server error.' });
    } else {
       // If headers were already sent (e.g., during streaming), just end the response abruptly.
       console.log("Headers already sent, ending response after error during stream.");
       res.end();
    }
  }
});

// --- Static File Serving (Optional - If frontend is in the same directory) ---

// Serve static files (HTML, CSS, JS) from the current directory
// If your frontend is hosted separately (like on Replit), you might not need these lines.
app.use(express.static(path.join(__dirname)));

// Route to serve the main HTML file
app.get('/', (req, res) => {
    const indexPath = path.join(__dirname, 'index.html');
    console.log(`Attempting to serve index.html from: ${indexPath}`);
    res.sendFile(indexPath, (err) => {
        if (err) {
            console.error("Error sending index.html:", err);
            // Don't send a 500 if the API route should be the primary interface
            // res.status(404).send("Cannot find index.html"); // Or 404
        } else {
            console.log("Successfully sent index.html");
        }
    });
});


// --- Start Server ---
app.listen(PORT, () => {
  // Log the *actual* port the server is listening on
  console.log(`Backend server is running and listening on port ${PORT}`);
  console.log(`Render Service URL should be accessible.`);
});

// --- END OF index.js ---
