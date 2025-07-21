import {
  Flagship,
  FSSdkStatus,
  DecisionMode,
  LogLevel,
  Visitor,
} from "@flagship.io/react-sdk";

type VisitorData = {
  id: string;
  hasConsented: boolean;
  context: Record<string, any>;
};

let flagshipInstance: Flagship | null = null;

// Helper to require environment variables
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

// Initializes a Flagship SDK instance
async function initializeFlagship(
  envId: string,
  apiKey: string
): Promise<Flagship> {
  return Flagship.start(envId, apiKey, {
    fetchNow: false,
    decisionMode: DecisionMode.DECISION_API,
    logLevel: LogLevel.INFO,
  });
}

// Gets or creates the singleton Flagship instance
async function getSingletonFlagship(): Promise<Flagship> {
  if (
    flagshipInstance &&
    flagshipInstance.getStatus() !== FSSdkStatus.SDK_NOT_INITIALIZED
  ) {
    return flagshipInstance;
  }

  const envId = requireEnv("FS_ENV_ID");
  const apiKey = requireEnv("FS_API_KEY");
  flagshipInstance = await initializeFlagship(envId, apiKey);
  return flagshipInstance;
}

// Creates and fetches visitor flags from a given Flagship instance
async function createVisitorAndFetchFlags(
  flagship: Flagship,
  data: VisitorData
): Promise<Visitor> {
  const visitor = flagship.newVisitor({
    visitorId: data.id,
    hasConsented: data.hasConsented,
    context: data.context,
  });

  await visitor.fetchFlags();
  return visitor;
}

// Main: uses the shared singleton instance
export async function getFsVisitorData(data: VisitorData): Promise<Visitor> {
  const flagship = await getSingletonFlagship();
  return createVisitorAndFetchFlags(flagship, data);
}

// Alternate: uses a fresh instance with fallback env vars
export async function getFsVisitorData2(data: VisitorData): Promise<Visitor> {
  const envId = requireEnv("FS_ENV_ID_DAVID");
  const apiKey = requireEnv("FS_API_KEY_DAVID");
  const freshInstance = await initializeFlagship(envId, apiKey);
  return createVisitorAndFetchFlags(freshInstance, data);
}

// Alternate: uses a fresh instance with ED env vars
export async function getFsVisitorData3(data: VisitorData): Promise<Visitor> {
  const envId = requireEnv("FS_ENV_ID_ED");
  const apiKey = requireEnv("FS_API_KEY_ED");
  const freshInstance = await initializeFlagship(envId, apiKey);
  return createVisitorAndFetchFlags(freshInstance, data);
}
