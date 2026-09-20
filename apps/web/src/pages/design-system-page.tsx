import { AddOutline, ArrowNarrowRightOutline, SearchOutline, SettingsOutline } from "@makeplane/propel/icons";
import { Link } from "react-router";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { Input } from "@/components/base/input/input";
import { Select } from "@/components/base/select/select";
import { AppIcons } from "@/components/foundations/icons";
import { useTranslation } from "react-i18next";

export default function DesignSystemPage() {
    const { t } = useTranslation();
    const variantLabels = { primary: t("designSystem.primary"), secondary: t("designSystem.secondary"), tertiary: t("designSystem.tertiary") };
    return (
        <div className="h-dvh overflow-y-auto bg-canvas p-8 text-primary">
            <div className="mx-auto max-w-5xl space-y-8">
                <header className="flex items-start justify-between">
                    <div>
                        <p className="text-xs font-medium text-tertiary">{t("designSystem.internal")}</p>
                        <h1 className="mt-1 text-xl font-medium">{t("designSystem.title")}</h1>
                        <p className="mt-1 text-sm text-tertiary">{t("designSystem.reference", { commit: "01064a756221921a1ce3e7941ae4d439f298029a" })}</p>
                    </div>
                    <Link to="/" aria-label={t("designSystem.closeCatalog")}>
                        <ButtonUtility icon={AppIcons.Close} tooltip={t("designSystem.closeCatalog")} />
                    </Link>
                </header>
                <section className="space-y-3">
                    <h2 className="text-sm font-medium">{t("designSystem.actions")}</h2>
                    <div className="flex flex-wrap items-center gap-3">
                        {(["primary", "secondary", "tertiary"] as const).map((color) => (
                            <Button key={color} color={color} iconLeading={AddOutline}>
                                {variantLabels[color]}
                            </Button>
                        ))}
                        <Button isLoading>{t("designSystem.loading")}</Button>
                        <Button isDisabled>{t("designSystem.disabled")}</Button>
                        <ButtonUtility icon={SettingsOutline} tooltip={t("nav.settings")} />
                        <ButtonUtility icon={SearchOutline} tooltip={t("common.search")} />
                    </div>
                </section>
                <section className="space-y-3">
                    <h2 className="text-sm font-medium">{t("designSystem.properties")}</h2>
                    <div className="grid max-w-xl gap-4 sm:grid-cols-2">
                        <Input label={t("designSystem.searchIssues")} placeholder={t("common.search")} icon={SearchOutline} />
                        <Input label={t("designSystem.invalidField")} placeholder={t("designSystem.enterValue")} isInvalid />
                        <Select
                            label={t("designSystem.status")}
                            selectedKey="in-progress"
                            items={[
                                { id: "backlog", label: t("designSystem.backlog") },
                                { id: "in-progress", label: t("designSystem.inProgress") },
                                { id: "done", label: t("designSystem.done") },
                            ]}
                        >
                            {(item) => <Select.Item id={item.id}>{item.label}</Select.Item>}
                        </Select>
                        <Checkbox label={t("designSystem.includeCompleted")} defaultSelected />
                    </div>
                </section>
                <section className="space-y-3">
                    <h2 className="text-sm font-medium">{t("designSystem.statusPriority")}</h2>
                    <div className="flex flex-wrap gap-2">
                        {(["gray", "brand", "success", "warning", "error"] as const).map((color) => (
                            <Badge key={color} color={color} size="sm" type="pill-color">
                                {color}
                            </Badge>
                        ))}
                    </div>
                </section>
                <section className="space-y-3">
                    <h2 className="text-sm font-medium">{t("designSystem.boardCard")}</h2>
                    <div className="w-[350px] rounded-md bg-surface-2 p-2">
                        <header className="flex h-8 items-center justify-between px-1">
                            <span className="flex items-center gap-2 text-sm font-medium">
                                <span className="bg-blue-600 size-2 rounded-full" />
                                {t("designSystem.inProgress")}
                            </span>
                            <span className="flex items-center gap-2 text-xs text-tertiary">
                                2 <ButtonUtility icon={ArrowNarrowRightOutline} tooltip={t("designSystem.columnActions")} size="xs" />
                            </span>
                        </header>
                        <article className="space-y-2 rounded-md border border-subtle bg-layer-2 p-3 shadow-raised-100">
                            <span className="text-xs text-tertiary">PLAT-12</span>
                            <h3 className="text-sm font-medium">{t("designSystem.buildWorkspace")}</h3>
                            <div className="flex gap-2">
                                <Badge size="sm" color="brand" type="pill-color">
                                    {t("designSystem.design")}
                                </Badge>
                                <Badge size="sm" color="warning" type="pill-color">
                                    {t("designSystem.high")}
                                </Badge>
                            </div>
                        </article>
                    </div>
                </section>
                <section className="space-y-3">
                    <h2 className="text-sm font-medium">{t("designSystem.layers")}</h2>
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
