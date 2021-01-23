import { Registry } from "@makeproaudio/makehaus-nodered-lib/dist/registry/registry";
import { Parameter, setSynapsesManager, NumberParameter } from "@makeproaudio/parameters-js";
import { v4 } from "uuid";
import { CustomSelectionMode, CustomSelector, Feature, HWWidgetType, SelectionMode, ZoneConfig, NavigatorSelectionItem } from "@makeproaudio/glue-feature-tools";

export default class MusicPlayerFeature implements Feature {
    public readonly zones: ZoneConfig[] = [
        {
            color: "#ff0000",
            id: "controls",
            name: "Controls",
            description: "This zone is used for control buttons like play / pause, skip, ...",
            widgetTypes: [HWWidgetType.LEDBUTTON],
        },
        {
            color: "#00ff33",
            id: "equalizer",
            name: "Equalizer",
            description: "This zone is used for equalizer encoders / faders like basses, mids, highs, ...",
            widgetTypes: [HWWidgetType.ENCODER, HWWidgetType.MOTORFADER],
        }
    ];
    public navigatorSelectionItems?: NavigatorSelectionItem[] = [];
    private registry: Registry;
    private equalizerMapper; 
    controlsSelector: CustomSelector;
    equalizerParameters: Map<number, Parameter<any>>;

    public constructor(settings: any, registry: Registry, synapsesManager: any) {
        setSynapsesManager(synapsesManager);
        this.registry = registry;
        console.log("Music Player Feature initialized");
        this.controlsSelector = new CustomSelector({
            mode: SelectionMode.CUSTOM,
            items: [
                {
                    colorInactive: "#333333",
                    colorActive: "#ffffff",
                    id: "back",
                    mode: CustomSelectionMode.MOMENTARY,
                },
                {
                    colorInactive: "#ff0000",
                    colorActive: "#00ff00",
                    id: "playpause",
                    mode: CustomSelectionMode.LATCHING,
                    selected: false,
                },
                {
                    colorInactive: "#333333",
                    colorActive: "#ffffff",
                    id: "forward",
                    mode: CustomSelectionMode.MOMENTARY,
                },
            ],
        });
        this.equalizerParameters = new Map<number, Parameter<any>>();
        for (let i = 0; i < 40; i++) {
            const p = new NumberParameter(50, 0, 100, 1, v4(), (evt) => {
                if (evt.value < 33) {
                    p.color = "#00ff00";
                    p.setMetadata("color", "#ffffff");
                } else if (evt.value < 66) {
                    p.color = "#ffff00";
                } else {
                    p.color = "#ff0000";
                }
            });
            this.equalizerParameters.set(i, p);
        }
    }

    giveParametersForZone(zoneConfig: ZoneConfig): Map<number, Parameter<any>> {
        const parameters = new Map<number, Parameter<any>>();
        if (zoneConfig.id == "equalizer") {
            return this.equalizerParameters;
        } else if (zoneConfig.id == "controls") {
            return this.controlsSelector.parameters;
        }
    }
        
    removeZone(zoneConfig: ZoneConfig, parameters: Map<number, Parameter<any>>): void {
        throw new Error("Method not implemented.");
    }

    public exit() {
        console.log("Music Player Feature exited");
    }
}