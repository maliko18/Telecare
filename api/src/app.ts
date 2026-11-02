import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import { HttpError } from "./errors";
import { REASONS } from "./reasons";
import { WaitingQueue } from "./queue";

export function createApp(queue: WaitingQueue) {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get("/reasons", (_req, res) => {
    res.json(REASONS);
  });

  app.post("/tickets", (req, res) => {
    // `?.` : sans body, req.body est undefined avec Express 5
    const ticket = queue.join(req.body?.reason);
    res.status(201).json(ticket);
  });

  app.get("/tickets/:id", (req, res) => {
    res.json(queue.get(req.params.id));
  });

  app.delete("/tickets/:id", (req, res) => {
    res.json(queue.leave(req.params.id));
  });

  // Gestion d'erreurs centralisée : les routes lèvent, ce handler traduit en HTTP.
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof HttpError) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    // JSON invalide dans le body : body-parser renvoie une erreur avec status 400
    const status = (err as { status?: number })?.status;
    if (status === 400) {
      res.status(400).json({ error: "Corps de requête invalide." });
      return;
    }
    console.error(err);
    res.status(500).json({ error: "Erreur interne du serveur." });
  });

  return app;
}
