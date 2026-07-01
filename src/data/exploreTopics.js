/** Explore portal cards — subject areas for browsing curated debates. */
export const EXPLORE_TOPICS = [
  {
    id: 'Technology',
    label: 'Technology',
    tagline: 'AI, platforms, digital life, and the systems reshaping society.',
    imageSeed: 'polaris-tech',
  },
  {
    id: 'Science',
    label: 'Science',
    tagline: 'Research, evidence, and the questions that define our era.',
    imageSeed: 'polaris-sci',
  },
  {
    id: 'Climate & Environment',
    label: 'Climate Change',
    tagline: 'Sustainability, ecology, transport, and the living planet.',
    imageSeed: 'polaris-climate',
  },
  {
    id: 'Human Rights',
    label: 'Human Rights',
    tagline: 'Dignity, justice, representation, and civil liberties.',
    imageSeed: 'polaris-rights',
  },
  {
    id: 'Immigration & Society',
    label: 'Immigration',
    tagline: 'Migration, identity, integration, and social cohesion.',
    imageSeed: 'polaris-immigration',
  },
  {
    id: 'Politics & Governance',
    label: 'Politics',
    tagline: 'Democracy, policy, power, and how societies decide.',
    imageSeed: 'polaris-politics',
  },
  {
    id: 'Religion & Ethics',
    label: 'Religion & Ethics',
    tagline: 'Faith, morality, culture, and values in public life.',
    imageSeed: 'polaris-ethics',
  },
  {
    id: 'Education',
    label: 'Education',
    tagline: 'Schools, credentials, youth, and how we prepare citizens.',
    imageSeed: 'polaris-education',
  },
  {
    id: 'Health & Society',
    label: 'Health & Society',
    tagline: 'Public health, wellbeing, medicine, and social behaviour.',
    imageSeed: 'polaris-health',
  },
]

export const EXPLORE_TOPIC_IDS = EXPLORE_TOPICS.map((t) => t.id)

export function getExploreTopic(id) {
  return EXPLORE_TOPICS.find((t) => t.id === id) ?? null
}

/** Match a post to an explore topic (curated topicArea or legacy category). */
export function postMatchesTopic(post, topicId) {
  if (!topicId) return true
  const area = post.topicArea ?? post.category
  if (area === topicId) return true
  if (topicId === 'Technology' && (area === 'Tech' || area === 'Technology')) return true
  if (topicId === 'Climate & Environment' && area === 'Nature') return true
  return false
}
