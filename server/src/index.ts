import express from 'express';
import { loadDialogue } from './content/loadDialogue';

const dialogue = loadDialogue();

const app = express();
const PORT = 3001;

app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/messages', (req, res) => {
  const message = req.body?.message;

  // reject empty or non-text messages
  if (typeof message !== 'string' || message.trim() === '') {
    res.status(400).json({ error: 'Message must be non-empty text.' });
    return;
  }

  // temporary for testing
  let reply = 'Whoa man, that one floated right past me. Try asking me about guitar.';
  if (message.toLowerCase().includes('guitar')) {
    reply = "I play a Fender Stratocaster, flipped upside down, 'cause I'm left-handed.";
  }

  res.json({ reply });
});

app.listen(PORT, () => {
  console.log(`Loaded ${dialogue.intents.length} intents across ${dialogue.areas.length} areas.`);
  console.log(`Server running at http://localhost:${PORT}`);
});
