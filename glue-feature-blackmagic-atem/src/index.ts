import { Feature, ZoneConfig, SingleListSelector } from "@makeproaudio/glue-feature-tools";
import { Registry } from "@makeproaudio/makehaus-nodered-lib";
import { ContinuousParameter, Parameter, setSynapsesManager, SwitchParameter } from "@makeproaudio/parameters-js";
import { EventEmitter } from "events";
import { FeatureStatus } from "@makeproaudio/glue-feature-tools/dist/_models/FeatureStatus";
import { BehaviorSubject } from "rxjs";
import { HWWidgetType } from "@makeproaudio/makehaus-nodered-lib";
import { Atem } from "atem-connection";
import { MediaSourceType } from "atem-connection/dist/enums";

enum ZoneId {
    PROGRAM = "PROGRAM",
    PREVIEW = "PREVIEW",
    MEDIAPOOL_STILLS = "MEDIAPOOL_STILLS",
    MEDIAPOOL_CLIPS = "MEDIAPOOL_CLIPS",
    MACROS = "MACROS",
    TBAR = "TBAR",
    BUS = "BUS"
}

const WAITING_TIME = 5000;

let INPUTS: { name: string, number: number }[] = [
    ...Array(20).fill(null).map((_, i) => ({ name: `Input ${i + 1}`, number: i + 1 })),
    { name: "ColorBars", number: 1000 },
    { name: "Color1", number: 2001 },
    { name: "Color2", number: 2002 },
    { name: "MediaPlayer1", number: 3010 },
    //
    { name: "MediaPlayer1Key", number: 3011 },
    { name: "MediaPlayer2", number: 3020 },
    { name: "MediaPlayer2Key", number: 3021 },
    { name: "MediaPlayer3", number: 3030 },
    { name: "MediaPlayer3Key", number: 3031 },
    { name: "MediaPlayer4", number: 3040 },
    { name: "MediaPlayer4Key", number: 3041 },
    { name: "Key1Mask", number: 4010 },
    { name: "Key2Mask", number: 4020 },
    { name: "Key3Mask", number: 4030 },
    { name: "Key4Mask", number: 4040 },
    { name: "Key5Mask", number: 4050 },
    { name: "Key6Mask", number: 4060 },
    { name: "Key7Mask", number: 4070 },
    { name: "Key8Mask", number: 4080 },
    { name: "Key9Mask", number: 4090 },
    { name: "Key10Mask", number: 4100 },
    { name: "Key11Mask", number: 4110 },
    { name: "Key12Mask", number: 4120 },
    { name: "Key13Mask", number: 4130 },
    { name: "Key14Mask", number: 4140 },
    { name: "Key15Mask", number: 4150 },
    { name: "Key16Mask", number: 4160 },
    { name: "DSK1Mask", number: 5010 },
    { name: "DSK2Mask", number: 5020 },
    { name: "DSK3Mask", number: 5030 },
    { name: "DSK4Mask", number: 5040 },
    { name: "SuperSource", number: 6000 },
    { name: "SuperSource2", number: 6001 },
    { name: "CleanFeed1", number: 7001 },
    { name: "CleanFeed2", number: 7002 },
    { name: "CleanFeed3", number: 7003 },
    { name: "CleanFeed4", number: 7004 },
    { name: "Auxilary1", number: 8001 },
    { name: "Auxilary2", number: 8002 },
    { name: "Auxilary3", number: 8003 },
    { name: "Auxilary4", number: 8004 },
    { name: "Auxilary5", number: 8005 },
    { name: "Auxilary6", number: 8006 },
    { name: "Auxilary7", number: 8007 },
    { name: "Auxilary8", number: 8008 },
    { name: "Auxilary9", number: 8009 },
    { name: "Auxilary10", number: 8010 },
    { name: "Auxilary11", number: 8011 },
    { name: "Auxilary12", number: 8012 },
    { name: "Auxilary13", number: 8013 },
    { name: "Auxilary14", number: 8014 },
    { name: "Auxilary15", number: 8015 },
    { name: "Auxilary16", number: 8016 },
    { name: "Auxilary17", number: 8017 },
    { name: "Auxilary18", number: 8018 },
    { name: "Auxilary19", number: 8019 },
    { name: "Auxilary20", number: 8020 },
    { name: "Auxilary21", number: 8021 },
    { name: "Auxilary22", number: 8022 },
    { name: "Auxilary23", number: 8023 },
    { name: "Auxilary24", number: 8024 },
    { name: "ME1Prog", number: 10010 },
    { name: "ME1Prev", number: 10011 },
    { name: "ME2Prog", number: 10020 },
    { name: "ME2Prev", number: 10021 },
    { name: "ME3Prog", number: 10030 },
    { name: "ME3Prev", number: 10031 },
    { name: "ME4Prog", number: 10040 },
    { name: "ME4Prev", number: 10041 },
    { name: "Input1Direct", number: 11001 },
];

