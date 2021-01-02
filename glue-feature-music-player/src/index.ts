import { Registry } from "@makeproaudio/makehaus-nodered-lib/dist/registry/registry";
import { Stack } from "@makeproaudio/makehaus-nodered-lib/dist/stack/stack";
import { Parameter, setSynapsesManager } from "@makeproaudio/parameters-js";
import { v4 } from "uuid";
import { CustomSelectionMode, Feature, HWWidgetType, SelectionMode, ZoneConfig } from "@makeproaudio/glue-feature-tools";
import { NavigatorSelectionItem } from "@makeproaudio/glue-feature-tools";

export default class MusicPlayerFeature implements Feature {
    public readonly zones: ZoneConfig[] = [
        {
            color: "#ff0000",
            id: "controls",
            name: "Controls",
            description: "This zone is used for control buttons like play / pause, skip, ...",
            widgetTypes: [HWWidgetType.LEDBUTTON],
            selectionConfig: {
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
            }
        },
        {
            color: "#00ff33",
            id: "equalizer",
            name: "Equalizer",
            description: "This zone is used for equalizer encoders / faders like basses, mids, highs, ...",
            widgetTypes: [HWWidgetType.ENCODER, HWWidgetType.MOTORFADER],
            min: 0,
            max: 100,
            default: 50,
            step: 1,
        }
    ];
    public navigatorSelectionItems?: NavigatorSelectionItem[] = [];
    private registry: Registry;
    private equalizerMapper; 

    public constructor(settings: any, registry: Registry, synapsesManager: any) {
        setSynapsesManager(synapsesManager);
        this.registry = registry;
        registry.registerInterest("", (status, result) => {
            console.log(status, result && result[0] ? result[0].objectReference.selection.widgets.length : "");
        }, "selection", {
            parent: "b997746b-f8d0-44a9-bbfe-8198432ca984",
            zoneId: "controls",
        });
        registry.registerInterest("", (status, result) => {
            console.log(status, result && result[0] ? result[0].objectReference.mapping.widgets.length : "");
            if (status == "NEW_MATCH") {
                this.equalizerMapper = result[0].objectReference.mapping;

                for (const p of this.equalizerMapper.parameters) {
                    const prmtr = new Parameter(v4());
                    prmtr.bindFrom(p, (e) => console.log(e.value));
                }
            }
        }, "mapping", {
            parent: "b997746b-f8d0-44a9-bbfe-8198432ca984",
            zoneId: "equalizer",
        });
        console.log("Music Player Feature initialized");
    }

    takeStacksForZone(zoneConfig: ZoneConfig, stacks: Map<number, Stack>): void {
        if (zoneConfig.id == "equalizer") {
            for (const [index, stack] of stacks) {
                const p = new Parameter(v4());
                
                stack.color ="#ffff00";
                stack.bind(p, (evt) => {
                    if (evt.value < 33) {
                        stack.color = "#00ff00";
                        p.setMetadata("color", "#ffffff");
                    } else if (evt.value < 66) {
                        stack.color = "#ffff00";
                    } else {
                        stack.color = "#ff0000";
                    }
                    return;
                });
            }
        }
    }
    removeZone(zoneConfig: ZoneConfig, stacks: Map<number, Stack>): void {
        throw new Error("Method not implemented.");
    }

    public exit() {
        console.log("Music Player Feature exited");
    }
}