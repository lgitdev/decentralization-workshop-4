import bodyParser from "body-parser";
import express, { Request, Response } from "express";
import { REGISTRY_PORT } from "../config";

export type Node = { nodeId: number; pubKey: string };

export type RegisterNodeBody = {
  nodeId: number;
  pubKey: string;
};

export type GetNodeRegistryBody = {
  nodes: Node[];
};

// Supprimé l'export redondant ici

const registeredNodes: Node[] = [];

export async function launchRegistry() {
  const _registry = express();
  _registry.use(express.json());
  _registry.use(bodyParser.json());

  // Implémentation de la route /status
  _registry.get("/status", (req: Request, res: Response) => {
    return res.send("live");
  });

  // Route pour enregistrer un nœud
  _registry.post("/registerNode", (req: Request, res: Response) => {
    const { nodeId, pubKey } = req.body;

    if (typeof nodeId !== "number" || typeof pubKey !== "string") {
      return res.status(400).json({ error: "Invalid request format" });
    }

    // Vérification pour éviter les doublons
    if (registeredNodes.some(node => node.nodeId === nodeId)) {
      return res.status(409).json({ error: "Node already registered" });
    }

    registeredNodes.push({ nodeId, pubKey });

    console.log(`Node ${nodeId} registered with public key: ${pubKey}`);

    return res.json({ success: true });
  });

  // Route pour récupérer la liste des nœuds enregistrés
  _registry.get("/getNodeRegistry", (req: Request, res: Response) => {
    return res.json({ nodes: registeredNodes });
  });

  // À ajouter dans registry.ts
  const privateKeys: { [key: number]: string } = {}; // Stockage des clés privées des nœuds

  // route pour enregistrer également la clé privée (ajustement de ta route existante)
  _registry.post("/registerNode", (req: Request, res: Response) => {
    const { nodeId, pubKey, privateKey } = req.body;  // privateKey doit être ajouté dans le body côté client

    if (typeof nodeId !== "number" || typeof pubKey !== "string" || typeof privateKey !== "string") {
      return res.status(400).json({ error: "Invalid request format" });
    }

    if (registeredNodes.some(node => node.nodeId === nodeId)) {
      return res.status(409).json({ error: "Node already registered" });
    }

    registeredNodes.push({ nodeId, pubKey });
    privateKeys[nodeId] = privateKey; // Stockage sécurisé de la clé privée

    return res.json({ success: true });
  });

  // Route pour récupérer la clé privée d'un nœud précis
  _registry.get("/getPrivateKey", (req: Request, res: Response) => {
    const nodeId = Number(req.query.nodeId);

    if (!nodeId || !(nodeId in privateKeys)) {
      return res.status(404).json({ error: "Private key not found for this node" });
    }

    return res.json({ privateKey: privateKeys[nodeId] });
  });


  
  const server = _registry.listen(REGISTRY_PORT, () => {
    console.log(`Registry is listening on port ${REGISTRY_PORT}`);
  });

  return server;
}
