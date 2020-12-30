import { Feature, ZoneConfig, HWWidgetType } from "@makeproaudio/glue-feature-tools";
import { Stack } from "@makeproaudio/makehaus-nodered-lib";
import { Registry } from "@makeproaudio/makehaus-nodered-lib/dist/registry/registry";
import { Parameter, setSynapsesManager } from "@makeproaudio/parameters-js";
import * as DMX from "dmx";
import { v4 } from "uuid";

enum Zone {
    BLACKOUT = "BLACKOUT",
    KEYS = "KEYS",
    VALUES = "VALUES",
}

export default class SimpleDmxFeature implements Feature {
    public readonly zones: ZoneConfig[] = [
        {
            color: "#000000",
            id: Zone.BLACKOUT,
            name: "Blackout",
            description: "This zone is used for Blackout Buttons",
            widgetTypes: [HWWidgetType.LEDBUTTON],
        },
        {
            color: "#0000ff",
            id: Zone.VALUES,
            name: "Values",
            description: "This zone is used for the value of the DMX channels",
            widgetTypes: [HWWidgetType.MOTORFADER],
            min: 0,
            max: 255,
            default: 0,
            step: 1,
        },
        {
            color: "#00ffff",
            id: Zone.KEYS,
            name: "Keys",
            description: "This zone is used for the DMX addresses to control",
            widgetTypes: [HWWidgetType.ENCODER],
            min: 1,
            max: 512,
            default: 1,
            step: 1,
        },
    ];
    private registry: Registry;
    private currentChannels: Map <number, number> = new Map<number, number>();
    dmx: any;
    universe: string;

    public constructor(settings: any, registry: Registry, synapsesManager: any) {
        setSynapsesManager(synapsesManager);
        this.registry = registry;
        console.log("DMX Feature initialized");
        console.log("got", settings);
        this.dmx = new DMX();
        this.universe = v4();
        this.dmx.addUniverse(this.universe, "enttec-usb-dmx-pro", "COM5");
    }
    
    public takeStacksForZone(zoneConfig: ZoneConfig, stacks: Map<number, Stack>): void {
        if (zoneConfig.id == Zone.BLACKOUT) {
            for (const [idx, stack] of stacks) {
                const p = new Parameter(v4());
                stack.color = "#000000";
                stack.bind(p, (v) => {
                    if (v.value == true) {
                        stack.color = "#ffffff";
                    } else {
                        stack.color = "#000000";
                    }
                });
            }
        } else if (zoneConfig.id == Zone.KEYS) {
            const presets = {
                0: 51,
                1: 52,
                2: 53,
                4: 56,
                5: 57,
                6: 58,
            };
            for (const [idx, stack] of stacks) {
                const p = new Parameter(v4());
                stack.bind(p, (v) => {
                    this.currentChannels.set(idx, v.value);
                });
                if (presets[idx]) {
                    p.update(presets[idx]);
                }
            }
        } else if (zoneConfig.id == Zone.VALUES) {
            for (const [idx, stack] of stacks) {
                const p = new Parameter(v4());
                stack.bind(p, (v) => {
                    const channel = this.currentChannels.get(idx);
                    if (channel !== undefined) {
                        this.dmx.update(this.universe, {
                            [channel]: v.value,
                        });
                    }
                });
            }
        }
    }
    
    public removeZone(zoneConfig: ZoneConfig, parameters: Map<number, Stack>): void {
        // throw new Error("Method not implemented.");
    }


    public exit() {
        console.log("DMX Feature exited");
    }
}