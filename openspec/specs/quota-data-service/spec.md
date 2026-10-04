# quota-data-service Specification

## Purpose

Stellt aktuelle OmniRoute-Quota-Snapshots zentral für alle Plugin-Verbraucher bereit und hält Provider-Verbindungen sowie Fehlerzustände eindeutig auseinander.

## Requirements

### Requirement: Retrieve snapshots using the shared connection
The plugin SHALL retrieve `GET /api/usage/om-usage?format=json` from the saved OmniRoute HTTP(S) instance using `Authorization: Bearer <apiKey>`. It SHALL use plugin-wide `url` and `apiKey`, SHALL NOT query external provider APIs or `/api/usage/utilization`, and SHALL NOT expose credentials in action settings, quota data or logs. Missing or invalid runtime configuration SHALL prevent requests without changing saved settings or adding save-time validation.

#### Scenario: Use an existing configured connection
- **WHEN** the plugin starts with a valid saved URL and API key
- **THEN** it immediately requests the current JSON snapshot from that OmniRoute instance with bearer authentication

#### Scenario: Handle unusable configuration safely
- **WHEN** either setting is missing or the URL cannot identify an HTTP(S) instance
- **THEN** no request is sent, consumers receive an unconfigured or invalid-configuration state, and saved text remains unchanged

#### Scenario: Protect credentials on a failed request
- **WHEN** a request fails with an error or response containing sensitive data
- **THEN** diagnostics contain only sanitized status information, never the API key, bearer header, raw response or credential-bearing URL

### Requirement: Share bounded periodic refreshes
The plugin SHALL share one snapshot refresh across all consumers, immediately refresh on startup and connection changes, and schedule subsequent refreshes 20 seconds after the preceding request completes. A request SHALL time out after 10 seconds. Adding consumers SHALL NOT start additional polling loops or duplicate an in-flight snapshot request.

#### Scenario: Multiple consumers use one refresh
- **WHEN** several Quota consumers are active during a refresh cycle
- **THEN** exactly one snapshot request supplies their shared data

#### Scenario: A request stops responding
- **WHEN** a snapshot request does not complete within 10 seconds
- **THEN** it terminates as unavailable and a later scheduled refresh can proceed

### Requirement: Preserve connection identity and generic quotas
The plugin SHALL expose the latest successful provider records keyed by nonempty `connectionId`, retaining `provider`, optional `plan` and arbitrary quota-window keys. A successful snapshot SHALL replace the previous snapshot, including an empty `providers` array. Missing identifiers, duplicate identifiers or an invalid `providers` envelope SHALL classify the response as invalid rather than merge or silently alias accounts. Invalid optional quota fields SHALL be treated as unknown without inventing values.

#### Scenario: Two accounts of the same provider
- **WHEN** the response contains two Codex records with different connection IDs
- **THEN** consumers can retrieve both records separately without overwriting either by provider or plan

#### Scenario: A provider disappears
- **WHEN** a valid new snapshot omits a previously present connection
- **THEN** that connection is absent from the new snapshot rather than retained as current

#### Scenario: Unknown provider window keys
- **WHEN** a provider returns `premium_interactions` or another previously unseen quota key
- **THEN** the key and valid quota fields remain available without provider-specific code

### Requirement: Normalize remaining quota without fabricating values
For a limited window, the plugin SHALL use a finite `remainingPercentage` in the range 0–100 when present; otherwise it SHALL derive a percentage from nonnegative `remaining` and positive `total`, or from valid `used` and positive `total` when `remaining` is absent. Derived percentages SHALL be clamped to 0–100. It SHALL distinguish unknown, unlimited and exhausted values; `unlimited: true` SHALL take precedence over numeric values. It SHALL NOT treat a standalone `remaining` value as a percentage.

#### Scenario: Normalize concept example
- **WHEN** a window has remaining 84 and total 100
- **THEN** its normalized remaining percentage is 84

#### Scenario: Distinguish unlimited and unknown
- **WHEN** one window has `unlimited: true` and another has no usable numeric fields
- **THEN** consumers receive unlimited and unknown states respectively, neither a fabricated zero nor a fabricated 100 percent

### Requirement: Publish freshness and recoverable error states
The plugin SHALL distinguish loading, ready, unconfigured, invalid configuration, authentication failure for HTTP 401/403, unavailable for transport/timeout and other unsuccessful HTTP responses, and invalid response for malformed JSON or invalid snapshot structure. It SHALL retain the last successful snapshot and timestamp on refresh failure within the same configuration, mark it stale and expose the current error. A later valid response SHALL clear stale/error state.

#### Scenario: Temporary failure after success
- **WHEN** a refresh fails after a successful snapshot
- **THEN** consumers receive the previous data explicitly marked stale with its last-success timestamp and the current error category

#### Scenario: Recover after an authentication failure
- **WHEN** a later refresh succeeds after HTTP 401
- **THEN** the valid snapshot becomes current and the authentication error is cleared

### Requirement: Isolate configuration generations
When saved URL or API key changes, the plugin SHALL discard prior cached data, cancel or ignore requests from the previous configuration and immediately refresh using the new configuration. An unchanged settings notification SHALL NOT reset the cache or duplicate polling. A late old response SHALL NOT overwrite current data.

#### Scenario: Switch OmniRoute instances during a request
- **WHEN** settings change while the previous instance's request is in flight
- **THEN** old data is removed and only a response from the new configuration can become current