export default class BlackmagicATEMFeature extends EventEmitter implements Feature {
    public zones: BehaviorSubject<ZoneConfig[]> = new BehaviorSubject<ZoneConfig[]>([
        {
            color: "#ff0000",
            id: ZoneId.PROGRAM,
            name: "Program",
            description: "",
            widgetTypes: [HWWidgetType.LEDBUTTON],
        },
        {
            color: "#00ff00",
            id: ZoneId.PREVIEW,
            name: "Preview",
            description: "",
            widgetTypes: [HWWidgetType.LEDBUTTON],
        },
        {
            color: "#0000ff",
            id: ZoneId.MEDIAPOOL_STILLS,
            name: "MediaPool Stills",
            description: "",
            widgetTypes: [HWWidgetType.LEDBUTTON],
        },
        {
            color: "#0000ff",
            id: ZoneId.MEDIAPOOL_CLIPS,
            name: "MediaPool Clips",
            description: "",
            widgetTypes: [HWWidgetType.LEDBUTTON],
        },
        {
            color: "#FFA200",
            id: ZoneId.MACROS,
            name: "Macros",
            description: "",
            widgetTypes: [HWWidgetType.LEDBUTTON],
        },
        {
            color: "#888888",
            id: ZoneId.TBAR,
            name: "T-Bar",
            description: "",
            widgetTypes: [HWWidgetType.MOTORFADER],
        },
        {
            color: "#FFFF00",
            id: ZoneId.BUS,
            name: "Bus Actions",
            description: "",
            widgetTypes: [HWWidgetType.LEDBUTTON],
        },
    ]);
    public status: BehaviorSubject<FeatureStatus> = new BehaviorSubject<FeatureStatus>(
        FeatureStatus.INITIALIZING,
    );
    private registry: Registry;
    // private audioVolumeParameters: Map<number, ContinuousParameter>;
    //private audioMutedParameters: Map<number, SwitchParameter>;
    private programInputSelector: SingleListSelector;
    private previewInputSelector: SingleListSelector;

    private mediaPoolStillsSelector: SingleListSelector;
    private mediaPoolClipsSelector: SingleListSelector;
    private macroParameters: SwitchParameter[] = [];

    private cutParameter: SwitchParameter;
    private autoParameter: SwitchParameter;
    private ftbParameter: SwitchParameter;
    private ftbBlinkInterval?: NodeJS.Timeout;

    private tBarParameter: ContinuousParameter;

    private studioMode = false;

    private ignoreVolumeChanges: number = 0;
    private ignoreMutedChanges: number = 0;
    resolveParamPromise: () => void;
    private allParametersLoaded = false;
    private atem = new Atem();

    public constructor(settings: any, registry: Registry, synapsesManager: any) {
        super();
        setSynapsesManager(synapsesManager);
        this.registry = registry;
    
        this.status.next(FeatureStatus.WAITING);
    }

