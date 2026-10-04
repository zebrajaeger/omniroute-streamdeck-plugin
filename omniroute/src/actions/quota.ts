import { action, SingletonAction } from "@elgato/streamdeck";
import { logger } from "../logging";

@action({ UUID: "de.lars-brandt.omniroute.quota" })
export class QuotaAction extends SingletonAction {
	override onWillAppear(): void {
		logger.debug("Quota action became visible");
	}
}
