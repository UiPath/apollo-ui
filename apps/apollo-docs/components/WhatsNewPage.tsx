'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';

export interface Release {
  id: number;
  tag_name: string;
  name: string;
  body: string;
  published_at: string;
  html_url: string;
}

const TABS = [
  { id: 'release-notes', label: 'Release Notes' },
  { id: 'changelog', label: 'Changelog' },
] as const;

const PACKAGES = ['apollo-wind', 'apollo-react', 'apollo-core'] as const;

const CHANGELOG_URLS: Record<string, string> = {
  'apollo-wind': 'https://raw.githubusercontent.com/UiPath/apollo-ui/main/packages/apollo-wind/CHANGELOG.md',
  'apollo-react': 'https://raw.githubusercontent.com/UiPath/apollo-ui/main/packages/apollo-react/CHANGELOG.md',
  'apollo-core': 'https://raw.githubusercontent.com/UiPath/apollo-ui/main/packages/apollo-core/CHANGELOG.md',
};

function packageBadgeClass(tag: string) {
  if (tag.includes('apollo-wind')) return 'badge-wind';
  if (tag.includes('apollo-react')) return 'badge-react';
  return 'badge-core';
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function WhatsNewContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeTab = searchParams.get('tab') ?? 'release-notes';
  const activePkg = (searchParams.get('pkg') ?? 'apollo-wind') as typeof PACKAGES[number];

  const [releases, setReleases] = useState<Release[]>([]);
  const [changelogs, setChangelogs] = useState<Record<string, string>>({});
  const [loadingReleases, setLoadingReleases] = useState(true);
  const [loadingChangelog, setLoadingChangelog] = useState(false);

  useEffect(() => {
    fetch('https://api.github.com/repos/UiPath/apollo-ui/releases?per_page=30', {
      headers: { Accept: 'application/vnd.github.v3+json' },
    })
      .then((r) => (r.ok ? r.json() : []))
      .catch(() => [])
      .then((data) => { setReleases(data); setLoadingReleases(false); });
  }, []);

  useEffect(() => {
    if (activeTab !== 'changelog') return;
    if (changelogs[activePkg]) return;
    setLoadingChangelog(true);
    fetch(CHANGELOG_URLS[activePkg])
      .then((r) => (r.ok ? r.text() : ''))
      .catch(() => '')
      .then((text) => {
        setChangelogs((prev) => ({ ...prev, [activePkg]: text }));
        setLoadingChangelog(false);
      });
  }, [activeTab, activePkg, changelogs]);

  function navigate(tab: string, pkg?: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    if (pkg) params.set('pkg', pkg);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="whats-new-page">
      <h1 className="whats-new-title">What's New</h1>
      <p className="whats-new-subtitle">
        Stay up to date with the latest Apollo UI releases and changes.
      </p>

      {/* Tab bar */}
      <div className="wn-tab-bar">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => navigate(tab.id)}
            className={`wn-tab-btn${activeTab === tab.id ? ' wn-tab-btn--active' : ''}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Release Notes tab */}
      {activeTab === 'release-notes' && (
        <div className="releases-list">
          {loadingReleases ? (
            <p className="releases-empty">Loading releases…</p>
          ) : releases.length === 0 ? (
            <p className="releases-empty">
              Unable to load releases.{' '}
              <a
                href="https://github.com/UiPath/apollo-ui/releases"
                target="_blank"
                rel="noopener noreferrer"
              >
                View on GitHub →
              </a>
            </p>
          ) : (
            releases.map((r) => (
              <div key={r.id} className="release-card">
                <div className="release-card__header">
                  <span className={`release-badge ${packageBadgeClass(r.tag_name)}`}>
                    {r.tag_name}
                  </span>
                  <span className="release-date">{formatDate(r.published_at)}</span>
                  <a
                    href={r.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="release-gh-link"
                  >
                    View on GitHub →
                  </a>
                </div>
                {r.body && (
                  <div className="markdown-body">
                    <ReactMarkdown>{r.body}</ReactMarkdown>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Changelog tab */}
      {activeTab === 'changelog' && (
        <div>
          <div className="pkg-selector">
            {PACKAGES.map((pkg) => (
              <button
                key={pkg}
                type="button"
                onClick={() => navigate('changelog', pkg)}
                className={`pkg-btn${activePkg === pkg ? ' pkg-btn--active' : ''}`}
              >
                {pkg}
              </button>
            ))}
          </div>
          <div className="markdown-body changelog-body">
            {loadingChangelog ? (
              <p style={{ color: 'var(--foreground-muted)', fontSize: '0.875rem' }}>Loading…</p>
            ) : (
              <ReactMarkdown>{changelogs[activePkg] ?? 'No changelog available.'}</ReactMarkdown>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function WhatsNewPage() {
  return (
    <Suspense>
      <WhatsNewContent />
    </Suspense>
  );
}
