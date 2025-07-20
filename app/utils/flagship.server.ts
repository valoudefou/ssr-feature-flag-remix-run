import {
  Flagship,
  FSSdkStatus,
  DecisionMode,
  LogLevel,
} from "@flagship.io/react-sdk";
import dotenv from "dotenv";
dotenv.config();

let flagshipInstance: Flagship | null = null;

// Helper to require env vars
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

// Start and return the singleton Flagship SDK instance
export async function startFlagshipSDK(): Promise<Flagship> {
  if (
    flagshipInstance &&
    flagshipInstance.getStatus() !== FSSdkStatus.SDK_NOT_INITIALIZED
  ) {
    return flagshipInstance;
  }

  const envId = requireEnv("FS_ENV_ID");
  const apiKey = requireEnv("FS_API_KEY");

  flagshipInstance = await Flagship.start(envId, apiKey, {
    fetchNow: false,
    decisionMode: DecisionMode.DECISION_API,
    logLevel: LogLevel.INFO,
  });

  return flagshipInstance;
}

export async function getFsVisitorData(visitorData: {
  id: string;
  hasConsented: boolean;
  context: Record<string, any>;
}) {
  const flagship = await startFlagshipSDK();

  const visitor = flagship.newVisitor({
    visitorId: visitorData.id,
    hasConsented: visitorData.hasConsented,
    context: visitorData.context,
  });

  await visitor.fetchFlags();
  return visitor; // inferred type automatically
}

export async function getFsVisitorData2(visitorData: {
  id: string;
  hasConsented: boolean;
  context: Record<string, any>;
}) {
  const envId = requireEnv("FS_ENV_ID_DAVID");
  const apiKey = requireEnv("FS_API_KEY_DAVID");

  const freshFlagshipInstance = await Flagship.start(envId, apiKey, {
    fetchNow: false,
    decisionMode: DecisionMode.DECISION_API,
    logLevel: LogLevel.INFO,
  });

  const visitor = freshFlagshipInstance.newVisitor({
    visitorId: visitorData.id,
    hasConsented: visitorData.hasConsented,
    context: visitorData.context,
  });

  await visitor.fetchFlags();
  return visitor;
}