    public init() {
        try {
            this.atem.connect("192.168.178.23");
            this.atem.on("connected", () => {

                INPUTS = INPUTS.filter((i) => this.atem.state.inputs[i.number.toString()]);

                this.previewInputSelector = new SingleListSelector("Preview Bus", INPUTS.map((i) => ({ name: i.name, id: `${i.number}`, hue: 120 })));
                this.updatePreviewInput();
                this.previewInputSelector.on("selected", (i) => this.atem.changePreviewInput(Number(i.id)));

                this.programInputSelector = new SingleListSelector("Program Bus", INPUTS.map((i) => ({ name: i.name, id: `${i.number}`, hue: 0 })));
                this.updateProgramInput();
                this.programInputSelector.on("selected", (i) => this.atem.changeProgramInput(Number(i.id)));

                
                this.mediaPoolStillsSelector = new SingleListSelector("MediaPool Stills", this.getMediaPoolSelectorItems("stills"));
                this.mediaPoolClipsSelector = new SingleListSelector("MediaPool Clips", this.getMediaPoolSelectorItems("clips"));
                this.updateMediaPool();
                this.mediaPoolStillsSelector.on("selected", (i) => this.atem.setMediaPlayerSource({sourceType: MediaSourceType.Still, stillIndex: Number(i.id) - 1}));
                this.mediaPoolClipsSelector.on("selected", (i) => this.atem.setMediaPlayerSource({ sourceType: MediaSourceType.Clip, clipIndex: Number(i.id) - 1 }));

                
                this.cutParameter = new SwitchParameter(false, "cut", (e) => {
                    if (e.value == true) {
                        this.atem.cut();
                        this.cutParameter.value = false;
                    }
                });

                this.cutParameter.color = "#ffffff";
                this.autoParameter = new SwitchParameter(false, "auto", (e) => {
                    if (e.value == true) {
                        this.atem.autoTransition();
                        this.autoParameter.color = "#ff0000";
                        this.autoParameter.value =  false;
                    }
                });

                this.autoParameter.color = "#ffffff";
                this.ftbParameter = new SwitchParameter(false, "ftb", (e) => {
                    if (e.value == true) {
                        this.atem.fadeToBlack();
                        this.ftbParameter.value = false;
                    }
                });
                this.updateFtbState();

                this.tBarParameter = new ContinuousParameter(0, 0, 10000, 1, "tbar", (e) => {
                    this.atem.setTransitionPosition(e.value);
                });

                this.allParametersLoaded = true;
                this.resolveParamPromise?.();
                this.status.next(FeatureStatus.OK);
            });
            this.atem.on("stateChanged", (state, paths) => {
                for (const path of paths) {
                    switch (path) {
                        case "video.mixEffects.0.previewInput":
                            this.updatePreviewInput();
                            break;
                        case "video.mixEffects.0.programInput":
                            this.updateProgramInput();
                            break;
                        case "video.mixEffects.0.transitionPosition":
                            if (state.video.mixEffects[0].transitionPosition.handlePosition === 0) {
                                this.autoParameter.color =  "#ffffff";
                            } else {
                                this.autoParameter.color = "#ff0000";
                            }
                            // this.tBarParameter.update(state.video.mixEffects[0].transitionPosition.handlePosition);
                            break;
                        case "media.players.0":
                            this.updateMediaPool();
                            break;
                        case "video.mixEffects.0.fadeToBlack":
                            this.updateFtbState();
                            break;
                    }
                    if (path.startsWith("media.stillPool")) {
                        this.mediaPoolStillsSelector.updateItems(this.getMediaPoolSelectorItems("stills"));
                    } else if (path.startsWith("media.clipPool")) {
                        this.mediaPoolStillsSelector.updateItems(this.getMediaPoolSelectorItems("clips"));
                    }
                }
            });
        } catch (e) {
            this.handleError(e);
        }
    }

