import { Feature, FeatureSetting, ZoneConfig, SelectionItem } from "@makeproaudio/glue-feature-tools";
import { Stack, StackModel } from "@makeproaudio/makehaus-nodered-lib";
import { Parameter, setSynapsesManager } from "@makeproaudio/parameters-js";
import { v4 } from "uuid";

export type NavigatorSelectionItem = {
    title: string;
    id: string;
    color: string;
    children?: NavigatorSelectionItem[];
}


export default class MyFeature implements Feature {
    public zones: ZoneConfig[] = [];
    public navigatorSelectionItems: NavigatorSelectionItem[] = [
        {
            color: "#ffffff",
            id: "item1",
            title: "Test Item 1",
            children: [
                {
                    id: "i1child1",
                    color: "#ff0000",
                    title: "Child 1 of item 1",
                },
                {
                    id: "i1child2",
                    color: "#ff0000",
                    title: "Child 2 of item 1",
                },
            ],
        },
        {
            color: "#ffffff",
            id: "item2",
            title: "Test Item 2",
        },
        {
            color: "#ffffff",
            id: "item3",
            title: "Test Item 3",
            children: [
                {
                    id: "i3child1",
                    color: "#2be0d7",
                    title: "Child 1 of item 3",
                },
                {
                    id: "i3child2",
                    color: "#2be0d7",
                    title: "Child 2 of item 3",
                },
                {
                    id: "i3child3",
                    color: "#2be0d7",
                    title: "Child 3 of item 3",
                },
                {
                    id: "i3child4",
                    color: "#2be0d7",
                    title: "Child 4 of item 3",
                    children: [
                        {
                            id: "i3child4child1",
                            color: "#b9e02b",
                            title: "Child 1 of child 4 of item 3",
                        },
                        {
                            id: "i3child4child2",
                            color: "#b9e02b",
                            title: "Child 2 of child 4 of item 3",
                        },
                        {
                            id: "i3child4child3",
                            color: "#b9e02b",
                            title: "Child 3 of child 4 of item 3",
                        },
                        {
                            id: "i3child4child4",
                            color: "#b9e02b",
                            title: "Child 4 of child 4 of item 3",
                        },
                    ],
                },
            ],
        },
    ];
    private parameters: Parameter[] = [];

    public constructor(settings: FeatureSetting, registry: any, synapsesManager: any) {
        setSynapsesManager(synapsesManager);
        this.navigatorSelectionItems
    }

    public init?(): void {
        //
    }

    public exit?(): void {
        //
    }

    public takeStacksForZone(zoneConfig: ZoneConfig, stacks: Map<number, Stack>): void {
        //
    }

    public onNavigatorSelection(item) {
        console.log("This item was selected:", item.id);
    }

    public onNavigatorFeatureSelected(mappings: Map<number, Map<number, Stack>>) {
        console.log("---- adding parameters to mapping");
        for (const [mappingId, stacks] of mappings) {
            for (const [index, stack] of stacks) {
                const p = new Parameter(v4());
                stack.bind(p, (e) => console.log("received an update:", e.value));
                this.parameters.push(p);
            }
        }
    }
    public onNavigatorFeatureDeselected(mappings: Map<number, Map<number, Stack>>) {
        console.log("removing parameters from mapping");
        for (const p of this.parameters) {
            p.unbind();
        }
    }

    public removeZone(zoneConfig: ZoneConfig, stacks: Map<number, Stack>): void {
        //
    }

    public takeSelectorForZone?(zoneConfig: ZoneConfig, selector: any): void {
        //
    }

    public getSelectionItems?(zoneConfig: ZoneConfig): SelectionItem[] {
        return [];
    }

    public onSettingsChange?(settings: FeatureSetting): void {
        //
    }

}