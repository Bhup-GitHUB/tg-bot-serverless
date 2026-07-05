export const parseAuthorizedIds = (raw: string) =>
  new Set(
    raw
      .split(",")
      .map((id) => id.trim())
      .filter((id) => id.length > 0),
  );

export const isAuthorized = (ids: Set<string>, userId: number | undefined) =>
  userId !== undefined && ids.has(String(userId));
