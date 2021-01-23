import { Feature, ZoneConfig, HWWidgetType } from "@makeproaudio/glue-feature-tools";
import { Registry } from "@makeproaudio/makehaus-nodered-lib/dist/registry/registry";
import { Parameter, setSynapsesManager, NumberParameter, SuperParameter, ParameterType } from "@makeproaudio/parameters-js";
import { v4 } from "uuid";

enum ZoneId {
    SCENES = "SCENES",
    AUDIO_MIXER = "AUDIO_MIXER"
}

export default class OBSControlFeature implements Feature {
    public readonly zones: ZoneConfig[] = [
        {
            color: "#03b5fc",
            id: ZoneId.SCENES,
            name: "Scenes",
            description: "This zone is used switching scenes",
            widgetTypes: [HWWidgetType.LEDBUTTON],
        },
        {
            color: "#fcd303",
            id: ZoneId.AUDIO_MIXER,
            name: "Audio Mixer",
            description: "This zone is used for the volume of all audio devices",
            widgetTypes: [HWWidgetType.ENCODER, HWWidgetType.MOTORFADER],
        },
    ];
    private registry: Registry;
    private audioMixerParameters: Map<number, Parameter<any>>;

    public constructor(settings: any, registry: Registry, synapsesManager: any) {
        setSynapsesManager(synapsesManager);
        this.registry = registry;
        console.log("OBS-Control Feature initialized");
        this.audioMixerParameters = new Map<number, Parameter<any>>();
        for (let i = 0; i < 40; i++) {
            const p = new NumberParameter(100, 0, 100, 1, v4(), (e) => console.log("audioMixer:", e.value));
            this.audioMixerParameters.set(i, p);
        }
    }
    
    public giveParametersForZone(zoneConfig: ZoneConfig): Map<number, Parameter<any>> {
        if (zoneConfig.id == ZoneId.AUDIO_MIXER) {
            return this.audioMixerParameters;
        }
        return new Map<number, Parameter<any>>();
    }
    
    public removeZone(zoneConfig: ZoneConfig, parameters: Map<number, Parameter<any>>): void {
        // throw new Error("Method not implemented.");
    }


    public exit() {
        console.log("OBS-Control Feature exited");
    }
}