// Project icon — uses the 50 agent icon repository
// Keyword-matches project name/tagline to pick the best icon
// Falls back to deterministic random from name hash

import AgentIcon, { matchCategory, hashStr, AGENT_CATEGORIES } from "@/assets/agentIcons";

export default function ProjectIcon({
  title = "",
  description = "",
  index = 0,
  size = 40,
  iconId,
}: {
  title?: string;
  description?: string;
  index?: number;
  size?: number;
  /** Stored icon category ID — takes priority over keyword matching */
  iconId?: string;
}) {
  // If project has a stored icon ID, use it directly
  if (iconId) {
    const colorSeed = hashStr(title || `project-${index}`) % AGENT_CATEGORIES.length;
    return <AgentIcon category={iconId} size={size} colorSeed={colorSeed} />;
  }

  // Otherwise keyword-match from title + description
  const cat = matchCategory(`${title} ${description}`);
  const colorSeed = hashStr(title || `project-${index}`) % AGENT_CATEGORIES.length;
  return <AgentIcon category={cat} size={size} colorSeed={colorSeed} />;
}
