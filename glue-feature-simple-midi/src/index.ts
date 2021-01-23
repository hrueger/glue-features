import { Registry } from "@makeproaudio/makehaus-nodered-lib/dist/registry/registry";
import { BooleanParameter, Parameter, setSynapsesManager } from "@makeproaudio/parameters-js";
import { v4 } from "uuid";
import * as midi from "easymidi";
import { Feature, ZoneConfig, HWWidgetType } from "@makeproaudio/glue-feature-tools";

enum Zone {
    TEST = "TEST"
}

export default class MidiFeature implements Feature {
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
    private parameters = new Map<number, Parameter<any>>();

    public constructor(settings: any, registry: Registry, synapsesManager: any) {
        setSynapsesManager(synapsesManager);
        this.registry = registry;
        const outputs = midi.getOutputs();
        this.midi = new midi.Output(outputs[0]);

        this.parameters = new Map();
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
        for (const [idx, note] of Object.entries(notes)) {
            let index = parseInt(idx, 10);
            const p = new BooleanParameter(false, v4(), (evt) => {
                if (evt.value == true) {
                    p.color = "#ffffff";
                    this.midi.send("noteon", {
                        channel: 1,
                        note: note,
                        velocity: 100,
                    });
                } else {
                    p.color = "#f5425a";
                    this.midi.send("noteoff", {
                        channel: 1,
                        note: note,
                        velocity: 100,
                    });
                }
            });
            this.parameters.set(index, p);
            // parameter.buttonMode = ButtonMode.MOMENTARY;
        }
        
    }
    
    public giveParametersForZone(zoneConfig: ZoneConfig): Map<number, Parameter<any>> {
        return this.parameters;
    }
    
    public removeZone(zoneConfig: ZoneConfig, parameters: Map<number, Parameter<any>>): void {
        // throw new Error("Method not implemented.");
    }


    public exit() {
    }
}