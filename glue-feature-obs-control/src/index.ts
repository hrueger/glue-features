import { Feature, ZoneConfig, SingleListSelector } from "@makeproaudio/glue-feature-tools";
import { Registry } from "@makeproaudio/makehaus-nodered-lib/dist/registry/registry";
import { Parameter, setSynapsesManager, ContinuousParameter, SwitchParameter } from "@makeproaudio/parameters-js";
import { v4 } from "uuid";
import { EventEmitter } from "events";
import * as OBSControl from "obs-websocket-js";
import { FeatureStatus } from "@makeproaudio/glue-feature-tools/dist/_models/FeatureStatus";
import { BehaviorSubject } from "rxjs";
import { HWWidgetType } from "@makeproaudio/makehaus-nodered-lib";

enum ZoneId {
    SCENES = "SCENES",
    AUDIO_VOLUME = "AUDIO_VOLUME",
    AUDIO_MUTED = "AUDIO_MUTED",
}

const WAITING_TIME = 5000;

export default class OBSControlFeature extends EventEmitter implements Feature {
    public zones: BehaviorSubject<ZoneConfig[]> = new BehaviorSubject<ZoneConfig[]>([
        {
            color: "#03b5fc",
            id: ZoneId.SCENES,
            name: "Scenes",
            description: "This zone is used switching scenes",
            widgetTypes: [HWWidgetType.LEDBUTTON],
        },
        {
            color: "#fcd303",
            id: ZoneId.AUDIO_VOLUME,
            name: "Volume Mixer",
            description: "This zone is used for the volume of all audio devices",
            widgetTypes: [HWWidgetType.ENCODER, HWWidgetType.MOTORFADER],
        },
        {
            color: "#fc9803",
            id: ZoneId.AUDIO_MUTED,
            name: "Muted",
            description: "This zone is used for the muted state of all audio devices",
            widgetTypes: [HWWidgetType.LEDBUTTON],
        },
    ]);
    public status: BehaviorSubject<FeatureStatus> = new BehaviorSubject<FeatureStatus>(
        FeatureStatus.INITIALIZING,
    );
    private registry: Registry;
    private audioVolumeParameters: Map<number, ContinuousParameter>;
    private audioMutedParameters: Map<number, SwitchParameter>;
    private sceneSelector: SingleListSelector;
    private scenes: OBSControl.Scene[];

    private studioMode = false;

    private ignoreVolumeChanges: number = 0;
    private ignoreMutedChanges: number = 0;
    resolveParamPromise: () => void;
    private allParametersLoaded = false;
    private obs: OBSControl;

    public constructor(settings: any, registry: Registry, synapsesManager: any) {
        super();
        setSynapsesManager(synapsesManager);
        this.registry = registry;

        this.obs = new OBSControl();
        this.obs.on("StudioModeSwitched", (s) => {
            this.studioMode = s["new-state"];
        });
        this.obs.on("SwitchScenes", (e) => {
            if (!this.studioMode) {
                this.selectSceneByName(e["scene-name"]);
            }
        });
        this.obs.on("PreviewSceneChanged", (e) => {
            if (this.studioMode) {
                this.selectSceneByName(e["scene-name"]);
            }
        });
        this.obs.on("ScenesChanged", () => {
            this.obs.send("GetSceneList").then((t) => {
                this.setScenes(t);
            }, (e) => this.handleError(e));
        });
        this.obs.on("SourceVolumeChanged", (e) => {
            if (this.ignoreVolumeChanges > 0) {
                this.ignoreVolumeChanges--;
            } else {
                for (const [i, p] of this.audioVolumeParameters) {
                    if (p.getMetadata("name") == e.sourceName) {
                        p.value = e.volume;
                    }
                }
            }
        });
        this.obs.on("SourceMuteStateChanged", (e) => {
            if (this.ignoreMutedChanges > 0) {
                this.ignoreMutedChanges--;
            } else {
                for (const [i, p] of this.audioMutedParameters) {
                    if (p.getMetadata("name") == e.sourceName) {
                        p.value = e.muted;
                    }
                }
            }
        });
    
        this.status.next(FeatureStatus.WAITING);
    }

