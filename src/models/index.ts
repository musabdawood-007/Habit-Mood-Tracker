/**
 * Re-export all models for convenient imports.
 * Import pattern: `import { User, Entry, Habit } from "@/models";`
 */

export { User } from "./User";
export type { IUser, IUserSettings } from "./User";

export { Identity } from "./Identity";
export type { IIdentity } from "./Identity";

export { Entry } from "./Entry";
export type { IEntry } from "./Entry";

export { Habit } from "./Habit";
export type { IHabit } from "./Habit";

export { HabitLog } from "./HabitLog";
export type { IHabitLog } from "./HabitLog";

export { HabitTemplate } from "./HabitTemplate";
export type { IHabitTemplate } from "./HabitTemplate";

export { Correlation } from "./Correlation";
export type { ICorrelation, TargetMetric } from "./Correlation";

export { Connection } from "./Connection";
export type { IConnection, ConnectionPermission, ConnectionStatus } from "./Connection";

export { PushSubscription } from "./PushSubscription";
export type { IPushSubscription } from "./PushSubscription";

export { Otp } from "./Otp";
export type { IOtp } from "./Otp";

export { Insight } from "./Insight";
export type { IInsight } from "./Insight";
