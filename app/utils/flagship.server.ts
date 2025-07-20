import {
  Flagship,
  FSSdkStatus,
  DecisionMode,
  LogLevel,
} from "@flagship.io/react-sdk";

let flagshipInstance: Flagship | null = null;

// Helper to require env vars
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

// ✅ Helper with fallback support
function requireEnvFallback(primary: string, fallback: string): string {
  return (
    process.env[primary] ||
    process.env[fallback] ||
    (() => {
      throw new Error(
        `Missing environment variables: ${primary} and fallback ${fallback}`
      );
    })()
  );
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

// Singleton usage
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
  return visitor;
}

// Fresh instance using fallback envs
export async function getFsVisitorData2(visitorData: {
  id: string;
  hasConsented: boolean;
  context: Record<string, any>;
}) {
  const envId = requireEnvFallback("FS_ENV_ID_DAVID", "FS_ENV_ID");
  const apiKey = requireEnvFallback("FS_API_KEY_DAVID", "FS_ENV_ID");

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
