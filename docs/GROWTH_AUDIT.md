# DreamCMS Growth Audit

## Part 1 - Audit Summary

### Frontend public
- Solid SSR/ISR foundation and strong content templates already exist.
- Missing sitewide information architecture for trust, search, and recurring navigation was hurting crawl depth and user retention.
- Public pages lacked a proper shell, footer trust links, and dedicated discovery paths outside article/category entry points.

### Admin
- Admin is broad and functional: content, SEO, GEO, media, redirects, backups, affiliate, newsletter, reports.
- Biggest gap is launch operations discipline rather than missing CRUD.
- Editorial workflows exist, but public trust surfaces were underrepresented.

### SEO tooling
- Strong editor-side SEO controls already exist.
- Metadata foundation had a weak root default and hardcoded site title handling.
- SearchAction/Organization site-level schema was missing.

### GEO tooling
- GEO scoring, speakable logic, direct answer extraction, and schema persistence are already strong.
- Biggest remaining GEO opportunity is richer author/entity trust and broader corpus interlinking.

### Media
- Sharp processing, alt text generation, thumbnail/OG generation are in place.
- Remaining gaps are CDN strategy, responsive image sizing, and image performance QA on live traffic.

### Redirects
- Redirect engine, cache, middleware integration, and hits tracking exist.
- Main risk is operational monitoring and redirect hygiene after launch.

### Backup
- Good baseline: DB/media/full backups plus email notifications.
- Main next step is live restore rehearsal and off-server retention validation.

### Analytics readiness
- Events, attribution, newsletter funnel, and revenue reporting exist.
- Still missing a deeper performance telemetry layer and real production baseline data.

### Monetization readiness
- Ads, affiliate placements, newsletter funnel, and revenue reports exist.
- Missing compliance/trust surfaces on public pages were a weakness before this pass.

### Performance readiness
- Next.js foundation is good, but live Core Web Vitals instrumentation is still absent.
- Root layout metadata/body defaults were under-optimized before this pass.

### E-E-A-T / trust readiness
- This was the biggest weakness.
- No visible about/contact/editorial/legal surfaces on the public site meant lower trust for both users and search engines.

## Part 2 - Prioritized Backlog

| ID | Improvement | Impact | Effort | Business reason | Risk | Owner |
| --- | --- | --- | --- | --- | --- | --- |
| G01 | Public site shell with nav, trust footer, and search entry | High | Medium | Improves crawl paths, UX, retention, and trust signals | Low | dev |
| G02 | Public trust/compliance pages (about, contact, editorial, privacy, terms, affiliate disclosure) | High | Medium | Needed for E-E-A-T, ads/affiliate compliance, and brand legitimacy | Low | dev/seo |
| G03 | Site-level Organization + WebSite + SearchAction schema | High | Low | Strengthens entity understanding and search discovery | Low | dev/seo |
| G04 | Public search hub with article + symbol search | High | Medium | Improves content discovery and session depth | Low | dev |
| G05 | Author profile model with bios, credentials, avatar, and public author pages | High | Medium | Stronger E-E-A-T and citation quality | Medium | dev/editor |
| G06 | Web Vitals telemetry to analytics DB and admin reporting | High | Medium | Needed for real performance optimization after launch | Low | dev |
| G07 | Content freshness workflow with stale-content flags in admin | High | Medium | Helps maintain rankings and trust over time | Low | dev/editor |
| G08 | Structured internal linking suggestions for frontend rendering, not only editor-side | High | Medium | Better crawl depth and topical authority | Medium | dev/seo |
| G09 | Comparison/cluster landing pages for high-volume dream intents | High | High | Unlocks scalable SEO clusters and monetizable traffic | Medium | seo/editor |
| G10 | Rich FAQ expansion from symbol/dream clusters into hub pages | Medium | Medium | Better long-tail capture and GEO answer coverage | Low | editor/seo |
| G11 | Related content widgets tuned by engagement and conversion data | Medium | Medium | More pageviews and better monetization yield | Medium | dev |
| G12 | Live ads health diagnostics (empty slots, CTR drops, blocked states) | Medium | Medium | Prevents silent revenue loss | Low | dev |
| G13 | Affiliate catalog QA rules (broken links, missing prices, stale merchants) | Medium | Medium | Protects monetization and trust | Low | dev |
| G14 | Editorial launch checklist inside admin per post/symbol | Medium | Medium | Reduces publishing mistakes | Low | dev/editor |
| G15 | Search Console style crawl dashboard from imported data | Medium | High | Faster SEO prioritization | Medium | dev/seo |
| G16 | Newsletter segmentation by source/topic and automated nurture paths | Medium | Medium | Better subscriber value and conversion | Medium | dev/marketing |
| G17 | Dedicated landing pages for commercial intent queries | Medium | High | Better affiliate revenue per session | Medium | seo/editor |
| G18 | Image CDN / cache strategy for production media | Medium | Medium | Faster pages and lower bandwidth cost | Medium | devops/dev |
| G19 | Automated redirect recommendations after slug/category changes | Medium | Medium | Preserves rankings during content maintenance | Low | dev |
| G20 | Restore drill documentation and automated backup integrity verification | Medium | Medium | Reduces operational risk pre-scale | Low | devops |

### Implemented in this pass
- G01
- G02
- G03

## Part 3 - Top 3 Implemented

### G01 - Public site shell
- Added a sitewide public header with category navigation and search entry.
- Added a public footer with crawlable trust/legal links and clearer site positioning.

### G02 - Trust and compliance surfaces
- Added dedicated public pages for about, contact, editorial policy, privacy, terms, and affiliate disclosure.
- Added monetization transparency messaging into public content templates.

### G03 - SEO foundation and search entity signals
- Added site-level Organization/WebSite/SearchAction schema.
- Added a real public search page.
- Fixed root metadata/lang defaults and metadata title composition.

## Part 4 - Verification
- Run `npm run lint`
- Run `npm run build`
- Confirm no new TypeScript or Next.js build errors