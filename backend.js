const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const { exec } = require('child_process');

mongoose.connect('mongodb://localhost:27017/chatbot', { useNewUrlParser: true, useUnifiedTopology: true });

const MessageSchema = new mongoose.Schema({
  text: String,
  sender: String,
  timestamp: { type: Date, default: Date.now },
});

const Message = mongoose.model('Message', MessageSchema);

const app = express();
app.use(bodyParser.json());

app.get('/api/messages', async (req, res) => {
  const messages = await Message.find();
  res.json(messages);
});

app.post('/api/messages', async (req, res) => {
  const { text, sender } = req.body;
  const message = new Message({ text, sender });
  await message.save();
  
  // Call CodeLlama model for a response
  exec(`codellama --input "${text}"`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      return res.status(500).send('Error processing message');
    }
    if (stderr) {
      console.error(`stderr: ${stderr}`);
      return res.status(500).send('Error processing message');
    }
    
    const botMessage = new Message({ text: stdout.trim(), sender: 'bot' });
    botMessage.save().then(() => {
      res.json({ text: stdout.trim(), sender: 'bot' });
    });
  });
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});