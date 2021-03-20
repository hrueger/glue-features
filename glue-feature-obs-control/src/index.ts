import { Feature, ZoneConfig, HWWidgetType, SingleListSelector } from "@makeproaudio/glue-feature-tools";
import { Registry } from "@makeproaudio/makehaus-nodered-lib/dist/registry/registry";
import { Parameter, setSynapsesManager, ContinuousParameter, SwitchParameter } from "@makeproaudio/parameters-js";
import { v4 } from "uuid";
import { EventEmitter } from "events";
import * as OBSControl from "obs-websocket-js";

enum ZoneId {
    SCENES = "SCENES",
    AUDIO_VOLUME = "AUDIO_VOLUME",
    AUDIO_MUTED = "AUDIO_MUTED",
}

export default class OBSControlFeature extends EventEmitter implements Feature {
    public readonly zones: ZoneConfig[] = [
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
    ];
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

    public constructor(settings: any, registry: Registry, synapsesManager: any) {
        super();
        setSynapsesManager(synapsesManager);
        this.registry = registry;
        console.log("OBS-Control Feature initialized");

        const obs = new OBSControl();
        obs.connect({ address: "127.0.0.1:4444", password: "12345678" }).then(() => {
            return obs.send("GetStudioModeStatus")
        }).then((s) => {
            this.studioMode = s["studio-mode"];
            obs.on("StudioModeSwitched", (s) => {
                this.studioMode = s["new-state"];
            })
            return obs.send("GetSceneList")
        }).then((t) => {
            this.setScenes(t);
            
            obs.on("SwitchScenes", (e) => {
                if (!this.studioMode) {
                    this.selectSceneByName(e["scene-name"]);
                }
            });
            obs.on("PreviewSceneChanged", (e) => {
                if (this.studioMode) {
                    this.selectSceneByName(e["scene-name"]);
                }
            });
            obs.on("ScenesChanged", () => {
                obs.send("GetSceneList").then((t) => {
                    this.setScenes(t);
                });
            });
            return obs.send("GetSourcesList")
        }).then(async (t) => {
            const sources = t.sources as unknown as { name: string, type: string, typeId: string }[];
            for (let i = 0; i < sources.length; i++) {
                const data = await obs.send("GetVolume", { source: sources[i].name });
                const p = new ContinuousParameter(data.volume, 0, 1, 0.00001, v4(), (e) => {
                    this.ignoreVolumeChanges++;
                    obs.send("SetVolume", { source: sources[i].name, volume: e.value });
                });
                p.color = "#fcd303";
                p.label = "OBS Control";
                p.setMetadata("context", "Volume");
                p.setMetadata("name", data.name);
                this.audioVolumeParameters.set(i, p);
                
                const q = new SwitchParameter(data.muted, v4(), (e) => {
                    q.color = e.value ? "#ff0000" : "#00ff00";
                    this.ignoreMutedChanges++;
                    obs.send("SetMute", { source: sources[i].name, mute: e.value });
                });
                p.label = "OBS Control";
                p.setMetadata("context", "Muted State");
                q.color = data.muted ? "#ff0000" : "#00ff00";
                q.setMetadata("name", data.name);
                this.audioMutedParameters.set(i, q);
            }
            
            obs.on("SourceVolumeChanged", (e) => {
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
            obs.on("SourceMuteStateChanged", (e) => {
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
            this.allParametersLoaded = true;
            this.resolveParamPromise?.();
        }, (e) => console.error(e));

        this.sceneSelector = new SingleListSelector("Scenes", []);
        this.sceneSelector.on("selected", (i) => {
            if (this.studioMode) {
                obs.send("SetPreviewScene", { "scene-name": i.id });
            } else {
                obs.send("SetCurrentScene", { "scene-name": i.id });
            }
        });

        this.audioVolumeParameters = new Map<number, Parameter<any>>();
        this.audioMutedParameters = new Map<number, Parameter<any>>();
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