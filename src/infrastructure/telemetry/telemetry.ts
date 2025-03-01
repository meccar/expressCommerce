import { NodeSDK } from "@opentelemetry/sdk-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { CONFIG } from "src/config/environment/environment.config";
import { Resource } from "@opentelemetry/resources";
import {
  ATTR_SERVICE_NAME,
  SEMRESATTRS_DEPLOYMENT_ENVIRONMENT,
} from "@opentelemetry/semantic-conventions";
import { ATTR_DEPLOYMENT_ENVIRONMENT } from "@opentelemetry/semantic-conventions/incubating";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base";
import { AWSXRayIdGenerator } from "@opentelemetry/id-generator-aws-xray";
import { HttpInstrumentation } from "@opentelemetry/instrumentation-http";
import { ExpressInstrumentation } from "@opentelemetry/instrumentation-express";

export class TelemetryService {
  private static sdk: NodeSDK;

  static initialize() {
    const exporter = new OTLPTraceExporter({
      url: CONFIG.TELEMETRY.OTLP_ENDPOINT,
      headers: { "uptrace-dsn": CONFIG.TELEMETRY.UPTRACE_DSN },
    });

    const bsp = new BatchSpanProcessor(exporter, {
      maxExportBatchSize: 1000,
      maxQueueSize: 1000,
    });
    // SEMRESATTRS_XXXXX
    this.sdk = new NodeSDK({
      spanProcessor: bsp,
      resource: new Resource({
        [ATTR_SERVICE_NAME]: CONFIG.TELEMETRY.SERVICE_NAME,
        [ATTR_DEPLOYMENT_ENVIRONMENT]: CONFIG.SYSTEM.ENV,
      }),
      idGenerator: new AWSXRayIdGenerator(),
      instrumentations: [
        getNodeAutoInstrumentations(),
        new HttpInstrumentation(),
        new ExpressInstrumentation(),
      ],
    });

    this.sdk.start();

    process.on("SIGTERM", () => {
      this.sdk
        .shutdown()
        .then(() => console.log("Tracing terminated"))
        .catch((error) => console.error("Error terminating tracing", error))
        .finally(() => process.exit(0));
    });
  }
}
