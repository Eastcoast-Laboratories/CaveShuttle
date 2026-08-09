// Level-pack import validation and parsing.
// Import format: single JSON file { meta: {...}, levels: { level1: "<.def content>", ... } }

export function parseImportedPackFile(fileText) {
  let parsed;
  try {
    parsed = JSON.parse(fileText);
  } catch (error) {
    throw new Error('Invalid JSON file. Please ensure the file is valid JSON.');
  }

  if (!parsed.meta || typeof parsed.meta !== 'object') {
    throw new Error('Pack must include a "meta" object with pack metadata.');
  }

  const { meta, levels } = parsed;

  if (!meta.id || typeof meta.id !== 'string') {
    throw new Error('Pack meta must include an "id" string (unique pack identifier).');
  }

  if (!meta.name || typeof meta.name !== 'string') {
    throw new Error('Pack meta must include a "name" string (display name).');
  }

  if (!levels || typeof levels !== 'object') {
    throw new Error('Pack must include a "levels" object mapping level IDs to .def content.');
  }

  const levelIds = Object.keys(levels);
  if (levelIds.length === 0) {
    throw new Error('Pack must contain at least one level.');
  }

  // Validate each level content (string or array of strings) and roughly matches .def format
  for (const levelId of levelIds) {
    const content = levels[levelId];
    let levelString;

    if (Array.isArray(content)) {
      // Join array of lines into a single string
      levelString = content.join('\n');
    } else if (typeof content === 'string') {
      levelString = content;
    } else {
      throw new Error(`Level "${levelId}" must be a string or array of strings.`);
    }

    if (levelString.trim().length === 0) {
      throw new Error(`Level "${levelId}" has empty content.`);
    }
    const firstLine = levelString.trim().split('\n')[0];
    // .def files start with a numeric width (e.g. "82          ; width")
    if (!/^\d/.test(firstLine.trim())) {
      throw new Error(`Level "${levelId}" does not appear to be a valid .def file (first line should start with numeric width).`);
    }

    // Normalize to string for storage
    levels[levelId] = levelString;
  }

  return parsed;
}
