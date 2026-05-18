import type { ChangeType, Prisma, Severity, SourceType } from "@prisma/client";

export type SnapshotItem = {
  sourceType: SourceType;
  athleteName: string;
  eventName: string;
  registeredDivision: string;
  team: string | null;
};

export type EventItem = {
  eventName: string;
  registrationLink: string;
};

export type ChangeDraft = {
  changeType: ChangeType;
  severity: Severity;
  title: string;
  description: string;
  athleteName?: string;
  eventName?: string;
  oldValue?: string;
  newValue?: string;
  metadata?: Prisma.InputJsonValue;
};

function exactCompetitorKey(item: SnapshotItem) {
  return `${item.sourceType}|${item.eventName}|${item.athleteName}|${item.registeredDivision}`;
}

function radarKey(item: SnapshotItem) {
  return `${item.athleteName}|${item.eventName}|${item.registeredDivision}`;
}

function athleteEventKey(item: SnapshotItem) {
  return `${item.athleteName}|${item.eventName}`;
}

function eventKey(item: EventItem) {
  return `${item.eventName}|${item.registrationLink}`;
}

export function diffSnapshots(previousEvents: EventItem[], currentEvents: EventItem[], previous: SnapshotItem[], current: SnapshotItem[]) {
  const changes: ChangeDraft[] = [];
  const previousEventKeys = new Set(previousEvents.map(eventKey));
  const currentEventKeys = new Set(currentEvents.map(eventKey));

  for (const event of currentEvents) {
    if (!previousEventKeys.has(eventKey(event))) {
      changes.push({
        changeType: "NEW_EVENT",
        severity: "IMPORTANT",
        title: "New exact division event",
        description: `${event.eventName} now lists the target division.`,
        eventName: event.eventName,
        newValue: event.registrationLink
      });
    }
  }

  for (const event of previousEvents) {
    if (!currentEventKeys.has(eventKey(event))) {
      changes.push({
        changeType: "REMOVED_EVENT",
        severity: "IMPORTANT",
        title: "Exact division disappeared",
        description: `${event.eventName} no longer lists the target division.`,
        eventName: event.eventName,
        oldValue: event.registrationLink
      });
    }
  }

  const previousExact = previous.filter((item) => item.sourceType === "EXACT_DIVISION");
  const currentExact = current.filter((item) => item.sourceType === "EXACT_DIVISION");
  const previousExactKeys = new Set(previousExact.map(exactCompetitorKey));
  const currentExactKeys = new Set(currentExact.map(exactCompetitorKey));

  for (const item of currentExact) {
    if (!previousExactKeys.has(exactCompetitorKey(item))) {
      changes.push({
        changeType: "NEW_COMPETITOR",
        severity: "IMPORTANT",
        title: "New exact division competitor",
        description: `${item.athleteName} appeared in ${item.registeredDivision} for ${item.eventName}.`,
        athleteName: item.athleteName,
        eventName: item.eventName,
        newValue: item.registeredDivision
      });
    }
  }

  for (const item of previousExact) {
    if (!currentExactKeys.has(exactCompetitorKey(item))) {
      changes.push({
        changeType: "REMOVED_COMPETITOR",
        severity: "IMPORTANT",
        title: "Exact division competitor removed",
        description: `${item.athleteName} is no longer listed in ${item.registeredDivision} for ${item.eventName}.`,
        athleteName: item.athleteName,
        eventName: item.eventName,
        oldValue: item.registeredDivision
      });
    }
  }

  const currentByAthleteEvent = new Map(current.map((item) => [athleteEventKey(item), item]));
  for (const oldItem of previous) {
    const newItem = currentByAthleteEvent.get(athleteEventKey(oldItem));
    if (!newItem) continue;
    if ((oldItem.team ?? "") !== (newItem.team ?? "")) {
      changes.push({
        changeType: "TEAM_CHANGED",
        severity: "INFO",
        title: "Team changed",
        description: `${newItem.athleteName} changed teams for ${newItem.eventName}.`,
        athleteName: newItem.athleteName,
        eventName: newItem.eventName,
        oldValue: oldItem.team ?? "",
        newValue: newItem.team ?? ""
      });
    }
    if (oldItem.registeredDivision !== newItem.registeredDivision) {
      changes.push({
        changeType: "DIVISION_CHANGED",
        severity: "IMPORTANT",
        title: "Registered division changed",
        description: `${newItem.athleteName} changed registration division for ${newItem.eventName}.`,
        athleteName: newItem.athleteName,
        eventName: newItem.eventName,
        oldValue: oldItem.registeredDivision,
        newValue: newItem.registeredDivision
      });
    }
  }

  const previousRadar = previous.filter((item) => item.sourceType === "RADAR");
  const currentRadar = current.filter((item) => item.sourceType === "RADAR");
  const previousRadarKeys = new Set(previousRadar.map(radarKey));
  const currentRadarKeys = new Set(currentRadar.map(radarKey));

  for (const item of currentRadar) {
    if (!previousRadarKeys.has(radarKey(item))) {
      changes.push({
        changeType: "NEW_RADAR_ATHLETE",
        severity: "INFO",
        title: "New radar athlete",
        description: `${item.athleteName} is ranked in the target division and registered for ${item.eventName} in ${item.registeredDivision}.`,
        athleteName: item.athleteName,
        eventName: item.eventName,
        newValue: item.registeredDivision
      });
    }
  }

  for (const item of previousRadar) {
    if (!currentRadarKeys.has(radarKey(item))) {
      changes.push({
        changeType: "REMOVED_RADAR_ATHLETE",
        severity: "INFO",
        title: "Radar athlete removed",
        description: `${item.athleteName} is no longer visible in upcoming radar registrations for ${item.eventName}.`,
        athleteName: item.athleteName,
        eventName: item.eventName,
        oldValue: item.registeredDivision
      });
    }
  }

  return changes;
}
