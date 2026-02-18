import type { GitCredentials, GitAuthor } from "../Commons/Types";
import { GIT_DEFAULT_AUTHOR_NAME, GIT_DEFAULT_AUTHOR_EMAIL, GIT_DEFAULT_CORS_PROXY } from "../Commons/Constants";

export interface GitSettings
{
    autoFetch: boolean;
    autoFetchInterval: number;
    showUntracked: boolean;
    showIgnored: boolean;
    corsProxy: string;
}

export function GetDefaultGitSettings(): GitSettings
{
    return {
        autoFetch: true,
        autoFetchInterval: 300000,
        showUntracked: true,
        showIgnored: false,
        corsProxy: GIT_DEFAULT_CORS_PROXY,
    };
}

export function GetDefaultGitAuthor(): GitAuthor
{
    return {
        name: GIT_DEFAULT_AUTHOR_NAME,
        email: GIT_DEFAULT_AUTHOR_EMAIL,
    };
}

export function GetDefaultCredentials(): GitCredentials
{
    return {
        type: 'token',
        username: '',
        token: '',
    };
}
