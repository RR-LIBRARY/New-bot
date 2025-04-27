// --- START OF index.js ---

// Import necessary modules
import express from 'express';
import cors from 'cors';
import { HfInference } from "@huggingface/inference";
import path from 'path';
import { fileURLToPath } from 'url';

// --- Configuration ---
const HF_TOKEN = process.env.HF_TOKEN;
if (!HF_TOKEN) {
  console.error("!!! FATAL ERROR: HF_TOKEN environment variable not found!");
  process.exit(1);
}
const client = new HfInference(HF_TOKEN);
const app = express();
const PORT = process.env.PORT || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- API Routes ---
app.post('/api/chat', async (req, res) => {
  const userInput = req.body.message;
  console.log("Received request for /api/chat");
  console.log("Request Body:", JSON.stringify(req.body));
  if (!userInput) {
    console.error("Validation Error: Missing 'message' field.");
    return res.status(400).json({ error: 'Request body must contain a "message" field.' });
  }
  console.log(`User input: "${userInput}"`);
  try {
    console.log("Attempting to call HF stream...");
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');
    const stream = client.chatCompletionStream({
      model: "deepseek-ai/DeepSeek-V3-0324",
      provider: "fireworks-ai",
      temperature: 0.4, max_tokens: 512, top_p: 0.7,
      messages: [{ role: "user", content: userInput }],
    });
    console.log("Streaming response started...");
    for await (const chunk of stream) {
      if (chunk.choices?.[0]?.delta?.content) {
        res.write(chunk.choices[0].delta.content);
      }
      if (chunk.choices?.[0]?.finish_reason) {
        console.log("Stream finished with reason:", chunk.choices[0].finish_reason);
        break;
      }
    }
    res.end();
    console.log('Finished sending stream.');
  } catch (error) {
    console.error("\n!!!!!!!! ERROR CAUGHT IN /api/chat !!!!!!!!");
    console.error("Timestamp:", new Date().toISOString());
    console.error("Error Message:", error.message);
    if (error.response) {
      console.error("--- Underlying HTTP Response Error Details ---");
      console.error("Response Status:", error.response.status);
      console.error("Response Data:", JSON.stringify(error.response.data, null, 2));
      console.error("--------------------------------------------");
    }
    console.error("Error Stack Trace:", error.stack);
    if (!res.headersSent) {
       console.log("Sending 500 error response.");
       res.status(500).json({ error: 'Internal server error.' });
    } else {
       console.log("Headers sent, ending response after error.");
       res.end();
    }
  }
});

// --- Static File Serving (Optional) ---
app.use(express.static(path.join(__dirname)));
app.get('/', (req, res) => {
    const indexPath = path.join(__dirname, 'index.html');
    console.log(`Attempting to serve: ${indexPath}`);
    res.sendFile(indexPath, (err) => {
        if (err) console.error("Error sending index.html:", err);
        else console.log("Sent index.html");
    });
});

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});

// --- END OF index.js ---
