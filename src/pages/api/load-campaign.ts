import type { NextApiRequest, NextApiResponse } from "next";
import { createMongoDBProvider } from "@/lib/providers/mongodb";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const mongo = createMongoDBProvider();

  if (!mongo.isEnabled()) {
    return res.status(200).json({ success: false, error: "MongoDB persistence disabled" });
  }

  const { campaignId } = req.body;

  if (!campaignId) {
    return res.status(400).json({ success: false, error: "campaignId required" });
  }

  const result = await mongo.loadCampaign(campaignId);

  if (!result.success) {
    return res.status(200).json({ success: false, error: result.error });
  }

  return res.status(200).json({ success: true, data: result.data });
}
