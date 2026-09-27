export function getCollectionSocialDescription(title: string): string {
  const prefix = "Explore ";
  const suffix = " on Stackly. Discover the items and details in this public collection.";
  const budget = 125 - prefix.length - suffix.length;
  const characters = Array.from(title.replace(/\s+/gu, " ").trim() || "this collection");
  const shortTitle = characters.length > budget
    ? `${characters.slice(0, budget - 1).join("").trimEnd()}…`
    : characters.join("");
  return `${prefix}${shortTitle}${suffix}`;
}
