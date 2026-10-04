import streamDeck from "@elgato/streamdeck";
import { QuotaAction } from "./actions/quota";
import { ConnectionSettingsAction } from "./actions/connection-settings";
import { logger } from "./logging";

streamDeck.logger.setLevel("info");

streamDeck.actions.registerAction(new QuotaAction());
streamDeck.actions.registerAction(new ConnectionSettingsAction());
logger.info("OmniRoute plugin starting");

// Finally, connect to the Stream Deck.
streamDeck.connect();
