---
description: close openspec change
---

## Finde Change-ID
- Führe `openscpec list` aus.
- Wurde ein Parameter übergeben?
  - Gibt es in der Liste eine ID die genau dem Parameter entspricht oder so ähnlich ist, 
    dass es sich mit hoher Wahrscheinlichkeit nur um einen Tippfehler handelt?
    Falls ja, so wähle die nimm die korrekt geschribene ID und fahre mit Sektion 'Ablauf' fort.
    Falls nein, fahre mit dem nächsten Punkt fort.
- Gibt es in der Liste der offenen Changes nur einen einzigen Eintrag?
  Falls ja, wähle diesen aus und fahre mit Sektion 'Ablauf fort'.
  Falls nein, fahre mit dem nächsten Punkt fort.
- Gibt es im Gesprächsverlauf einen eindeutigen Hinweis auf einen der offenen Changes aus der Liste?
  Falls ja, so nimm diesen und fahre mit Sektion 'Ablauf fort'.
  Falls nein, fahre mit dem nächsten Punkt fort.
- Stelle dem User die Frage, welchen offenen Change er schließen möchte.
  Biete ihm die Liste der offenen Changes als Auswahl an.
  Wurde die Frage beantwortet, so fahre mit der Sektion 'Ablauf' fort.
- Falls Du an diesem Punkt kommst, so sag dem Benutzer, was Du benötigst, um fortzufahren.
  Frag ihn, ob Du noch einmal in den vorigen Punkt mit der Auswahl aus den offenen Changes gehen sollst.
  Falls ja, gehe zu dem Punkt. Falls nein, sage dem Benutzer, dass Du ohne die nötigen Informationen nicht fortfahren kannst und breche ab.


## Ablauf
- Aus der Sektion 'Finde Change-ID' sollte sich eine Change-ID ergeben haben.
  Falls nicht, breche an dieser Stelle mit einem Hinweis ab.
- Synce erst mit `/opsx-sync <Change-ID>`.
- War der Sync erfolgreich, archiviere mit `/opsx-archive <Change-ID>`.
- War das Archivieren erfolgreich, so erstelle einen git commit aus den zugehörigen Dateien (OpenSpec, Code, Doku,...).
  Gibt es im Projektkontext keinen Hinweis, wie die commit-Message gestaltet werden soll, so nimm als Vorlage:
  `[fix|feature|<was auch immer passt>]: "["<Change-ID>"]" <Commit Beschreibung>`.
  Beispiel: `fix: [implement-logging] Einbau der Logginbibliothek xy und Einfügen von Logausgaben in ...`
