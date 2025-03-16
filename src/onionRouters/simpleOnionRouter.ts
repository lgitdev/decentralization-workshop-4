import bodyParser from "body-parser";
import express from "express";
import crypto from "crypto";
import axios from "axios";
import { BASE_ONION_ROUTER_PORT, REGISTRY_PORT } from "../config";

let lastReceivedEncryptedMessage: string | null = null;
let lastReceivedDecryptedMessage: string | null = null;
let lastMessageDestination: number | null = null;

const generateKeyPair = () => {
  const { privateKey, publicKey } = crypto.generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: "spki",
      format: "der",
    },
    privateKeyEncoding: {
      type: "pkcs8",
      format: "der",
    },
  });

  // 🔥 Vérification explicite que la clé privée est bien générée
  if (!privateKey || privateKey.length === 0) {
    throw new Error("Private key generation failed");
  }

  // 🔥 Encodage sûr en Base64
  const formattedPublicKey = Buffer.from(publicKey).toString("base64");
  const formattedPrivateKey = Buffer.from(privateKey).toString("base64");

  return {
    privateKey: formattedPrivateKey,
    publicKey: formattedPublicKey,
  };
};


export async function simpleOnionRouter(nodeId: number) {
  const onionRouter = express();
  onionRouter.use(express.json());
  onionRouter.use(bodyParser.json());

  // ✅ Générer une paire de clés UNIQUE pour CHAQUE nœud
  const { privateKey, publicKey } = generateKeyPair();

  // ✅ Enregistrement du nœud avec sa clé publique
  try {
    await axios.post(`http://localhost:${REGISTRY_PORT}/registerNode`, {
      nodeId,
      pubKey: publicKey,
    });
    console.log(`Node ${nodeId} successfully registered to the registry.`);
  } catch (error) {
    console.error(`Failed to register node ${nodeId}:`, error);
  }

  // ✅ Route pour vérifier si le nœud est actif
  onionRouter.get("/status", (req, res) => {
    res.send("live");
  });

  // ✅ Route pour récupérer le dernier message crypté reçu
  onionRouter.get("/getLastReceivedEncryptedMessage", (req, res) => {
    res.json({ result: lastReceivedEncryptedMessage ?? null });
  });

  // ✅ Route pour récupérer le dernier message déchiffré
  onionRouter.get("/getLastReceivedDecryptedMessage", (req, res) => {
    res.json({ result: lastReceivedDecryptedMessage ?? null });
  });

  // ✅ Route pour récupérer la destination du dernier message
  onionRouter.get("/getLastMessageDestination", (req, res) => {
    res.json({ result: lastMessageDestination ?? null });
  });

  // Route correcte (simpleOnionRouter.ts)
  onionRouter.get("/getPrivateKey", (req, res) => {
    if (!privateKey || privateKey.length === 0) {
      return res.status(500).json({ error: "Private key is missing" });
    }

    // ⚠️ Le test attend précisément une clé privée sous {result: "clé_en_base64"}
    return res.json({ result: privateKey });
  });


  let lastCircuit: number[] | null = null;

  // ✅ Route pour récupérer le dernier circuit utilisé
  onionRouter.get("/getLastCircuit", (req, res) => {
    return res.json({ result: lastCircuit ?? [] });
  });

  

  


  const server = onionRouter.listen(BASE_ONION_ROUTER_PORT + nodeId, () => {
    console.log(
      `Onion router ${nodeId} is listening on port ${BASE_ONION_ROUTER_PORT + nodeId}`
    );
  });

  return server;
}