    private updateFtbState() {
        if (this.atem.state.video.mixEffects[0].fadeToBlack.inTransition) {
            this.ftbParameter.color = "#ffff00";
            this.clearFtbBlinkInterval();
        } else if (this.atem.state.video.mixEffects[0].fadeToBlack.isFullyBlack) {
            if (!this.ftbBlinkInterval) {
                this.ftbBlinkInterval = setInterval(() => {
                    if (this.ftbParameter.color === "#ff0000") {
                        this.ftbParameter.color = "#111111";
                    } else {
                        this.ftbParameter.color = "#ff0000";
                    }
                }, 500);
            }
        } else {
            this.clearFtbBlinkInterval();
            this.ftbParameter.color = "#888888";
        }
    }

    private clearFtbBlinkInterval() {
        if (this.ftbBlinkInterval)
            clearInterval(this.ftbBlinkInterval);
        this.ftbBlinkInterval = undefined;
    }

    private updateMediaPool() {
        if (this.atem.state.media.players[0].sourceType == MediaSourceType.Clip) {
            this.mediaPoolStillsSelector.selectItem(this.atem.state.media.players[0].clipIndex);
        } else if (this.atem.state.media.players[0].sourceType == MediaSourceType.Still) {
            this.mediaPoolStillsSelector.selectItem(this.atem.state.media.players[0].stillIndex);
        }
    }

    private updateProgramInput() {
        this.programInputSelector.selectItem(INPUTS.findIndex((i) => i.number == this.atem.state.video.mixEffects[0].programInput));
    }

    private updatePreviewInput() {
        this.previewInputSelector.selectItem(INPUTS.findIndex((i) => i.number == this.atem.state.video.mixEffects[0].previewInput));
    }

    private getMediaPoolSelectorItems(type: "stills" | "clips") {
        return (this.atem.state.media[type == "stills" ? "stillPool" : "clipPool"] as any).filter((s) => s.isUsed)
            .map((s, i) => ({ name: type == "stills" ? s.fileName : s.name, id: `${i + 1}`, hue: 200 }));
    }

    private handleError(e: any) {
        if (e.status == "error" && (e.code == "CONNECTION_ERROR" || e.code == "NOT_CONNECTED")) {
            this.status.next(FeatureStatus.WAITING);
            setTimeout(() => {
                this.init();
            }, WAITING_TIME);
        } else {
            console.log(e);
            this.status.next(FeatureStatus.ERROR);
        }
    }

    public giveParametersForZone(zoneConfig: ZoneConfig): Map<number, Parameter<any>> | Promise<Map<number, Parameter<any>>> {
        if (!this.allParametersLoaded) {
            return new Promise((resolve) => {
                this.resolveParamPromise = () => resolve(this.giveParametersForZone(zoneConfig));
            });
        }
        switch (zoneConfig.id) {
            case ZoneId.MACROS:
                return this.paramArrayToMap(this.macroParameters);
            case ZoneId.MEDIAPOOL_CLIPS:
                return this.mediaPoolClipsSelector.parameters;
            case ZoneId.MEDIAPOOL_STILLS:
                return this.mediaPoolStillsSelector.parameters;
            case ZoneId.PREVIEW:
                return this.previewInputSelector.parameters;
            case ZoneId.PROGRAM:
                return this.programInputSelector.parameters;
            case ZoneId.TBAR:
                return this.paramArrayToMap([this.tBarParameter]);
            case ZoneId.BUS:
                return this.paramArrayToMap([this.cutParameter, this.autoParameter, null, this.ftbParameter]);
        }
        return new Map<number, Parameter<any>>();
    }

    private paramArrayToMap(parameters: Parameter<any>[]): Map<number, Parameter<any>> {
        return new Map(parameters.map((p, i) => [i, p]));
    }

    public async exit() {
        await this.atem?.disconnect();
        console.log("Blackmagic ATEM Feature exited");
    }
}