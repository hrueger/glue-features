import { ContinuousParameter, Parameter, setSynapsesManager } from "@makeproaudio/parameters-js";
import { v4 } from "uuid";
import { Feature, ZoneConfig } from "@makeproaudio/glue-feature-tools";
import { EventEmitter } from "events";
import { FeatureStatus } from "@makeproaudio/glue-feature-tools/dist/_models/FeatureStatus";
import { BehaviorSubject } from "rxjs";
import { HWWidgetType } from "@makeproaudio/makehaus-nodered-lib";

export default class OLEDTestFeature extends EventEmitter implements Feature {
    public zones: BehaviorSubject<ZoneConfig[]> = new BehaviorSubject<ZoneConfig[]>([
        {
            color: "#34eba4",
            id: "slow",
            name: "Toggle Slow",
            description: "",
            widgetTypes: [HWWidgetType.LEDBUTTON],
        },
        {
            color: "#eb3471",
            id: "fast",
            name: "Toggle Fast",
            description: "",
            widgetTypes: [HWWidgetType.LEDBUTTON],
        },
    ]);
    public status: BehaviorSubject<FeatureStatus> = new BehaviorSubject<FeatureStatus>(
        FeatureStatus.INITIALIZING,
    );
    private registry: any;
    fastToggleParams: Map<number, Parameter<any>>;
    slowToggleParams: Map<number, Parameter<any>>;
    widgets: any;
    layout = 4;


    public constructor(settings: any, registry, synapsesManager: any) {
        super();
        setSynapsesManager(synapsesManager);
        this.registry = registry;
        this.fastToggleParams = new Map<number, Parameter<any>>();
        this.slowToggleParams = new Map<number, Parameter<any>>();
        for (let i = 0; i < 40; i++) {
            const p = new ContinuousParameter(50, 0, 100, 1, v4(), (evt) => {
                this.toggleLayoutFast();
                p.color = "#ffffff";
                setTimeout(() => {
                    p.color = "#eb3471";
                }, 1000)
            });
            this.fastToggleParams.set(i, p);
        }
        for (let i = 0; i < 40; i++) {
            const p = new ContinuousParameter(50, 0, 100, 1, v4(), (evt) => {
                this.toggleLayoutSlow();
                p.color = "#ffffff";
                setTimeout(() => {
                    p.color = "#34eba4";
                }, 1000)
            });
            this.slowToggleParams.set(i, p);
        }

        registry.registerInterest(null, (e, r) => {
            if (e == "NEW_MATCH") {
                for (const obj of r) {
                    const tile = obj.objectReference;
                    this.widgets = tile.widgets;
                }
            }
        }, "tile", {
            tileType: "4O",
        });
        
        this.status.next(FeatureStatus.OK);
    }

    giveParametersForZone(zoneConfig: ZoneConfig): Map<number, Parameter<any>> {
        if (zoneConfig.id == "slow") {
            return this.slowToggleParams;
        }
        return this.fastToggleParams;
    }

    private toggleLayoutFast() {
        if (!this.widgets) {
            return;
        }
        this.layout++;
        if (this.layout > 4) {
            this.layout = 1;
        }
        this.widgets[0].layout = this.layout;
        this.widgets[1].layout = this.layout;
        this.widgets[2].layout = this.layout;
        this.widgets[3].layout = this.layout;
    }

    private toggleLayoutSlow() {
        if (!this.widgets) {
            return;
        }
        this.layout++;
        if (this.layout > 4) {
            this.layout = 1;
        }
        setTimeout(() => (this.widgets[0].layout = this.layout), 0)
        setTimeout(() => (this.widgets[1].layout = this.layout), 1000)
        setTimeout(() => (this.widgets[2].layout = this.layout), 2000)
        setTimeout(() => (this.widgets[3].layout = this.layout), 3000)
    }
}