import express, { Express, Request, Response } from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import path from 'path';
import { sendMessage, streamMessage } from "./src/api-client";

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

app.use('/static', express.static(path.join(__dirname, "src/public")));
app.use(bodyParser.json()) // for parsing application/json

app.get('/', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, "/src/views/index.html"));
});

app.post('/chat', async (req, res) => {
  const result = await sendMessage(req.body);
  res.json({ msg: result });
});

app.post('/streaming', async (req: Request, res: Response) => {
  res.set({
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
    "Content-Type": "text/event-stream",
  });
  res.flushHeaders(); // flush the headers to establish SSE with client

  await streamMessage(req.body, (result) => {
    //.log(result);
    if (result === "[DONE]" || result === "[ERROR]") {
      res.end();
    }
    else {
      res.write(`data: ${result}\n\n`);
    }
  });
});

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});