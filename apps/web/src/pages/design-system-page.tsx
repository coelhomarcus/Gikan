import { AddOutline, ArrowNarrowRightOutline, SearchOutline, SettingsOutline } from "@makeplane/propel/icons";
import { Link } from "react-router";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { Input } from "@/components/base/input/input";
import { Select } from "@/components/base/select/select";
import { AppIcons } from "@/components/foundations/icons";

export default function DesignSystemPage() {
    return (
        <div className="h-dvh overflow-y-auto bg-canvas p-8 text-primary">
            <div className="mx-auto max-w-5xl space-y-8">
                <header className="flex items-start justify-between">
                    <div>
                        <p className="text-xs font-medium text-tertiary">GIKAN / INTERNAL</p>
                        <h1 className="mt-1 text-xl font-medium">Plane design system</h1>
                        <p className="mt-1 text-sm text-tertiary">Reference commit 01064a756221921a1ce3e7941ae4d439f298029a · dark</p>
                    </div>
                    <Link to="/" aria-label="Close catalog">
                        <ButtonUtility icon={AppIcons.Close} tooltip="Close catalog" />
                    </Link>
                </header>
                <section className="space-y-3">
                    <h2 className="text-sm font-medium">Actions</h2>
                    <div className="flex flex-wrap items-center gap-3">
                        {(["primary", "secondary", "tertiary"] as const).map((color) => (
                            <Button key={color} color={color} iconLeading={AddOutline}>
                                {color}
                            </Button>
                        ))}
                        <Button isLoading>Loading</Button>
                        <Button isDisabled>Disabled</Button>
                        <ButtonUtility icon={SettingsOutline} tooltip="Settings" />
                        <ButtonUtility icon={SearchOutline} tooltip="Search" />
                    </div>
                </section>
                <section className="space-y-3">
                    <h2 className="text-sm font-medium">Properties</h2>
                    <div className="grid max-w-xl gap-4 sm:grid-cols-2">
                        <Input label="Search issues" placeholder="Search" icon={SearchOutline} />
                        <Input label="Invalid field" placeholder="Enter a value" isInvalid />
                        <Select
                            label="Status"
                            selectedKey="in-progress"
                            items={[
                                { id: "backlog", label: "Backlog" },
                                { id: "in-progress", label: "In progress" },
                                { id: "done", label: "Done" },
                            ]}
                        >
                            {(item) => <Select.Item id={item.id}>{item.label}</Select.Item>}
                        </Select>
                        <Checkbox label="Include completed issues" defaultSelected />
                    </div>
                </section>
                <section className="space-y-3">
                    <h2 className="text-sm font-medium">Status and priority</h2>
                    <div className="flex flex-wrap gap-2">
                        {(["gray", "brand", "success", "warning", "error"] as const).map((color) => (
                            <Badge key={color} color={color} size="sm" type="pill-color">
                                {color}
                            </Badge>
                        ))}
                    </div>
                </section>
                <section className="space-y-3">
                    <h2 className="text-sm font-medium">Board and issue card</h2>
                    <div className="w-[350px] rounded-md bg-surface-2 p-2">
                        <header className="flex h-8 items-center justify-between px-1">
                            <span className="flex items-center gap-2 text-sm font-medium">
                                <span className="bg-blue-600 size-2 rounded-full" />
                                In progress
                            </span>
                            <span className="flex items-center gap-2 text-xs text-tertiary">
                                2 <ButtonUtility icon={ArrowNarrowRightOutline} tooltip="Column actions" size="xs" />
                            </span>
                        </header>
                        <article className="space-y-2 rounded-md border border-subtle bg-layer-2 p-3 shadow-raised-100">
                            <span className="text-xs text-tertiary">PLAT-12</span>
                            <h3 className="text-sm font-medium">Build the project workspace</h3>
                            <div className="flex gap-2">
                                <Badge size="sm" color="brand" type="pill-color">
                                    Design
                                </Badge>
                                <Badge size="sm" color="warning" type="pill-color">
                                    High
                                </Badge>
                            </div>
                        </article>
                    </div>
                </section>
                <section className="space-y-3">
                    <h2 className="text-sm font-medium">Layers</h2>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {["canvas", "surface-1", "surface-2", "layer-1", "layer-2", "layer-3", "accent-primary", "danger-primary"].map((layer) => (
                            <div key={layer} className="rounded-md border border-subtle bg-layer-2 p-3">
                                <p className="mb-3 text-xs text-tertiary">{layer}</p>
                                <div className={`h-12 rounded bg-${layer}`} />
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}
