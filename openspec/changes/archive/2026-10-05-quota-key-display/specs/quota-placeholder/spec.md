## REMOVED Requirements

### Requirement: Quota action is an inert placeholder
**Reason**: Die Quota-Action zeigt nun echte Daten der ausgewählten OmniRoute-Verbindung; die zuvor im Change `quota-provider-selection` gelockerte Platzhalter-Regel ist überholt.
**Migration**: Bestehende Quota-Action-UUID und gespeicherte `connectionId` beibehalten. Unzugeordnete Tasten zeigen einen Konfigurationshinweis; Darstellung und Fehlerzustände regelt `quota-key-display`. Dieser Delta wird erst nach Abschluss und Spec-Sync von `quota-provider-selection` angewendet.
