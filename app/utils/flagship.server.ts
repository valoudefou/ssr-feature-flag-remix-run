import {
  Flagship,
  FSSdkStatus,
  DecisionMode,
  LogLevel,
} from "@flagship.io/react-sdk";

let flagshipInstance1: Flagship | null = null;
let flagshipInstance2: Flagship | null = null;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

// Initialize and return first Flagship SDK instance
export async function startFlagshipSDK1(): Promise<Flagship> {
  if (
    flagshipInstance1 &&
    flagshipInstance1.getStatus() !== FSSdkStatus.SDK_NOT_INITIALIZED
  ) {
    return flagshipInstance1;
  }

  const envId = requireEnv("FS_ENV_ID");
  const apiKey = requireEnv("FS_API_KEY");

  flagshipInstance1 = await Flagship.start(envId, apiKey, {
    fetchNow: false,
    decisionMode: DecisionMode.DECISION_API,
    logLevel: LogLevel.INFO,
  });

  return flagshipInstance1;
}

// Initialize and return second Flagship SDK instance
export async function startFlagshipSDK2(): Promise<Flagship> {
  if (
    flagshipInstance2 &&
    flagshipInstance2.getStatus() !== FSSdkStatus.SDK_NOT_INITIALIZED
  ) {
    return flagshipInstance2;
  }

  const envId = requireEnv("FS_ENV_ID_DAVID");
  const apiKey = requireEnv("FS_API_KEY_DAVID");

  flagshipInstance2 = await Flagship.start(envId, apiKey, {
    fetchNow: false,
    decisionMode: DecisionMode.DECISION_API,
    logLevel: LogLevel.INFO,
  });

  return flagshipInstance2;
}
