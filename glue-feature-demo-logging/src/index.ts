import { Feature, FeatureSetting, ZoneConfig, SingleListSelector } from "@makeproaudio/glue-feature-tools";
import { FeatureEvents } from "@makeproaudio/glue-feature-tools/dist/_models/Feature";
import { Parameter, setSynapsesManager } from "@makeproaudio/parameters-js";
import { EventEmitter } from "events";

export type NavigatorSelectionItem = {
    title: string;
    id: string;
    color: string;
    children?: NavigatorSelectionItem[];
}


export default class DemoLoggingFeature extends EventEmitter implements Feature {
    public zones: ZoneConfig[] = [];
    private parameters: Parameter<any>[] = [];
    private synthSelector: SingleListSelector;
    private prodysseySectionSelector: SingleListSelector;
    private minimaxSectionSelector: SingleListSelector;
    private pro12SectionSelector: SingleListSelector;
    private selectedSynth: string;

    public constructor(settings: FeatureSetting, registry: any, synapsesManager: any) {
        super();
        setSynapsesManager(synapsesManager);
        this.synthSelector = new SingleListSelector([
            { id: "prodyssey", hue: 50, },
            { id: "minimax", hue: 100, },
            { id: "pro12", hue: 150, },
        ]);
        this.synthSelector.on("selected", (i) => {
            console.log("Synth", i.id, "was selected");
            this.selectedSynth = i.id;
            this.emit(FeatureEvents.UPDATE_NAVIGATOR_SELECTION, 2);
        })
        this.prodysseySectionSelector = new SingleListSelector([
            { id: "oscillators", hue: 1, },
            { id: "filters", hue: 1, },
            { id: "effects", hue: 1, },
        ]);
        this.minimaxSectionSelector = new SingleListSelector([
            { id: "oscillators", hue: 1, },
            { id: "filters", hue: 1, },
            { id: "effects", hue: 1, },
        ]);
        this.pro12SectionSelector = new SingleListSelector([
            { id: "oscillators", hue: 1, },
            { id: "filters", hue: 1, },
            { id: "effects", hue: 1, },
        ]);
        for (const s of [this.pro12SectionSelector, this.minimaxSectionSelector, this.pro12SectionSelector]) {
            s.on("selected", (i) => {
                console.log("Section", i.id, "was selected");
            });
        }
    }

    public init?(): void {
        //
    }

    public exit?(): void {
        //
    }

    public giveParametersForZone(zoneConfig: ZoneConfig): Map<number, Parameter<any>> {
        return new Map();
    }

    public giveParametersForNavigatorSelection?(selection: 1 | 2 | 3): Map<number, Parameter<any>> | false {
        switch (selection) {
            case 1:
                return this.synthSelector.parameters;
            case 2:
                switch (this.selectedSynth) {
                    case "prodyssey":
                        return this.prodysseySectionSelector.parameters;
                    case "pro12":
                        return this.pro12SectionSelector.parameters;
                    case "minimax":
                        return this.minimaxSectionSelector.parameters;
                    default:
                        return this.prodysseySectionSelector.parameters;
                }
        }
    }

    public giveParametersForNavigatorMapping?(mapping: 1 | 2 | 3 | 4 | 5): Map<number, Parameter<any>> | false {
        return false;
    }

    public onSettingsChange?(settings: FeatureSetting): void {
        //
    }

}