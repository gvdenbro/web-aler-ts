# web-aler-ts

Notifies a person when a watched page or API changes. Git stores the scraped records; Telegram is the reader.

## Language

**Scrape**:
A single run against one scrape target that records what the target currently shows.
_Avoid_: job, crawl, monitor

**Scrape target**:
The page, API, or site flow a scrape points at.
_Avoid_: source, site, URL

**Scrape set**:
A named group of scrapes that share an output directory, schedule, and notification.
_Avoid_: workflow, category, collection

**Scrape artifact**:
The durable record of one scrape: a markdown file, an optional image, and a link to the source.
_Avoid_: output, result, file, page

**Artifact name**:
The relative path that identifies a scrape artifact within its scrape set.
_Avoid_: filename, slug, test title

**Display title**:
The human-readable label for a scrape artifact, used in notifications and frontmatter.
_Avoid_: name, heading

**Price history**:
The append-only record of prices observed for a scrape set over time.
_Avoid_: price log, series, CSV

**Noise**:
Third-party requests a scrape blocks so the target's own content can be reached.
_Avoid_: ads, trackers, blocklist
