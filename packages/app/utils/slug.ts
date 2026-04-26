export const slugify = (text: string) => {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/([^0-9a-z-\s])/g, '')
    .replace(/(\s+)/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
};

/**
 * Generates an SEO friendly slug: truc-tiep-[home]-vs-[away]-[date]-[id]
 * Example: truc-tiep-ha-noi-vs-viettel-2024-03-06-12345
 */
export const generateMatchSlug = (homeTeamName: string, awayTeamName: string, date: string, matchId: string) => {
  const homeSlug = slugify(homeTeamName);
  const awaySlug = slugify(awayTeamName);
  const cleanDate = date.split('T')[0]; // Ensure only YYYY-MM-DD
  return `truc-tiep-${homeSlug}-vs-${awaySlug}-${cleanDate}-${matchId}`;
};

export const parseMatchSlug = (slug: string) => {
  const parts = slug.split('-');
  const id = parts[parts.length - 1];
  
  // Date is YYYY-MM-DD, which is 3 parts before the ID
  // e.g., ...-2024-03-06-12345
  // indices: length-4, length-3, length-2
  const day = parts[parts.length - 2];
  const month = parts[parts.length - 3];
  const year = parts[parts.length - 4];
  const date = `${year}-${month}-${day}`;
  
  return { id, date };
};

// Backwards compatibility for now if needed
export const extractMatchId = (slug: string) => {
  return parseMatchSlug(slug).id;
};