    public init() {
        try {
            this.obs.connect({ address: "127.0.0.1:4444", password: "secret" }).then(() => {
                return this.obs.send("GetStudioModeStatus")
            }).then((s) => {
                this.studioMode = s["studio-mode"];
                return this.obs.send("GetSceneList")
            }).then((t) => {
                this.setScenes(t);
                return this.obs.send("GetSourcesList")
            }).then(async (t) => {
                const sources = t.sources as unknown as { name: string, type: string, typeId: string }[];
                for (let i = 0; i < sources.length; i++) {
                    const data = await this.obs.send("GetVolume", { source: sources[i].name });
                    const p = new ContinuousParameter(data.volume, 0, 1, 0.00001, v4(), (e) => {
                        this.ignoreVolumeChanges++;
                        this.obs.send("SetVolume", { source: sources[i].name, volume: e.value }).catch((e) => this.handleError(e));
                    });
                    p.color = "#fcd303";
                    p.label = "OBS Control";
                    p.setMetadata("context", "Volume");
                    p.setMetadata("name", data.name);
                    this.audioVolumeParameters.set(i, p);

                    const q = new SwitchParameter(data.muted, v4(), (e) => {
                        q.color = e.value ? "#ff0000" : "#00ff00";
                        this.ignoreMutedChanges++;
                        this.obs.send("SetMute", { source: sources[i].name, mute: e.value }).catch((e) => this.handleError(e));
                    });
                    p.label = "OBS Control";
                    p.setMetadata("context", "Muted State");
                    q.color = data.muted ? "#ff0000" : "#00ff00";
                    q.setMetadata("name", data.name);
                    this.audioMutedParameters.set(i, q);
                }
                this.allParametersLoaded = true;
                this.resolveParamPromise?.();
                this.status.next(FeatureStatus.OK);
            }, (e) => {
                this.handleError(e);
            });

            this.sceneSelector = new SingleListSelector("Scenes", []);
            this.sceneSelector.on("selected", (i) => {
                if (this.studioMode) {
                    this.obs.send("SetPreviewScene", { "scene-name": i.id }).catch((e) => this.handleError(e));
                } else {
                    this.obs.send("SetCurrentScene", { "scene-name": i.id }).catch((e) => this.handleError(e));
                }
            });

            this.audioVolumeParameters = new Map<number, Parameter<any>>();
            this.audioMutedParameters = new Map<number, Parameter<any>>();
        } catch (e) {
            this.handleError(e);
        }
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

    private setScenes(t: { messageId: string; status: "ok"; "current-scene": string; scenes: OBSControl.Scene[]; }) {
        this.sceneSelector.updateItems(t.scenes.map((s) => ({ id: s.name, hue: 30, name: s.name })));
        this.scenes = t.scenes;
        this.selectSceneByName(t["current-scene"]);
    }

    public selectSceneByName(name: string) {
        this.sceneSelector.selectItem(this.scenes.findIndex((s) => s.name == name));
    }

    public giveParametersForZone(zoneConfig: ZoneConfig): Map<number, Parameter<any>> | Promise<Map<number, Parameter<any>>> {
        if (!this.allParametersLoaded) {
            return new Promise((resolve) => {
                this.resolveParamPromise = () => resolve(this.giveParametersForZone(zoneConfig));
            });
        }
        if (zoneConfig.id == ZoneId.AUDIO_VOLUME) {
            return this.audioVolumeParameters;
        } else if (zoneConfig.id == ZoneId.AUDIO_MUTED) {
            return this.audioMutedParameters;
        } else if (zoneConfig.id == ZoneId.SCENES) {
            return this.sceneSelector.parameters;
        }
        return new Map<number, Parameter<any>>();
    }


    public exit() {
        console.log("OBS-Control Feature exited");
    }
}