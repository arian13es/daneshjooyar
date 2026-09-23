import express from "express";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();

  // Security headers middleware
  app.use((_req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; img-src 'self' data: blob: https:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; font-src 'self' data:; connect-src 'self' https: wss:; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
    );
    next();
  });

  const PORT = parseInt(process.env.PORT || "3000", 10);
  const HOST = process.env.HOST || "0.0.0.0";

  // Production when NODE_ENV is set explicitly, or when running the bundled
  // dist/server.cjs (npm start). Otherwise: dev with Vite middleware.
  const entry = (process.argv[1] || "").replace(/\\/g, "/");
  const isProduction =
    process.env.NODE_ENV === "production" ||
    entry.endsWith("/dist/server.cjs");

  if (!isProduction) {
    // Dev: mount Vite in middleware mode
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");

    // Never expose build artifacts (sourcemaps / bundled server) over HTTP
    app.use((req, res, next) => {
      const p = req.path.toLowerCase();
      if (p.endsWith(".map") || p.endsWith(".cjs") || p.includes("/server.")) {
        res.status(404).end();
        return;
      }
      next();
    });

    app.use(express.static(distPath));
    app.get("*", (_req: express.Request, res: express.Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const server = app.listen(PORT, HOST, () => {
    console.log(
      `Server is running at http://${HOST}:${PORT} (${isProduction ? "production" : "development"})`
    );
  });

  server.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      console.error(`Critical: port ${PORT} is already in use.`);
    } else {
      console.error("Critical: server error:", err);
    }
    process.exit(1);
  });
}

startServer().catch((err) => {
  console.error("Critical: Failed to start server:", err);
  process.exit(1);
});
