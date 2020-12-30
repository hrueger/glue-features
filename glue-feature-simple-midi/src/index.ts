import { ButtonMode, Stack } from "@makeproaudio/makehaus-nodered-lib";
import { Registry } from "@makeproaudio/makehaus-nodered-lib/dist/registry/registry";
import { Parameter, setSynapsesManager } from "@makeproaudio/parameters-js";
import { v4 } from "uuid";
import * as midi from "easymidi";
import { Feature, ZoneConfig, HWWidgetType } from "@makeproaudio/glue-feature-tools";

enum Zone {
    TEST = "TEST"
}

export default class DmxFeature implements Feature {
    public readonly zones: ZoneConfig[] = [
        {
            color: "#f5425a",
            id: Zone.TEST,
            name: "Midi Test",
            description: "This zone is used for Midi Test Buttons",
            widgetTypes: [HWWidgetType.LEDBUTTON],
        },
    ];
    private registry: Registry;
    midi: midi.Output;

    public constructor(settings: any, registry: Registry, synapsesManager: any) {
        setSynapsesManager(synapsesManager);
        this.registry = registry;
        const outputs = midi.getOutputs();
        this.midi = new midi.Output(outputs[0]);
        
    }
    
    public takeStacksForZone(zoneConfig: ZoneConfig, stacks: Map<number, Stack>): void {
        const naturals = {
            0: 48,
            1: 50,
            2: 52,
            3: 53,
            4: 55,
            5: 57,
            6: 59,
            7: 60,
            8: 60,
            9: 62,
            10: 64,
            11: 65,
            12: 67,
            13: 69,
            14: 71,
            15: 72,
        };
        const fullOctave = {
            8: 48,
            0: 49,
            9: 50,
            1: 51,
            10: 52,
            11: 53,
            3: 54,
            12: 55,
            4: 56,
            13: 57,
            5: 58,
            14: 59,
            15: 60,
        };
        const notes = naturals;
        for (const [idx, stack] of stacks) {
            if (notes[idx]) {
                const p = new Parameter(v4());
                stack.bind(p, (evt) => {
                    if (evt.value == true) {
                        stack.color = "#ffffff";
                        this.midi.send("noteon", {
                            channel: 1,
                            note: notes[idx],
                            velocity: 100,
                        });
                    } else {
                        stack.color = "#f5425a";
                        this.midi.send("noteoff", {
                            channel: 1,
                            note: notes[idx],
                            velocity: 100,
                        });
                    }
                });
                stack.buttonMode = ButtonMode.MOMENTARY;
            } else {
                stack.color = "#000000";
            }
        }
    }
    
    public removeZone(zoneConfig: ZoneConfig, parameters: Map<number, Stack>): void {
        // throw new Error("Method not implemented.");
    }


    public exit() {
    }
}