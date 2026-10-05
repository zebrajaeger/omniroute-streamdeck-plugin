import streamDeck from "@elgato/streamdeck";
import { QuotaAction } from "./actions/quota";
import { ConnectionSettingsAction } from "./actions/connection-settings";
import { logger } from "./logging";
import { QuotaService } from "./quota-service";
import { startQuotaService } from "./quota-bootstrap";

streamDeck.logger.setLevel("info");

// One shared polling service for the entire plugin, independent of action visibility.
export const quotaService = new QuotaService(undefined, undefined, undefined, logger);

const quotaAction = new QuotaAction(undefined, quotaService);
streamDeck.actions.registerAction(quotaAction);
streamDeck.actions.registerAction(new ConnectionSettingsAction(settings => quotaService.configure(settings)));
logger.info("OmniRoute plugin starting");

void startQuotaService(streamDeck, {
	configure(settings) { quotaService.configure(settings); quotaAction.configure(settings); },
	stop() { quotaService.stop(); },
});
