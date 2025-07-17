import {
  Flagship,
  FSSdkStatus,
  DecisionMode,
  LogLevel,
} from "@flagship.io/react-sdk";

let flagshipInstanceDefault: Flagship | null = null;
let flagshipInstanceDavid: Flagship | null = null;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

export async function startFlagshipSDK(): Promise<Flagship> {
  if (
    flagshipInstanceDefault &&
    flagshipInstanceDefault.getStatus() !== FSSdkStatus.SDK_NOT_INITIALIZED
  ) {
    return flagshipInstanceDefault;
  }

  const envId = requireEnv("FS_ENV_ID");
  const apiKey = requireEnv("FS_API_KEY");

  // Always create a new instance for account-1
  flagshipInstanceDefault = await Flagship.start(envId, apiKey, {
    fetchNow: false,
    decisionMode: DecisionMode.DECISION_API,
    logLevel: LogLevel.INFO,
  });

  return flagshipInstanceDefault;
}

export async function startFlagshipSDKDavid(): Promise<Flagship> {
  if (
    flagshipInstanceDavid &&
    flagshipInstanceDavid.getStatus() !== FSSdkStatus.SDK_NOT_INITIALIZED
  ) {
    return flagshipInstanceDavid;
  }

  const envId = requireEnv("FS_ENV_ID_DAVID");
  const apiKey = requireEnv("FS_API_KEY_DAVID");

  // Always create a new instance for account-2
  flagshipInstanceDavid = await Flagship.start(envId, apiKey, {
    fetchNow: false,
    decisionMode: DecisionMode.DECISION_API,
    logLevel: LogLevel.INFO,
  });

  return flagshipInstanceDavid;
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
  return visitor;
}

export async function getFsVisitorDataDavid(visitorData: {
  id: string;
  hasConsented: boolean;
  context: Record<string, any>;
}) {
  const flagship = await startFlagshipSDKDavid();

  const visitor = flagship.newVisitor({
    visitorId: visitorData.id,
    hasConsented: visitorData.hasConsented,
    context: visitorData.context,
  });

  await visitor.fetchFlags();
  return visitor;
}
