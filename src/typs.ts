export interface Capability {
  id: number;
  text: string;
}

// ADD THIS NEW TYPE
export interface ProcessedCapability extends Capability {
  enjoymentRank: number;
  skillRank: number;
}