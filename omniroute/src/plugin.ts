import streamDeck from "@elgato/streamdeck";
import { QuotaAction } from "./actions/quota";

// We can enable "trace" logging so that all messages between the Stream Deck, and the plugin are recorded. When storing sensitive information
streamDeck.logger.setLevel("trace");

streamDeck.actions.registerAction(new QuotaAction());

// Finally, connect to the Stream Deck.
streamDeck.connect();
