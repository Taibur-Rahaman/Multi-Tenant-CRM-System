// GitHub API Service - Direct API calls to GitHub
import api from './api';

export interface GitHubUser {
  login: string;
  id: number;
  name: string;
  email: string;
  avatar_url: string;
  bio: string;
  company: string;
  blog: string;
  location: string;
  followers: number;
  following: number;
  public_repos: number;
  created_at: string;
  updated_at: string;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string;
  html_url: string;
  language: string;
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
}

export interface GitHubEmail {
  email: string;
  primary: boolean;
  verified: boolean;
  visibility: string | null;
}

class GitHubApiService {
  private baseUrl = 'https://api.github.com';

  /**
   * Get GitHub user info using access token
   */
  async getUserInfo(accessToken: string): Promise<GitHubUser> {
    const response = await fetch(`${this.baseUrl}/user`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get user's email addresses from GitHub
   */
  async getUserEmails(accessToken: string): Promise<GitHubEmail[]> {
    const response = await fetch(`${this.baseUrl}/user/emails`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get user's repositories
   */
  async getUserRepos(accessToken: string, username: string): Promise<GitHubRepo[]> {
    const response = await fetch(`${this.baseUrl}/users/${username}/repos?sort=updated&per_page=10`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get public user info (no auth required)
   */
  async getPublicUserInfo(username: string): Promise<GitHubUser> {
    const response = await fetch(`${this.baseUrl}/users/${username}`, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Search users (no auth required)
   */
  async searchUsers(query: string): Promise<{ items: GitHubUser[] }> {
    const response = await fetch(`${this.baseUrl}/search/users?q=${encodeURIComponent(query)}`, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get repository info (no auth required)
   */
  async getRepo(owner: string, repo: string): Promise<GitHubRepo> {
    const response = await fetch(`${this.baseUrl}/repos/${owner}/${repo}`, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Exchange OAuth code for access token (via backend)
   */
  async exchangeCodeForToken(code: string): Promise<{ access_token: string }> {
    // This should be called via your backend to keep client secret safe
    const response = await api.post('/auth/oauth/github/exchange', { code });
    
    if (response.data.success) {
      return { access_token: response.data.data.access_token };
    }
    
    throw new Error('Failed to exchange code for token');
  }
}

export const githubApi = new GitHubApiService();


