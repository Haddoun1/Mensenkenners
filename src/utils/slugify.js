export const slugify = (value) =>
  value
    ?.toLowerCase()
    .trim()
    .replaceAll(" ", "-")
    .replaceAll("ë", "e")
    .replaceAll("é", "e");

// https://dev.to/bybydev/how-to-slugify-a-string-in-javascript-4o9n