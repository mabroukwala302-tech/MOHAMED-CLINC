import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Support parsing JSON bodies
  app.use(express.json());

  // رابط الـ Webhook الخاص بنظام العيادة (رابط الإنتاج)
  const DEFAULT_WEBHOOK_URL = "https://auramedflow.online/webhook/8595aadf-c252-4292-9d66-f6069f7215f2";

  // API proxy route to bypass CORS and forward call requests
  app.post("/api/call-patient", async (req, res) => {
    let { webhookUrl, payload } = req.body;

    // استبدال أي رابط قديم (ngrok أو trycloudflare أو رابط الاختبار القديم webhook-test) أو قيمة فارغة برابط الإنتاج الجديد
    if (!webhookUrl || typeof webhookUrl !== "string" || webhookUrl.includes("ngrok") || webhookUrl.includes("trycloudflare") || webhookUrl.includes("webhook-test")) {
      webhookUrl = DEFAULT_WEBHOOK_URL;
    }

    try {
      // التأكد من التنسيق الصحيح للرابط (ترميز الفراغات مع تجنب الازدواج)
      const targetUrl = encodeURI(decodeURI(webhookUrl.trim()));
      console.log(`Proxying request to VPS Webhook: ${targetUrl}`);
      const response = await fetch(targetUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json, text/plain, */*",
          "User-Agent": "ClinicDashboardProxy/1.0"
        },
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();
      console.log(`Webhook responded with status ${response.status}. Response length: ${responseText.length}`);

      if (response.ok) {
        return res.json({ success: true, status: response.status, data: responseText });
      } else {
        return res.status(response.status).json({ 
          success: false, 
          status: response.status, 
          error: responseText || `HTTP error ${response.status}` 
        });
      }
    } catch (error: any) {
      console.error("Error proxying webhook request:", error);
      return res.status(500).json({ success: false, error: error?.message || "Internal network error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
