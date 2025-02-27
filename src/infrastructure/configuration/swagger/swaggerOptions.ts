import swaggerJSDoc from "swagger-jsdoc";

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Express Commerce API",
      version: "1.0.0",
      description: "API documentation for Express Commerce application",
    },
    servers: [
      {
        url: `/api/v1`,
      },
    ],
  },
  apis: ["./src/modules/**/*.ts"],
};

export const swaggerDocs = swaggerJSDoc(swaggerOptions);
