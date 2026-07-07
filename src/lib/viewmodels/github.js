// GitHub page view model — static data from data/github.yaml. Live stats
// (stars/forks/language, follower counts) are fetched client-side by the
// page's inline script and degrade silently, so nothing here touches the
// network: the avatar uses GitHub's stable <user>.png redirect.
import { localize } from '../i18n.js';

export function buildGithubViewModel(data, lang) {
  const username = data.username;
  return {
    username,
    display_name: data.name || username,
    profile_url: `https://github.com/${username}`,
    avatar_url: `https://github.com/${username}.png?size=192`,
    repos: (data.repos || []).map((repo) => ({
      name: repo.name,
      url: `https://github.com/${username}/${repo.name}`,
      description: localize(repo, 'description', lang),
      topics: repo.topics || [],
      has_topics: (repo.topics || []).length > 0,
    })),
  };
}
