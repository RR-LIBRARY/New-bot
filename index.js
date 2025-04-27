// --- START OF FINAL index.js CODE ---
import express from 'express';
import cors from 'cors';
import { HfInference } from "@huggingface/inference";
import path from 'path'; // path मॉड्यूल इम्पोर्ट करें
import { fileURLToPath } from 'url'; // URL से पाथ बनाने के लिए

// --- Hugging Face Setup ---
const HF_TOKEN = process.env.HF_TOKEN;
if (!HF_TOKEN) {
  console.error("!!! ज़रूरी: Hugging Face Token Replit Secrets में नहीं मिला!");
  process.exit(1);
}
const client = new HfInference(HF_TOKEN);
// --- End Hugging Face Setup ---

// --- Express Server Setup ---
const app = express();
const PORT = process.env.PORT || 3000;
// __dirname को ES Modules में डिफाइन करें
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());
// --- End Express Server Setup ---

// --- API Endpoint for Chat ---
app.post('/api/chat', async (req, res) => {
  const userInput = req.body.message;
  if (!userInput) {
    return res.status(400).json({ error: 'Request में "message" नहीं मिला' });
  }
  console.log(`Backend को संदेश मिला: "${userInput}"`);
  try {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');
    const stream = client.chatCompletionStream({
      model: "deepseek-ai/DeepSeek-V3-0324", // या अपना पसंदीदा मॉडल
      provider: "fireworks-ai",             // या हटा दें अगर HF मॉडल है
      temperature: 0.4,
      max_tokens: 512,
      top_p: 0.7,
      messages: [{ role: "user", content: userInput }],
    });
    for await (const chunk of stream) {
      if (chunk.choices?.[0]?.delta?.content) {
        res.write(chunk.choices[0].delta.content);
      }
      if (chunk.choices?.[0]?.finish_reason) {
        break;
      }
    }
    res.end();
    console.log('Backend से जवाब भेजना समाप्त।');
  } catch (error) {
    console.error("\nAPI कॉल या स्ट्रीमिंग में गड़बड़:", error.message);
    if (!res.headersSent) {
       res.status(500).json({ error: 'चैट संदेश प्रोसेस करने में विफल' });
    } else {
       res.end();
    }
  }
});
// --- End API Endpoint ---

// --- Serve Frontend ---
// स्टैटिक फाइल्स (CSS, Client-side JS) सर्व करें
app.use(express.static(__dirname));

// रूट URL पर index.html भेजें
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});
// --- End Frontend Route ---

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`Backend सर्वर पोर्ट ${PORT} पर चल रहा है।`);
  console.log(`Frontend यहाँ दिखना चाहिए: आपके Replit का URL`);
});
// --- End Start Server ---
// --- END OF FINAL index.js CODE ---