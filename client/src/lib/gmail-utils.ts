/**
 * Utility functions for handling Gmail-specific data formatting
 */

export interface ParsedGmailUser {
  name: string;
  email: string;
  displayName: string;
}

/**
 * Parses Gmail user string format "Name <email@domain.com>"
 * Returns parsed name and email components
 */
export function parseGmailUser(userString: string): ParsedGmailUser {
  if (!userString) {
    return {
      name: "Unknown",
      email: "",
      displayName: "Unknown",
    };
  }

  // Handle format: "Name <email@domain.com>"
  const match = userString.match(/^(.+?)\s*<(.+?)>$/);

  if (match) {
    const [, name, email] = match;
    return {
      name: name.trim(),
      email: email.trim(),
      displayName: name.trim(),
    };
  }

  // If no match, assume it's just an email or name
  if (userString.includes("@")) {
    return {
      name: userString.split("@")[0],
      email: userString,
      displayName: userString.split("@")[0],
    };
  }

  return {
    name: userString,
    email: "",
    displayName: userString,
  };
}

/**
 * Gets the initials from a name for avatar fallback
 */
export function getInitials(name: string): string {
  if (!name) return "?";

  const words = name.trim().split(" ");
  if (words.length >= 2) {
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  }
  return name.charAt(0).toUpperCase();
}

/**
 * Formats email subject for display
 */
export function formatEmailSubject(
  subject: string | undefined,
  maxLength: number = 60
): string {
  if (!subject) return "No Subject";

  if (subject.length <= maxLength) return subject;
  return subject.substring(0, maxLength - 3) + "...";
}

/**
 * Extracts domain from email address
 */
export function getEmailDomain(email: string): string {
  if (!email || !email.includes("@")) return "";
  return email.split("@")[1];
}

/**
 * Generates a consistent color for an email address/domain
 */
export function getEmailColor(email: string): string {
  if (!email) return "#6B7280"; // gray-500

  const domain = getEmailDomain(email);
  const colors = [
    "#EF4444", // red-500
    "#F97316", // orange-500
    "#EAB308", // yellow-500
    "#22C55E", // green-500
    "#06B6D4", // cyan-500
    "#3B82F6", // blue-500
    "#8B5CF6", // violet-500
    "#EC4899", // pink-500
  ];

  let hash = 0;
  for (let i = 0; i < domain.length; i++) {
    hash = domain.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
}
