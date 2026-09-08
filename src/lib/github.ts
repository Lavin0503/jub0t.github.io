// Fetched once at build time. The deploy workflow runs on every push, so the
// numbers are as fresh as the last deploy; if the API is unreachable we fall
// back to the values below rather than failing the build.
import { site } from '../data/site';

export interface Asset {
	name: string;
	url: string;
	size: number;
}

export interface Release {
	version: string;
	url: string;
	publishedAt: string;
	assets: Asset[];
}

export interface Repo {
	stars: number;
	forks: number;
}

const API = `https://api.github.com/repos/${site.repo}`;
// Unauthenticated calls are limited to 60/hour per IP, which Actions runners
// share, so the deploy workflow passes GITHUB_TOKEN through.
const headers: Record<string, string> = { Accept: 'application/vnd.github+json', 'User-Agent': 'jub0t.github.io' };
if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

const FALLBACK_REPO: Repo = { stars: 1434, forks: 131 };

const FALLBACK_RELEASE: Release = {
	version: '0.2.1',
	url: `${site.repoUrl}/releases/tag/v0.2.1`,
	publishedAt: '2026-09-04',
	assets: [
		'macos-arm64.dmg',
		'macos-x86_64.dmg',
		'windows-x86_64.zip',
		'windows-aarch64.zip',
		'linux-x86_64.tar.gz',
		'linux-aarch64.tar.gz',
		'android-arm64.apk',
		'ios-arm64.ipa',
	].map((suffix) => ({
		name: `Concat-0.2.1-${suffix}`,
		url: `${site.repoUrl}/releases/download/v0.2.1/Concat-0.2.1-${suffix}`,
		size: 0,
	})),
};

async function get<T>(path: string): Promise<T | null> {
	try {
		const res = await fetch(`${API}${path}`, { headers });
		if (!res.ok) return null;
		return (await res.json()) as T;
	} catch {
		return null;
	}
}

export async function getRepo(): Promise<Repo> {
	const data = await get<{ stargazers_count: number; forks_count: number }>('');
	if (!data) return FALLBACK_REPO;
	return { stars: data.stargazers_count, forks: data.forks_count };
}

export async function getLatestRelease(): Promise<Release> {
	const data = await get<{
		tag_name: string;
		html_url: string;
		published_at: string;
		assets: { name: string; browser_download_url: string; size: number }[];
	}>('/releases/latest');
	if (!data) return FALLBACK_RELEASE;
	return {
		version: data.tag_name.replace(/^v/, ''),
		url: data.html_url,
		publishedAt: data.published_at.slice(0, 10),
		assets: data.assets.map((a) => ({ name: a.name, url: a.browser_download_url, size: a.size })),
	};
}

/** Group release assets into one row per platform. */
export interface PlatformRow {
	platform: string;
	status: 'tested' | 'untested';
	note?: string;
	builds: { arch: string; asset: Asset }[];
}

const PLATFORMS: { key: string; platform: string; status: PlatformRow['status']; note?: string }[] = [
	{ key: 'macos', platform: 'macOS', status: 'tested', note: 'Unsigned build; see the note below.' },
	{ key: 'windows', platform: 'Windows', status: 'tested' },
	{ key: 'linux', platform: 'Linux', status: 'tested' },
	{ key: 'android', platform: 'Android', status: 'untested' },
	{ key: 'ios', platform: 'iOS / iPadOS', status: 'untested' },
];

function archLabel(platform: string, arch: string): string {
	if (arch === 'x86_64') return platform === 'macos' ? 'Intel' : 'x86_64';
	return platform === 'macos' ? 'Apple silicon' : 'arm64';
}

export function groupByPlatform(assets: Asset[]): PlatformRow[] {
	return PLATFORMS.map(({ key, ...rest }) => {
		const builds = assets
			.map((asset) => {
				const m = asset.name.match(new RegExp(`-${key}-([a-z0-9_]+)\\.`));
				if (!m) return null;
				return { arch: archLabel(key, m[1]), asset };
			})
			.filter((b): b is { arch: string; asset: Asset } => b !== null);
		return { ...rest, builds };
	}).filter((row) => row.builds.length > 0);
}

export function formatBytes(n: number): string {
	if (!n) return '';
	return `${(n / 1_048_576).toFixed(0)} MB`;
}

export function formatCount(n: number): string {
	return n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k` : String(n);
}
