import { Feature, ZoneConfig } from "@makeproaudio/glue-feature-tools";
import { Registry } from "@makeproaudio/makehaus-nodered-lib/dist/registry/registry";
import { ContinuousParameter, Parameter, setSynapsesManager, SwitchParameter } from "@makeproaudio/parameters-js";
import * as DMX from "dmx";
import { v4 } from "uuid";
import { EventEmitter } from "events";
import { FeatureStatus } from "@makeproaudio/glue-feature-tools/dist/_models/FeatureStatus";
import { BehaviorSubject } from "rxjs";
import { HWWidgetType } from "@makeproaudio/makehaus-nodered-lib";

enum Zone {
    BLACKOUT = "BLACKOUT",
    KEYS = "KEYS",
    VALUES = "VALUES",
}

export default class SimpleDmxFeature extends EventEmitter implements Feature {
    public zones: BehaviorSubject<ZoneConfig[]> = new BehaviorSubject<ZoneConfig[]>([
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
        },
        {
            color: "#00ffff",
            id: Zone.KEYS,
            name: "Keys",
            description: "This zone is used for the DMX addresses to control",
            widgetTypes: [HWWidgetType.ENCODER],
        },
    ]);
    public status: BehaviorSubject<FeatureStatus> = new BehaviorSubject<FeatureStatus>(
        FeatureStatus.INITIALIZING,
    );
    private registry: Registry;
    private currentChannels: Map <number, number> = new Map<number, number>();
    dmx: any;
    universe: string;
    private blackoutParameters: Map<number, Parameter<any>> = new Map<number, Parameter<any>>();
    private keyParameters: Map<number, Parameter<any>> = new Map<number, Parameter<any>>();
    private valueParameters: Map<number, Parameter<any>> = new Map<number, Parameter<any>>();

    public constructor(settings: any, registry: Registry, synapsesManager: any) {
        super();
        // super();
        setSynapsesManager(synapsesManager);
        this.registry = registry;
        console.log("DMX Feature initialized");
        console.log("got", settings);
        this.dmx = new DMX();
        this.universe = v4();
        this.dmx.addUniverse(this.universe, "enttec-usb-dmx-pro", "COM5");

        for (let i = 0; i < 40; i++) {
            const p = new SwitchParameter(false, v4(), (v) => {
                if (v.value == true) {
                    p.color = "#ffffff";
                } else {
                    p.color = "#000000";
                }
            });
            p.color = "#000000";
            this.blackoutParameters.set(i, p);
        }
        const presets = {
            0: 51,
            1: 52,
            2: 53,
            4: 56,
            5: 57,
            6: 58,
        };
        for (let i = 0; i < 40; i++) {
            const p = new ContinuousParameter(presets[i] || 0, 1, 512, 1, v4(), (v) => {
                this.currentChannels.set(i, v.value);
            });
            p.color = "#0000ff";
            p.label = "Simple DMX";
            p.setMetadata("context", "Keys");
            this.keyParameters.set(i, p);
        }
        for (let i = 0; i < 40; i++) {
            const p = new ContinuousParameter(0, 0, 255, 1, v4(), (v) => {
                const channel = this.currentChannels.get(i);
                if (channel !== undefined) {
                    this.dmx.update(this.universe, {
                        [channel]: v.value,
                    });
                }
            });
            p.color = "#00ffff";
            p.label = "Simple DMX";
            p.setMetadata("context", "Values");
            this.valueParameters.set(i, p);
        }
        
        this.status.next(FeatureStatus.OK);
    }
    
    public giveParametersForZone(zoneConfig: ZoneConfig): Map<number, Parameter<any>> {
        const parameters = new Map<number, Parameter<any>>();
        if (zoneConfig.id == Zone.BLACKOUT) {
            return this.blackoutParameters;
        } else if (zoneConfig.id == Zone.KEYS) {
            return this.keyParameters;
        } else if (zoneConfig.id == Zone.VALUES) {
            return this.valueParameters;
        }
        return parameters;
    }


    public exit() {
        console.log("DMX Feature exited");
    }
}