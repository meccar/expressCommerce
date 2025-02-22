import { Express } from "express";
import fs from "fs";
import path from "path";

export function routes(app: Express) {
  const servicesPath = path.join(__dirname, "..", "..", "services");

  function loadRoutes(directory: string) {
    const files = fs.readdirSync(directory);

    files.forEach((file) => {
      const fullPath = path.join(directory, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        loadRoutes(fullPath);
      } else if (file.endsWith(".route.ts") || file.endsWith(".route.js")) {
        try {
          const routeModule = require(fullPath);

          if (routeModule.router) {
            app.use(routeModule.router);
          } else if (typeof routeModule.setupRoutes === "function") {
            routeModule.setupRoutes(app);
          }
        } catch (error) {
          console.error(`Error loading routes from ${fullPath}:`, error);
        }
      }
    });
  }

  loadRoutes(servicesPath);
}
