import { Registry } from "@makeproaudio/makehaus-nodered-lib/dist/registry/registry";
import { Parameter, setSynapsesManager, NumberParameter } from "@makeproaudio/parameters-js";
import { v4 } from "uuid";
import { CustomSelectionMode, CustomSelector, Feature, HWWidgetType, SelectionMode, SingleListSelector, ZoneConfig } from "@makeproaudio/glue-feature-tools";
import { EventEmitter } from "events";
import { FeatureEvents } from "@makeproaudio/glue-feature-tools/dist/_models/Feature";

export default class MusicPlayerFeature extends EventEmitter implements Feature {
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
    private registry: Registry;
    private equalizerMapper; 
    controlsSelector: CustomSelector;
    equalizerParameters: Map<number, Parameter<any>>;
    private categoriesSelector: SingleListSelector;
    private currentCategory: string = "sounds";

    private allParameters: Map<string, Map<number, Map<number, Parameter<any>>>> = new Map();


    public constructor(settings: any, registry: Registry, synapsesManager: any) {
        super();
        setSynapsesManager(synapsesManager);
        this.registry = registry;
        console.log("Music Player Feature initialized");
        const categories = [
            { id: "sounds", hue: 200, },
            { id: "fx", hue: 250, },
            { id: "drumset", hue: 300, },
        ];
        this.categoriesSelector = new SingleListSelector(categories);
        this.categoriesSelector.on("selected", (c) => {
            this.currentCategory = c.id;
            this.emit(FeatureEvents.UPDATE_NAVIGATOR_MAPPING);
        });

        for (const category of categories) {
            const categoryParams = new Map<number, Map<number, Parameter<any>>>();
            for (let i = 1; i <= 5; i++) {
                const paramMap = new Map<number, Parameter<any>>();
                for (let j = 0; j < 4; j++) {
                    const p = new NumberParameter(0, 0, 100, 1, v4(), (e) => {
                        console.log(category.id, "mapping", i, "parameter", j, "updated to", e.value);
                    });
                    paramMap.set(j, p);
                }
                categoryParams.set(i, paramMap);
            }
            this.allParameters.set(category.id, categoryParams);
        }

        this.controlsSelector = new CustomSelector([
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
        ]);
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

    public giveParametersForNavigatorSelection?(selection: 1 | 2 | 3): Map<number, Parameter<any>> | false {
        return this.categoriesSelector.parameters;
    }
    
    public giveParametersForNavigatorMapping?(mapping: 1 | 2 | 3 | 4 | 5): Map<number, Parameter<any>> | false {
        return this.allParameters.get(this.currentCategory).get(mapping);
    }

    giveParametersForZone(zoneConfig: ZoneConfig): Map<number, Parameter<any>> {
        if (zoneConfig.id == "equalizer") {
            return this.equalizerParameters;
        } else if (zoneConfig.id == "controls") {
            return this.controlsSelector.parameters;
        }
    }

    public exit() {
        console.log("Music Player Feature exited");
    }
}