import streamDeck from "@elgato/streamdeck";
import { QuotaAction } from "./actions/quota";
import { logger } from "./logging";

streamDeck.logger.setLevel("info");

streamDeck.actions.registerAction(new QuotaAction());
logger.info("OmniRoute plugin starting");

// Finally, connect to the Stream Deck.
streamDeck.connect();
