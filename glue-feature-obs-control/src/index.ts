import { Feature, ZoneConfig, HWWidgetType } from "@makeproaudio/glue-feature-tools";
import { Registry } from "@makeproaudio/makehaus-nodered-lib/dist/registry/registry";
import { Stack } from "@makeproaudio/makehaus-nodered-lib/dist/stack/stack";
import { setSynapsesManager } from "@makeproaudio/parameters-js";

export default class OBSControlFeature implements Feature {
    public readonly zones: ZoneConfig[] = [
        {
            color: "#03b5fc",
            id: "scenes",
            name: "Scenes",
            description: "This zone is used switching scenes",
            widgetTypes: [HWWidgetType.LEDBUTTON],
        },
        {
            color: "#fcd303",
            id: "audio",
            name: "Audio Mixer",
            description: "This zone is used for the volume of all audio devices",
            widgetTypes: [HWWidgetType.ENCODER, HWWidgetType.MOTORFADER],
            min: 0,
            max: 100,
            default: 0,
            step: 1,
        },
    ];
    private registry: Registry;

    public constructor(settings: any, registry: Registry, synapsesManager: any) {
        setSynapsesManager(synapsesManager);
        this.registry = registry;
        console.log("OBS-Control Feature initialized");
    }
    
    public takeStacksForZone(zoneConfig: ZoneConfig, stacks: Map<number, Stack>): void {
        /* if (zoneConfig.id == "scenes") {
            console.log("takeStacksForZone() called")
            for (const [idx, stack] of stacks) {
                const p = new Parameter(v4());
                stack.color = "#00ff00";
                stack.bind(p, (v) => {
                    if (v.value == true) {
                        stack.color = "#ff00ff";
                    } else {
                        stack.color = "#00ff00";
                    }
                });
            }
        } */
    }
    
    public removeZone(zoneConfig: ZoneConfig, stacks: Map<number, Stack>): void {
        // throw new Error("Method not implemented.");
    }


    public exit() {
        console.log("OBS-Control Feature exited");
    }
}