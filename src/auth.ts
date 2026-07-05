export const parseIds = (raw: string) =>
  new Set(
    raw
      .split(",")
      .map((id) => id.trim())
      .filter((id) => id.length > 0),
  );

export const isValidUserId = (value: string) => /^\d{1,20}$/.test(value);
