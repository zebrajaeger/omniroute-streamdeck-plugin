import { action, SingletonAction } from "@elgato/streamdeck";

@action({ UUID: "de.lars-brandt.omniroute.quota" })
export class QuotaAction extends SingletonAction {}
