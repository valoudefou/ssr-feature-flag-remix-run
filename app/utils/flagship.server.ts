import {
  Flagship,
  FSSdkStatus,
  DecisionMode,
  LogLevel,
} from "@flagship.io/react-sdk";

// Store two instances
let flagshipInstance1: Flagship | null = null;
let flagshipInstance2: Flagship | null = null;

// Helper to require env vars
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

// Generic function to initialize a Flagship instance
async function initFlagshipInstance(
  envId: string,
  apiKey: string
): Promise<Flagship> {
  return Flagship.start(envId, apiKey, {
    fetchNow: false,
    decisionMode: DecisionMode.DECISION_API,
    logLevel: LogLevel.INFO,
  });
}

// Initialize instance 1
export async function getFlagshipInstance1(): Promise<Flagship> {
  if (
    flagshipInstance1 &&
    flagshipInstance1.getStatus() !== FSSdkStatus.SDK_NOT_INITIALIZED
  ) {
    return flagshipInstance1;
  }

  const envId = requireEnv("FS_ENV_ID");
  const apiKey = requireEnv("FS_API_KEY");

  flagshipInstance1 = await initFlagshipInstance(envId, apiKey);
  return flagshipInstance1;
}

// Initialize instance 2
export async function getFlagshipInstance2(): Promise<Flagship> {
  if (
    flagshipInstance2 &&
    flagshipInstance2.getStatus() !== FSSdkStatus.SDK_NOT_INITIALIZED
  ) {
    return flagshipInstance2;
  }

  const envId = requireEnv("FS_ENV_ID_DAVID");
  const apiKey = requireEnv("FS_API_KEY_DAVID");

  flagshipInstance2 = await initFlagshipInstance(envId, apiKey);
  return flagshipInstance2;
}

// Example: get visitor for instance 1
export async function getFsVisitorDataFromInstance1(visitorData: {
  id: string;
  hasConsented: boolean;
  context: Record<string, any>;
}) {
  const flagship = await getFlagshipInstance1();

  const visitor = flagship.newVisitor({
    visitorId: visitorData.id,
    hasConsented: visitorData.hasConsented,
    context: visitorData.context,
  });

  await visitor.fetchFlags();
  return visitor;
}

// Example: get visitor for instance 2
export async function getFsVisitorDataFromInstance2(visitorData: {
  id: string;
  hasConsented: boolean;
  context: Record<string, any>;
}) {
  const flagship = await getFlagshipInstance2();

  const visitor = flagship.newVisitor({
    visitorId: visitorData.id,
    hasConsented: visitorData.hasConsented,
    context: visitorData.context,
  });

  await visitor.fetchFlags();
  return visitor;
}
