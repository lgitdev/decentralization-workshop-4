import bodyParser from "body-parser";
import express from "express";
import { BASE_USER_PORT } from "../config";
import axios from "axios";

export type SendMessageBody = {
  message: string;
  destinationUserId: number;
};

export async function user(userId: number) {
  const _user = express();
  _user.use(express.json());
  _user.use(bodyParser.json());

  let lastReceivedMessage: string | null = null;
  let lastSentMessage: string | null = null;

  // Status route
  _user.get("/status", (req, res) => {
    res.send("live");
  });

  // Retrieve last received message
  _user.get("/getLastReceivedMessage", (req, res) => {
    res.json({ result: lastReceivedMessage });
  });

  // Retrieve last sent message
  _user.get("/getLastSentMessage", (req, res) => {
    res.json({ result: lastSentMessage });
  });

  // Receive a message
  _user.post("/message", (req, res) => {
    const { message } = req.body;
    if (message) {
      lastReceivedMessage = message;
      return res.send("success"); // Envoi d'une chaîne de caractères au lieu d'un JSON
    } else {
      return res.status(400).json({ error: "Invalid request" });
    }
  });

  


  // Send a message to another user
  // Send a message to another user
  _user.post("/sendMessage", async (req, res) => {
    const { message, destinationUserId } = req.body;
    if (!message || typeof destinationUserId !== "number") {
      return res.status(400).json({ error: "Invalid request" });
    }
    
    try {
      const response = await axios.post(
        `http://localhost:${BASE_USER_PORT + destinationUserId}/message`, 
        { message }
      );
      lastSentMessage = message;
      return res.json({ success: true, response: response.data }); // Ajout du return
    } catch (error) {
      return res.status(500).json({ error: "Failed to send message" }); // Ajout du return
    }
  });


  const server = _user.listen(BASE_USER_PORT + userId, () => {
    console.log(
      `User ${userId} is listening on port ${BASE_USER_PORT + userId}`
    );
  });

  return server;
}